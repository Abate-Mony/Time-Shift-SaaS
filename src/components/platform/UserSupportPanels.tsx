import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ArrowRightLeft, BellRing, KeyRound, LogOut, Mail, MailCheck, UserX } from "lucide-react";
import { ConfirmModal } from "@/components/platform/figma/primitives";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import {
  anonymiseUser, changeUserEmail, moveUserCompany, platformCompaniesQuery, platformErrorMessage, resendUserVerification,
  revokeUserSessions, sendUserPasswordReset, sendUserTestNotification, type PlatformUserDetail,
} from "@/utils/platform-api";
import { ActionButton, Card } from "./SupportBits";

type Dialog = null | "reset" | "verify" | "email" | "signout" | "move" | "anonymise";

const inputClass =
  "w-full h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20";

/** Recovery, security, notifications, duplicates, move and anonymise for one user. */
export function UserSupportPanels({ user }: { user: PlatformUserDetail }) {
  const { canSupport, isSuper } = usePlatformPermissions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [newEmail, setNewEmail] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [targetCompany, setTargetCompany] = useState<{ id: string; name: string } | null>(null);

  const isOwner = user.role === "owner";
  const isPlatformAdmin = !!user.platformRole;

  const { data: companyResults } = useQuery({
    ...platformCompaniesQuery({ search: companySearch.trim() || undefined, limit: "8" }),
    enabled: dialog === "move" && companySearch.trim().length >= 2,
  });

  const done = (msg: string) => (d?: { msg?: string }) => {
    toast.success(d?.msg ?? msg);
    setDialog(null);
    queryClient.invalidateQueries({ queryKey: ["platform", "users", user.id] });
    queryClient.invalidateQueries({ queryKey: ["platform", "audit"] });
  };
  const fail = (fallback: string) => (e: unknown) => toast.error(platformErrorMessage(e, fallback));

  const reset = useMutation({ mutationFn: (r: string) => sendUserPasswordReset(user.id, r), onSuccess: done("Password reset email sent."), onError: fail("Couldn't send the reset email.") });
  const verify = useMutation({ mutationFn: (r: string) => resendUserVerification(user.id, r), onSuccess: done("Verification email sent."), onError: fail("Couldn't send the verification email.") });
  const email = useMutation({ mutationFn: (r: string) => changeUserEmail(user.id, newEmail.trim(), r), onSuccess: done("Email changed."), onError: fail("Couldn't change the email.") });
  const signout = useMutation({ mutationFn: (r: string) => revokeUserSessions(user.id, r), onSuccess: done("Signed out everywhere."), onError: fail("Couldn't sign the user out.") });
  const test = useMutation({
    mutationFn: () => sendUserTestNotification(user.id),
    onSuccess: (d) => { toast.success(d.msg ?? "Test notification sent."); queryClient.invalidateQueries({ queryKey: ["platform", "users", user.id] }); },
    onError: fail("Couldn't send a test notification."),
  });
  const move = useMutation({
    mutationFn: (r: string) => moveUserCompany(user.id, targetCompany!.id, r),
    onSuccess: done("User moved."),
    onError: fail("Couldn't move the user."),
  });
  const anonymise = useMutation({
    mutationFn: (r: string) => anonymiseUser(user.id, user.email, r),
    onSuccess: done("User anonymised."),
    onError: fail("Couldn't anonymise the user."),
  });

  if (!canSupport) return null;

  const pushTotal = user.push.web + user.push.mobile;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <Card title="Account recovery">
          <dl className="grid grid-cols-2 gap-y-2 text-xs mb-4">
            <dt className="text-slate-400">Email</dt>
            <dd className="font-semibold text-slate-700 text-right truncate">{user.email}</dd>
            <dt className="text-slate-400">Verified</dt>
            <dd className={`font-semibold text-right ${user.isVerified ? "text-emerald-700" : "text-amber-700"}`}>{user.isVerified ? "Yes" : "Not yet"}</dd>
            <dt className="text-slate-400">Phone</dt>
            <dd className="font-semibold text-slate-700 text-right">{user.phone ?? "—"}</dd>
          </dl>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => setDialog("reset")}><KeyRound size={12} /> Send password reset</ActionButton>
            {!user.isVerified && <ActionButton onClick={() => setDialog("verify")}><MailCheck size={12} /> Resend verification</ActionButton>}
            <ActionButton onClick={() => { setNewEmail(""); setDialog("email"); }}><Mail size={12} /> Change email</ActionButton>
          </div>
        </Card>

        <Card title="Security">
          <p className="text-xs text-slate-500 mb-2">
            {user.sessions.length === 0 ? "No active sessions." : `${user.sessions.length} active session${user.sessions.length === 1 ? "" : "s"}`}
          </p>
          {user.sessions.length > 0 && (
            <ul className="mb-4 divide-y divide-[#F1F5F9] border border-[#F1F5F9] rounded-lg">
              {user.sessions.map((s, i) => (
                <li key={i} className="px-3 py-2 flex justify-between text-xs">
                  <span className="text-slate-600">Signed in {s.createdAt ? dayjs(s.createdAt).format("D MMM YYYY, HH:mm") : "—"}</span>
                  <span className="text-slate-400">expires {dayjs(s.expiresAt).format("D MMM")}</span>
                </li>
              ))}
            </ul>
          )}
          <ActionButton onClick={() => setDialog("signout")} disabled={user.sessions.length === 0}>
            <LogOut size={12} /> Sign out everywhere
          </ActionButton>
          <p className="mt-2 text-[11px] text-slate-400">Two-factor sign-in isn't available in the app yet.</p>
        </Card>

        <Card title="Notifications">
          <dl className="grid grid-cols-2 gap-y-2 text-xs mb-4">
            <dt className="text-slate-400">Browsers subscribed</dt>
            <dd className="font-semibold text-slate-700 text-right tabular-nums">{user.push.web}</dd>
            <dt className="text-slate-400">Mobile devices</dt>
            <dd className="font-semibold text-slate-700 text-right tabular-nums">{user.push.mobile}</dd>
            <dt className="text-slate-400">Last notification</dt>
            <dd className="font-semibold text-slate-700 text-right">
              {user.push.lastNotification ? (
                <>
                  <span className="block truncate">{user.push.lastNotification.title}</span>
                  <span className="block text-slate-400 font-normal">{dayjs(user.push.lastNotification.createdAt).format("D MMM, HH:mm")}</span>
                </>
              ) : "None"}
            </dd>
          </dl>
          <ActionButton onClick={() => test.mutate()} disabled={pushTotal === 0 || test.isPending} title={pushTotal === 0 ? "No devices registered" : undefined}>
            <BellRing size={12} /> {test.isPending ? "Sending…" : "Send test notification"}
          </ActionButton>
          {pushTotal === 0 && <p className="mt-2 text-[11px] text-amber-700">No devices registered — they won't get push notifications until they allow them in the app or browser.</p>}
        </Card>

        <Card title="Possible duplicates">
          {user.possibleDuplicates.length === 0 ? (
            <p className="text-xs text-slate-500">No other accounts share this phone number.</p>
          ) : (
            <ul className="divide-y divide-[#F1F5F9]">
              {user.possibleDuplicates.map((d) => (
                <li key={d.id}>
                  <button type="button" onClick={() => navigate(`/platform/users/${d.id}`)} className="w-full py-2 text-left hover:bg-slate-50 rounded">
                    <span className="block text-sm font-semibold text-slate-800">{d.name}</span>
                    <span className="block text-xs text-slate-400">{d.email} · {d.company?.name ?? "No company"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {isSuper && (
          <div className="lg:col-span-2">
            <Card title="Danger zone">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Move to another company</p>
                    <p className="text-xs text-slate-500">
                      {isOwner ? "Company owners can't be moved — transfer ownership first." : "For workers who signed up under the wrong company. Their past shifts stay with the old company."}
                    </p>
                  </div>
                  <ActionButton onClick={() => { setTargetCompany(null); setCompanySearch(""); setDialog("move"); }} disabled={isOwner}>
                    <ArrowRightLeft size={12} /> Move…
                  </ActionButton>
                </div>
                <div className="flex items-start justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Anonymise user</p>
                    <p className="text-xs text-slate-500">
                      {isOwner || isPlatformAdmin
                        ? "Not available for company owners or platform admins."
                        : "Removes their name, email and phone for a deletion request. Timesheets and invoices are kept, shown as \"Former worker\"."}
                    </p>
                  </div>
                  <ActionButton danger onClick={() => setDialog("anonymise")} disabled={isOwner || isPlatformAdmin}>
                    <UserX size={12} /> Anonymise…
                  </ActionButton>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <AnimatePresence>
        {dialog === "reset" && (
          <ConfirmModal title="Send password reset?" body={`Emails ${user.email} a link to set a new password.`} confirmLabel="Send email"
            busy={reset.isPending} onConfirm={(r) => reset.mutate(r)} onClose={() => setDialog(null)} />
        )}
        {dialog === "verify" && (
          <ConfirmModal title="Resend verification email?" body={`Sends a new verification link to ${user.email}.`} confirmLabel="Send email"
            busy={verify.isPending} onConfirm={(r) => verify.mutate(r)} onClose={() => setDialog(null)} />
        )}
        {dialog === "email" && (
          <ConfirmModal
            title="Change email address"
            body={`Currently ${user.email}. They'll sign in with the new address and need to verify it again.`}
            consequence="Only do this after confirming the person's identity — the new address can reset the password."
            confirmLabel="Change email"
            busy={email.isPending}
            onConfirm={(r) => { if (/^\S+@\S+\.\S+$/.test(newEmail.trim())) email.mutate(r); else toast.error("Enter a valid email address."); }}
            onClose={() => setDialog(null)}
          >
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="new-email">New email</label>
            <input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} placeholder="name@example.com" />
          </ConfirmModal>
        )}
        {dialog === "signout" && (
          <ConfirmModal title="Sign out everywhere?" body="Ends every signed-in session on web and mobile. They'll need to sign in again."
            consequence="An access token already issued can keep working for up to 15 minutes."
            confirmLabel="Sign out everywhere" busy={signout.isPending} onConfirm={(r) => signout.mutate(r)} onClose={() => setDialog(null)} />
        )}
        {dialog === "move" && (
          <ConfirmModal
            title={`Move ${user.name}`}
            body={`From ${user.company?.name ?? "no company"} to the company you pick. Their past shifts stay with the old company; from now on they'll see the new company's jobs.`}
            confirmLabel={targetCompany ? `Move to ${targetCompany.name}` : "Pick a company"}
            busy={move.isPending}
            onConfirm={(r) => { if (targetCompany) move.mutate(r); else toast.error("Pick a company first."); }}
            onClose={() => setDialog(null)}
          >
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="company-search">Company</label>
            <input id="company-search" value={companySearch} onChange={(e) => { setCompanySearch(e.target.value); setTargetCompany(null); }}
              className={inputClass} placeholder="Search by name…" autoComplete="off" />
            {companySearch.trim().length >= 2 && !targetCompany && (
              <ul className="mt-1 max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-lg divide-y divide-[#F1F5F9]">
                {companyResults?.data.filter((c) => c.id !== user.company?.id).map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => { setTargetCompany({ id: c.id, name: c.name }); setCompanySearch(c.name); }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      {c.name}
                    </button>
                  </li>
                ))}
                {companyResults?.data.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">No companies found.</li>}
              </ul>
            )}
          </ConfirmModal>
        )}
        {dialog === "anonymise" && (
          <ConfirmModal
            title={`Anonymise ${user.name}?`}
            body="Replaces their name with “Former worker”, removes their email, phone and photo, signs them out and disables the account. This can't be undone."
            consequence="Use this for a right-to-erasure request. Their shifts and invoices stay for the company's records."
            confirmLabel="Anonymise user"
            danger
            confirmText={user.email}
            busy={anonymise.isPending}
            onConfirm={(r) => anonymise.mutate(r)}
            onClose={() => setDialog(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

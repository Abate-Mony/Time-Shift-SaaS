import { Calendar, Clock, MapPin } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import SearchLocation from "@/components/locationSearchComponent"
import { ApplyRatePrompt, ClientCombobox } from "@/components/client/ClientCombobox"
import { SiteCombobox } from "@/components/site/SiteCombobox"
import { clientSitesQuery } from "@/utils/sites"
import { useCreateJob } from "../CreateJobContext"
import { formatHours } from "../wizardConfig"
import { FieldError } from "../FieldError"
import { Label } from "@/components/ui/label"

const PRIORITIES = [
  { value: "low", label: "Low", className: "text-foreground" },
  { value: "medium", label: "Medium", className: "text-amber-600" },
  { value: "high", label: "High", className: "text-orange-600" },
  { value: "urgent", label: "Urgent", className: "text-red-600" },
] as const

export function JobDetailsStep() {
  const {
    form,
    selectedClient,
    handleClientSelect,
    showApplyRate,
    previousChargeRate,
    applyClientRate,
    keepCurrentRate,
    locationMode,
    setLocationMode,
    selectedSite,
    handleSiteSelect,
    shiftHours,
    lockedFromQuote,
  } = useCreateJob()

  const { register, setValue, watch, formState: { errors } } = form

  const priority = watch("priority")
  const address = watch("address")
  const startTime = watch("startTime")
  const endTime = watch("endTime")

  // Quote-conversion only: the accepted quote itself had no Site, but the
  // (locked) client might still have one on file worth suggesting — asked,
  // not applied automatically, same "ask before overriding" precedent as
  // ApplyRatePrompt above for the charge rate.
  const [siteSuggestionDismissed, setSiteSuggestionDismissed] = useState(false)
  const suggestedSitesQuery = useQuery({
    ...clientSitesQuery(selectedClient?._id ?? ""),
    enabled: !!lockedFromQuote && !!selectedClient && !selectedSite,
  })
  const suggestedSites = suggestedSitesQuery.data?.sites ?? []
  const showSiteSuggestion = !!lockedFromQuote && !selectedSite && !siteSuggestionDismissed && suggestedSites.length > 0

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Job details */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-foreground mb-4">Job details</h2>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="min-w-0">
            <Input
              label="Job name"
              placeholder="e.g. Canary Wharf Security — Night Shift"
              {...register("title")}
              className={cn(errors.title && "border-red-500!")}
            />
            <FieldError message={errors.title?.message as string} />
          </div>

          <div className="min-w-0">
            <Textarea
              {...register("description")}
              placeholder="Brief description of the work required..."
              className={cn(errors.description && "border-red-500!")}
            />
            <FieldError message={errors.description?.message as string} />
          </div>

          <div className="min-w-0">
            {lockedFromQuote ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Client</p>
                <div className="p-3.5 border border-[var(--border)] rounded-xl bg-muted/40">
                  <p className="text-sm font-bold text-foreground">{selectedClient?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Locked from accepted quote {lockedFromQuote.quoteNumber}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">To change the client, revise the quote instead.</p>
              </div>
            ) : (
              <>
                <ClientCombobox value={selectedClient} onChange={handleClientSelect} />
                <FieldError message={errors.client?.message as string} />
              </>
            )}

            {showApplyRate && selectedClient && previousChargeRate !== null && (
              <div className="mt-2 min-w-0">
                <ApplyRatePrompt
                  client={selectedClient}
                  currentRate={previousChargeRate}
                  onKeep={keepCurrentRate}
                  onApply={applyClientRate}
                />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Priority
            </p>
            <div className="flex flex-wrap gap-2 min-w-0">
              {PRIORITIES.map(item => (
                <Label
                  key={item.value}
                  className={cn(
                    "shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all",
                    priority === item.value
                      ? "border-[var(--primary)] bg-[var(--primary)]/[0.03]"
                      : "border-[var(--border)] hover:border-slate-300"
                  )}
                >
                  <Input
                    type="radio"
                    name="priority"
                    className="sr-only"
                    value={item.value}
                    checked={priority === item.value}
                    onChange={() => setValue("priority", item.value, { shouldValidate: true })}
                  />
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      priority === item.value ? "border-[var(--primary)] bg-[var(--primary)]" : "border-slate-300"
                    )}
                  >
                    {priority === item.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className={cn("text-sm font-medium", item.className)}>{item.label}</span>
                </Label>
              ))}
            </div>
            <FieldError message={errors.priority?.message as string} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-foreground mb-1">Location</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Use a site for places your team visits repeatedly. Use a one-off location for ad-hoc work.
        </p>

        {lockedFromQuote && selectedSite ? (
          <div>
            <div className="p-3.5 border border-[var(--border)] rounded-xl bg-muted/40">
              <p className="text-sm font-bold text-foreground">{selectedSite.name}</p>
              {selectedSite.formattedAddress && <p className="text-xs text-muted-foreground mt-0.5">{selectedSite.formattedAddress}</p>}
              <p className="text-xs text-muted-foreground mt-1">Locked from accepted quote {lockedFromQuote.quoteNumber}</p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">To change the site, revise the quote instead.</p>
          </div>
        ) : (
          <>
        {showSiteSuggestion && (
          <div className="mb-4 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-900">
                {selectedClient?.name} has {suggestedSites.length === 1 ? `a site on file: ${suggestedSites[0].name}` : `${suggestedSites.length} sites on file`}.
                {" "}Use {suggestedSites.length === 1 ? "it" : "one"} for this job?
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSiteSuggestionDismissed(true)}
                  className="h-7 px-3 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode("site")
                    if (suggestedSites.length === 1) handleSiteSelect(suggestedSites[0])
                    setSiteSuggestionDismissed(true)
                  }}
                  className="h-7 px-3 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {suggestedSites.length === 1 ? "Use this site" : "Choose a site"}
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedClient && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setLocationMode("site")}
              className={cn(
                "flex-1 h-9 rounded-lg text-xs font-semibold transition-all border",
                locationMode === "site"
                  ? "border-[var(--primary)] bg-[var(--primary)]/[0.03] text-[var(--primary)]"
                  : "border-[var(--border)] text-muted-foreground hover:border-slate-300"
              )}
            >
              Existing site
            </button>
            <button
              type="button"
              onClick={() => { setLocationMode("custom"); handleSiteSelect(null) }}
              className={cn(
                "flex-1 h-9 rounded-lg text-xs font-semibold transition-all border",
                locationMode === "custom"
                  ? "border-[var(--primary)] bg-[var(--primary)]/[0.03] text-[var(--primary)]"
                  : "border-[var(--border)] text-muted-foreground hover:border-slate-300"
              )}
            >
              One-off location
            </button>
          </div>
        )}

        {selectedClient && locationMode === "site" ? (
          <SiteCombobox clientId={selectedClient._id} value={selectedSite} onChange={handleSiteSelect} />
        ) : (
          <SearchLocation
            onSelect={location => {
              setValue("location", location.siteName, { shouldValidate: true })
              setValue(
                "address",
                [location.address, location.city, location.postcode].filter(Boolean).join(", "),
                { shouldValidate: true }
              )
              setValue("coordinates", { lat: location.lat, lng: location.lng }, { shouldValidate: true })
            }}
          />
        )}
        <FieldError message={errors.location?.message as string} />

        {locationMode === "custom" && address && (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <MapPin size={12} className="text-muted-foreground shrink-0" />
              <span className="truncate">{address}</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Only the general area is shown to workers before they're assigned — the exact
              address is used for directions once someone is.
            </p>
          </>
        )}
          </>
        )}
      </div>

      {/* Date & time */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-foreground mb-4">Date & time</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
          <div className="min-w-0">
            <Input
              label="Date"
              type="date"
              min={dayjs().format("YYYY-MM-DD")}
              icon={<Calendar size={14} />}
              {...register("date")}
              className={cn(errors.date && "border-red-500!")}
            />
            <FieldError message={errors.date?.message as string} />
          </div>

          <div className="min-w-0">
            <Input
              label="Start time"
              type="time"
              icon={<Clock size={14} />}
              {...register("startTime")}
              className={cn(errors.startTime && "border-red-500!")}
            />
            <FieldError message={errors.startTime?.message as string} />
          </div>

          <div className="min-w-0">
            <Input
              label="End time"
              type="time"
              icon={<Clock size={14} />}
              {...register("endTime")}
              className={cn(errors.endTime && "border-red-500!")}
            />
            <FieldError message={errors.endTime?.message as string} />
          </div>
        </div>

        {shiftHours > 0 && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2 min-w-0">
            <Clock size={14} className="text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700 min-w-0">
              <span className="font-semibold">{formatHours(shiftHours)}</span> shift duration
              {endTime < startTime && <span className="text-blue-500"> · overnight</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

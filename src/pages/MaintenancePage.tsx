import { useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublicMaintenanceStatus } from "@/utils/platform-api";

// Full-screen block, not a banner — the kill switch in
// PlatformSystem.tsx/enforceMaintenanceMode is a total block, not a partial
// read-only mode, so a banner over otherwise-broken content would look
// buggy rather than honest about what's happening. Rendered as a top-level
// route (see routes.tsx), outside every layout, so it keeps working even
// while every protected loader is 503ing. Reached via customFetch.ts's
// response interceptor, which hard-redirects here on a 503/MAINTENANCE_MODE
// response rather than a router navigate.
export function MaintenancePage() {
  const { data } = useQuery({
    queryKey: ["maintenance", "public-status"],
    queryFn: getPublicMaintenanceStatus,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (data && !data.enabled) {
      window.location.href = "/";
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col">
      <div className="px-5 py-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-xs">O</span>
        </div>
        <span className="text-white font-semibold text-base tracking-tight">OnClockly</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm flex flex-col gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-2">
            <Wrench size={28} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white">We'll be right back</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            {data?.message || "OnClockly is temporarily down for maintenance. Please try again shortly."}
          </p>
          <p className="text-xs text-white/30 mt-2">This page checks automatically and will take you back once we're done.</p>
        </motion.div>
      </div>
    </div>
  );
}

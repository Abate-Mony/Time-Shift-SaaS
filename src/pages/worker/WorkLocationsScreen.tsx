import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Building2, ChevronLeft, MapPin, Navigation } from "lucide-react"

import { getMyLocations } from "@/utils/api-request-functions"
import { Skeleton } from "@/components/ui/skeleton"
import { buildMapUrl } from "@/utils/mapLinks"
import type { WorkLocation } from "@/utils/types"

const locationsQuery = {
  queryKey: ["my-locations"],
  queryFn: getMyLocations,
}

export const loader = async () => null

function LocationRow({ location }: { location: WorkLocation }) {
  const mapsHref = buildMapUrl("google", {
    lat: location.coordinates?.lat,
    lng: location.coordinates?.lng,
    address: location.address ?? location.location,
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
        <Building2 size={15} className="text-sky-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{location.location}</p>
        {!!location.address && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{location.address}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {location.visitCount} shift{location.visitCount === 1 ? "" : "s"} · last {new Date(location.lastWorkedAt).toLocaleDateString()}
        </p>
      </div>
      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary)] flex items-center justify-center shrink-0 hover:bg-blue-100 transition-colors"
        >
          <Navigation size={13} />
        </a>
      ) : (
        <div className="w-8 h-8 shrink-0" />
      )}
    </div>
  )
}

export default function WorkLocationsScreen() {
  const navigate = useNavigate()
  const { data: locations = [], isLoading } = useQuery(locationsQuery)

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
            <MapPin size={15} className="text-muted-foreground" />
          </span>
          Work Locations
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Sites you've been scheduled to.</p>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : locations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No locations yet — sites from your shifts will show up here once you've worked one.
        </p>
      ) : (
        <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-border">
          {locations.map(loc => (
            <LocationRow key={`${loc.location}-${loc.address}`} location={loc} />
          ))}
        </div>
      )}
    </div>
  )
}

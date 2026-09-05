import type { ClientRecentJob, ClientStats } from "@/utils/clients"
import type { Client } from "@/utils/types/client"
import { createContext, useContext } from "react"

export interface ClientDetailContextValue {
    client: Client
    stats: ClientStats
    recentJobs: ClientRecentJob[]
}

const ClientDetailContext = createContext<ClientDetailContextValue | null>(null)

export const ClientDetailProvider = ClientDetailContext.Provider

/** Read the current client from anywhere under the `clients/:id` route tree
 *  (the tab pages rendered through ClientDetail's <Outlet/>) without having
 *  it threaded through as a prop at every level. */
export function useClientDetail(): ClientDetailContextValue {
    const ctx = useContext(ClientDetailContext)
    if (!ctx) {
        throw new Error("useClientDetail must be used within the clients/:id route tree (ClientDetailProvider is missing above it)")
    }
    return ctx
}

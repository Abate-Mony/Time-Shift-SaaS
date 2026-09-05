import { useCreateJob } from "./CreateJobContext"
import { mapRecurringStateToPayload } from "@/utils/mapRecurringStateToPayload"

/**
 * Every value that lives outside RHF-registered inputs, rendered ONCE in the
 * wizard parent rather than inside a step.
 *
 * This matters because React Router's <Form> serialises from the DOM. If these
 * lived inside step components, unmounting a step would silently drop its
 * values from the submitted FormData.
 *
 * Native <input> deliberately — the styled `Input` wrapper renders a label and
 * container div, which lays out even when type="hidden".
 */
export function CreateJobHiddenFields() {
  const { form, selectedClient, selectedWorkers, recurring, generateInvoice, invoiceDueDate, invoiceLineItems } =
    useCreateJob()

  const { watch } = form
  const address = watch("address")
  const coordinates = watch("coordinates")
  const supervisor = watch("supervisor")
  const geofenceMode = watch("geofenceMode")
  const geofenceRadius = watch("geofenceRadiusMeters")
  const openToClaims = watch("openToClaims") ?? false
  const requiresApproval = watch("requiresApproval") ?? true

  const recurringPayload = mapRecurringStateToPayload(recurring)

  return (
    <>
      {/* Client — held in component state, not RHF */}
      <input type="hidden" name="client" value={selectedClient?._id ?? ""} />

      {/* Location */}
      <input type="hidden" name="address" value={address ?? ""} />
      {coordinates && (
        <input type="hidden" name="coordinates" value={JSON.stringify(coordinates)} />
      )}

      {/* Recurrence */}
      <input type="hidden" name="isRecurring" value={String(recurringPayload.isRecurring)} />
      {recurringPayload.frequency && (
        <input type="hidden" name="frequency" value={recurringPayload.frequency} />
      )}
      {recurringPayload.interval !== undefined && (
        <input type="hidden" name="interval" value={String(recurringPayload.interval)} />
      )}
      {recurringPayload.daysOfWeek && (
        <input type="hidden" name="daysOfWeek" value={JSON.stringify(recurringPayload.daysOfWeek)} />
      )}
      {recurringPayload.endDate && (
        <input type="hidden" name="endDate" value={recurringPayload.endDate} />
      )}

      {/* Staffing */}
      {selectedWorkers.length > 0 && (
        <input type="hidden" name="workers" value={JSON.stringify(selectedWorkers)} />
      )}
      {supervisor && <input type="hidden" name="supervisor" value={supervisor} />}
      <input type="hidden" name="openToClaims" value={String(openToClaims)} />
      <input type="hidden" name="requiresApproval" value={String(requiresApproval)} />

      {/* Policies */}
      {geofenceMode && <input type="hidden" name="geofenceMode" value={geofenceMode} />}
      {geofenceMode && geofenceMode !== "off" && geofenceRadius && (
        <input type="hidden" name="geofenceRadiusMeters" value={String(geofenceRadius)} />
      )}

      {/* Invoice — the UI is still hidden, so this stays false in practice */}
      <input type="hidden" name="generateInvoice" value={String(generateInvoice)} />
      {generateInvoice && (
        <>
          <input type="hidden" name="invoiceDueDate" value={invoiceDueDate} />
          <input type="hidden" name="invoiceLineItems" value={JSON.stringify(invoiceLineItems)} />
        </>
      )}
    </>
  )
}

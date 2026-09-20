import { Input } from "../ui/input"
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
 * Native<Input> deliberately — the styled `Input` wrapper renders a label and
 * container div, which lays out even when type="hidden".
 */
export function CreateJobHiddenFields() {
  const { form, selectedClient, selectedSite, selectedWorkers, recurring, generateInvoice, invoiceDueDate, invoiceLineItems, lockedFromQuote } =
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
      {/* Client / Site — held in component state, not RHF */}
    <Input type="hidden" name="client" value={selectedClient?._id ?? ""} />
    <Input type="hidden" name="site" value={selectedSite?._id ?? ""} />
      {lockedFromQuote && (
        <>
        <Input type="hidden" name="sourceQuote" value={lockedFromQuote.quoteId} />
          {/* Display-only, for the post-create toast — the backend ignores
              unknown fields, it never reads this. */}
        <Input type="hidden" name="sourceQuoteNumber" value={lockedFromQuote.quoteNumber} />
        </>
      )}

      {/* Location */}
    <Input type="hidden" name="address" value={address ?? ""} />
      {coordinates && (
      <Input type="hidden" name="coordinates" value={JSON.stringify(coordinates)} />
      )}

      {/* Recurrence */}
    <Input type="hidden" name="isRecurring" value={String(recurringPayload.isRecurring)} />
      {recurringPayload.frequency && (
      <Input type="hidden" name="frequency" value={recurringPayload.frequency} />
      )}
      {recurringPayload.interval !== undefined && (
      <Input type="hidden" name="interval" value={String(recurringPayload.interval)} />
      )}
      {recurringPayload.daysOfWeek && (
      <Input type="hidden" name="daysOfWeek" value={JSON.stringify(recurringPayload.daysOfWeek)} />
      )}
      {recurringPayload.endDate && (
      <Input type="hidden" name="endDate" value={recurringPayload.endDate} />
      )}

      {/* Staffing */}
      {selectedWorkers.length > 0 && (
      <Input type="hidden" name="workers" value={JSON.stringify(selectedWorkers)} />
      )}
      {supervisor &&<Input type="hidden" name="supervisor" value={supervisor} />}
    <Input type="hidden" name="openToClaims" value={String(openToClaims)} />
    <Input type="hidden" name="requiresApproval" value={String(requiresApproval)} />

      {/* Policies */}
      {geofenceMode &&<Input type="hidden" name="geofenceMode" value={geofenceMode} />}
      {geofenceMode && geofenceMode !== "off" && geofenceRadius && (
      <Input type="hidden" name="geofenceRadiusMeters" value={String(geofenceRadius)} />
      )}

      {/* Invoice — the UI is still hidden, so this stays false in practice */}
    <Input type="hidden" name="generateInvoice" value={String(generateInvoice)} />
      {generateInvoice && (
        <>
        <Input type="hidden" name="invoiceDueDate" value={invoiceDueDate} />
        <Input type="hidden" name="invoiceLineItems" value={JSON.stringify(invoiceLineItems)} />
        </>
      )}
    </>
  )
}

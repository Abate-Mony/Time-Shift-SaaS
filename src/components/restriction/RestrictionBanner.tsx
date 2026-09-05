import { TriangleAlert, X, ChevronRight, Upload, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { type AccountRestriction, REASON_LABELS } from '../../data/restrictionMockData.ts'

interface RestrictionBannerProps {
  restriction: AccountRestriction
  onViewDetails: () => void
  onUpload?: () => void
  onContactManager?: () => void
}

export function RestrictionBanner({ restriction, onViewDetails, onUpload, onContactManager }: RestrictionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  const primaryAction = restriction.remedy === 'upload_document'
    ? { label: 'Upload document', icon: Upload, onClick: onUpload }
    : restriction.remedy === 'contact_manager'
    ? { label: 'Contact manager', icon: MessageSquare, onClick: onContactManager }
    : null

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <TriangleAlert size={13} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 leading-tight">
                {restriction.accessLevel === 'read_only' ? 'Your account has read-only access' : 'Your account has limited access'}
              </p>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {restriction.reason === 'document_expired'
                  ? 'Your right-to-work document needs updating.'
                  : restriction.reason === 'no_show'
                  ? 'Your account was temporarily restricted after a missed shift.'
                  : restriction.reason === 'disciplinary'
                  ? 'Some actions are temporarily restricted while an internal review is completed.'
                  : REASON_LABELS[restriction.reason]}
                {restriction.remedy !== 'none' && ' Some actions are temporarily unavailable.'}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {primaryAction && (
                  <button
                    onClick={primaryAction.onClick}
                    className="flex items-center gap-1.5 h-7 px-3 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <primaryAction.icon size={11} />
                    {primaryAction.label}
                  </button>
                )}
                <button
                  onClick={onViewDetails}
                  className="flex items-center gap-1 h-7 px-3 text-xs font-semibold text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  View restriction <ChevronRight size={11} />
                </button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-400 transition-colors shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

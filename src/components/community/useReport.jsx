import { useState } from 'react'
import ReportDialog from './ReportDialog'

/** Report flow shared by every page that shows posts. */
export default function useReport(onReported) {
  const [target, setTarget] = useState(null)
  const dialog = (
    <ReportDialog
      open={Boolean(target)}
      onClose={() => setTarget(null)}
      onReport={(reason) => {
        onReported(target, reason)
        setTarget(null)
      }}
    />
  )
  return { open: setTarget, dialog }
}

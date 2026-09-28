import { useEffect } from 'react'

/** Sets the browser tab title, e.g. "About us | Living Dose". */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Living Dose` : 'Living Dose — Healthy living made affordable'
  }, [title])
}

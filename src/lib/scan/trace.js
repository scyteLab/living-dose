import { PRODUCTS_BY_ID } from '@/data/products'

/**
 * Traceability codes printed under the QR code on Living Dose products:
 *   LD-<PRODUCT ID>-<BATCH>   e.g. LD-UGU-B0930
 * The QR code holds the same text. Returns the product and batch, or null.
 */
export function parseTraceCode(raw) {
  const text = String(raw ?? '').trim()
  const fromUrl = text.match(/[?&]code=([^&]+)/)
  const code = (fromUrl ? decodeURIComponent(fromUrl[1]) : text).toUpperCase().replace(/\s+/g, '')
  const m = code.match(/^LD-([A-Z0-9-]+)-(B\d{4,})$/)
  if (!m) return null
  const productId = m[1].toLowerCase()
  const product = PRODUCTS_BY_ID[productId]
  return product ? { product, batch: m[2] } : null
}

export const SAMPLE_CODES = ['LD-UGU-B0930', 'LD-FISH-CROAKER-B0930', 'LD-OFADA-RICE-B0915']

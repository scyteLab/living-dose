import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, CameraOff, ShieldCheck, Sprout, Warehouse } from 'lucide-react'
import ProductTile from '@/components/shop/ProductTile'
import Button from '@/components/ui/Button'
import { SAMPLE_CODES, parseTraceCode } from '@/lib/scan/trace'
import styles from './Scan.module.css'

const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window

/**
 * Reads the QR code on a product label with the camera where the browser supports it
 * (BarcodeDetector, e.g. Chrome on Android), or lets people type the printed code.
 */
export default function ProductScanner() {
  const { t } = useTranslation('scan')
  const inputId = useId()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [invalid, setInvalid] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])

  const check = (raw) => {
    const found = parseTraceCode(raw)
    setResult(found)
    setInvalid(!found)
    if (found) stopCamera()
  }

  const startCamera = async () => {
    setCameraError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
      requestAnimationFrame(async () => {
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const loop = async () => {
          if (!streamRef.current) return
          try {
            const codes = await detector.detect(video)
            const found = codes.map((c) => parseTraceCode(c.rawValue)).find(Boolean)
            if (found) {
              setResult(found)
              setInvalid(false)
              stopCamera()
              return
            }
          } catch {
            /* frame not ready */
          }
          setTimeout(loop, 400)
        }
        loop()
      })
    } catch {
      setCameraError(true)
      stopCamera()
    }
  }

  if (result) {
    const { product, batch } = result
    return (
      <section className={styles.panel} aria-labelledby="trace-h">
        <div className={styles.traceHead}>
          <ProductTile product={product} size="sm" />
          <div>
            <p className={styles.traced}>
              <ShieldCheck size={16} strokeWidth={2.2} aria-hidden="true" />
              {t('product.result')}
            </p>
            <h2 id="trace-h" className={styles.panelTitle}>
              {product.name}
            </h2>
            <p className={styles.small}>
              {product.unit} · {t('product.batch', { batch })}
            </p>
          </div>
        </div>
        {product.trace ? (
          <ol className={styles.traceSteps}>
            <li>
              <Sprout size={18} strokeWidth={2} aria-hidden="true" />
              <span>
                <strong>
                  {t('product.from')} {product.trace.place}
                </strong>
                {t('product.harvested', { count: product.trace.days })}
              </span>
            </li>
            <li>
              <Warehouse size={18} strokeWidth={2} aria-hidden="true" />
              <span>{t('product.packed')}</span>
            </li>
          </ol>
        ) : (
          <p className={styles.muted}>{t('product.noTrace')}</p>
        )}
        <div className={styles.buttons}>
          <Button to={`/shop/${product.id}`}>{t('product.view')}</Button>
          <Button
            variant="outline"
            onClick={() => {
              setResult(null)
              setCode('')
            }}
          >
            {t('product.scanAnother')}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.panel} aria-labelledby="scan-h">
      <h2 id="scan-h" className={styles.panelTitle}>
        {t('product.title')}
      </h2>
      <p className={styles.muted}>{t('product.body')}</p>

      {hasDetector ? (
        scanning ? (
          <div className={styles.camera}>
            <video ref={videoRef} className={styles.video} playsInline muted aria-label={t('product.cameraHelp')} />
            <span className={styles.frame} aria-hidden="true" />
            <p className={styles.small}>{t('product.cameraHelp')}</p>
            <Button variant="outline" onClick={stopCamera}>
              <CameraOff size={18} strokeWidth={2} aria-hidden="true" />
              {t('product.stop')}
            </Button>
          </div>
        ) : (
          <Button variant="action" onClick={startCamera} className={styles.selfStart}>
            <Camera size={18} strokeWidth={2} aria-hidden="true" />
            {t('product.camera')}
          </Button>
        )
      ) : (
        <p className={styles.note}>{t('product.noCamera')}</p>
      )}
      {cameraError && (
        <p className={styles.error} role="alert">
          {t('product.cameraError')}
        </p>
      )}

      <form
        className={styles.codeForm}
        onSubmit={(e) => {
          e.preventDefault()
          check(code)
        }}
      >
        <label htmlFor={inputId} className={styles.label}>
          {t('product.codeLabel')}
        </label>
        <div className={styles.codeRow}>
          <input
            id={inputId}
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setInvalid(false)
            }}
            placeholder={t('product.codePlaceholder')}
            autoCapitalize="characters"
            autoComplete="off"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${inputId}-err` : undefined}
          />
          <Button type="submit">{t('product.check')}</Button>
        </div>
        {invalid && (
          <p id={`${inputId}-err`} className={styles.error} role="alert">
            {t('product.invalid')}
          </p>
        )}
      </form>
      <div className={styles.samples}>
        <span className={styles.small}>{t('product.samples')}</span>
        {SAMPLE_CODES.map((c) => (
          <button key={c} type="button" className={styles.sample} onClick={() => check(c)}>
            {c}
          </button>
        ))}
      </div>
    </section>
  )
}

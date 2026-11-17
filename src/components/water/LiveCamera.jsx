import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Water.module.css'

/**
 * Front camera, live only (there is deliberately no way to pick a saved photo).
 * capture() returns { image, thumb }: a JPEG for the check and a small thumbnail.
 */
const LiveCamera = forwardRef(function LiveCamera({ onState }, ref) {
  const { t } = useTranslation('scan')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [state, setState] = useState('starting') // starting | live | denied | unsupported

  useEffect(() => {
    let alive = true
    const update = (s) => {
      if (!alive) return
      setState(s)
      onState?.(s)
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      update('unsupported')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 960 } }, audio: false })
      .then(async (stream) => {
        if (!alive) return stream.getTracks().forEach((tr) => tr.stop())
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        update('live')
      })
      .catch(() => update('denied'))
    return () => {
      alive = false
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
    }
  }, [onState])

  useImperativeHandle(ref, () => ({
    capture() {
      const video = videoRef.current
      if (!video?.videoWidth) return null
      const shot = (maxSide, quality) => {
        const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/jpeg', quality)
      }
      return { image: shot(720, 0.8), thumb: shot(160, 0.7) }
    },
  }))

  if (state === 'denied' || state === 'unsupported') {
    return (
      <div className={styles.cameraBlocked} role="alert">
        <p className={styles.blockedTitle}>{t(`water.camera.${state}Title`)}</p>
        <p>{t(`water.camera.${state}Body`)}</p>
      </div>
    )
  }
  return (
    <div className={styles.viewfinder}>
      {/* Mirrored so it feels like a mirror; the photo itself isn't flipped */}
      <video ref={videoRef} className={styles.video} playsInline muted aria-label={t('water.camera.label')} />
      {state === 'starting' && <p className={styles.starting}>{t('water.camera.starting')}</p>}
      <span className={styles.faceGuide} aria-hidden="true" />
    </div>
  )
})

export default LiveCamera

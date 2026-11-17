/**
 * Shrinks a photo to a small JPEG for the diary (about 30 to 60 KB),
 * so many meals fit in the browser's storage.
 */
export function compressPhoto(file, maxSide = 480, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('not-image'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    img.src = url
  })
}

/** A sharper copy for the AI to read (about 100 to 200 KB). Not stored. */
export const photoForAI = (file) => compressPhoto(file, 1024, 0.8)

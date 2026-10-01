import { useDeferredValue, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Camera, ImagePlus, Plus, Search, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import Segmented from '@/components/auth/Segmented'
import Button from '@/components/ui/Button'
import { FOODS, FOODS_BY_ID } from '@/data/foods'
import { RECIPES } from '@/data/recipes'
import { PORTIONS, lookup, searchFoods, slotForTime, totals } from '@/lib/scan/diary'
import { compressPhoto, recognisePlate } from '@/lib/scan/photo'
import { toIso } from '@/lib/mealPlan/storage'
import styles from './Scan.module.css'

const STEPS = ['photo', 'plate', 'save']
const QUICK = ['jollof-rice', 'eba', 'egusi-soup', 'beans-porridge', 'dodo', 'grilled-chicken', 'moi-moi', 'soft-drink']

/** Photo → what's on the plate → check and save. */
export default function SnapFlow({ onSave }) {
  const { t } = useTranslation('scan')
  const searchId = useId()
  const cameraRef = useRef(null)
  const fileRef = useRef(null)
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [photoError, setPhotoError] = useState(false)
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const query = useDeferredValue(q)
  const [slot, setSlot] = useState(() => slotForTime())
  const [saved, setSaved] = useState(false)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPhotoError(false)
      setPhoto(await compressPhoto(file))
      const suggested = await recognisePlate(file)
      if (suggested?.length) setItems(suggested)
    } catch {
      setPhotoError(true)
    }
  }

  const addItem = (source, id) => setItems((list) => [...list, { source, id, portion: 1, key: `${source}-${id}-${Date.now()}` }])
  const results = searchFoods(query, { foods: FOODS, recipes: RECIPES })
  const sum = totals(items)

  const save = () => {
    const now = new Date()
    onSave({ date: toIso(now), time: now.toISOString(), slot, photo, items: items.map(({ source, id, portion }) => ({ source, id, portion })) })
    setSaved(true)
  }

  const reset = () => {
    setStep(0)
    setPhoto(null)
    setItems([])
    setQ('')
    setSaved(false)
    setSlot(slotForTime())
  }

  if (saved) {
    return (
      <div className={styles.savedBox} role="status">
        <p className={styles.savedTitle}>{t('review.saved')}</p>
        <Button onClick={reset}>{t('review.another')}</Button>
      </div>
    )
  }

  return (
    <section className={styles.flow} aria-label={t('tabs.meal')}>
      <ol className={styles.steps} aria-label={t('steps.label')}>
        {STEPS.map((s, i) => (
          <li key={s} className={clsx(i < step && styles.stepDone, i === step && styles.stepNow)} aria-current={i === step ? 'step' : undefined}>
            <span>{i + 1}</span>
            {t(`steps.${s}`)}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('photo.title')}</h2>
          <p className={styles.muted}>{t('photo.body')}</p>
          {photo ? (
            <img src={photo} alt={t('photo.alt')} className={styles.preview} />
          ) : (
            <div className={styles.dropzone}>
              <Camera size={40} strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
          {photoError && (
            <p className={styles.error} role="alert">
              {t('photo.error')}
            </p>
          )}
          {/* capture="environment" opens the back camera on phones; desktops get a file picker */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} tabIndex={-1} aria-hidden="true" />
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} tabIndex={-1} aria-hidden="true" />
          <div className={styles.buttons}>
            <Button variant="action" onClick={() => cameraRef.current.click()}>
              <Camera size={18} strokeWidth={2} aria-hidden="true" />
              {photo ? t('photo.retake') : t('photo.take')}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current.click()}>
              <ImagePlus size={18} strokeWidth={2} aria-hidden="true" />
              {t('photo.choose')}
            </Button>
          </div>
          <div className={styles.nav}>
            <span />
            <Button onClick={() => setStep(1)}>
              {photo ? t('photo.next') : t('photo.skip')}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={styles.panel}>
          <div className={styles.plateHead}>
            {photo && <img src={photo} alt={t('photo.alt')} className={styles.thumb} />}
            <div>
              <h2 className={styles.panelTitle}>{t('plate.title')}</h2>
              <p className={styles.muted}>{t('plate.body')}</p>
            </div>
          </div>

          <div className={styles.search}>
            <label htmlFor={searchId} className="sr-only">
              {t('plate.search')}
            </label>
            <Search className={styles.searchIcon} size={20} strokeWidth={2} aria-hidden="true" />
            <input id={searchId} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('plate.placeholder')} autoComplete="off" />
          </div>

          {q ? (
            results.length ? (
              <ul className={styles.results} aria-live="polite">
                {results.map((r) => (
                  <li key={`${r.source}-${r.id}`}>
                    <span className={styles.resultText}>
                      <strong>{r.name}</strong>
                      <span>
                        {r.source === 'recipe' ? `${t('plate.recipe')} · ` : ''}
                        {r.portion} · {r.kcal} kcal
                      </span>
                    </span>
                    <button
                      type="button"
                      className={styles.addButton}
                      aria-label={t('plate.addAria', { name: r.name })}
                      onClick={() => {
                        addItem(r.source, r.id)
                        setQ('')
                      }}
                    >
                      <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                      {t('plate.add')}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>{t('plate.noResults')}</p>
            )
          ) : (
            <div className={styles.quick}>
              <p className={styles.small}>{t('plate.quick')}</p>
              <div className={styles.quickChips}>
                {QUICK.map((id) => (
                  <button key={id} type="button" className={styles.quickChip} onClick={() => addItem('food', id)} aria-label={t('plate.addAria', { name: FOODS_BY_ID[id].name })}>
                    <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
                    {FOODS_BY_ID[id].name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ul className={styles.plate}>
            {items.length === 0 && <li className={styles.plateEmpty}>{t('plate.empty')}</li>}
            {items.map((item) => {
              const food = lookup(item)
              return (
                <li key={item.key} className={styles.plateItem}>
                  <div className={styles.plateText}>
                    <strong>{food.name}</strong>
                    <span className={styles.small}>
                      {t('plate.portionHint', { portion: food.portion })} · {Math.round(food.kcal * item.portion)} kcal
                    </span>
                  </div>
                  <Segmented
                    label={`${t('plate.portion')}: ${food.name}`}
                    value={item.portion}
                    onChange={(portion) => setItems((list) => list.map((x) => (x.key === item.key ? { ...x, portion } : x)))}
                    options={PORTIONS.map((p) => ({ value: p, label: t(`plate.portions.${p}`) }))}
                  />
                  <button type="button" className={styles.iconButton} aria-label={t('plate.remove', { name: food.name })} onClick={() => setItems((list) => list.filter((x) => x.key !== item.key))}>
                    <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className={styles.nav}>
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
              {t('plate.back')}
            </Button>
            <Button onClick={() => setStep(2)} disabled={items.length === 0}>
              {t('plate.next')}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>{t('review.title')}</h2>
          <div className={styles.reviewTop}>
            {photo && <img src={photo} alt={t('photo.alt')} className={styles.thumbLg} />}
            <ul className={styles.reviewItems}>
              {items.map((item) => (
                <li key={item.key}>
                  {lookup(item).name} <span className={styles.small}>({t(`plate.portions.${item.portion}`).toLowerCase()})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.slotPick}>
            <p className={styles.label}>{t('review.slot')}</p>
            <Segmented label={t('review.slot')} value={slot} onChange={setSlot} options={['breakfast', 'lunch', 'dinner', 'snack'].map((s) => ({ value: s, label: t(`review.slots.${s}`) }))} />
          </div>

          <div className={styles.totals} aria-label={t('review.totals')}>
            <p className={styles.label}>{t('review.totals')}</p>
            <dl>
              <div>
                <dt>{t('review.energy')}</dt>
                <dd>
                  {sum.kcal.toLocaleString()} <small>kcal</small>
                </dd>
              </div>
              <div>
                <dt>{t('review.protein')}</dt>
                <dd>
                  {sum.protein} <small>g</small>
                </dd>
              </div>
              <div>
                <dt>{t('review.fibre')}</dt>
                <dd>
                  {sum.fibre} <small>g</small>
                </dd>
              </div>
              <div>
                <dt>{t('review.salt')}</dt>
                <dd>
                  {sum.salt} <small>g</small>
                </dd>
              </div>
              <div>
                <dt>{t('review.veg')}</dt>
                <dd>{t('review.portionsCount', { count: sum.veg })}</dd>
              </div>
            </dl>
            {sum.salt >= 2.5 && <p className={styles.warning}>{t('review.saltHigh')}</p>}
            <p className={styles.small}>{t('review.estimates')}</p>
          </div>

          <div className={styles.nav}>
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
              {t('review.back')}
            </Button>
            <Button variant="action" onClick={save}>
              {t('review.save')}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

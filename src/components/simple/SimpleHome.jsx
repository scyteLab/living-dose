import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Ambulance,
  Camera,
  Check,
  Flame,
  Languages,
  Droplet,
  GlassWater,
  LayoutDashboard,
  PhoneCall,
  Siren,
  Stethoscope,
  UsersRound,
  Utensils,
} from 'lucide-react'
import clsx from 'clsx'
import Dialog from '@/components/ui/Dialog'
import FamilyDialog from './FamilyDialog'
import ReadAloud from './ReadAloud'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import { WATER_GOAL } from '@/lib/dashboard/habits'
import { partOfDay } from '@/lib/dashboard/insights'
import { loadFamily } from '@/lib/simple/view'
import useCheckins from '@/hooks/useCheckins'
import useRegion from '@/hooks/useRegion'
import styles from './Simple.module.css'

const subscribe = (cb) => {
  window.addEventListener('ld-view', cb)
  return () => window.removeEventListener('ld-view', cb)
}

/** Simple view home: six big picture buttons and one line about today. */
export default function SimpleHome({ userId, firstName, water = 0, onFullView }) {
  const { t } = useTranslation('simple')
  useDocumentTitle(t('docTitle'))
  const familyJson = useSyncExternalStore(subscribe, () => JSON.stringify(loadFamily(userId)))
  const family = JSON.parse(familyJson)
  const [dialog, setDialog] = useState(null) // 'help' | 'family' | null
  const { streak } = useCheckins(userId)
  const { language, setLanguage } = useRegion()
  const tc = useTranslation('checkin').t

  const part = partOfDay()
  const greeting = firstName ? t(`greeting.${part}`, { name: firstName }) : t(`greeting.${part}NoName`)
  const waterLine = water >= WATER_GOAL ? t('waterDone') : t('water', { count: water })

  const tiles = [
    { id: 'snap', icon: Camera, tone: 'ember', to: '/scan' },
    { id: 'water', icon: GlassWater, tone: 'sky', to: '/challenges/water' },
    { id: 'doctor', icon: Stethoscope, tone: 'plum', to: '/care' },
    { id: 'meals', icon: Utensils, tone: 'leaf', to: '/plan' },
    { id: 'help', icon: Siren, tone: 'berry', onClick: () => setDialog('help') },
    family
      ? {
          id: 'family',
          icon: PhoneCall,
          tone: 'sun',
          href: `tel:${family.phone}`,
          title: t('tiles.family.titleNamed', { name: family.name || family.phone }),
          hint: t('tiles.family.hintNamed'),
        }
      : { id: 'family', icon: UsersRound, tone: 'sun', onClick: () => setDialog('family') },
  ]

  const spoken = () =>
    [
      greeting,
      waterLine,
      streak.doneToday ? tc('simple.done') : tc('simple.todo'),
      t('tapToStart'),
      ...tiles.map((x) => x.title ?? t(`tiles.${x.id}.title`)),
    ].join('\n')

  return (
    <div className={styles.home}>
      <header className={styles.head}>
        <h1 className={styles.greeting}>{greeting}</h1>
        <p className={styles.water}>
          <span className={styles.drops} aria-hidden="true">
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <Droplet key={i} size={22} strokeWidth={2} className={i < water ? styles.dropOn : styles.drop} />
            ))}
          </span>
          {waterLine}
        </p>
        <ReadAloud text={spoken} />
      </header>

      <Link to="/check-in" className={clsx(styles.checkin, streak.doneToday && styles.checkinDone)}>
        <span className={styles.checkinIcon} aria-hidden="true">
          {streak.doneToday ? <Check size={34} strokeWidth={3} /> : '🙂'}
        </span>
        <span className={styles.checkinText}>
          {streak.doneToday ? tc('simple.done') : tc('simple.todo')}
          {streak.count > 0 && (
            <span className={styles.checkinStreak}>
              <Flame size={20} strokeWidth={2.4} aria-hidden="true" />
              {tc('done.streak', { count: streak.count })}
            </span>
          )}
        </span>
      </Link>

      <p className={styles.tapHint}>{t('tapToStart')}</p>
      <ul className={styles.tiles}>
        {tiles.map(({ id, icon: Icon, tone, to, href, onClick, title, hint }) => {
          const body = (
            <>
              <span className={styles.tileIcon} aria-hidden="true">
                <Icon size={40} strokeWidth={2} />
              </span>
              <span className={styles.tileTitle}>{title ?? t(`tiles.${id}.title`)}</span>
              <span className={styles.tileHint}>{hint ?? t(`tiles.${id}.hint`)}</span>
            </>
          )
          const cls = clsx(styles.tile, styles[`tile_${tone}`])
          return (
            <li key={id}>
              {to ? (
                <Link to={to} className={cls}>
                  {body}
                </Link>
              ) : href ? (
                <a href={href} className={cls}>
                  {body}
                </a>
              ) : (
                <button type="button" className={cls} onClick={onClick}>
                  {body}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className={styles.footer}>
        {family && (
          <button type="button" className={styles.textBtn} onClick={() => setDialog('family')}>
            {t('changeFamily')}
          </button>
        )}
        <button
          type="button"
          className={styles.textBtn}
          onClick={() => setLanguage(language === 'pcm' ? 'en' : 'pcm')}
          lang={language === 'pcm' ? 'en' : 'pcm'}
        >
          <Languages size={20} strokeWidth={2} aria-hidden="true" />
          {language === 'pcm' ? 'Read in English' : 'Read for Pidgin'}
        </button>
        <Link to="/account/family" className={styles.textBtn}>
          <UsersRound size={20} strokeWidth={2} aria-hidden="true" />
          {t('familyHelpers')}
        </Link>
        <button type="button" className={styles.textBtn} onClick={onFullView}>
          <LayoutDashboard size={20} strokeWidth={2} aria-hidden="true" />
          {t('fullView')}
        </button>
      </div>

      <Dialog open={dialog === 'help'} onClose={() => setDialog(null)} title={t('help.title')} description={t('help.body')} closeLabel={t('help.close')}>
        <div className={styles.helpList}>
          <a href="tel:112" className={clsx(styles.helpBtn, styles.helpEmergency)}>
            <PhoneCall size={28} strokeWidth={2.2} aria-hidden="true" />
            {t('help.call112')}
          </a>
          {family && (
            <a href={`tel:${family.phone}`} className={styles.helpBtn}>
              <UsersRound size={28} strokeWidth={2.2} aria-hidden="true" />
              {t('help.callFamily', { name: family.name || family.phone })}
            </a>
          )}
          <Link to="/shuttle-meds" className={styles.helpBtn}>
            <Ambulance size={28} strokeWidth={2.2} aria-hidden="true" />
            {t('help.shuttle')}
          </Link>
        </div>
      </Dialog>

      <FamilyDialog open={dialog === 'family'} onClose={() => setDialog(null)} userId={userId} family={family} />
    </div>
  )
}

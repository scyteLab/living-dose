import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScanLine, Video } from 'lucide-react'
import GettingStarted from '@/components/dashboard/GettingStarted'
import Habits from '@/components/dashboard/Habits'
import NextConsultation from '@/components/dashboard/NextConsultation'
import ScoreCard from '@/components/dashboard/ScoreCard'
import { OrderCard, ReadCard, WeeklyFocus } from '@/components/dashboard/SideCards'
import TodayMeals from '@/components/dashboard/TodayMeals'
import WeekStrip from '@/components/dashboard/WeekStrip'
import styles from '@/components/dashboard/Dashboard.module.css'
import Button from '@/components/ui/Button'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import useAuth from '@/hooks/useAuth'
import useDashboard from '@/hooks/useDashboard'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useMealPlan from '@/hooks/useMealPlan'
import { relativeWhen } from '@/lib/care/format'
import { partOfDay } from '@/lib/dashboard/insights'

const todayIndex = () => (new Date().getDay() + 6) % 7

/** Signed-in Home: today at a glance, built from the person's own data. */
export default function Dashboard() {
  const { t, i18n } = useTranslation('dashboard')
  const tc = useTranslation('care').t
  useDocumentTitle(t('docTitle'))
  const { user, firstName } = useAuth()
  const dash = useDashboard(user)
  const mp = useMealPlan(user)
  // The time the page opened, so everything on it agrees on "now"
  const [now] = useState(() => Date.now())

  if (dash.loading || mp.loading || !mp.plan) return <div className={styles.loading} role="status" aria-label={t('docTitle')} />

  // New members: the getting-started checklist until the health check is done
  if (!dash.record) {
    return (
      <GettingStarted
        firstName={firstName}
        status={{ hasResult: false, planSeen: dash.planSeen, hasOrder: dash.hasOrder, hasAppointment: dash.hasAppointment }}
        water={dash.todayHabits.water}
        setWater={dash.setWater}
      />
    )
  }

  const di = mp.weekOffset === 0 ? todayIndex() : 0
  const day = mp.plan.days[di]
  const slots = Object.keys(day.meals).filter((s) => day.meals[s])
  const done = slots.filter((s) => mp.week.eaten[`${di}.${s}`]).length
  const part = partOfDay()
  const dateText = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  // One-line summary of the day
  const lines = [done ? t('summaryMeals', { done, total: slots.length }) : t('summaryNoneYet')]
  if (dash.nextAppt && new Date(dash.nextAppt.start).getTime() - now < 48 * 3600e3) {
    lines.push(t('summaryAppt', { name: PROFESSIONALS_BY_ID[dash.nextAppt.professionalId].name, when: relativeWhen(dash.nextAppt.start, i18n.language, tc) }))
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>{dateText}</p>
          <h1 className={styles.title}>{firstName ? t(`greeting.${part}`, { name: firstName }) : t(`greeting.${part}NoName`)}</h1>
          <p className={styles.lead}>{lines.join(' ')}</p>
        </div>
        <div className={styles.quick}>
          <Button to="/scan" variant="outline" size="sm">
            <ScanLine size={18} strokeWidth={2} aria-hidden="true" />
            {t('snap')}
          </Button>
          <Button to="/care" variant="care" size="sm">
            <Video size={18} strokeWidth={2} aria-hidden="true" />
            {t('bookExpert')}
          </Button>
        </div>
      </header>

      <div className={styles.rowA}>
        <ScoreCard record={dash.record} now={now} />
        <TodayMeals day={day} dayIndex={di} eaten={mp.week.eaten} onToggle={(slot) => mp.toggleEaten(di, slot)} target={mp.targets.kcal} />
      </div>

      <div className={styles.rowB}>
        <Habits today={dash.todayHabits} setWater={dash.setWater} addMinutes={dash.addMinutes} setMood={dash.setMood} />
        <NextConsultation appt={dash.nextAppt} />
      </div>

      <div className={styles.rowC}>
        <WeeklyFocus record={dash.record} habits={dash.habits} />
        <OrderCard order={dash.latestOrder} />
        <ReadCard record={dash.record} />
      </div>

      <WeekStrip planStore={mp.store} habits={dash.habits} />
    </div>
  )
}

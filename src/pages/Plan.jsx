import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import DayStrip from '@/components/plan/DayStrip'
import DaySummary from '@/components/plan/DaySummary'
import MealCard from '@/components/plan/MealCard'
import PlanGuest from '@/components/plan/PlanGuest'
import PlanHeader from '@/components/plan/PlanHeader'
import RecipeDialog from '@/components/plan/RecipeDialog'
import SettingsDialog from '@/components/plan/SettingsDialog'
import ShoppingList from '@/components/plan/ShoppingList'
import SwapDialog from '@/components/plan/SwapDialog'
import styles from '@/components/plan/Plan.module.css'
import { RECIPES_BY_ID } from '@/data/recipes'
import useAuth from '@/hooks/useAuth'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import useMealPlan from '@/hooks/useMealPlan'
import { dayTotals } from '@/lib/mealPlan/generate'

export default function Plan() {
  const { t } = useTranslation('plan')
  useDocumentTitle(t('docTitle'), t('metaDescription'))
  const { user, loading } = useAuth()

  if (loading) return <div className={styles.loading} role="status" aria-label={t('docTitle')} />
  if (!user) return <PlanGuest />
  return <PlanForUser user={user} />
}

const todayIndex = () => (new Date().getDay() + 6) % 7

function PlanForUser({ user }) {
  const { t, i18n } = useTranslation('plan')
  const mp = useMealPlan(user)
  const [tab, setTab] = useState('meals')
  const [selected, setSelected] = useState(todayIndex)
  const [recipeMeal, setRecipeMeal] = useState(null)
  const [swapTarget, setSwapTarget] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notice, setNotice] = useState(null)

  // Ticks off "See your meal plan" on the Home getting-started list
  useEffect(() => {
    try {
      window.localStorage.setItem(`ld.plan.seen.${user.id}`, '1')
    } catch {
      /* storage blocked */
    }
  }, [user.id])

  const locale = i18n.language
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale])
  const fmtLong = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'long' }), [locale])
  const parse = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  if (mp.loading || !mp.plan) return <div className={styles.loading} role="status" aria-label={t('docTitle')} />

  const { plan, week, targets, settings } = mp
  const day = plan.days[selected]
  const slots = Object.keys(day.meals)
  const totals = dayTotals(day.meals)
  const eatenKcal = slots.reduce((sum, s) => {
    const m = day.meals[s]
    return week.eaten[`${selected}.${s}`] && m ? sum + Math.round(RECIPES_BY_ID[m.recipeId].kcal * m.portion) : sum
  }, 0)
  const eatenCount = (d) => slots.filter((s) => week.eaten[`${d}.${s}`]).length
  const rangeText = t('weekRange', { from: fmt.format(parse(plan.days[0].date)), to: fmt.format(parse(plan.days[6].date)) })
  const recordDate = mp.record ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(mp.record.createdAt)) : null
  const tabs = ['meals', 'shopping']

  const onTabKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = tabs[(tabs.indexOf(tab) + 1) % tabs.length]
    setTab(next)
    document.getElementById(`plan-tab-${next}`)?.focus()
  }

  return (
    <div className={styles.page}>
      <PlanHeader
        weekOffset={mp.weekOffset}
        onWeekChange={(v) => {
          mp.setWeekOffset(v)
          setSelected(v === 0 ? todayIndex() : 0)
        }}
        rangeText={rangeText}
        targets={targets}
        record={mp.record}
        dateText={recordDate}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <div className={styles.tabs} role="tablist" aria-label={t('tabs.label')} onKeyDown={onTabKey}>
        {tabs.map((id) => (
          <button
            key={id}
            id={`plan-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`plan-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={clsx(styles.tab, tab === id && styles.tabOn)}
            onClick={() => setTab(id)}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'meals' ? (
        <div id="plan-panel-meals" role="tabpanel" aria-labelledby="plan-tab-meals" className={styles.mealsPanel}>
          <DayStrip
            days={plan.days}
            selected={selected}
            onSelect={setSelected}
            todayIndex={mp.weekOffset === 0 ? todayIndex() : -1}
            eatenCount={eatenCount}
            mealCount={slots.length}
            locale={locale}
          />
          <div id="day-panel" role="tabpanel" aria-labelledby={`day-tab-${selected}`} className={styles.dayLayout}>
            <div className={styles.meals}>
              {slots.map((slot) => (
                <MealCard
                  key={`${day.date}-${slot}`}
                  slot={slot}
                  meal={day.meals[slot]}
                  eaten={Boolean(week.eaten[`${selected}.${slot}`])}
                  onToggleEaten={() => mp.toggleEaten(selected, slot)}
                  onSwap={() => setSwapTarget({ dayIndex: selected, slot, meal: day.meals[slot] })}
                  onRecipe={() => setRecipeMeal(day.meals[slot])}
                />
              ))}
              <p className={styles.review}>{t('review')}</p>
            </div>
            <DaySummary dayName={fmtLong.format(parse(day.date))} totals={totals} eatenKcal={eatenKcal} targets={targets} dayIndex={selected} />
          </div>
        </div>
      ) : (
        <div id="plan-panel-shopping" role="tabpanel" aria-labelledby="plan-tab-shopping">
          <ShoppingList
            days={plan.days}
            household={settings.household}
            checked={week.checked}
            onToggle={mp.toggleChecked}
            onReset={mp.resetChecked}
            weekText={fmt.format(parse(plan.days[0].date))}
          />
        </div>
      )}

      <RecipeDialog key={recipeMeal?.recipeId ?? 'none'} meal={recipeMeal} household={settings.household} onClose={() => setRecipeMeal(null)} />
      <SwapDialog
        target={swapTarget}
        settings={settings}
        targets={targets}
        onChoose={(id) => {
          mp.swap(swapTarget.dayIndex, swapTarget.slot, id)
          setSwapTarget(null)
        }}
        onUndo={() => {
          mp.undoSwap(swapTarget.dayIndex, swapTarget.slot)
          setSwapTarget(null)
        }}
        onClose={() => setSwapTarget(null)}
      />
      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(next) => {
          mp.updateSettings(next)
          setSettingsOpen(false)
          setNotice(t('settings.saved'))
          setTimeout(() => setNotice(null), 4000)
        }}
      />
    </div>
  )
}

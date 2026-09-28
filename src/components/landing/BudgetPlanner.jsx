import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import useRegion from '@/hooks/useRegion'
import styles from './BudgetPlanner.module.css'

const GOALS = ['bloodSugar', 'heart', 'weight', 'pregnancy']
const HOUSEHOLDS = ['one', 'two', 'family']
const DAYS = ['mon', 'tue', 'wed']
const MEALS = ['breakfast', 'lunch', 'dinner']

/** The currency symbol for the visitor's region, e.g. ₦, £, $ */
function currencySymbol(currency) {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value ?? currency
    )
  } catch {
    return currency
  }
}

/**
 * A small working demo: pick a goal and household, see a sample of the week.
 * Menus are samples only; real plans are built and checked by a dietitian after sign-up.
 */
export default function BudgetPlanner() {
  const { t } = useTranslation()
  const { currency } = useRegion()
  const id = useId()
  const [goal, setGoal] = useState('bloodSugar')
  const [household, setHousehold] = useState('two')
  const [budget, setBudget] = useState('')

  const symbol = useMemo(() => currencySymbol(currency), [currency])

  // Keep only digits and show thousands separators as the person types
  const onBudgetChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
    setBudget(digits ? Number(digits).toLocaleString('en') : '')
  }

  const joinLink = `/join?goal=${goal}&household=${household}`

  return (
    <section className={styles.section} aria-labelledby="budget-title">
      <Reveal className={styles.copy}>
        <SectionHeader
          id="budget-title"
          eyebrow={t('landing.budget.eyebrow')}
          tone="ember"
          title={t('landing.budget.title')}
          intro={t('landing.budget.intro')}
        />
        <p className={styles.note}>
          <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
          {t('landing.budget.note')}
        </p>
      </Reveal>

      <Reveal delay={120} className={styles.card}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor={`${id}-goal`}>{t('landing.budget.goalLabel')}</label>
            <select id={`${id}-goal`} value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {t(`landing.budget.goals.${g}`)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${id}-household`}>{t('landing.budget.householdLabel')}</label>
            <select id={`${id}-household`} value={household} onChange={(e) => setHousehold(e.target.value)}>
              {HOUSEHOLDS.map((h) => (
                <option key={h} value={h}>
                  {t(`landing.budget.households.${h}`)}
                </option>
              ))}
            </select>
          </div>

          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor={`${id}-budget`}>
              {t('landing.budget.budgetLabel')} <span className={styles.optional}>{t('landing.budget.optional')}</span>
            </label>
            <div className={styles.money}>
              <span className={styles.symbol} aria-hidden="true">
                {symbol}
              </span>
              <input
                id={`${id}-budget`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={t('landing.budget.budgetPlaceholder')}
                value={budget}
                onChange={onBudgetChange}
              />
              <span className={styles.per}>{t('landing.budget.perWeek')}</span>
            </div>
          </div>
        </div>

        <div className={styles.preview} aria-live="polite">
          <p className={styles.previewTitle}>{t('landing.budget.previewTitle')}</p>
          <dl className={styles.days}>
            {DAYS.map((day) => (
              <div key={day} className={styles.day}>
                <dt>{t(`landing.budget.days.${day}`)}</dt>
                <dd>
                  {MEALS.map((meal) => (
                    <span key={meal} className={styles.meal}>
                      {t(`landing.budget.menus.${goal}.${day}.${meal}`)}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p className={styles.sample}>{t('landing.budget.sample')}</p>
        </div>

        <Button to={joinLink} variant="action" className={styles.cta}>
          {t('landing.budget.cta')}
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </Button>
      </Reveal>
    </section>
  )
}

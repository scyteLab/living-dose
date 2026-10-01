import { Activity, Apple, Brain, Cigarette, CookingPot, Droplet, HeartPulse, Leaf, Moon, Scale, Sunrise, Utensils } from 'lucide-react'
import clsx from 'clsx'
import styles from './Learn.module.css'

/** A drawn cover for each topic until real photography is ready. */
const TOPIC_ICON = { eating: Leaf, diabetes: Droplet, heart: HeartPulse, weight: Scale, activity: Activity, sleep: Moon, mind: Brain, habits: Cigarette, pregnancy: Apple }
const MEAL_ICON = { breakfast: Sunrise, lunch: Utensils, dinner: CookingPot, snack: Apple }

export default function Cover({ item, size = 'md' }) {
  const Icon = item.kind === 'recipe' ? MEAL_ICON[item.meal] : TOPIC_ICON[item.topic]
  return (
    <span className={clsx(styles.cover, styles[`cover_${item.kind === 'recipe' ? 'recipe' : item.topic}`], styles[`cover_${size}`])} aria-hidden="true">
      <span className={styles.coverShape} />
      <Icon strokeWidth={1.5} />
    </span>
  )
}

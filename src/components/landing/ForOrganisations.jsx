import { useTranslation } from 'react-i18next'
import { Briefcase, GraduationCap, HandHeart } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import styles from './ForOrganisations.module.css'

const OFFERS = [
  { key: 'staff', icon: Briefcase },
  { key: 'schools', icon: GraduationCap },
  { key: 'community', icon: HandHeart },
]

/** Companies, schools and NGOs. Ends the landing page with a clear next step. */
export default function ForOrganisations() {
  const { t } = useTranslation()

  return (
    <section className={styles.band} aria-labelledby="orgs-title">
      <Reveal className={styles.head}>
        <SectionHeader id="orgs-title" title={t('landing.orgs.title')} intro={t('landing.orgs.intro')} />
        <Button to="/partners" variant="outline">
          {t('landing.orgs.cta')}
        </Button>
      </Reveal>

      <ul className={styles.grid}>
        {OFFERS.map(({ key, icon: Icon }, i) => (
          <Reveal as="li" key={key} delay={i * 90} className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <h3 className={styles.cardTitle}>{t(`landing.orgs.${key}.title`)}</h3>
            <p className={styles.cardBody}>{t(`landing.orgs.${key}.body`)}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

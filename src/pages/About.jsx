import { useTranslation } from 'react-i18next'
import { ArrowRight, Globe2, HandCoins, ShieldCheck, Wheat } from 'lucide-react'
import PageIntro from '@/components/page/PageIntro'
import Pillars from '@/components/landing/Pillars'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import styles from './About.module.css'

const VALUES = [
  { key: 'food', icon: Wheat, tone: 'leaf' },
  { key: 'honest', icon: ShieldCheck, tone: 'sky' },
  { key: 'affordable', icon: HandCoins, tone: 'ember' },
  { key: 'local', icon: Globe2, tone: 'plum' },
]

export default function About() {
  const { t } = useTranslation()
  useDocumentTitle(t('about.docTitle'))
  const story = t('about.story', { returnObjects: true })

  return (
    <div className={styles.page}>
      <PageIntro eyebrow={t('about.eyebrow')} title={t('about.title')} intro={t('about.intro')} />

      <section className={styles.story} aria-labelledby="story-title">
        <Reveal>
          <SectionHeader id="story-title" title={t('about.storyTitle')} />
        </Reveal>
        <Reveal delay={100} className={styles.storyText}>
          {story.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </Reveal>
      </section>

      <div className={styles.purpose}>
        <Reveal className={`${styles.purposeCard} ${styles.mission}`}>
          <h2 className={styles.purposeTitle}>{t('about.missionTitle')}</h2>
          <p>{t('about.mission')}</p>
        </Reveal>
        <Reveal delay={100} className={`${styles.purposeCard} ${styles.vision}`}>
          <h2 className={styles.purposeTitle}>{t('about.visionTitle')}</h2>
          <p>{t('about.vision')}</p>
        </Reveal>
      </div>

      <section className={styles.values} aria-labelledby="values-title">
        <Reveal>
          <SectionHeader id="values-title" title={t('about.valuesTitle')} />
        </Reveal>
        <ul className={styles.valueGrid}>
          {VALUES.map(({ key, icon: Icon, tone }, i) => (
            <Reveal as="li" key={key} delay={i * 80} className={styles.value}>
              <span className={`${styles.valueIcon} ${styles[tone]}`} aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <h3 className={styles.valueTitle}>{t(`about.values.${key}.title`)}</h3>
              <p className={styles.valueBody}>{t(`about.values.${key}.body`)}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <Pillars />

      <Reveal as="section" className={styles.cta} aria-labelledby="about-cta-title">
        <div>
          <h2 id="about-cta-title" className={styles.ctaTitle}>
            {t('about.ctaTitle')}
          </h2>
          <p className={styles.ctaBody}>{t('about.ctaBody')}</p>
        </div>
        <div className={styles.ctaActions}>
          <Button to="/join" variant="action">
            {t('about.ctaPrimary')}
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button to="/contact" variant="outline" className={styles.onDark}>
            {t('about.ctaSecondary')}
          </Button>
        </div>
      </Reveal>
    </div>
  )
}

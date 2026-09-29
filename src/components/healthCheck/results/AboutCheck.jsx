import { useTranslation } from 'react-i18next'
import styles from './Results.module.css'

export default function AboutCheck() {
  const { t } = useTranslation('healthCheck')
  return (
    <section className={styles.about} aria-labelledby="about-check-title">
      <div>
        <h2 id="about-check-title" className={styles.cardTitle}>
          {t('results.aboutTitle')}
        </h2>
        {t('results.aboutBody', { returnObjects: true }).map((p) => (
          <p key={p} className={styles.aboutText}>
            {p}
          </p>
        ))}
      </div>
      <div>
        <h3 className={styles.methodsTitle}>{t('results.methodsTitle')}</h3>
        <ul className={styles.methods}>
          {t('results.methods', { returnObjects: true }).map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BadgeCheck, Check, GraduationCap, Languages } from 'lucide-react'
import Avatar from '@/components/care/Avatar'
import BookingPanel from '@/components/care/BookingPanel'
import { TYPE_ICON } from '@/components/care/typeIcons'
import styles from '@/components/care/Care.module.css'
import PageIntro from '@/components/page/PageIntro'
import Tag from '@/components/ui/Tag'
import { care } from '@/config/care'
import { PROFESSIONALS_BY_ID } from '@/data/professionals'
import useDocumentTitle from '@/hooks/useDocumentTitle'

export default function ProfessionalPage() {
  const { professionalId } = useParams()
  const { t } = useTranslation('care')
  const p = PROFESSIONALS_BY_ID[professionalId]
  useDocumentTitle(p ? `${p.name}, ${p.title}` : t('docTitle'), p?.bio)

  if (!p) {
    return (
      <div className={styles.page}>
        <PageIntro title={t('profile.notFound')}>
          <Link to="/care">{t('profile.back')}</Link>
        </PageIntro>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link to="/care" className={styles.back}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        {t('profile.back')}
      </Link>

      <div className={styles.profileLayout}>
        <div className={styles.profileMain}>
          <header className={styles.profileHead}>
            <Avatar professional={p} size="lg" />
            <div className={styles.profileWho}>
              <p className={styles.eyebrow}>{t(`specialtyOne.${p.specialty}`)}</p>
              <h1 className={styles.profileName}>{p.name}</h1>
              <p className={styles.cardTitle}>
                {p.title} · {t('years', { count: p.years })}
              </p>
              <p className={styles.verified}>
                <BadgeCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                {t('verified')}
              </p>
            </div>
          </header>

          <ul className={styles.profileFacts}>
            <li>
              <Languages size={18} strokeWidth={2} aria-hidden="true" />
              <span>
                <strong>{t('profile.languages')}</strong> {p.languages.join(', ')}
              </span>
            </li>
            <li>
              <span className={styles.typeIcons}>
                {p.types.map((ty) => {
                  const Icon = TYPE_ICON[ty]
                  return <Icon key={ty} size={18} strokeWidth={2} aria-hidden="true" />
                })}
              </span>
              <span>{p.types.map((ty) => t(`typesLong.${ty}`)).join(', ')}</span>
            </li>
          </ul>

          <section className={styles.section} aria-labelledby="about-title">
            <h2 id="about-title" className={styles.sectionTitle}>
              {t('profile.about')}
            </h2>
            <p className={styles.bio}>{p.bio}</p>
          </section>

          <section className={styles.section} aria-labelledby="helps-title">
            <h2 id="helps-title" className={styles.sectionTitle}>
              {t('profile.helpsWith')}
            </h2>
            <div className={styles.cardTags}>
              {p.focus.map((f) => (
                <Tag key={f} tone="sky">
                  {t(`focus.${f}`)}
                </Tag>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="edu-title">
            <h2 id="edu-title" className={styles.sectionTitle}>
              {t('profile.education')}
            </h2>
            <ul className={styles.education}>
              {p.education.map((e) => (
                <li key={e}>
                  <GraduationCap size={18} strokeWidth={2} aria-hidden="true" />
                  {e}
                </li>
              ))}
            </ul>
            <p className={styles.hint}>{t('profile.verifiedNote')}</p>
          </section>

          <section className={styles.expect} aria-labelledby="expect-title">
            <h2 id="expect-title" className={styles.sectionTitle}>
              {t('profile.expect')}
            </h2>
            <ul>
              {t('profile.expectItems', { returnObjects: true, minutes: care.slotMinutes }).map((item) => (
                <li key={item}>
                  <Check size={17} strokeWidth={2.6} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <BookingPanel professional={p} />
      </div>
    </div>
  )
}

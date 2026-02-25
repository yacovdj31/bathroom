import QuoteForm from '../components/QuoteForm'
import { useI18n } from '../i18n'

const PHONE_NUMBER = '053-344-1353'
const PHONE_DIGITS = PHONE_NUMBER.replace(/-/g, '')

function Contact() {
  const { strings } = useI18n()
  const cards = [
    { title: 'Phone', text: PHONE_NUMBER },
    ...strings.contact.cards.filter((card) => card.text !== PHONE_NUMBER),
  ]

  return (
    <div>
      <section className="section">
        <div className="section-header">
          <h2>{strings.home.quote.title}</h2>
          <p className="muted">{strings.home.quote.subtitle}</p>
        </div>
        <div className="form-shell">
          <QuoteForm />
        </div>
      </section>

      <section className="section muted-section">
        <div className="section-header">
          <h1>{strings.contact.title}</h1>
          <p className="muted">{strings.contact.subtitle}</p>
        </div>
        <div className="card-grid">
          {cards.map((card) => {
            const cleaned = card.text.replace(/[^0-9]/g, '')
            const link = card.text.includes('@')
              ? `mailto:${card.text}`
              : cleaned.length >= 9
                ? `tel:${cleaned || PHONE_DIGITS}`
                : '/contact'
            return (
              <a key={card.title} className="card card-link" href={link}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default Contact

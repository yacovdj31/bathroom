import QuoteForm from '../components/QuoteForm'
import { useI18n } from '../i18n'

function Contact() {
  const { strings } = useI18n()

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
          {strings.contact.cards.map((card) => {
            const link =
              card.title === strings.contact.cards[0].title
                ? `tel:${strings.nav.phone}`
                : card.title === strings.contact.cards[1].title
                  ? `mailto:${strings.footer.email}`
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

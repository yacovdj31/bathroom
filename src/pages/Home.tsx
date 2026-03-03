import { Link } from 'react-router-dom'
import IncludedFeatures from '../components/IncludedFeatures'
import QuoteForm from '../components/QuoteForm'
import { eventTypes } from '../content/eventTypes'
import { useI18n } from '../i18n'

const PHONE_NUMBER = '053-344-1353'

function Home() {
  const { strings } = useI18n()

  return (
    <div>
      <section className="hero section">
        <div className="hero-banner">
          <img
            className="hero-banner-image"
            src="/images/loohave-photo1.webp"
            alt="Interior view of a restroom trailer"
          />
          <div className="hero-content">
            <p className="eyebrow">{strings.home.hero.eyebrow}</p>
            <p className="subtitle hero-title">{strings.home.hero.title}</p>
            <div className="hero-actions">
              <Link className="button primary hero-primary" to="/contact">
                {strings.home.hero.primaryCta}
              </Link>
              <a className="hero-phone-link" href={`tel:${PHONE_NUMBER.replace(/-/g, '')}`}>
                {PHONE_NUMBER}
              </a>
            </div>
          </div>
        </div>
        <p className="hero-explanation">{strings.home.hero.subtitle}</p>
      </section>

      <section className="section">
        <div className="badge-row">
          {strings.home.badges.map((badge) => (
            <span key={badge} className="badge">
              {badge}
            </span>
          ))}
        </div>
      </section>

      <section className="section event-types-section">
        <div className="section-header">
          <h2>Event Types We Serve Across Israel</h2>
          <p className="muted">
            Luxury restroom trailer rentals for weddings, private events, corporate productions, and long-term projects.
          </p>
        </div>
        <div className="event-types-grid">
          {eventTypes.map((type) => (
            <article key={type.id} className="event-type-card">
              <div className="event-type-image-shell">
                <img className="event-type-image" src={type.homeImage} alt={`${type.title} restroom trailer service`} />
              </div>
              <h3>{type.title}</h3>
              <p>{type.shortText}</p>
              <Link className="event-type-link" to={`/about#${type.id}`}>
                Learn More
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{strings.home.howItWorks.title}</h2>
        </div>
        <div className="card-grid">
          {strings.home.howItWorks.steps.map((step, index) => {
            const link = index === 0 ? '/items' : '/contact'
            return (
              <Link key={step.title} className="card card-link" to={link}>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{strings.home.featured.title}</h2>
          <p className="muted">{strings.home.featured.subtitle}</p>
        </div>
        <div className="card-grid">
          {strings.home.featured.cards.map((card) => (
            <Link key={card.name} className="card card-link featured-card" to="/items">
              <h3>{card.name}</h3>
              <p>{card.detail}</p>
              <div className="price-row">
                <span className="price">{card.price}</span>
                <span className="muted">{card.capacity}</span>
              </div>
              <span className="text-link">{strings.home.hero.primaryCta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{strings.home.faq.title}</h2>
        </div>
        <div className="card-grid">
          {strings.home.faq.items.map((item) => (
            <Link key={item.question} className="card card-link" to="/items#top">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </Link>
          ))}
        </div>
      </section>

      <IncludedFeatures />

      <section className="section muted-section">
        <div className="section-header">
          <h2>{strings.home.quote.title}</h2>
          <p className="muted">{strings.home.quote.subtitle}</p>
        </div>
        <div className="form-shell">
          <QuoteForm />
        </div>
      </section>
    </div>
  )
}

export default Home

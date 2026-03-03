import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import IncludedFeatures from '../components/IncludedFeatures'
import { eventTypes, type EventTypeContent } from '../content/eventTypes'
import { useI18n } from '../i18n'

function About() {
  const { strings } = useI18n()
  const location = useLocation()
  const [featuredType, ...otherTypes] = eventTypes
  const sectionPhotos = [
    '/images/loohaven-b3.webp',
    '/images/loohaven-b2.webp',
    '/images/loohaven-image3.webp',
    '/images/loohaven-b1.webp',
  ]
  const galleryPhotos = [
    '/images/loohave-photo1.webp',
    '/images/loohaven-image3.webp',
    '/images/loohaven-image2.webp',
    '/images/loohaven-b1.webp',
    '/images/loohaven-b5.webp',
  ]
  const getEventMediaPhotos = (images: string[]) => {
    const main = images[0] || '/images/loohaven-a1.webp'
    const firstThumb = images[1] || main
    const secondThumb = images[2] || main
    return { main, thumbs: [firstThumb, secondThumb] }
  }

  useEffect(() => {
    if (!location.hash) return
    const id = decodeURIComponent(location.hash.slice(1))
    const target = document.getElementById(id)
    if (!target) return
    requestAnimationFrame(() => {
      const top = target.getBoundingClientRect().top + window.scrollY - 92
      window.scrollTo({ top, behavior: 'smooth' })
    })
  }, [location.hash])

  const renderEventCard = (item: EventTypeContent, featured = false) => {
    const media = getEventMediaPhotos(item.aboutImages)
    const keyBullets = item.bullets.slice(0, 2)
    const extraBullets = item.bullets.slice(2)
    const stripPhotos = [
      item.aboutImages[1] || media.main,
      item.aboutImages[2] || media.main,
      item.aboutImages[3] || media.main,
      item.aboutImages[4] || item.aboutImages[1] || media.main,
    ]
    const formatBullet = (line: string) => {
      const [first, ...rest] = line.split(' ')
      return { first, rest: rest.join(' ') }
    }

    return (
      <article key={item.id} id={item.id} className={`about-event-card about-event-flow ${featured ? 'about-event-featured' : ''}`.trim()}>
        <div className="about-event-media">
          <Link className="about-event-photo about-event-photo-main is-box about-event-photo-link" to="/contact">
            <img src={media.main} alt={`${item.title} restroom trailer in Israel`} />
            <div className="about-event-photo-overlay">
              <p className="about-event-tag">Event-ready setup</p>
              <h3>{item.title}</h3>
              <span className="button primary about-overlay-cta">Request Quote</span>
            </div>
          </Link>
        </div>

        <div className="about-event-content">
          <p className="about-lead">
            <strong>Built for {item.title.toLowerCase()}.</strong> {item.seoIntro}
          </p>
          <p>
            <strong>What clients value most:</strong> {item.details[0]}
          </p>

          <ul className="list about-bullets about-bullets-lg">
            {keyBullets.map((line) => (
              <li key={line}>{(() => {
                const parts = formatBullet(line)
                return (
                  <>
                    <strong>{parts.first}</strong>{parts.rest ? ` ${parts.rest}` : ''}
                  </>
                )
              })()}</li>
            ))}
          </ul>

          <ul className="list about-bullets about-bullets-sm">
            {extraBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="about-event-thumb-row about-event-thumb-row-4">
          {stripPhotos.map((image, imageIndex) => (
            <div key={`${item.id}-strip-${imageIndex}`} className={`about-event-photo about-event-photo-thumb ${imageIndex % 3 === 0 ? 'is-circle' : imageIndex % 3 === 1 ? 'is-box' : 'is-soft'}`}>
              <img src={image} alt={`${item.title} gallery photo ${imageIndex + 1}`} />
            </div>
          ))}
        </div>

        <div className="about-event-actions about-event-actions-bottom">
          <Link className="button primary" to="/contact">Request Quote</Link>
        </div>
      </article>
    )
  }

  return (
    <div>
      <section className="section about-top-headline" aria-label={`${strings.brand} logo`}>
        <img className="about-head-logo" src="/images/bathroomsheli-logo.png" alt="Bathroom Sheli logo" />
      </section>

      <section className="section about-hero-section">
        <div className="about-hero-banner">
          <img src="/images/loohaven-a4.webp" alt="Luxury mobile restroom trailer setup for events in Israel" />
          <div className="about-hero-overlay">
            <p className="eyebrow">About bathroomsheli</p>
            <h1>Luxury Restroom Trailer Rentals Across Israel</h1>
            <p>
              Professional, clean, and guest-ready mobile restroom trailers for weddings, private events,
              corporate productions, and long-term projects.
            </p>
            <Link className="button primary" to="/contact">Request Quote</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{strings.about.title}</h2>
          <p className="muted">
            bathroomsheli is a premium restroom trailer rental service in Israel, built for weddings, events,
            and professional long-term projects.
          </p>
        </div>
        <div className="about-story-grid">
          {strings.about.body.map((paragraph, index) => (
            <article key={paragraph} className="about-story-card">
              <p className="eyebrow">Point {index + 1}</p>
              <p>{paragraph}</p>
            </article>
          ))}
        </div>
        <div className="about-section-cta">
          <Link className="button primary" to="/contact">Request Quote</Link>
        </div>
      </section>

      <section className="section muted-section about-event-types">
        <div className="section-header">
          <h2>Our Event Types</h2>
          <p className="muted">
            Explore how our mobile restroom trailer rentals are customized for each type of event in Israel.
          </p>
        </div>

        {renderEventCard(featuredType, true)}

        <div className="about-event-list">
          {otherTypes.map((item) => renderEventCard(item))}
        </div>
      </section>

      <section className="section">
        <div className="about-grid">
          {strings.about.sections.map((section, index) => (
            <div key={section.title} className="about-card">
              <div className="about-image-shell">
                <img className={`about-image ${index % 2 === 0 ? 'is-box' : 'is-circle'}`} src={sectionPhotos[index % sectionPhotos.length]} alt={section.title} />
              </div>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              <Link className="button secondary" to="/contact">Request Quote</Link>
            </div>
          ))}
        </div>
      </section>

      <IncludedFeatures />

      <section className="section">
        <div className="about-grid about-gallery-grid">
          {strings.about.gallery.map((item, index) => {
            return (
              <div key={item} className="about-photo">
                <img src={galleryPhotos[index % galleryPhotos.length]} alt={item} />
              </div>
            )
          })}
        </div>
        <div className="about-section-cta">
          <Link className="button primary" to="/contact">Request Quote</Link>
        </div>
      </section>
    </div>
  )
}

export default About

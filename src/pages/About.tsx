import IncludedFeatures from '../components/IncludedFeatures'
import { useI18n } from '../i18n'

function About() {
  const { strings } = useI18n()

  return (
    <div>
      <section className="section">
        <div className="section-header">
          <h1>{strings.about.title}</h1>
        </div>
        <div className="stacked-text">
          {strings.about.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="section muted-section">
        <div className="about-grid">
          {strings.about.sections.map((section) => (
            <div key={section.title} className="about-card">
              <div className="about-image" aria-hidden="true" />
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </div>
          ))}
        </div>
      </section>

      <IncludedFeatures />

      <section className="section">
        <div className="about-grid">
          {strings.about.gallery.map((item, index) => {
            const photos = [
              '/images/loohave-photo1.webp',
              '/images/loohaven-image3.webp',
              '/images/loohaven-image2.webp',
            ]

            return (
              <div key={item} className="about-photo">
                <img src={photos[index % photos.length]} alt={item} />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default About

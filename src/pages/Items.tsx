import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

type GalleryCategory = 'twoStall' | 'threeStall'

function Items() {
  const { strings } = useI18n()
  const galleryByCategory: Record<GalleryCategory, { src: string; alt: string }[]> = {
    twoStall: [
      { src: '/images/loohaven-a3.webp', alt: 'Two-stall restroom trailer exterior view' },
      { src: '/images/loohaven-a2.webp', alt: 'Two-stall restroom trailer interior view' },
      { src: '/images/loohaven-a1.webp', alt: 'Two-stall restroom trailer floor plan' },
      {
        src: '/images/loohaven-a4.webp',
        alt: 'Two-stall restroom trailer additional interior view',
      },
    ],
    threeStall: [
      { src: '/images/loohaven-b1.webp', alt: 'Three-stall restroom trailer exterior view' },
      { src: '/images/loohaven-b2.webp', alt: 'Three-stall restroom trailer interior view 1' },
      { src: '/images/loohaven-b3.webp', alt: 'Three-stall restroom trailer floor plan' },
      { src: '/images/loohaven-b4.webp', alt: 'Three-stall restroom trailer interior view 2' },
      { src: '/images/loohaven-b5.webp', alt: 'Three-stall restroom trailer interior view 3' },
    ],
  }
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('twoStall')
  const [selectedIndexByCategory, setSelectedIndexByCategory] = useState<
    Record<GalleryCategory, number>
  >({
    twoStall: 0,
    threeStall: 0,
  })
  const activePhotos = galleryByCategory[activeCategory]
  const selectedIndex = selectedIndexByCategory[activeCategory]
  const selectedPhoto = activePhotos[selectedIndex]
  const selectedIsPlan = /floor plan/i.test(selectedPhoto.alt)

  const showPhoto = (index: number) => {
    setSelectedIndexByCategory((previous) => ({
      ...previous,
      [activeCategory]: index,
    }))
  }

  const showPreviousPhoto = () => {
    showPhoto((selectedIndex - 1 + activePhotos.length) % activePhotos.length)
  }

  const showNextPhoto = () => {
    showPhoto((selectedIndex + 1) % activePhotos.length)
  }

  return (
    <div>
      <section id="top" className="section items-section">
        <div className="section-header">
          <h1>{strings.items.title}</h1>
          <p className="muted">{strings.items.subtitle}</p>
        </div>
        <div className="items-gallery-categories" role="tablist" aria-label="Trailer categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'twoStall'}
            className={`items-category${activeCategory === 'twoStall' ? ' is-active' : ''}`}
            onClick={() => setActiveCategory('twoStall')}
          >
            {strings.items.cards[0].name}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'threeStall'}
            className={`items-category${activeCategory === 'threeStall' ? ' is-active' : ''}`}
            onClick={() => setActiveCategory('threeStall')}
          >
            {strings.items.cards[1].name}
          </button>
        </div>
        <div
          className="items-gallery"
          aria-label={`${activeCategory === 'twoStall' ? 'Two-stall' : 'Three-stall'} trailer photo gallery`}
        >
          <div className="items-gallery-viewport">
            <button
              type="button"
              className="items-gallery-arrow is-prev"
              onClick={showPreviousPhoto}
              aria-label="Previous photo"
            >
              &#8249;
            </button>
            <div className="items-gallery-main">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                className={selectedIsPlan ? 'is-plan' : ''}
              />
            </div>
            <button
              type="button"
              className="items-gallery-arrow is-next"
              onClick={showNextPhoto}
              aria-label="Next photo"
            >
              &#8250;
            </button>
          </div>
          <div className="items-gallery-thumbs">
            {activePhotos.map((photo, index) => {
              const isActive = photo.src === selectedPhoto.src
              return (
                <button
                  key={photo.src}
                  type="button"
                  className={`items-thumb${isActive ? ' is-active' : ''}`}
                  onClick={() => showPhoto(index)}
                  aria-label={`Show photo: ${photo.alt}`}
                  aria-pressed={isActive}
                >
                  <img src={photo.src} alt={photo.alt} />
                </button>
              )
            })}
          </div>
        </div>
        <div className="card-grid">
          {strings.items.cards.map((card) => (
            <Link key={card.name} className="card card-link" to="/contact">
              <div className="card-head">
                <h2>{card.name}</h2>
                <span className="price">{card.price}</span>
              </div>
              <p className="muted">{card.capacity}</p>
              <p>{card.uses}</p>
              <p className="card-label">{card.includesTitle}</p>
              <ul className="list">
                {card.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span className="text-link">{strings.home.hero.primaryCta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section muted-section">
        <div className="section-header">
          <h2>{strings.items.includedTitle}</h2>
        </div>
        <div className="feature-grid">
          {strings.items.includedItems.map((item) => (
            <div key={item} className="feature-card">
              <span className="feature-icon" aria-hidden="true">
                ✦
              </span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Items

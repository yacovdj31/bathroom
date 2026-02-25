import { useI18n } from '../i18n'

const includedIcons = [
  (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13h16M7 16V8m10 8V8M9 8h6l2 3H7z" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c2.6 3 4 5.3 4 7.1a4 4 0 1 1-8 0C8 8.3 9.4 6 12 3zM4 18h16" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 9a5 5 0 1 1 10 0v4M5 14h14M9 14v3m6-3v3" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h10M11 8l4 4-4 4M6 6h8M6 18h8" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-6 14a6 6 0 0 1 12 0" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 15c3-6 13-6 16 0M5 15h14M7 11h10" />
    </svg>
  )
]

function IncludedFeatures() {
  const { strings } = useI18n()

  return (
    <section className="section included-section">
      <div className="section-header">
        <h2>{strings.items.includedTitle}</h2>
      </div>
      <div className="included-grid">
        {strings.items.includedItems.map((item, index) => (
          <article key={item} className="included-item">
            <span className="included-icon">{includedIcons[index] ?? includedIcons[0]}</span>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default IncludedFeatures

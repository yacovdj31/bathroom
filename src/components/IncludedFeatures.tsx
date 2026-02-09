import { useI18n } from '../i18n'

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
            <span className={`included-icon icon-${(index % 4) + 1}`} aria-hidden="true" />
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default IncludedFeatures

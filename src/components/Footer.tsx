import { useI18n } from '../i18n'

function Footer() {
  const { strings } = useI18n()

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>{strings.footer.title}</h3>
          <p>{strings.footer.description}</p>
        </div>
        <div>
          <p className="footer-title">{strings.footer.serviceTitle}</p>
          <p>{strings.footer.serviceText}</p>
        </div>
        <div>
          <p className="footer-title">{strings.footer.contactTitle}</p>
          <p>
            <a href={`mailto:${strings.footer.email}`}>{strings.footer.email}</a>
          </p>
        </div>
      </div>
      <p className="footer-note">{strings.footer.note}</p>
    </footer>
  )
}

export default Footer

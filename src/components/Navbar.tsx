import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'

function Navbar() {
  const { strings, language, setLanguage } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)

  const toggleLanguage = (next: 'en' | 'he') => {
    setLanguage(next)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current) {
        return
      }

      if (!headerRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <header ref={headerRef} className="navbar">
      <div className="navbar-inner">
        <NavLink className="brand" to="/" onClick={() => setMenuOpen(false)}>
          JEWHAVEN
        </NavLink>

        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary">
          {strings.nav.links.map((link) => (
            <NavLink
              key={link.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'is-active' : ''}`
              }
              to={link.path}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link className="button primary nav-cta nav-cta-center" to="/contact" onClick={() => setMenuOpen(false)}>
          {strings.nav.cta}
        </Link>

        <div className="nav-actions">
          <a className="nav-phone" href={`tel:${strings.nav.phone}`}>
            {strings.nav.phone}
          </a>
          <div className="lang-toggle" role="group" aria-label={strings.nav.langLabel}>
            <button
              type="button"
              className={`lang-button ${language === 'en' ? 'is-active' : ''}`}
              onClick={() => toggleLanguage('en')}
            >
              {strings.nav.lang.en}
            </button>
            <button
              type="button"
              className={`lang-button ${language === 'he' ? 'is-active' : ''}`}
              onClick={() => toggleLanguage('he')}
            >
              {strings.nav.lang.he}
            </button>
          </div>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{strings.nav.menu}</span>
            <span className="menu-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`mobile-nav-backdrop ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
        tabIndex={-1}
        onClick={() => setMenuOpen(false)}
      />
      <div id="mobile-menu" className={`mobile-nav ${menuOpen ? 'is-open' : ''}`}>
        {strings.nav.links.map((link) => (
          <NavLink
            key={link.path}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'is-active' : ''}`
            }
            to={link.path}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
        <Link className="button primary" to="/contact" onClick={() => setMenuOpen(false)}>
          {strings.nav.cta}
        </Link>
        <a className="button secondary" href={`tel:${strings.nav.phone}`} onClick={() => setMenuOpen(false)}>
          {strings.nav.phone}
        </a>
      </div>
    </header>
  )
}

export default Navbar

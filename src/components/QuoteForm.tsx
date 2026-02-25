import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

type QuoteFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventDate: string
  eventEndDate: string
  scheduleMode: 'single' | 'range'
  trailerType: string
  message: string
}

const initialValues: QuoteFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  eventDate: '',
  eventEndDate: '',
  scheduleMode: 'single',
  trailerType: '',
  message: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toIsoDay = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const asDate = (value: string) => {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const todayIso = () => toIsoDay(new Date())

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const monthLabel = (value: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(value)

function QuoteForm() {
  const { strings } = useI18n()
  const [values, setValues] = useState<QuoteFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [submitError, setSubmitError] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const scheduleContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const fieldLabels = {
    firstName: strings.form.fields.firstName || strings.form.fields.fullName || 'First name',
    lastName: strings.form.fields.lastName || 'Last name',
    email: strings.form.fields.email,
    phone: strings.form.fields.phone || 'Phone number',
    eventDate: strings.form.fields.eventDate || 'Event date',
    trailerType: strings.form.fields.trailerType,
    message: strings.form.fields.message,
  }

  useEffect(() => {
    if (!scheduleOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!scheduleContainerRef.current) return
      if (!scheduleContainerRef.current.contains(event.target as Node)) {
        setScheduleOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [scheduleOpen])

  const fieldErrors = {
    firstName: strings.form.errors.firstName || strings.form.errors.fullName || 'Required',
    lastName: strings.form.errors.lastName || 'Required',
    email: strings.form.errors.email,
    phone: strings.form.errors.phone || 'Required',
    eventDate: strings.form.errors.eventDate,
    eventEndDate: 'Please choose a second day.',
    trailerType: strings.form.errors.trailerType,
    submit: strings.form.errors.submit,
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name } = event.target
    const value = event.target.value
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.firstName.trim()) nextErrors.firstName = fieldErrors.firstName
    if (!values.lastName.trim()) nextErrors.lastName = fieldErrors.lastName

    const email = values.email.trim()
    if (!email || !emailPattern.test(email)) nextErrors.email = fieldErrors.email

    const phone = values.phone.trim()
    if (!phone || phone.length < 6) nextErrors.phone = fieldErrors.phone

    if (!values.eventDate.trim()) nextErrors.eventDate = fieldErrors.eventDate

    if (values.scheduleMode === 'range') {
      if (!values.eventEndDate.trim()) nextErrors.eventEndDate = fieldErrors.eventEndDate
      if (values.eventDate && values.eventEndDate && values.eventEndDate <= values.eventDate) {
        nextErrors.eventEndDate = 'Choose at least two days for multiple-days mode.'
      }
    }

    if (!values.trailerType.trim()) nextErrors.trailerType = fieldErrors.trailerType
    return nextErrors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 12000)

    try {
      setStatus('submitting')
      const eventEndDate = values.scheduleMode === 'range'
        ? values.eventEndDate.trim()
        : values.eventDate.trim()
      const payload = {
        ...values,
        eventEndDate,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        cityOrArea: '',
      }

      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        let details = ''
        let requestId = ''
        try {
          const result = await response.json()
          details = typeof result?.reason === 'string' ? result.reason : ''
          requestId = typeof result?.requestId === 'string' ? result.requestId : ''
        } catch {
          details = ''
        }
        const parts = [details, requestId ? `id:${requestId}` : ''].filter(Boolean)
        throw new Error(parts.join(' | ') || 'Request failed')
      }

      setStatus('success')
      setValues(initialValues)
    } catch (error) {
      const message =
        error instanceof Error && error.message && error.message !== 'Request failed'
          ? `${fieldErrors.submit} (${error.message})`
          : fieldErrors.submit
      setSubmitError(message)
      setStatus('idle')
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const resetForm = () => {
    setErrors({})
    setSubmitError('')
    setValues(initialValues)
    setStatus('idle')
  }

  const monthStart = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1)
  const monthEnd = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0)
  const calendarStart = addDays(monthStart, -monthStart.getDay())
  const calendarEnd = addDays(monthEnd, 6 - monthEnd.getDay())
  const calendarDays: Date[] = []
  let cursor = calendarStart
  while (cursor <= calendarEnd) {
    calendarDays.push(cursor)
    cursor = addDays(cursor, 1)
  }

  const startDate = asDate(values.eventDate)
  const endDate = asDate(values.eventEndDate)
  const minSelectableDay = todayIso()

  const isDayInSelectedRange = (iso: string) => {
    const selected = asDate(iso)
    if (!selected || !startDate) return false
    if (values.scheduleMode === 'single') return iso === values.eventDate
    if (!endDate) return iso === values.eventDate
    return selected >= startDate && selected <= endDate
  }

  const isRangeEdge = (iso: string) =>
    values.scheduleMode === 'range' && (iso === values.eventDate || iso === values.eventEndDate)

  const selectScheduleDay = (iso: string) => {
    if (iso < minSelectableDay) {
      return
    }
    let shouldClose = false
    setValues((prev) => {
      if (prev.scheduleMode === 'single') {
        shouldClose = true
        return { ...prev, eventDate: iso, eventEndDate: iso }
      }

      if (!prev.eventDate || prev.eventEndDate) {
        return { ...prev, eventDate: iso, eventEndDate: '' }
      }

      if (iso <= prev.eventDate) {
        return { ...prev, eventDate: iso, eventEndDate: '' }
      }

      shouldClose = true
      return { ...prev, eventEndDate: iso }
    })
    setErrors((prev) => ({ ...prev, eventDate: '', eventEndDate: '' }))
    if (shouldClose) setScheduleOpen(false)
  }

  const setScheduleMode = (mode: 'single' | 'range') => {
    setValues((prev) => {
      if (mode === 'single') {
        const singleDay = prev.eventDate || prev.eventEndDate
        return {
          ...prev,
          scheduleMode: 'single',
          eventDate: singleDay,
          eventEndDate: singleDay,
        }
      }
      return { ...prev, scheduleMode: 'range', eventEndDate: '' }
    })
    setErrors((prev) => ({ ...prev, eventEndDate: '' }))
  }

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <h3>{strings.form.successTitle}</h3>
        <p>{strings.form.successBody}</p>
        <button className="button secondary" type="button" onClick={resetForm}>
          {strings.form.sendAnother}
        </button>
      </div>
    )
  }

  return (
    <form className="quote-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="firstName">{fieldLabels.firstName}</label>
        <input id="firstName" name="firstName" type="text" value={values.firstName} onChange={handleChange} />
        {errors.firstName && <span className="field-error">{errors.firstName}</span>}
      </div>

      <div className="field">
        <label htmlFor="lastName">{fieldLabels.lastName}</label>
        <input id="lastName" name="lastName" type="text" value={values.lastName} onChange={handleChange} />
        {errors.lastName && <span className="field-error">{errors.lastName}</span>}
      </div>

      <div className="field">
        <label htmlFor="email">{fieldLabels.email}</label>
        <input id="email" name="email" type="email" value={values.email} onChange={handleChange} />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="phone">{fieldLabels.phone}</label>
        <input id="phone" name="phone" type="tel" value={values.phone} onChange={handleChange} />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>

      <div className="field">
        <div className="schedule-field-head">
          <label htmlFor="schedule-trigger">{fieldLabels.eventDate}</label>
        </div>
        <div className="schedule-popover" ref={scheduleContainerRef}>
          <button
            id="schedule-trigger"
            type="button"
            className={`schedule-trigger ${values.eventDate ? 'has-value' : ''}`}
            aria-expanded={scheduleOpen}
            aria-controls="schedule-picker"
            onClick={() => setScheduleOpen((open) => !open)}
          >
            <span>
              {values.eventDate
                ? values.scheduleMode === 'single'
                  ? values.eventDate
                  : values.eventEndDate
                    ? `${values.eventDate} to ${values.eventEndDate}`
                    : `Start: ${values.eventDate}`
                : 'Click to choose your event date(s)'}
            </span>
            <span className="schedule-trigger-icon" aria-hidden="true">
              {scheduleOpen ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {scheduleOpen ? (
            <div id="schedule-picker" className="schedule-picker is-open">
            <div className="schedule-picker-head">
              <div className="schedule-mode-toggle" role="group" aria-label="Schedule mode">
                <button
                  type="button"
                  className={`schedule-mode-button ${values.scheduleMode === 'single' ? 'is-active' : ''}`}
                  onClick={() => setScheduleMode('single')}
                >
                  One day
                </button>
                <button
                  type="button"
                  className={`schedule-mode-button ${values.scheduleMode === 'range' ? 'is-active' : ''}`}
                  onClick={() => setScheduleMode('range')}
                >
                  Multiple days
                </button>
              </div>
              <button
                type="button"
                className="schedule-close-btn"
                onClick={() => setScheduleOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="schedule-month-nav">
              <button type="button" className="schedule-month-btn" aria-label="Previous month" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                {'<'}
              </button>
              <strong>{monthLabel(activeMonth)}</strong>
              <button type="button" className="schedule-month-btn" aria-label="Next month" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                {'>'}
              </button>
            </div>

            <>
              <div className="schedule-weekdays">
                {weekdayLabels.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="schedule-calendar">
                {calendarDays.map((day) => {
                  const iso = toIsoDay(day)
                  const inMonth = day.getMonth() === activeMonth.getMonth()
                  const isInRange = isDayInSelectedRange(iso)
                  const isEdge = isRangeEdge(iso)
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`schedule-day ${!inMonth ? 'is-muted' : ''} ${iso < minSelectableDay ? 'is-disabled' : ''} ${isInRange ? 'is-selected' : ''} ${isEdge ? 'is-edge' : ''}`.trim()}
                      onClick={() => selectScheduleDay(iso)}
                      disabled={iso < minSelectableDay}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
            <p className="schedule-selection">
              {values.eventDate
                ? values.scheduleMode === 'single'
                  ? `Selected: ${values.eventDate}`
                  : values.eventEndDate
                    ? `Selected: ${values.eventDate} to ${values.eventEndDate}`
                    : `Start: ${values.eventDate} (pick an end date)`
                : 'Pick your event date(s)'}
            </p>
            </div>
          ) : null}
        </div>
        {errors.eventDate && <span className="field-error">{errors.eventDate}</span>}
        {errors.eventEndDate && <span className="field-error">{errors.eventEndDate}</span>}
      </div>

      <div className="field">
        <label htmlFor="trailerType">{fieldLabels.trailerType}</label>
        <select id="trailerType" name="trailerType" value={values.trailerType} onChange={handleChange}>
          <option value="">{strings.form.trailerOptions.placeholder}</option>
          <option value="2-stall">{strings.form.trailerOptions.two}</option>
          <option value="3-stall">{strings.form.trailerOptions.three}</option>
        </select>
        {errors.trailerType && <span className="field-error">{errors.trailerType}</span>}
      </div>

      <div className="field field-span">
        <label htmlFor="message">{fieldLabels.message}</label>
        <textarea id="message" name="message" rows={4} value={values.message} onChange={handleChange} />
      </div>

      {submitError && <span className="field-error form-error">{submitError}</span>}

      <button className="button primary form-submit" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' && <span className="button-spinner" aria-hidden="true" />}
        {status === 'submitting' ? 'Sending...' : strings.form.submit}
      </button>
    </form>
  )
}

export default QuoteForm

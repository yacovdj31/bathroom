import { useState } from 'react'
import { useI18n } from '../i18n'

type QuoteFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventDate: string
  eventEndDate: string
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
  trailerType: '',
  message: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function QuoteForm() {
  const { strings } = useI18n()
  const [values, setValues] = useState<QuoteFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [submitError, setSubmitError] = useState('')

  const fieldLabels = {
    firstName: strings.form.fields.firstName || strings.form.fields.fullName || 'First name',
    lastName: strings.form.fields.lastName || 'Last name',
    email: strings.form.fields.email,
    phone: strings.form.fields.phone || 'Phone number',
    eventDate: strings.form.fields.eventDate,
    eventEndDate: 'End date (for multi-day)',
    trailerType: strings.form.fields.trailerType,
    message: strings.form.fields.message,
  }

  const fieldErrors = {
    firstName: strings.form.errors.firstName || strings.form.errors.fullName || 'Required',
    lastName: strings.form.errors.lastName || 'Required',
    email: strings.form.errors.email,
    phone: strings.form.errors.phone || 'Required',
    eventDate: strings.form.errors.eventDate,
    eventEndDate: 'Please choose an end date.',
    trailerType: strings.form.errors.trailerType,
    submit: strings.form.errors.submit,
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
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

    const endDate = values.eventEndDate.trim() || values.eventDate.trim()
    if (!endDate) nextErrors.eventEndDate = fieldErrors.eventEndDate
    if (values.eventDate && endDate && endDate < values.eventDate) {
      nextErrors.eventEndDate = 'End date cannot be before start date.'
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
      const endDate = values.eventEndDate.trim() || values.eventDate.trim()
      const payload = {
        ...values,
        eventEndDate: endDate,
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
        <label htmlFor="eventDate">{fieldLabels.eventDate}</label>
        <input id="eventDate" name="eventDate" type="date" value={values.eventDate} onChange={handleChange} />
        {errors.eventDate && <span className="field-error">{errors.eventDate}</span>}
      </div>

      <div className="field">
        <label htmlFor="eventEndDate">{fieldLabels.eventEndDate}</label>
        <input
          id="eventEndDate"
          name="eventEndDate"
          type="date"
          value={values.eventEndDate}
          min={values.eventDate || undefined}
          onChange={handleChange}
        />
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

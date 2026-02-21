import { useState } from 'react'
import { useI18n } from '../i18n'

type QuoteFormValues = {
  fullName: string
  email: string
  eventDate: string
  cityOrArea: string
  trailerType: string
  message: string
}

const initialValues: QuoteFormValues = {
  fullName: '',
  email: '',
  eventDate: '',
  cityOrArea: '',
  trailerType: '',
  message: '',
}

function QuoteForm() {
  const { strings } = useI18n()
  const [values, setValues] = useState<QuoteFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [submitError, setSubmitError] = useState('')

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.fullName.trim()) nextErrors.fullName = strings.form.errors.fullName
    if (!values.email.trim()) nextErrors.email = strings.form.errors.email
    if (!values.eventDate.trim()) nextErrors.eventDate = strings.form.errors.eventDate
    if (!values.cityOrArea.trim()) nextErrors.cityOrArea = strings.form.errors.cityOrArea
    if (!values.trailerType.trim())
      nextErrors.trailerType = strings.form.errors.trailerType
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
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        signal: controller.signal,
      })
      if (!response.ok) {
        let details = ''
        let requestId = ''
        let likelyCause = ''
        try {
          const payload = await response.json()
          details = typeof payload?.reason === 'string' ? payload.reason : ''
          requestId = typeof payload?.requestId === 'string' ? payload.requestId : ''
          likelyCause = typeof payload?.likelyCause === 'string' ? payload.likelyCause : ''
        } catch {
          details = ''
        }
        const parts = [details, likelyCause ? `cause:${likelyCause}` : '', requestId ? `id:${requestId}` : ''].filter(Boolean)
        throw new Error(parts.join(' | ') || 'Request failed')
      }
      setStatus('success')
      setValues(initialValues)
    } catch (error) {
      const message =
        error instanceof Error && error.message && error.message !== 'Request failed'
          ? `${strings.form.errors.submit} (${error.message})`
          : strings.form.errors.submit
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
        <label htmlFor="fullName">{strings.form.fields.fullName}</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={values.fullName}
          onChange={handleChange}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
        />
        {errors.fullName && (
          <span className="field-error" id="fullName-error">
            {errors.fullName}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="email">{strings.form.fields.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="eventDate">{strings.form.fields.eventDate}</label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          value={values.eventDate}
          onChange={handleChange}
          aria-invalid={Boolean(errors.eventDate)}
        />
        {errors.eventDate && <span className="field-error">{errors.eventDate}</span>}
      </div>

      <div className="field">
        <label htmlFor="cityOrArea">{strings.form.fields.cityOrArea}</label>
        <input
          id="cityOrArea"
          name="cityOrArea"
          type="text"
          value={values.cityOrArea}
          onChange={handleChange}
          aria-invalid={Boolean(errors.cityOrArea)}
        />
        {errors.cityOrArea && <span className="field-error">{errors.cityOrArea}</span>}
      </div>

      <div className="field">
        <label htmlFor="trailerType">{strings.form.fields.trailerType}</label>
        <select
          id="trailerType"
          name="trailerType"
          value={values.trailerType}
          onChange={handleChange}
          aria-invalid={Boolean(errors.trailerType)}
        >
          <option value="">{strings.form.trailerOptions.placeholder}</option>
          <option value="2-stall">{strings.form.trailerOptions.two}</option>
          <option value="3-stall">{strings.form.trailerOptions.three}</option>
        </select>
        {errors.trailerType && (
          <span className="field-error">{errors.trailerType}</span>
        )}
      </div>

      <div className="field field-span">
        <label htmlFor="message">{strings.form.fields.message}</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={values.message}
          onChange={handleChange}
        />
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

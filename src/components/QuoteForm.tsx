import { useState } from 'react'
import { useI18n } from '../i18n'

type QuoteFormValues = {
  fullName: string
  email: string
  phone: string
  eventDate: string
  cityOrArea: string
  trailerType: string
  message: string
}

const initialValues: QuoteFormValues = {
  fullName: '',
  email: '',
  phone: '',
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
    if (!values.phone.trim()) nextErrors.phone = strings.form.errors.phone
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

    try {
      setStatus('submitting')
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        throw new Error('Request failed')
      }
      setStatus('success')
      setValues(initialValues)
    } catch (error) {
      setSubmitError(strings.form.errors.submit)
      setStatus('idle')
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
        <label htmlFor="phone">{strings.form.fields.phone}</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
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

      {submitError && <span className="field-error">{submitError}</span>}

      <button className="button primary" type="submit" disabled={status === 'submitting'}>
        {strings.form.submit}
      </button>
    </form>
  )
}

export default QuoteForm

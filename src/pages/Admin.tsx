import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type QuoteItem = {
  _id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  cityOrArea?: string
  trailerType: '2-stall' | '3-stall'
  eventDate: string
  message?: string
  wantsAnotherDate: boolean
  paidDownpayment: boolean
  paidFully: boolean
  answered: boolean
  createdAt: string
}

const ADMIN_STORAGE_KEY = 'bathroomsheli_admin_code'

type ColumnKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'cityOrArea'
  | 'trailerType'
  | 'message'
  | 'paidDownpayment'
  | 'paidFully'
  | 'wantsAnotherDate'
  | 'open'
  | 'eventDate'
  | 'createdAt'

const columnConfig: { key: ColumnKey; label: string }[] = [
  { key: 'firstName', label: 'Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'cityOrArea', label: 'City / Area' },
  { key: 'trailerType', label: 'Trailer' },
  { key: 'message', label: 'Message' },
  { key: 'paidDownpayment', label: 'Paid Downpayment' },
  { key: 'paidFully', label: 'Paid Fully' },
  { key: 'wantsAnotherDate', label: 'Wants Another Date' },
  { key: 'open', label: 'Open' },
  { key: 'eventDate', label: 'Event Date' },
  { key: 'createdAt', label: 'Submitted At' },
]

const boolText = (value: boolean) => (value ? 'YES' : 'NO')

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const toTsvRow = (item: QuoteItem) => [
  item.firstName,
  item.lastName,
  item.email,
  item.phone,
  item.cityOrArea || '',
  item.trailerType,
  item.message || '',
  boolText(item.paidDownpayment),
  boolText(item.paidFully),
  boolText(item.wantsAnotherDate),
  boolText(!item.answered),
  item.eventDate,
  formatDateTime(item.createdAt),
].join('\t')

function Admin() {
  const [codeInput, setCodeInput] = useState('')
  const [code, setCode] = useState('')
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [search, setSearch] = useState('')
  const [trailerFilter, setTrailerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [flexDateFilter, setFlexDateFilter] = useState('all')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [eventFrom, setEventFrom] = useState('')
  const [eventTo, setEventTo] = useState('')
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey>('email')
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)
    if (saved) {
      setCode(saved)
      setCodeInput(saved)
    }
  }, [])

  const fetchQuotes = async (adminCode: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/quotes', {
        headers: { 'x-admin-code': adminCode },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load quotes')
      }
      const items = Array.isArray(payload?.items) ? payload.items : []
      setQuotes(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes')
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!code) return
    fetchQuotes(code)
  }, [code])

  const submitCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = codeInput.trim()
    if (!next) return
    setCode(next)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ADMIN_STORAGE_KEY, next)
    }
  }

  const logout = () => {
    setCode('')
    setCodeInput('')
    setQuotes([])
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
    }
  }

  const patchQuote = async (id: string, patch: Partial<QuoteItem>) => {
    if (!code) return
    setUpdatingId(id)
    setError('')
    try {
      const response = await fetch('/api/admin/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': code,
        },
        body: JSON.stringify({ id, ...patch }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Update failed')
      }
      const updated = payload?.item
      setQuotes((prev) => prev.map((item) => (item._id === id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdatingId('')
    }
  }

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return quotes
      .filter((item) => {
        if (normalizedSearch) {
          const haystack = [
            item.firstName,
            item.lastName,
            item.email,
            item.phone,
            item.fullName,
            item.cityOrArea || '',
            item.message || '',
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(normalizedSearch)) return false
        }

        if (trailerFilter !== 'all' && item.trailerType !== trailerFilter) return false

        if (statusFilter === 'open' && item.answered) return false
        if (statusFilter === 'answered' && !item.answered) return false

        if (paymentFilter === 'none' && (item.paidDownpayment || item.paidFully)) return false
        if (paymentFilter === 'downpayment' && (!item.paidDownpayment || item.paidFully))
          return false
        if (paymentFilter === 'full' && !item.paidFully) return false

        if (flexDateFilter === 'yes' && !item.wantsAnotherDate) return false
        if (flexDateFilter === 'no' && item.wantsAnotherDate) return false

        if (createdFrom && item.createdAt.slice(0, 10) < createdFrom) return false
        if (createdTo && item.createdAt.slice(0, 10) > createdTo) return false
        if (eventFrom && item.eventDate < eventFrom) return false
        if (eventTo && item.eventDate > eventTo) return false

        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [
    quotes,
    search,
    trailerFilter,
    statusFilter,
    paymentFilter,
    flexDateFilter,
    createdFrom,
    createdTo,
    eventFrom,
    eventTo,
  ])

  const copyText = async (text: string, message: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(message)
      setTimeout(() => setCopyStatus(''), 1800)
    } catch {
      setCopyStatus('Clipboard blocked by browser')
      setTimeout(() => setCopyStatus(''), 1800)
    }
  }

  const copyAllRows = () => {
    const header = columnConfig.map((column) => column.label).join('\t')
    const rows = filteredQuotes.map(toTsvRow)
    copyText([header, ...rows].join('\n'), `Copied ${rows.length} rows`)
  }

  const copySingleColumn = () => {
    const label = columnConfig.find((column) => column.key === selectedColumn)?.label || 'Column'
    const values = filteredQuotes.map((item) => {
      if (selectedColumn === 'open') return boolText(!item.answered)
      if (selectedColumn === 'createdAt') return formatDateTime(item.createdAt)
      if (selectedColumn === 'paidDownpayment') return boolText(item.paidDownpayment)
      if (selectedColumn === 'paidFully') return boolText(item.paidFully)
      if (selectedColumn === 'wantsAnotherDate') return boolText(item.wantsAnotherDate)
      return String(item[selectedColumn] || '')
    })
    copyText([label, ...values].join('\n'), `Copied ${label} column`)
  }

  if (!code) {
    return (
      <section className="admin-shell">
        <div className="admin-login-card">
          <h1>Admin Dashboard</h1>
          <p>Enter your private access code.</p>
          <form onSubmit={submitCode} className="admin-login-form">
            <input
              type="password"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              placeholder="Admin code"
            />
            <button className="button primary" type="submit">
              Unlock
            </button>
          </form>
          {error && <p className="field-error">{error}</p>}
        </div>
      </section>
    )
  }

  return (
    <section className="admin-shell">
      <div className="admin-panel">
        <div className="admin-toolbar">
          <div>
            <h1>Admin Requests</h1>
            <p>{filteredQuotes.length} request(s)</p>
          </div>
          <div className="admin-toolbar-actions">
            <button className="button secondary" type="button" onClick={() => fetchQuotes(code)}>
              Refresh
            </button>
            <button className="button secondary" type="button" onClick={logout}>
              Lock
            </button>
          </div>
        </div>

        <div className="admin-filters">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone"
          />
          <select value={trailerFilter} onChange={(event) => setTrailerFilter(event.target.value)}>
            <option value="all">All Trailers</option>
            <option value="2-stall">2-Stall</option>
            <option value="3-stall">3-Stall</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="answered">Answered</option>
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
            <option value="all">All Payments</option>
            <option value="none">No Payment</option>
            <option value="downpayment">Downpayment</option>
            <option value="full">Paid Fully</option>
          </select>
          <select value={flexDateFilter} onChange={(event) => setFlexDateFilter(event.target.value)}>
            <option value="all">All Date Flexibility</option>
            <option value="yes">Wants Another Date</option>
            <option value="no">Fixed Date</option>
          </select>
          <label>
            Submitted from
            <input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} />
          </label>
          <label>
            Submitted to
            <input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} />
          </label>
          <label>
            Event from
            <input type="date" value={eventFrom} onChange={(event) => setEventFrom(event.target.value)} />
          </label>
          <label>
            Event to
            <input type="date" value={eventTo} onChange={(event) => setEventTo(event.target.value)} />
          </label>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setSearch('')
              setTrailerFilter('all')
              setStatusFilter('all')
              setPaymentFilter('all')
              setFlexDateFilter('all')
              setCreatedFrom('')
              setCreatedTo('')
              setEventFrom('')
              setEventTo('')
            }}
          >
            Clear Filters
          </button>
        </div>

        <div className="admin-export">
          <button className="button secondary" type="button" onClick={copyAllRows}>
            Copy All (TSV)
          </button>
          <select value={selectedColumn} onChange={(event) => setSelectedColumn(event.target.value as ColumnKey)}>
            {columnConfig.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          <button className="button secondary" type="button" onClick={copySingleColumn}>
            Copy Column
          </button>
          {copyStatus && <span className="muted">{copyStatus}</span>}
        </div>

        {error && <p className="field-error">{error}</p>}
        {loading ? <p>Loading...</p> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>City / Area</th>
                <th>Trailer</th>
                <th>Message</th>
                <th>Paid Downpayment</th>
                <th>Paid Fully</th>
                <th>Wants Another Date</th>
                <th>Open</th>
                <th>Event Date</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((item) => {
                const isUpdating = updatingId === item._id
                return (
                  <tr key={item._id} className={!item.answered ? 'row-open' : undefined}>
                    <td>{item.firstName}</td>
                    <td>{item.lastName}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td>{item.cityOrArea || '-'}</td>
                    <td>{item.trailerType}</td>
                    <td>{item.message || '-'}</td>
                    <td className={item.paidDownpayment ? 'cell-paid-down' : undefined}>
                      <input
                        type="checkbox"
                        checked={item.paidDownpayment}
                        disabled={isUpdating}
                        onChange={(event) =>
                          patchQuote(item._id, {
                            paidDownpayment: event.target.checked,
                            paidFully: event.target.checked ? item.paidFully : false,
                          })
                        }
                      />
                    </td>
                    <td className={item.paidFully ? 'cell-paid-full' : undefined}>
                      <input
                        type="checkbox"
                        checked={item.paidFully}
                        disabled={isUpdating}
                        onChange={(event) =>
                          patchQuote(item._id, {
                            paidFully: event.target.checked,
                            paidDownpayment: event.target.checked ? true : item.paidDownpayment,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.wantsAnotherDate}
                        disabled={isUpdating}
                        onChange={(event) =>
                          patchQuote(item._id, { wantsAnotherDate: event.target.checked })
                        }
                      />
                    </td>
                    <td className={!item.answered ? 'cell-open' : undefined}>
                      <input
                        type="checkbox"
                        checked={!item.answered}
                        disabled={isUpdating}
                        onChange={(event) =>
                          patchQuote(item._id, { answered: !event.target.checked })
                        }
                      />
                    </td>
                    <td>{item.eventDate}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default Admin

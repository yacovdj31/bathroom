import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type QuoteItem = {
  _id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  trailerType: '2-stall' | '3-stall'
  eventDate: string
  eventEndDate?: string
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
  | 'trailerType'
  | 'paidDownpayment'
  | 'paidFully'
  | 'open'
  | 'eventDate'
  | 'eventEndDate'
  | 'createdAt'

const columnConfig: { key: ColumnKey; label: string }[] = [
  { key: 'firstName', label: 'Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'trailerType', label: 'Trailer' },
  { key: 'paidDownpayment', label: 'Paid Downpayment' },
  { key: 'paidFully', label: 'Paid Fully' },
  { key: 'open', label: 'Open' },
  { key: 'eventDate', label: 'Start Date' },
  { key: 'eventEndDate', label: 'End Date' },
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

const formatDateLabel = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

const monthLabel = (value: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(value)

const asDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const toIsoDay = (date: Date) => date.toISOString().slice(0, 10)

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const getDateRange = (start: string, end?: string) => {
  const from = asDate(start)
  const to = asDate(end || start)
  if (!from || !to) return []

  const safeEnd = to < from ? from : to
  const dates: string[] = []
  let current = from
  while (current <= safeEnd) {
    dates.push(toIsoDay(current))
    current = addDays(current, 1)
  }
  return dates
}

const getRowTone = (item: QuoteItem) => {
  if (item.paidFully) return 'row-paid-full'
  if (item.paidDownpayment) return 'row-paid-down'
  if (!item.answered) return 'row-open'
  return 'row-looked-over'
}

const getDayTone = (items: QuoteItem[]) => {
  if (items.some((item) => item.paidFully)) return 'day-paid-full'
  if (items.some((item) => item.paidDownpayment)) return 'day-paid-down'
  if (items.some((item) => !item.answered)) return 'day-open'
  return 'day-looked-over'
}

const toTsvRow = (item: QuoteItem) => [
  item.firstName,
  item.lastName,
  item.email,
  item.phone,
  item.trailerType,
  boolText(item.paidDownpayment),
  boolText(item.paidFully),
  boolText(!item.answered),
  item.eventDate,
  item.eventEndDate || item.eventDate,
  formatDateTime(item.createdAt),
].join('\t')

function Admin() {
  const [codeInput, setCodeInput] = useState('')
  const [code, setCode] = useState('')
  const [viewMode, setViewMode] = useState<'sheets' | 'schedule'>('sheets')
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [search, setSearch] = useState('')
  const [trailerFilter, setTrailerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [copyStatus, setCopyStatus] = useState('')
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

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

  const resetFilters = () => {
    setSearch('')
    setTrailerFilter('all')
    setStatusFilter('all')
    setPaymentFilter('all')
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
          const haystack = [item.firstName, item.lastName, item.email, item.phone, item.fullName].join(' ').toLowerCase()
          if (!haystack.includes(normalizedSearch)) return false
        }

        if (trailerFilter !== 'all' && item.trailerType !== trailerFilter) return false
        if (statusFilter === 'open' && item.answered) return false
        if (statusFilter === 'answered' && !item.answered) return false

        if (paymentFilter === 'none' && (item.paidDownpayment || item.paidFully)) return false
        if (paymentFilter === 'downpayment' && (!item.paidDownpayment || item.paidFully)) return false
        if (paymentFilter === 'full' && !item.paidFully) return false

        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [quotes, search, trailerFilter, statusFilter, paymentFilter])

  const activeFilterCount = useMemo(() => {
    return [Boolean(search.trim()), trailerFilter !== 'all', statusFilter !== 'all', paymentFilter !== 'all'].filter(Boolean)
      .length
  }, [search, trailerFilter, statusFilter, paymentFilter])

  const quotesByDay = useMemo(() => {
    const index = new Map<string, QuoteItem[]>()
    for (const item of quotes) {
      const days = getDateRange(item.eventDate, item.eventEndDate || item.eventDate)
      for (const day of days) {
        if (!index.has(day)) index.set(day, [])
        index.get(day)?.push(item)
      }
    }
    return index
  }, [quotes])

  const calendarDays = useMemo(() => {
    const year = activeMonth.getFullYear()
    const month = activeMonth.getMonth()
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    const start = addDays(monthStart, -monthStart.getDay())
    const end = addDays(monthEnd, 6 - monthEnd.getDay())

    const days: Date[] = []
    let cursor = start
    while (cursor <= end) {
      days.push(cursor)
      cursor = addDays(cursor, 1)
    }
    return days
  }, [activeMonth])

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return []
    return quotesByDay.get(selectedDay) || []
  }, [quotesByDay, selectedDay])

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

  if (!code) {
    return (
      <section className="admin-shell">
        <div className="admin-login-card">
          <h1>Admin Dashboard</h1>
          <p>Enter your private access code.</p>
          <form onSubmit={submitCode} className="admin-login-form">
            <input type="password" value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="Admin code" />
            <button className="button primary" type="submit">Unlock</button>
          </form>
          {error && <p className="field-error">{error}</p>}
        </div>
      </section>
    )
  }

  return (
    <section className="admin-shell">
      <div className="admin-panel">
        <div className="admin-top-nav">
          <div className="admin-top-brand">
            <span className="brand-mark" aria-hidden="true">BS</span>
            <span>BathroomSheli - Admin</span>
          </div>
          <div className="admin-top-right">
            <div className="admin-view-tabs" role="tablist" aria-label="Admin views">
              <button className={`admin-view-tab ${viewMode === 'sheets' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('sheets')}>Sheets</button>
              <button className={`admin-view-tab ${viewMode === 'schedule' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('schedule')}>Schedule</button>
            </div>
            <button className="button secondary admin-mini-btn" type="button" onClick={() => fetchQuotes(code)}>Refresh</button>
            <button className="button secondary admin-mini-btn" type="button" onClick={logout}>Lock</button>
          </div>
        </div>

        <div className="admin-stat-badge">{filteredQuotes.length}</div>

        {viewMode === 'sheets' ? (
          <>
            <div className="admin-export">
              <button className="button secondary" type="button" onClick={copyAllRows}>Copy All (TSV)</button>
              {copyStatus && <span className="muted">{copyStatus}</span>}
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Trailer</th>
                    <th>Downpayment</th>
                    <th>Paid Fully</th>
                    <th>Looked Over</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((item) => {
                    const isUpdating = updatingId === item._id
                    return (
                      <tr key={item._id} className={getRowTone(item)}>
                        <td>{item.firstName}</td>
                        <td>{item.lastName}</td>
                        <td>{item.email}</td>
                        <td>{item.phone}</td>
                        <td>{item.trailerType}</td>
                        <td><input type="checkbox" checked={item.paidDownpayment} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidDownpayment: event.target.checked, paidFully: event.target.checked ? item.paidFully : false })} /></td>
                        <td><input type="checkbox" checked={item.paidFully} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidFully: event.target.checked, paidDownpayment: event.target.checked ? true : item.paidDownpayment })} /></td>
                        <td><button className="review-toggle" type="button" disabled={isUpdating} onClick={() => patchQuote(item._id, { answered: !item.answered })}>{item.answered ? 'Looked Over' : 'Mark'}</button></td>
                        <td>{item.eventDate}</td>
                        <td>{item.eventEndDate || item.eventDate}</td>
                        <td>{formatDateTime(item.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-filters-card compact">
              <div className="admin-filters-head">
                <h2>Filters</h2>
                <span className="muted">{activeFilterCount} active</span>
              </div>

              <div className="admin-quick-filters compact">
                <button className="button secondary" type="button" onClick={() => setPaymentFilter('none')}>Unpaid</button>
                <button className="button secondary" type="button" onClick={() => setPaymentFilter('full')}>Paid</button>
                <button className="button secondary" type="button" onClick={resetFilters}>Clear Filters</button>
              </div>

              <div className="admin-filters-grid compact">
                <label>
                  Search
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, phone" />
                </label>
                <label>
                  Trailer
                  <select value={trailerFilter} onChange={(event) => setTrailerFilter(event.target.value)}>
                    <option value="all">All</option>
                    <option value="2-stall">2-Stall</option>
                    <option value="3-stall">3-Stall</option>
                  </select>
                </label>
                <label>
                  Status
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="answered">Looked Over</option>
                  </select>
                </label>
                <label>
                  Payment
                  <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
                    <option value="all">All</option>
                    <option value="none">No Payment</option>
                    <option value="downpayment">Downpayment</option>
                    <option value="full">Paid Fully</option>
                  </select>
                </label>
              </div>
            </div>
          </>
        ) : (
          <div className="schedule-panel">
            <div className="schedule-head">
              <button className="button secondary" type="button" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>Previous</button>
              <h2>{monthLabel(activeMonth)}</h2>
              <button className="button secondary" type="button" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>Next</button>
            </div>

            <div className="schedule-legend">
              <span className="legend-item legend-open">Open</span>
              <span className="legend-item legend-down">Downpayment</span>
              <span className="legend-item legend-full">Paid Fully</span>
              <span className="legend-item legend-reviewed">Looked Over</span>
            </div>

            <div className="calendar-grid calendar-days-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-day-label">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day) => {
                const iso = toIsoDay(day)
                const items = quotesByDay.get(iso) || []
                const inMonth = day.getMonth() === activeMonth.getMonth()
                const tone = items.length > 0 ? getDayTone(items) : ''
                return (
                  <button key={iso} type="button" className={`calendar-cell ${inMonth ? '' : 'is-muted'} ${tone}`.trim()} onClick={() => items.length > 0 && setSelectedDay(iso)} disabled={items.length === 0}>
                    <span className="calendar-date">{day.getDate()}</span>
                    {items.length > 0 ? <span className="calendar-count">{items.length} request(s)</span> : null}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedDay && selectedDayItems.length > 0 ? (
          <div className="admin-modal-backdrop" onClick={() => setSelectedDay(null)}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-head">
                <h3>{formatDateLabel(selectedDay)}</h3>
                <button className="button secondary" type="button" onClick={() => setSelectedDay(null)}>Close</button>
              </div>

              <div className="admin-modal-list">
                {selectedDayItems.map((item) => {
                  const isUpdating = updatingId === item._id
                  return (
                    <article key={item._id} className={`admin-modal-card ${getRowTone(item)}`}>
                      <p><strong>{item.firstName} {item.lastName}</strong> ({item.trailerType})</p>
                      <p>{item.email} | {item.phone}</p>
                      <div className="admin-modal-fields">
                        <label>
                          Start
                          <input type="date" value={item.eventDate} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { eventDate: event.target.value })} />
                        </label>
                        <label>
                          End
                          <input type="date" value={item.eventEndDate || item.eventDate} min={item.eventDate} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { eventEndDate: event.target.value })} />
                        </label>
                        <label>
                          Trailer
                          <select value={item.trailerType} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { trailerType: event.target.value as '2-stall' | '3-stall' })}>
                            <option value="2-stall">2-Stall</option>
                            <option value="3-stall">3-Stall</option>
                          </select>
                        </label>
                      </div>

                      <div className="admin-modal-toggles">
                        <label><input type="checkbox" checked={item.paidDownpayment} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidDownpayment: event.target.checked, paidFully: event.target.checked ? item.paidFully : false })} /> Downpayment</label>
                        <label><input type="checkbox" checked={item.paidFully} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidFully: event.target.checked, paidDownpayment: event.target.checked ? true : item.paidDownpayment })} /> Paid Fully</label>
                        <button className="review-toggle" type="button" disabled={isUpdating} onClick={() => patchQuote(item._id, { answered: !item.answered })}>{item.answered ? 'Looked Over' : 'Mark Looked Over'}</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {error && <p className="field-error">{error}</p>}
        {loading ? <p>Loading...</p> : null}
      </div>
    </section>
  )
}

export default Admin

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
  startTime?: string
  endTime?: string
  paidDownpayment: boolean
  paidFully: boolean
  answered: boolean
  note?: string
  message?: string
  createdAt: string
}

const ADMIN_STORAGE_KEY = 'bathroomsheli_admin_code'
type TimeFilter = 'all' | 'past' | 'future'

type ColumnKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'status'
  | 'paidDownpayment'
  | 'paidFully'
  | 'note'
  | 'message'
  | 'trailerType'
  | 'dayCount'
  | 'eventDate'
  | 'eventEndDate'
  | 'startTime'
  | 'endTime'
  | 'createdAt'

const columnConfig: { key: ColumnKey; label: string }[] = [
  { key: 'firstName', label: 'Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'status', label: 'Status' },
  { key: 'paidDownpayment', label: 'Paid Downpayment' },
  { key: 'paidFully', label: 'Paid Fully' },
  { key: 'note', label: 'Note' },
  { key: 'message', label: 'User Message' },
  { key: 'trailerType', label: 'Trailer' },
  { key: 'dayCount', label: 'Days' },
  { key: 'eventDate', label: 'Start Date' },
  { key: 'eventEndDate', label: 'End Date' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'endTime', label: 'End Time' },
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

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const toLocalIsoDay = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDateRange = (start: string, end?: string) => {
  const from = asDate(start)
  const to = asDate(end || start)
  if (!from || !to) return []

  const safeEnd = to < from ? from : to
  const dates: string[] = []
  let current = from
  while (current <= safeEnd) {
    dates.push(toLocalIsoDay(current))
    current = addDays(current, 1)
  }
  return dates
}

const getEventDayCount = (start: string, end?: string) => getDateRange(start, end).length || 1

const isPastEvent = (item: QuoteItem) => {
  const eventEnd = asDate(item.eventEndDate || item.eventDate)
  const today = asDate(toLocalIsoDay(new Date()))
  if (!eventEnd || !today) return false
  return eventEnd.getTime() < today.getTime()
}

const getStatusKind = (item: QuoteItem) => {
  if (isPastEvent(item)) return item.paidFully ? 'completed' : 'inactive'
  if (!item.answered) return 'active'
  return 'inactive'
}

const getStatusLabel = (item: QuoteItem) => {
  const kind = getStatusKind(item)
  if (kind === 'active') return 'Active'
  if (kind === 'completed') return 'Inactive (Completed)'
  return 'Inactive'
}

const getRowTone = (item: QuoteItem) => {
  const status = getStatusKind(item)
  if (status === 'completed') return 'row-completed'
  if (status === 'inactive') return 'row-inactive'
  if (item.paidFully) return 'row-paid-full'
  if (item.paidDownpayment) return 'row-paid-down'
  return 'row-active'
}

const getDaySegmentTone = (item: QuoteItem) => {
  const status = getStatusKind(item)
  if (status === 'completed') return 'segment-completed'
  if (status === 'inactive') return 'segment-inactive'
  if (item.paidFully) return 'segment-paid-full'
  if (item.paidDownpayment) return 'segment-paid-down'
  return 'segment-active'
}

const getRangeEdgeState = (item: QuoteItem, dayIso: string) => {
  const end = item.eventEndDate || item.eventDate
  const fromPrev = dayIso > item.eventDate && dayIso <= end
  const toNext = dayIso >= item.eventDate && dayIso < end
  return { fromPrev, toNext }
}

const isFutureOrTodayEvent = (item: QuoteItem) => {
  const eventEnd = asDate(item.eventEndDate || item.eventDate)
  const today = asDate(toLocalIsoDay(new Date()))
  if (!eventEnd || !today) return false
  return eventEnd.getTime() >= today.getTime()
}

const matchesTimeFilter = (item: QuoteItem, filter: TimeFilter) => {
  if (filter === 'all') return true
  const future = isFutureOrTodayEvent(item)
  return filter === 'future' ? future : !future
}

const getClippedRangeForView = (item: QuoteItem, viewStartIso: string, viewEndIso: string) => {
  const start = item.eventDate > viewStartIso ? item.eventDate : viewStartIso
  const endRaw = item.eventEndDate || item.eventDate
  const end = endRaw < viewEndIso ? endRaw : viewEndIso
  if (end < start) return null
  return { start, end }
}

const buildLaneMap = (items: QuoteItem[], viewStartIso: string, viewEndIso: string) => {
  const laneById = new Map<string, number>()
  const laneEndByIndex: string[] = []

  const sorted = [...items]
    .filter((item) => getClippedRangeForView(item, viewStartIso, viewEndIso))
    .sort((a, b) => {
      if (a.eventDate !== b.eventDate) return a.eventDate.localeCompare(b.eventDate)
      const aEnd = a.eventEndDate || a.eventDate
      const bEnd = b.eventEndDate || b.eventDate
      if (aEnd !== bEnd) return aEnd.localeCompare(bEnd)
      return a._id.localeCompare(b._id)
    })

  for (const item of sorted) {
    const clipped = getClippedRangeForView(item, viewStartIso, viewEndIso)
    if (!clipped) continue
    let lane = 0
    while (lane < laneEndByIndex.length && clipped.start <= laneEndByIndex[lane]) {
      lane += 1
    }
    if (lane === laneEndByIndex.length) {
      laneEndByIndex.push(clipped.end)
    } else {
      laneEndByIndex[lane] = clipped.end
    }
    laneById.set(item._id, lane)
  }
  return laneById
}

const toTsvRow = (item: QuoteItem) => [
  item.firstName,
  item.lastName,
  item.email,
  item.phone,
  getStatusLabel(item).toUpperCase(),
  boolText(item.paidDownpayment),
  boolText(item.paidFully),
  item.note || '',
  item.message || '',
  item.trailerType,
  String(getEventDayCount(item.eventDate, item.eventEndDate || item.eventDate)),
  item.eventDate,
  item.eventEndDate || item.eventDate,
  item.startTime || '',
  item.endTime || '',
  formatDateTime(item.createdAt),
].join('\t')

const parseApiPayload = async (response: Response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [copyStatus, setCopyStatus] = useState('')
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [noteModalId, setNoteModalId] = useState<string | null>(null)
  const [noteModalDraft, setNoteModalDraft] = useState('')
  const [messageModal, setMessageModal] = useState<{ name: string; message: string } | null>(null)
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
      const payload = await parseApiPayload(response)
      if (!response.ok) {
        throw new Error(payload?.error || `Failed to load quotes (${response.status})`)
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

  useEffect(() => {
    setNoteDrafts((prev) => {
      const next = { ...prev }
      for (const item of quotes) {
        if (next[item._id] === undefined) {
          next[item._id] = item.note || ''
        }
      }
      return next
    })
  }, [quotes])

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
    setTimeFilter('all')
  }

  const patchQuote = async (id: string, patch: Partial<QuoteItem>) => {
    if (!code) return
    setUpdatingId(id)
    setError('')

    let previous: QuoteItem | null = null
    setQuotes((prev) =>
      prev.map((item) => {
        if (item._id !== id) return item
        previous = item
        return { ...item, ...patch }
      }),
    )

    try {
      const response = await fetch('/api/admin/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': code,
        },
        body: JSON.stringify({ id, ...patch }),
      })
      const payload = await parseApiPayload(response)
      if (!response.ok) {
        throw new Error(payload?.error || `Update failed (${response.status})`)
      }
      const updated = payload?.item
      setQuotes((prev) => prev.map((item) => (item._id === id ? updated : item)))
    } catch (err) {
      if (previous) {
        setQuotes((prev) => prev.map((item) => (item._id === id ? previous! : item)))
      }
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
        const status = getStatusKind(item)
        if (statusFilter === 'active' && status !== 'active') return false
        if (statusFilter === 'inactive' && status === 'active') return false

        if (paymentFilter === 'none' && (item.paidDownpayment || item.paidFully)) return false
        if (paymentFilter === 'downpayment' && (!item.paidDownpayment || item.paidFully)) return false
        if (paymentFilter === 'full' && !item.paidFully) return false
        if (!matchesTimeFilter(item, timeFilter)) return false

        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [quotes, search, trailerFilter, statusFilter, paymentFilter, timeFilter])

  const activeFilterCount = useMemo(() => {
    return [Boolean(search.trim()), trailerFilter !== 'all', statusFilter !== 'all', paymentFilter !== 'all', timeFilter !== 'all'].filter(Boolean)
      .length
  }, [search, trailerFilter, statusFilter, paymentFilter, timeFilter])

  const quotesByDay = useMemo(() => {
    const index = new Map<string, QuoteItem[]>()
    const orderedQuotes = [...quotes].sort((a, b) => {
      if (a.eventDate !== b.eventDate) return a.eventDate.localeCompare(b.eventDate)
      return a._id.localeCompare(b._id)
    })
    for (const item of orderedQuotes) {
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

  const laneById = useMemo(() => {
    if (calendarDays.length === 0) return new Map<string, number>()
    const viewStartIso = toLocalIsoDay(calendarDays[0])
    const viewEndIso = toLocalIsoDay(calendarDays[calendarDays.length - 1])
    return buildLaneMap(quotes, viewStartIso, viewEndIso)
  }, [quotes, calendarDays])

  const laneCount = useMemo(() => {
    let maxLane = 0
    laneById.forEach((lane) => {
      if (lane > maxLane) maxLane = lane
    })
    return Math.max(maxLane + 1, 1)
  }, [laneById])

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return []
    const items = quotesByDay.get(selectedDay) || []
    return [...items].sort((a, b) => {
      const laneA = laneById.get(a._id) ?? 0
      const laneB = laneById.get(b._id) ?? 0
      if (laneA !== laneB) return laneA - laneB
      return a._id.localeCompare(b._id)
    })
  }, [quotesByDay, selectedDay, laneById])

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

  const saveNoteNow = (id: string, value: string) => {
    const current = quotes.find((item) => item._id === id)?.note || ''
    if (current === value) {
      return
    }
    patchQuote(id, { note: value })
  }

  const openNoteEditor = (item: QuoteItem) => {
    const value = noteDrafts[item._id] ?? item.note ?? ''
    setNoteModalId(item._id)
    setNoteModalDraft(value)
  }

  const closeNoteEditor = () => {
    setNoteModalId(null)
    setNoteModalDraft('')
  }

  const saveNoteFromModal = () => {
    if (!noteModalId) return
    setNoteDrafts((prev) => ({ ...prev, [noteModalId]: noteModalDraft }))
    saveNoteNow(noteModalId, noteModalDraft)
    closeNoteEditor()
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
            <img className="admin-brand-logo" src="/images/bathroomsheli-logo.png" alt="Bathroom Sheli" />
          </div>
          <div className="admin-top-right">
            <div className="admin-view-tabs" role="tablist" aria-label="Admin views">
              <button className={`admin-view-tab ${viewMode === 'sheets' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('sheets')}>Sheets</button>
              <button className={`admin-view-tab ${viewMode === 'schedule' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('schedule')}>Schedule</button>
            </div>
            <button className="button secondary admin-mini-btn" type="button" onClick={logout}>Logout</button>
          </div>
        </div>

        {viewMode === 'sheets' ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th aria-label="Row" />
                    <th>Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th className="cell-center">Status</th>
                    <th className="cell-center">Downpayment</th>
                    <th className="cell-center">Paid Fully</th>
                    <th>Note</th>
                    <th>User Message</th>
                    <th>Trailer</th>
                    <th className="cell-center">Days</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((item, index) => {
                    const isUpdating = updatingId === item._id
                    const statusKind = getStatusKind(item)
                    const isPast = isPastEvent(item)
                    return (
                      <tr key={item._id} className={getRowTone(item)}>
                        <td className="row-index-cell">{index + 1}.</td>
                        <td>{item.firstName}</td>
                        <td>{item.lastName}</td>
                        <td>{item.email}</td>
                        <td>{item.phone}</td>
                        <td className="cell-center"><button className={`review-toggle is-${statusKind}`} type="button" disabled={isUpdating || isPast} onClick={() => patchQuote(item._id, { answered: !item.answered })}>{getStatusLabel(item)}</button></td>
                        <td className="cell-center"><input type="checkbox" checked={item.paidDownpayment} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidDownpayment: event.target.checked, paidFully: event.target.checked ? item.paidFully : false })} /></td>
                        <td className="cell-center"><input type="checkbox" checked={item.paidFully} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidFully: event.target.checked, paidDownpayment: event.target.checked ? true : item.paidDownpayment })} /></td>
                        <td>
                          <button className="admin-note-trigger" type="button" onClick={() => openNoteEditor(item)}>
                            Notes
                          </button>
                        </td>
                        <td>
                          {item.message?.trim() ? (
                            <button
                              className="admin-note-trigger"
                              type="button"
                              onClick={() => setMessageModal({ name: `${item.firstName} ${item.lastName}`.trim(), message: item.message || '' })}
                            >
                              Message
                            </button>
                          ) : '-'}
                        </td>
                        <td>{item.trailerType}</td>
                        <td className="cell-center">{getEventDayCount(item.eventDate, item.eventEndDate || item.eventDate)}</td>
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
                <div className="admin-filters-topline">
                  <span className="admin-stat-badge">{filteredQuotes.length}</span>
                  <span className="muted">{activeFilterCount} active</span>
                </div>
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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
                <label>
                  Time
                  <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)} aria-label="Time filter">
                    <option value="all">All dates</option>
                    <option value="future">Future only</option>
                    <option value="past">Past only</option>
                  </select>
                </label>
              </div>

              <div className="admin-quick-filters compact">
                <button className="button primary" type="button" onClick={resetFilters}>Clear Filters</button>
              </div>
              <div className="admin-export">
                <button className="button primary" type="button" onClick={copyAllRows}>Copy All</button>
                {copyStatus && <span className="muted">{copyStatus}</span>}
              </div>
            </div>
          </>
        ) : (
          <div className="schedule-panel">
            <div className="schedule-head">
              <button className="button secondary schedule-arrow-btn" type="button" aria-label="Previous month" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>←</button>
              <h2>{monthLabel(activeMonth)}</h2>
              <button className="button secondary schedule-arrow-btn" type="button" aria-label="Next month" onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>→</button>
            </div>

            <div className="schedule-legend">
              <span className="legend-item legend-open">Active</span>
              <span className="legend-item legend-down">Downpayment</span>
              <span className="legend-item legend-full">Paid Fully</span>
              <span className="legend-item legend-completed">Inactive (Completed)</span>
              <span className="legend-item legend-reviewed">Inactive</span>
              <span className="legend-item legend-flow">Multi-day flow</span>
            </div>

            <div className="calendar-grid calendar-days-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-day-label">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day) => {
                const iso = toLocalIsoDay(day)
                const items = quotesByDay.get(iso) || []
                const inMonth = day.getMonth() === activeMonth.getMonth()
                const sortedItems = [...items].sort((a, b) => {
                  const laneA = laneById.get(a._id) ?? 0
                  const laneB = laneById.get(b._id) ?? 0
                  if (laneA !== laneB) return laneA - laneB
                  return a._id.localeCompare(b._id)
                })
                const onlyItem = sortedItems.length === 1 ? sortedItems[0] : null
                const onlyItemLane = onlyItem ? (laneById.get(onlyItem._id) ?? 0) : 0
                const useSingleLaneHeight = Boolean(onlyItem) && onlyItemLane === 0
                const dayLaneCount = useSingleLaneHeight ? 1 : laneCount
                return (
                  <button key={iso} type="button" className={`calendar-cell ${inMonth ? '' : 'is-muted'} ${items.length > 0 ? 'has-items' : ''}`.trim()} onClick={() => items.length > 0 && setSelectedDay(iso)} disabled={items.length === 0}>
                    {items.length > 0 ? (
                      <span
                        className="calendar-segments"
                        style={{ '--day-lane-count': String(dayLaneCount) } as Record<string, string>}
                        aria-hidden="true"
                      >
                        {sortedItems.map((item) => {
                          const { fromPrev, toNext } = getRangeEdgeState(item, iso)
                          const lane = laneById.get(item._id) ?? 0
                          const gridRowStart = useSingleLaneHeight ? 1 : lane + 1
                          return (
                            <span
                              key={`${iso}-${item._id}`}
                              className={`calendar-segment ${getDaySegmentTone(item)} ${fromPrev ? 'from-prev' : ''} ${toNext ? 'to-next' : ''}`.trim()}
                              style={{ gridRowStart: String(gridRowStart) }}
                            />
                          )
                          })}
                      </span>
                    ) : null}
                    <span className="calendar-date">{day.getDate()}</span>
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
                <div>
                  <h3>{formatDateLabel(selectedDay)}</h3>
                  <p className="admin-modal-count">{selectedDayItems.length} request(s) on this day</p>
                </div>
                <button className="button secondary" type="button" onClick={() => setSelectedDay(null)}>Close</button>
              </div>

              <div className="admin-modal-list">
                {selectedDayItems.map((item, index) => {
                  const isUpdating = updatingId === item._id
                  const statusKind = getStatusKind(item)
                  const isPast = isPastEvent(item)
                  const isMultiDay = (item.eventEndDate || item.eventDate) > item.eventDate
                  return (
                    <article key={item._id} className={`admin-modal-card ${getRowTone(item)}`}>
                      <div className="admin-modal-card-head">
                        <p>
                          <span className="admin-item-index">{index + 1}.</span> <strong>{item.firstName} {item.lastName}</strong>
                          <span className="admin-head-links">
                            {' | '}<a href={`mailto:${item.email}`}>{item.email}</a>{' | '}<a href={`tel:${item.phone.replace(/\D/g, '')}`}>{item.phone}</a>
                          </span>
                        </p>
                        <span className={`modal-status-pill is-${statusKind}`}>
                          {getStatusLabel(item)}
                        </span>
                      </div>
                      <p className="admin-modal-date-line">
                        {item.eventDate === (item.eventEndDate || item.eventDate)
                          ? `Date: ${item.eventDate}`
                          : `Dates: ${item.eventDate} to ${item.eventEndDate || item.eventDate}`}
                      </p>
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
                          {isMultiDay ? 'Start Time (first day)' : 'Start Time'}
                          <input type="time" value={item.startTime || ''} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { startTime: event.target.value })} />
                        </label>
                        <label>
                          {isMultiDay ? 'End Time (last day)' : 'End Time'}
                          <input type="time" value={item.endTime || ''} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { endTime: event.target.value })} />
                        </label>
                      </div>

                      <div className="admin-modal-meta-row">
                        <label>
                          Trailer
                          <select value={item.trailerType} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { trailerType: event.target.value as '2-stall' | '3-stall' })}>
                            <option value="2-stall">2-Stall</option>
                            <option value="3-stall">3-Stall</option>
                          </select>
                        </label>
                        <button className="admin-note-trigger" type="button" onClick={() => openNoteEditor(item)}>
                          Notes
                        </button>
                      </div>

                      <div className="admin-modal-toggles">
                        <label><input type="checkbox" checked={item.paidDownpayment} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidDownpayment: event.target.checked, paidFully: event.target.checked ? item.paidFully : false })} /> Downpayment</label>
                        <label><input type="checkbox" checked={item.paidFully} disabled={isUpdating} onChange={(event) => patchQuote(item._id, { paidFully: event.target.checked, paidDownpayment: event.target.checked ? true : item.paidDownpayment })} /> Paid Fully</label>
                        <button className={`review-toggle is-${statusKind}`} type="button" disabled={isUpdating || isPast} onClick={() => patchQuote(item._id, { answered: !item.answered })}>{getStatusLabel(item)}</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {messageModal ? (
          <div className="admin-modal-backdrop" onClick={() => setMessageModal(null)}>
            <div className="admin-modal admin-note-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-head">
                <h3>User Message{messageModal.name ? ` - ${messageModal.name}` : ''}</h3>
                <button className="button secondary" type="button" onClick={() => setMessageModal(null)}>Close</button>
              </div>
              <div className="admin-note-sheet">
                <textarea
                  className="admin-note-sheet-input"
                  rows={10}
                  value={messageModal.message}
                  readOnly
                />
              </div>
            </div>
          </div>
        ) : null}

        {noteModalId ? (
          <div className="admin-modal-backdrop" onClick={closeNoteEditor}>
            <div className="admin-modal admin-note-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-head">
                <h3>Notes</h3>
                <button className="button secondary" type="button" onClick={closeNoteEditor}>Close</button>
              </div>
              <div className="admin-note-sheet">
                <textarea
                  className="admin-note-sheet-input"
                  rows={10}
                  value={noteModalDraft}
                  placeholder="Write notes for this request..."
                  onChange={(event) => setNoteModalDraft(event.target.value)}
                />
                <div className="admin-note-sheet-actions">
                  <button className="button secondary" type="button" onClick={closeNoteEditor}>Cancel</button>
                  <button className="button primary" type="button" onClick={saveNoteFromModal}>Save note</button>
                </div>
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

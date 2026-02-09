import { useState, useEffect, useCallback } from 'react';
import { bookings as bookingsApi } from '../api/endpoints';
import type { BookingsResponse, Booking } from '../types/api';
import { ApiError } from '../api/client';

/** Only these three statuses are filterable; "All" = no filter. */
const STATUS_FILTER_OPTIONS = ['pending_approval', 'confirmed', 'canceled'] as const;

const PLATFORM_OPTIONS = ['whatsapp', 'sms', 'web'] as const;
const PAGE_SIZE = 10;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** Display label for status (table, drawer, filter chip). pending_approval → "Inquiry". */
function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending_approval: 'Inquiry',
    confirmed: 'Confirmed',
    canceled: 'Canceled',
    booking_inquiry: 'Inquiry',
    completed: 'Completed',
    checked_in: 'Checked in',
  };
  return map[s] ?? s;
}

function platformLabel(p: string) {
  return p === 'whatsapp' ? 'WhatsApp' : p === 'sms' ? 'SMS' : 'Web';
}

function guestDisplay(b: Booking): string {
  const name = b.customer?.name;
  if (typeof name === 'string' && name.trim()) return name;
  return '—';
}

/** Detail sections: label + keys for top-level booking fields. Guest comes from booking.customer. */
const DETAIL_SECTIONS: { section: string; fields: { label: string; keys: string[] }[] }[] = [
  {
    section: 'Dates',
    fields: [
      { label: 'Check in date', keys: ['checkInDate'] },
      { label: 'Check out date', keys: ['checkOutDate'] },
      { label: 'Created at', keys: ['createdAt'] },
    ],
  },
  {
    section: 'Price & source',
    fields: [
      { label: 'Amount', keys: ['totalAmount', 'totalPrice'] },
      { label: 'Currency', keys: ['currency'] },
      { label: 'Booking source', keys: ['bookingSource'] },
    ],
  },
  {
    section: 'Status & codes',
    fields: [
      { label: 'Status', keys: ['status'] },
      { label: 'Platform', keys: ['platform'] },
      { label: 'Confirmation code', keys: ['confirmationCode'] },
      { label: 'External confirmation code', keys: ['externalConfirmationCode'] },
      { label: 'Unit number', keys: ['unitNumber'] },
    ],
  },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="bookings-detail-row">
      <span className="bookings-detail-label">{label}</span>
      <span className="bookings-detail-value">{String(value)}</span>
    </div>
  );
}

function BookingDetailDrawer({
  booking,
  onClose,
  statusLabelFn,
  platformLabelFn,
  formatDateFn,
  formatDateTimeFn,
}: {
  booking: Booking;
  onClose: () => void;
  statusLabelFn: (s: string) => string;
  platformLabelFn: (s: string) => string;
  formatDateFn: (iso: string) => string;
  formatDateTimeFn: (iso: string) => string;
}) {
  const raw = booking as Record<string, unknown>;
  const getFirst = (keys: string[]): { key: string; val: unknown } | null => {
    for (const key of keys) {
      const val = raw[key];
      if (val !== undefined && val !== null && val !== '') return { key, val };
    }
    return null;
  };
  const formatVal = (key: string, val: unknown): React.ReactNode => {
    if (val === undefined || val === null) return null;
    if (key === 'status' && typeof val === 'string') return statusLabelFn(val);
    if (key === 'platform' && typeof val === 'string') return platformLabelFn(val);
    if ((key === 'checkInDate' || key === 'checkOutDate') && typeof val === 'string') return formatDateFn(val);
    if (key === 'createdAt' && typeof val === 'string') return formatDateTimeFn(val);
    if (key === 'totalPrice' && typeof val === 'number') return val.toLocaleString();
    if (key === 'totalAmount') {
      if (typeof val === 'number') return val.toLocaleString();
      if (typeof val === 'string') return val;
      return String(val);
    }
    return String(val);
  };

  const customer = booking.customer;

  return (
    <>
      <div className="bookings-drawer-backdrop visible" onClick={onClose} aria-hidden />
      <div className="bookings-drawer visible" role="dialog" aria-labelledby="booking-drawer-title">
        <div className="bookings-drawer-header">
          <h2 id="booking-drawer-title" className="bookings-drawer-title">Booking details</h2>
          <button type="button" className="bookings-drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="bookings-drawer-body">
          {customer && (
            <div className="bookings-detail-section">
              <h3 className="bookings-detail-section-title">Guest</h3>
              {customer.name && <DetailRow label="Name" value={customer.name} />}
              {customer.email && <DetailRow label="Email" value={customer.email} />}
              {customer.phoneNumber && <DetailRow label="Phone" value={customer.phoneNumber} />}
            </div>
          )}
          {DETAIL_SECTIONS.map(({ section, fields }) => (
            <div key={section} className="bookings-detail-section">
              <h3 className="bookings-detail-section-title">{section}</h3>
              {fields.map(({ label, keys }) => {
                const found = getFirst(keys);
                if (!found) return null;
                const value = formatVal(found.key, found.val);
                if (value === null) return null;
                return <DetailRow key={label} label={label} value={value} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.list({
        page,
        pageSize: PAGE_SIZE,
        platform: platform as 'whatsapp' | 'sms' | 'web' | undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [page, platform, startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const clearFilters = () => {
    setStatusFilter('');
    setPlatform('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = !!(statusFilter || platform || startDate || endDate);

  const rows = (data?.bookings ?? []) as Booking[];

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <h1>Bookings</h1>
        {!loading && data && (
          <span className="bookings-summary">
            {data.total} booking{data.total !== 1 ? 's' : ''} total
          </span>
        )}
      </header>

      <section className="bookings-filters" aria-label="Filter bookings">
        <h2 className="bookings-filters-title">Filters</h2>
        <div className="bookings-filter-row">
          <div className="bookings-filter-group">
            <span className="section-header">Status</span>
            <button
              type="button"
              className={`chip ${!statusFilter ? 'chip-active' : ''}`}
              onClick={() => { setStatusFilter(''); setPage(1); }}
            >
              All
            </button>
{STATUS_FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${statusFilter === s ? 'chip-active' : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {statusLabel(s)}
            </button>
          ))}
          </div>
        </div>
        <div className="bookings-filter-row">
          <div className="bookings-filter-group">
            <span className="section-header">Platform</span>
            <button
              type="button"
              className={`chip ${!platform ? 'chip-active' : ''}`}
              onClick={() => { setPlatform(''); setPage(1); }}
            >
              All
            </button>
            {PLATFORM_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                className={`chip ${platform === p ? 'chip-active' : ''}`}
                onClick={() => { setPlatform(p); setPage(1); }}
              >
                {platformLabel(p)}
              </button>
            ))}
          </div>
        </div>
        <div className="bookings-filter-row">
          <div className="bookings-filter-group">
            <label htmlFor="bookings-date-from">From</label>
            <input
              id="bookings-date-from"
              type="date"
              className="input-text"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{ width: 160 }}
            />
          </div>
          <div className="bookings-filter-group">
            <label htmlFor="bookings-date-to">To</label>
            <input
              id="bookings-date-to"
              type="date"
              className="input-text"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{ width: 160 }}
            />
          </div>
        </div>
        <div className="bookings-actions">
          {hasActiveFilters && (
            <button type="button" className="btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <button type="button" className="btn-primary" onClick={() => fetchBookings()}>
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="auth-error" style={{ marginBottom: 16 }} role="alert">
          {error}
        </div>
      )}

      <div className="bookings-table-wrap">
        <div className="bookings-table-scroll">
          {loading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Confirmation code</th>
                  <th>Ext. confirmation</th>
                  <th>Status</th>
                  <th>Platform</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="skeleton" style={{ height: 20, borderRadius: 4 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : !rows.length ? (
            <div className="empty-state">
              <p>No bookings match your filters.</p>
              <p>Try adjusting status, platform, or date range.</p>
              <button type="button" className="btn-secondary" onClick={clearFilters} style={{ marginTop: 8 }}>
                Clear filters
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Confirmation code</th>
                  <th>Ext. confirmation</th>
                  <th>Status</th>
                  <th>Platform</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr
                    key={b.id}
                    className="clickable"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td style={{ fontWeight: 500 }}>{guestDisplay(b)}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                      {b.confirmationCode ?? '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                      {b.externalConfirmationCode ?? '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${(b.status ?? '').replace('-', '_')}`}>
                        {statusLabel(b.status ?? '')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${b.platform ?? 'web'}`}>
                        {platformLabel(b.platform ?? 'web')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {b.createdAt ? formatDate(b.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && data && data.totalPages > 0 && (
          <div className="bookings-pagination">
            <span>
              Page {data.page} of {data.totalPages}
            </span>
            <div className="bookings-pagination-buttons">
              <button
                type="button"
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && (
        <BookingDetailDrawer
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          statusLabelFn={statusLabel}
          platformLabelFn={platformLabel}
          formatDateFn={formatDate}
          formatDateTimeFn={formatDateTime}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { chat } from '../api/endpoints';
import type { ChatHistoryResponse } from '../types/api';
import { ApiError } from '../api/client';

const LIMIT = 20;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function ChatHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [platform, setPlatform] = useState<'all' | 'web' | 'whatsapp' | 'sms'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<ChatHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const propertyId = user?.propertyId ?? '';

  const fetchHistory = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await chat.history({
        propertyId,
        status: status === 'all' ? undefined : status,
        platform: platform === 'all' ? undefined : platform,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        guestPhone: guestPhone.trim() || undefined,
        search: search.trim() || undefined,
        limit: LIMIT,
        offset,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [propertyId, status, platform, dateFrom, dateTo, guestPhone, search, offset]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const hasMore = data?.hasMore ?? false;
  const total = data?.total ?? 0;

  return (
    <div className="page-layout">
      <header className="page-layout-header">
        <h1>Chat history</h1>
        {!loading && data != null && (
          <span className="page-layout-summary">
            {total} conversation{total !== 1 ? 's' : ''} total
          </span>
        )}
      </header>

      <section className="page-layout-filters" aria-label="Filter conversations">
        <h2 className="page-layout-filters-title">Filters</h2>
        <div className="page-layout-filter-row">
          <div className="page-layout-filter-group">
            <span className="section-header">Status</span>
            {(['all', 'active', 'closed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${status === s ? 'chip-active' : ''}`}
                onClick={() => { setStatus(s); setOffset(0); }}
              >
                {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>
        </div>
        <div className="page-layout-filter-row">
          <div className="page-layout-filter-group">
            <span className="section-header">Platform</span>
            {(['all', 'web', 'whatsapp', 'sms'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`chip ${platform === p ? 'chip-active' : ''}`}
                onClick={() => { setPlatform(p); setOffset(0); }}
              >
                {p === 'all' ? 'All' : p === 'whatsapp' ? 'WhatsApp' : p === 'sms' ? 'SMS' : 'Web'}
              </button>
            ))}
          </div>
        </div>
        <div className="page-layout-filter-row">
          <div className="page-layout-filter-group">
            <label htmlFor="chat-date-from">From</label>
            <input id="chat-date-from" type="date" className="input-text" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setOffset(0); }} style={{ width: 160 }} />
          </div>
          <div className="page-layout-filter-group">
            <label htmlFor="chat-date-to">To</label>
            <input id="chat-date-to" type="date" className="input-text" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setOffset(0); }} style={{ width: 160 }} />
          </div>
          <input type="text" className="input-text" placeholder="Guest phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} onBlur={() => setOffset(0)} style={{ width: 140 }} />
          <input type="text" className="input-text" placeholder="Search messages" value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => setOffset(0)} style={{ width: 180 }} />
        </div>
        <div className="page-layout-actions">
          <button type="button" className="btn-primary" onClick={() => fetchHistory()}>Refresh</button>
        </div>
      </section>

      {error && <div className="auth-error" style={{ marginBottom: 16 }} role="alert">{error}</div>}

      <div className="page-layout-table-card">
        {loading ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Started</th>
                <th>Messages</th>
                <th>Last message</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !data?.conversations?.length ? (
          <div className="empty-state">
            <p>No conversations in this period.</p>
            <p>Try adjusting filters or date range.</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Messages</th>
                  <th>Last message</th>
                </tr>
              </thead>
              <tbody>
                {data.conversations.map((c) => (
                  <tr key={c.sessionId} className="clickable" onClick={() => navigate(`/chat/${c.sessionId}`)}>
                    <td style={{ fontWeight: 500 }}>{c.guestName || c.guestPhone}</td>
                    <td><span className={`badge badge-${c.platform}`}>{c.platform}</span></td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(c.startedAt)}</td>
                    <td>{c.messageCount}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{c.lastMessage ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="page-layout-pagination">
              <span>Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
              <div className="page-layout-pagination-buttons">
                <button type="button" className="btn-secondary" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}>Previous</button>
                <button type="button" className="btn-secondary" disabled={!hasMore} onClick={() => setOffset((o) => o + LIMIT)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

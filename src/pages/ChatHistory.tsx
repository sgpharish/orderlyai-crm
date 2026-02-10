import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { chat } from '../api/endpoints';
import type { ChatHistoryResponse } from '../types/api';
import { ApiError } from '../api/client';
import { conversationStatusLabel, conversationStatusBadgeClass } from '../utils/conversationStatus';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';

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
  const { showToast } = useToast();
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
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const propertyId = user?.propertyId ?? '';

  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (status !== 'all') activeChips.push({ key: 'status', label: `Status: ${status === 'active' ? 'Active' : 'Closed'}`, onClear: () => { setStatus('all'); setOffset(0); } });
  if (platform !== 'all') activeChips.push({ key: 'platform', label: `Platform: ${platform === 'whatsapp' ? 'WhatsApp' : platform === 'sms' ? 'SMS' : 'Web'}`, onClear: () => { setPlatform('all'); setOffset(0); } });
  if (dateFrom) activeChips.push({ key: 'dateFrom', label: `From: ${dateFrom}`, onClear: () => { setDateFrom(''); setOffset(0); } });
  if (dateTo) activeChips.push({ key: 'dateTo', label: `To: ${dateTo}`, onClear: () => { setDateTo(''); setOffset(0); } });
  if (guestPhone.trim()) activeChips.push({ key: 'guestPhone', label: `Phone: ${guestPhone.trim()}`, onClear: () => { setGuestPhone(''); setOffset(0); } });
  if (search.trim()) activeChips.push({ key: 'search', label: `Search: "${search.trim().slice(0, 20)}${search.trim().length > 20 ? '…' : ''}"`, onClear: () => { setSearch(''); setOffset(0); } });

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
    <PageShell
      header={
        <PageHeader
          title="Chat history"
          subtitle={!loading && data != null ? `${total} conversation${total !== 1 ? 's' : ''} total` : undefined}
          userEmail={user?.email}
        />
      }
    >
      <section className="page-layout-filters chat-history-filters filter-control-panel" aria-label="Filter conversations">
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
        {activeChips.length > 0 && (
          <div className="filter-active-chips">
            {activeChips.map(({ key, label, onClear }) => (
              <span key={key} className="filter-chip">
                {label}
                <button type="button" className="filter-chip-remove" onClick={onClear} aria-label={`Remove ${label}`}>×</button>
              </span>
            ))}
          </div>
        )}
        <div className="filter-more-toggle-wrap">
          <button
            type="button"
            className="filter-more-toggle"
            onClick={() => setMoreFiltersOpen((o) => !o)}
            aria-expanded={moreFiltersOpen}
          >
            {moreFiltersOpen ? 'Less' : 'More'} filters
          </button>
        </div>
        {moreFiltersOpen && (
          <div className="page-layout-filter-row filter-more-content">
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
        )}
        <div className="page-layout-actions">
          <button type="button" className="btn-primary" onClick={() => fetchHistory()}>Refresh</button>
        </div>
      </section>

      {error && <div className="auth-error" style={{ marginBottom: 16 }} role="alert">{error}</div>}

      <div className="page-layout-table-card chat-history-table-card">
        {loading ? (
          <div className="page-layout-table-scroll">
            <table className="data-table">
                <thead>
                <tr>
                  <th>Guest</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Messages</th>
                  <th>Last message</th>
                  <th className="table-cell-actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !data?.conversations?.length ? (
          <div className="empty-state chat-history-empty">
            <p>No conversations in this period.</p>
            <p>Try adjusting filters or date range.</p>
          </div>
        ) : (
          <>
            <div className="page-layout-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Platform</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Messages</th>
                    <th>Last message</th>
                    <th className="table-cell-actions"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.conversations.map((c) => (
                    <tr key={c.sessionId} className="clickable" onClick={() => navigate(`/chat/${c.sessionId}`)}>
                      <td style={{ fontWeight: 500 }}>{c.guestName || c.guestPhone}</td>
                      <td><span className={`badge badge-${c.platform}`}>{c.platform}</span></td>
                      <td><span className={`badge badge-${conversationStatusBadgeClass(c.status)}`}>{conversationStatusLabel(c.status)}</span></td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(c.startedAt)}</td>
                      <td>{c.messageCount}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{c.lastMessage ?? '—'}</td>
                      <td className="table-cell-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="table-row-actions">
                          <Link to={`/chat/${c.sessionId}`} className="table-action-link">View</Link>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => showToast('info', 'Download transcript (coming soon — requires backend)')}
                            title="Download transcript (coming soon)"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(c.sessionId).then(() => showToast('success', 'Session ID copied'));
                            }}
                          >
                            Copy ID
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </PageShell>
  );
}

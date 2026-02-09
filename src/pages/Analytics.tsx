import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { analytics as analyticsApi } from '../api/endpoints';
import type {
  MessageAnalyticsResponse,
  BookingAnalyticsResponse,
  ConversationAnalyticsResponse,
  GuestAnalyticsResponse,
} from '../types/api';
import { ApiError } from '../api/client';

type TabId = 'messages' | 'bookings' | 'conversations' | 'guests';

const TAB_IDS: TabId[] = ['messages', 'bookings', 'conversations', 'guests'];

const COLORS = ['var(--color-primary)', '#64748b', '#94a3b8', '#cbd5e1'];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const propertyId = user?.propertyId ?? '';

  const pathTab = (location.pathname.replace('/analytics/', '') || 'messages') as TabId;
  const activeTab = TAB_IDS.includes(pathTab) ? pathTab : 'messages';

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  });
  const [endDate, setEndDate] = useState(() => toISODate(new Date()));
  const [groupByDay, setGroupByDay] = useState(true);
  const [topN, setTopN] = useState(10);

  const [messagesData, setMessagesData] = useState<MessageAnalyticsResponse | null>(null);
  const [bookingsData, setBookingsData] = useState<BookingAnalyticsResponse | null>(null);
  const [conversationsData, setConversationsData] = useState<ConversationAnalyticsResponse | null>(null);
  const [guestsData, setGuestsData] = useState<GuestAnalyticsResponse | null>(null);

  const [loading, setLoading] = useState<Record<TabId, boolean>>({ messages: false, bookings: false, conversations: false, guests: false });
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!propertyId) return;
    setLoading((l) => ({ ...l, messages: true }));
    setError(null);
    try {
      const res = await analyticsApi.messages(propertyId, startDate, endDate, groupByDay ? 'day' : undefined);
      setMessagesData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load message analytics.');
    } finally {
      setLoading((l) => ({ ...l, messages: false }));
    }
  }, [propertyId, startDate, endDate, groupByDay]);

  const fetchBookings = useCallback(async () => {
    if (!propertyId) return;
    setLoading((l) => ({ ...l, bookings: true }));
    setError(null);
    try {
      const res = await analyticsApi.bookings(propertyId, startDate, endDate, groupByDay ? 'day' : undefined);
      setBookingsData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load booking analytics.');
    } finally {
      setLoading((l) => ({ ...l, bookings: false }));
    }
  }, [propertyId, startDate, endDate, groupByDay]);

  const fetchConversations = useCallback(async () => {
    if (!propertyId) return;
    setLoading((l) => ({ ...l, conversations: true }));
    setError(null);
    try {
      const res = await analyticsApi.conversations(propertyId, startDate, endDate, groupByDay ? 'day' : undefined);
      setConversationsData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load conversation analytics.');
    } finally {
      setLoading((l) => ({ ...l, conversations: false }));
    }
  }, [propertyId, startDate, endDate, groupByDay]);

  const fetchGuests = useCallback(async () => {
    if (!propertyId) return;
    setLoading((l) => ({ ...l, guests: true }));
    setError(null);
    try {
      const res = await analyticsApi.guests(propertyId, startDate, endDate, topN);
      setGuestsData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load guest analytics.');
    } finally {
      setLoading((l) => ({ ...l, guests: false }));
    }
  }, [propertyId, startDate, endDate, topN]);

  useEffect(() => {
    if (activeTab === 'messages') fetchMessages();
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab, fetchBookings]);

  useEffect(() => {
    if (activeTab === 'conversations') fetchConversations();
  }, [activeTab, fetchConversations]);

  useEffect(() => {
    if (activeTab === 'guests') fetchGuests();
  }, [activeTab, fetchGuests]);

  const selectTab = (tab: TabId) => navigate(`/analytics/${tab}`);

  return (
    <div className="page-layout">
      <header className="page-layout-header">
        <h1>Analytics</h1>
      </header>

      <section className="page-layout-filters" aria-label="Date and options">
        <h2 className="page-layout-filters-title">Date range & options</h2>
        <div className="page-layout-filter-row">
          <div className="page-layout-filter-group">
            <label htmlFor="analytics-from">From</label>
            <input id="analytics-from" type="date" className="input-text" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 160 }} />
          </div>
          <div className="page-layout-filter-group">
            <label htmlFor="analytics-to">To</label>
            <input id="analytics-to" type="date" className="input-text" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 160 }} />
          </div>
          {(activeTab === 'messages' || activeTab === 'bookings' || activeTab === 'conversations') && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={groupByDay} onChange={(e) => setGroupByDay(e.target.checked)} />
              <span>By day</span>
            </label>
          )}
          {activeTab === 'guests' && (
            <div className="page-layout-filter-group">
              <label htmlFor="analytics-topn">Top N</label>
              <input id="analytics-topn" type="number" className="input-text" min={1} max={50} value={topN} onChange={(e) => setTopN(Number(e.target.value) || 10)} style={{ width: 64 }} />
            </div>
          )}
        </div>
      </section>

      <div className="page-layout-tabs" role="tablist">
        {TAB_IDS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`chip ${activeTab === tab ? 'chip-active' : ''}`}
            onClick={() => selectTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }} role="alert">{error}</div>}

      <div className="page-layout-content-card">
        {activeTab === 'messages' && (
          <MessagesView data={messagesData} loading={loading.messages} groupByDay={groupByDay} />
        )}
        {activeTab === 'bookings' && (
          <BookingsView data={bookingsData} loading={loading.bookings} groupByDay={groupByDay} />
        )}
        {activeTab === 'conversations' && (
          <ConversationsView data={conversationsData} loading={loading.conversations} groupByDay={groupByDay} />
        )}
        {activeTab === 'guests' && (
          <GuestsView data={guestsData} loading={loading.guests} />
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12, minWidth: 120 }}>
      <div className="section-header" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}

function MessagesView({ data, loading, groupByDay }: { data: MessageAnalyticsResponse | null; loading: boolean; groupByDay: boolean }) {
  if (loading) return <div className="empty-state"><p>Loading…</p></div>;
  if (!data) return <div className="empty-state"><p>Select a date range and load.</p></div>;

  const platformPie = [
    { name: 'WhatsApp', value: data.byPlatform.whatsapp },
    { name: 'SMS', value: data.byPlatform.sms },
    { name: 'Web', value: data.byPlatform.web },
  ].filter((d) => d.value > 0);

  const typePie = [
    { name: 'Booking', value: data.byType.booking },
    { name: 'Concierge', value: data.byType.concierge },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <KpiCard label="Total messages" value={data.totalMessages} />
        <KpiCard label="Booking" value={data.byType.booking} />
        <KpiCard label="Concierge" value={data.byType.concierge} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12, minWidth: 200 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>By platform</div>
          {platformPie.length ? (
            <ResponsiveContainer width={220} height={180}>
              <PieChart>
                <Pie data={platformPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={(e) => e.name}>
                  {platformPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No data</p>}
        </div>
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12, minWidth: 200 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>By type</div>
          {typePie.length ? (
            <ResponsiveContainer width={220} height={180}>
              <PieChart>
                <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={(e) => e.name}>
                  {typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No data</p>}
        </div>
      </div>
      {groupByDay && data.daily && data.daily.length > 0 && (
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>Daily</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="var(--color-primary)" name="Messages" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** Conversion funnel: same status set as Bookings page — Inquiry (pending_approval + booking_inquiry), Confirmed, Canceled only. */
function buildConversionFunnel(conversion: Record<string, number> | undefined): { name: string; value: number }[] {
  if (!conversion) return [];
  const inquiry = (conversion.pending_approval ?? 0) + (conversion.booking_inquiry ?? 0);
  const confirmed = conversion.confirmed ?? 0;
  const canceled = conversion.canceled ?? 0;
  return [
    { name: 'Inquiry', value: inquiry },
    { name: 'Confirmed', value: confirmed },
    { name: 'Canceled', value: canceled },
  ];
}

function BookingsView({ data, loading, groupByDay }: { data: BookingAnalyticsResponse | null; loading: boolean; groupByDay: boolean }) {
  if (loading) return <div className="empty-state"><p>Loading…</p></div>;
  if (!data) return <div className="empty-state"><p>Select a date range and load.</p></div>;

  const conversionArr = buildConversionFunnel(data.conversion);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <KpiCard label="Total bookings" value={data.totalBookings} />
        <KpiCard label="Avg length of stay (nights)" value={data.averageLengthOfStayNights ?? 0} />
      </div>
      {conversionArr.length > 0 && (
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>Conversion funnel</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={conversionArr} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-primary)" name="Count" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {groupByDay && data.overTime && data.overTime.length > 0 && (
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>Over time</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" name="Bookings" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ConversationsView({ data, loading, groupByDay }: { data: ConversationAnalyticsResponse | null; loading: boolean; groupByDay: boolean }) {
  if (loading) return <div className="empty-state"><p>Loading…</p></div>;
  if (!data) return <div className="empty-state"><p>Select a date range and load.</p></div>;

  const sess = data.sessionsPerGuest || { oneSession: 0, twoSessions: 0, threePlusSessions: 0 };
  const sessPie = [
    { name: '1 session', value: sess.oneSession },
    { name: '2 sessions', value: sess.twoSessions },
    { name: '3+ sessions', value: sess.threePlusSessions },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <KpiCard label="Total sessions" value={data.totalSessions} />
      </div>
      {sessPie.length > 0 && (
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12, maxWidth: 280 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>Sessions per guest</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sessPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {sessPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.peakByHour && data.peakByHour.length > 0 && (
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>Peak by hour</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.peakByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" name="Sessions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {groupByDay && data.overTime && data.overTime.length > 0 && (
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>Over time</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" name="Sessions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function GuestsView({ data, loading }: { data: GuestAnalyticsResponse | null; loading: boolean }) {
  if (loading) return <div className="empty-state"><p>Loading…</p></div>;
  if (!data) return <div className="empty-state"><p>Select a date range and load.</p></div>;

  const channelPie = [
    { name: 'WhatsApp', value: data.channelMix?.whatsapp ?? 0 },
    { name: 'SMS', value: data.channelMix?.sms ?? 0 },
    { name: 'Web', value: data.channelMix?.web ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <KpiCard label="New guests" value={data.newGuests} />
        <KpiCard label="Returning guests" value={data.returningGuests} />
      </div>
      {channelPie.length > 0 && (
        <div className="glass-panel glass" style={{ padding: 20, borderRadius: 12, maxWidth: 280 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>Channel mix</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={channelPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {channelPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.topGuestsByBookingCount && data.topGuestsByBookingCount.length > 0 && (
        <div>
          <div className="section-header" style={{ marginBottom: 12 }}>Top guests by booking count</div>
          <div className="table-scroll-wrap" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {data.topGuestsByBookingCount.map((g) => (
                <tr key={g.customerId}>
                  <td>{g.name || '—'}</td>
                  <td>{g.phoneNumber}</td>
                  <td>{g.bookingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

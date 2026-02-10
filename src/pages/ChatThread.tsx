import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { chat } from '../api/endpoints';
import type { ChatMessagesResponse, ChatMessage } from '../types/api';
import { ApiError } from '../api/client';
import { conversationStatusLabel, conversationStatusBadgeClass } from '../utils/conversationStatus';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function formatDateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'long' });
  } catch {
    return iso;
  }
}

/** Group messages by date (YYYY-MM-DD) for date separators */
function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; dateLabel: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const m of messages) {
    const date = m.sentAt.slice(0, 10);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, dateLabel: formatDateLabel(m.sentAt), messages: [] });
    }
    groups[groups.length - 1].messages.push(m);
  }
  return groups;
}

function senderLabel(senderType: string, senderName?: string) {
  if (senderName && senderName.trim()) return senderName;
  const map: Record<string, string> = { guest: 'Guest', staff: 'Staff', system: 'System' };
  return map[senderType] ?? senderType;
}

/** Split content into text and URL segments; render URLs as links. */
function renderMessageContent(content: string) {
  if (!content?.trim()) return '—';
  const parts: (string | { url: string })[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(URL_REGEX.source, 'gi');
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) parts.push(content.slice(lastIndex, m.index));
    parts.push({ url: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      p
    ) : (
      <a key={i} href={p.url} target="_blank" rel="noreferrer noopener">
        {p.url.length > 50 ? p.url.slice(0, 47) + '…' : p.url}
      </a>
    )
  );
}

export default function ChatThread() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<ChatMessagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });
    chat.messages(sessionId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load messages.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId]);

  if (!sessionId) return <PageShell><p className="auth-error" role="alert">Missing conversation.</p></PageShell>;
  if (error) {
    return (
      <PageShell>
        <p className="auth-error" role="alert">{error}</p>
        <Link to="/chat" className="btn-secondary">Back to list</Link>
      </PageShell>
    );
  }
  if (loading || !data) {
    return (
      <PageShell>
        <div className="page-layout-content-card">
          <div className="empty-state"><p>Loading…</p></div>
        </div>
      </PageShell>
    );
  }

  const { session, messages } = data;
  const fromClass = (t: string) => (t === 'guest' ? 'from-guest' : t === 'system' ? 'from-system' : 'from-staff');

  const messageGroups = groupMessagesByDate(messages);

  return (
    <PageShell
      header={
        <PageHeader
          title="Conversation"
          breadcrumbs={[{ label: 'Chat history', href: '/chat' }, { label: 'Conversation' }]}
          userEmail={user?.email}
        />
      }
    >
      <div className="chat-thread-wrap">
        <div className="chat-thread-sticky-bar">
          <div className="chat-thread-header">
            <div className="chat-thread-header-meta">
              <span className="chat-thread-guest">{session.guestName || session.guestPhone}</span>
              {session.unitNumber && <span className="chat-thread-meta-extra">Unit {session.unitNumber}</span>}
              <span className={`badge badge-${session.platform}`}>{session.platform}</span>
              <span className={`badge badge-${conversationStatusBadgeClass(session.status)}`}>{conversationStatusLabel(session.status)}</span>
              {session.assignedStaff && <span className="chat-thread-meta-extra">{session.assignedStaff.name}</span>}
            </div>
            <div className="chat-thread-header-actions">
              <button type="button" className="btn-secondary chat-thread-action-btn" onClick={() => showToast('info', 'Download transcript (coming soon — requires backend)')} title="Download transcript (coming soon)">Download</button>
              <button type="button" className="btn-secondary chat-thread-action-btn" onClick={() => showToast('info', 'Email transcript (coming soon — requires backend)')} title="Email transcript (coming soon)">Email</button>
            </div>
          </div>
        </div>

        <div className="chat-thread-messages">
          {messages.length === 0 ? (
            <div className="empty-state"><p>No messages in this conversation.</p></div>
          ) : (
            <ul className="chat-message-list">
              {messageGroups.map((group) => (
                <li key={group.date} className="chat-date-group">
                  <div className="chat-date-separator">{group.dateLabel}</div>
                  <ul className="chat-message-sublist">
                    {group.messages.map((m: ChatMessage) => (
                      <li key={m.id} className={`chat-message ${fromClass(m.senderType)}`}>
                        <div className={`chat-bubble ${fromClass(m.senderType)}`}>
                          <div className="chat-bubble-sender">
                            {senderLabel(m.senderType, m.senderName)}
                            <span className="chat-bubble-time">{formatTime(m.sentAt)}</span>
                          </div>
                          <div className="chat-bubble-body">{renderMessageContent(m.content ?? '')}</div>
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="chat-bubble-attachments">
                              {m.attachments.map((a) => (
                                <a key={a.id} href={a.filePath} target="_blank" rel="noreferrer noopener">{a.originalName}</a>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}

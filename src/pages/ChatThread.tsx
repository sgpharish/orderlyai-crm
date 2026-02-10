import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { chat } from '../api/endpoints';
import type { ChatMessagesResponse } from '../types/api';
import { ApiError } from '../api/client';
import { conversationStatusLabel, conversationStatusBadgeClass } from '../utils/conversationStatus';

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
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

  if (!sessionId) return <div className="page-layout"><p className="auth-error" role="alert">Missing conversation.</p></div>;
  if (error) {
    return (
      <div className="page-layout">
        <p className="auth-error" role="alert">{error}</p>
        <Link to="/chat" className="btn-secondary">Back to list</Link>
      </div>
    );
  }
  if (loading || !data) {
    return (
      <div className="page-layout">
        <div className="page-layout-content-card">
          <div className="empty-state"><p>Loading…</p></div>
        </div>
      </div>
    );
  }

  const { session, messages } = data;
  const fromClass = (t: string) => (t === 'guest' ? 'from-guest' : t === 'system' ? 'from-system' : 'from-staff');

  return (
    <div className="page-layout">
      <div className="chat-thread-wrap">
        <div className="chat-thread-header">
          <Link to="/chat" className="back-link">Back to list</Link>
          <div className="chat-thread-header-meta">
            <span className="chat-thread-guest">{session.guestName || session.guestPhone}</span>
            {session.unitNumber && <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-caption)' }}>Unit {session.unitNumber}</span>}
            <span className={`badge badge-${session.platform}`}>{session.platform}</span>
            <span className={`badge badge-${conversationStatusBadgeClass(session.status)}`}>{conversationStatusLabel(session.status)}</span>
            {session.assignedStaff && <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-caption)' }}>{session.assignedStaff.name}</span>}
          </div>
        </div>

        <div className="chat-thread-messages">
          {messages.length === 0 ? (
            <div className="empty-state"><p>No messages in this conversation.</p></div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {messages.map((m) => (
                <li key={m.id} className={`chat-message ${fromClass(m.senderType)}`}>
                  <div className={`chat-bubble ${fromClass(m.senderType)}`}>
                    <div className="chat-bubble-sender">
                      {senderLabel(m.senderType, m.senderName)}
                      <span className="chat-bubble-time">{formatTime(m.sentAt)}</span>
                    </div>
                    <div className="chat-bubble-body">{renderMessageContent(m.content ?? '')}</div>
                    {m.attachments?.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}

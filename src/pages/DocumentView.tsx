import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { documents as docsApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { DocumentViewResponse } from '../types/api';

export default function DocumentView() {
  const { documentId } = useParams<{ documentId: string }>();
  const [doc, setDoc] = useState<DocumentViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDoc(null);
    docsApi
      .get(documentId)
      .then((res) => {
        if (!cancelled) setDoc(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load document.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [documentId]);

  if (!documentId) {
    return (
      <div className="page-layout"><p className="auth-error" role="alert">Missing document ID.</p></div>
    );
  }

  if (error) {
    return (
      <div className="page-layout">
        <p className="auth-error" role="alert">{error}</p>
        <Link to="/documents" className="back-link">Back to documents</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-layout">
        <div className="page-layout-content-card">
          <div className="empty-state"><p>Loading document…</p></div>
        </div>
      </div>
    );
  }

  if (!doc?.viewUrl) {
    return (
      <div className="page-layout">
        <p className="auth-error" role="alert">No view URL for this document.</p>
        <Link to="/documents" className="back-link">Back to documents</Link>
      </div>
    );
  }

  const isPdf = doc.type === 'application/pdf' || doc.type === '';

  return (
    <div className="page-layout">
      <header className="page-layout-header" style={{ flexWrap: 'wrap', gap: 'var(--spacing-md)', alignItems: 'center' }}>
        <Link to="/documents" className="back-link">Back to documents</Link>
        <span className="page-layout-summary" style={{ fontWeight: 500 }}>{doc.name}</span>
      </header>
      <div className="page-layout-content-card" style={{ padding: 0, overflow: 'hidden', minHeight: 480 }}>
        {isPdf ? (
          <iframe
            src={doc.viewUrl}
            title={doc.name}
            style={{ width: '100%', height: '80vh', minHeight: 480, border: 'none' }}
          />
        ) : (
          <div className="empty-state">
            <p>Preview not available for this file type.</p>
            <a href={doc.viewUrl} download={doc.name || 'document'} className="btn-primary" target="_blank" rel="noreferrer noopener">Open or download</a>
          </div>
        )}
      </div>
    </div>
  );
}

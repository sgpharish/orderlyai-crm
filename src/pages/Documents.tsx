import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { documents as docsApi } from '../api/endpoints';
import type { DocumentItem } from '../types/api';
import { ApiError } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
  } catch {
    return iso;
  }
}

const IconView = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconReplace = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

export default function Documents() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const propertyId = user?.propertyId ?? '';
  const [list, setList] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replaceDoc, setReplaceDoc] = useState<DocumentItem | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceName, setReplaceName] = useState('');
  const [replaceDesc, setReplaceDesc] = useState('');
  const [replaceSubmitting, setReplaceSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await docsApi.list(propertyId);
      setList(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openReplace = (doc: DocumentItem) => {
    setReplaceDoc(doc);
    setReplaceFile(null);
    setReplaceName(doc.name);
    setReplaceDesc(doc.description ?? '');
  };

  const closeReplace = () => {
    setReplaceDoc(null);
    setReplaceFile(null);
  };

  const submitReplace = async () => {
    if (!replaceDoc || !replaceFile) return;
    setReplaceSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', replaceFile);
      if (replaceName.trim()) form.append('name', replaceName.trim());
      if (replaceDesc.trim()) form.append('description', replaceDesc.trim());
      await docsApi.replace(replaceDoc.id, form);
      showToast('success', 'Document replaced successfully.');
      closeReplace();
      fetchList();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'Replace failed.');
    } finally {
      setReplaceSubmitting(false);
    }
  };

  return (
    <div className="page-layout documents-page">
      <header className="page-layout-header">
        <h1>Property documents</h1>
        {!loading && (
          <span className="page-layout-summary">
            {list.length} document{list.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      {error && <div className="auth-error" style={{ marginBottom: 16 }} role="alert">{error}</div>}

      <div className="page-layout-table-card documents-table-card documents-desktop">
        {loading ? (
          <table className="data-table documents-table">
            <thead>
              <tr>
                <th className="documents-col-name">Name</th>
                <th className="documents-col-desc">Description</th>
                <th className="documents-col-type">Type</th>
                <th className="documents-col-uploaded">Uploaded</th>
                <th className="documents-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !list.length ? (
          <div className="empty-state">
            <p>No documents for this property.</p>
          </div>
        ) : (
          <table className="data-table documents-table">
            <thead>
              <tr>
                <th className="documents-col-name">Name</th>
                <th className="documents-col-desc">Description</th>
                <th className="documents-col-type">Type</th>
                <th className="documents-col-uploaded">Uploaded</th>
                <th className="documents-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((doc) => (
                <tr key={doc.id}>
                  <td className="documents-col-name">{doc.name}</td>
                  <td className="documents-col-desc" style={{ color: 'var(--color-text-secondary)' }}>{doc.description ?? '—'}</td>
                  <td className="documents-col-type"><span className="badge badge-default">{doc.type}</span></td>
                  <td className="documents-col-uploaded" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(doc.uploadedAt)}</td>
                  <td className="documents-col-actions">
                    <div className="table-cell-actions">
                      <Link to={`/documents/view/${doc.id}`} className="btn-icon btn-icon-primary" title="View" aria-label="View document">
                        <IconView />
                      </Link>
                      <button type="button" className="btn-icon btn-icon-secondary" title="Replace" aria-label="Replace document" onClick={() => openReplace(doc)}>
                        <IconReplace />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {loading && (
        <div className="documents-cards documents-mobile">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="document-card">
              <div className="document-card-main">
                <div className="skeleton" style={{ height: 20, width: '60%', borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 4, marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && list.length > 0 && (
        <div className="documents-cards documents-mobile">
          {list.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-card-main">
                <span className="document-card-name">{doc.name}</span>
                <span className="document-card-meta">
                  {doc.type && <span className="badge badge-default">{doc.type}</span>}
                  <span className="document-card-date">{formatDate(doc.uploadedAt)}</span>
                </span>
                {doc.description ? <p className="document-card-desc">{doc.description}</p> : null}
              </div>
              <div className="document-card-actions">
                <Link to={`/documents/view/${doc.id}`} className="btn-icon btn-icon-primary" title="View" aria-label="View document">
                  <IconView />
                </Link>
                <button type="button" className="btn-icon btn-icon-secondary" title="Replace" aria-label="Replace document" onClick={() => openReplace(doc)}>
                  <IconReplace />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && list.length === 0 && (
        <div className="documents-mobile">
          <div className="page-layout-table-card">
            <div className="empty-state">
              <p>No documents for this property.</p>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!replaceDoc}
        onClose={closeReplace}
        title="Replace document"
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={closeReplace}>Cancel</button>
            <button type="button" className="btn-primary" disabled={!replaceFile || replaceSubmitting} onClick={submitReplace}>
              {replaceSubmitting ? 'Uploading…' : 'Replace'}
            </button>
          </>
        }
      >
        {replaceDoc && (
          <div className="auth-form">
            <div className="auth-field">
              <label>File (required)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="auth-field">
              <label>Name (optional)</label>
              <div className="input-wrap">
                <input type="text" className="input-text" value={replaceName} onChange={(e) => setReplaceName(e.target.value)} placeholder={replaceDoc.name} />
              </div>
            </div>
            <div className="auth-field">
              <label>Description (optional)</label>
              <div className="input-wrap">
                <input type="text" className="input-text" value={replaceDesc} onChange={(e) => setReplaceDesc(e.target.value)} placeholder="Description" />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useToast } from '../contexts/ToastContext';

export default function ToastList() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role="alert"
        >
          <span className="toast-message">{t.message}</span>
          <button type="button" className="toast-dismiss" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

import type { ReactNode } from 'react';
import './PageShell.css';

export interface PageShellProps {
  children: ReactNode;
  /** Optional custom header (e.g. PageHeader with breadcrumbs). When set, title/subtitle/actions are ignored. */
  header?: ReactNode;
  /** Optional sticky header: title, subtitle, and actions (ignored if header is set) */
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export default function PageShell({ children, header, title, subtitle, actions }: PageShellProps) {
  const hasCustomHeader = header != null;
  const hasDefaultHeader = !hasCustomHeader && (title != null || subtitle != null || actions != null);

  return (
    <div className="page-shell">
      {hasCustomHeader && (
        <header className="page-shell-header">
          {header}
        </header>
      )}
      {hasDefaultHeader && (
        <header className="page-shell-header">
          <div className="page-shell-header-inner">
            <div className="page-shell-header-left">
              {title != null && <h1 className="page-shell-title">{title}</h1>}
              {subtitle != null && <span className="page-shell-subtitle">{subtitle}</span>}
            </div>
            {actions != null && <div className="page-shell-actions">{actions}</div>}
          </div>
        </header>
      )}
      <div className="page-shell-content">{children}</div>
    </div>
  );
}

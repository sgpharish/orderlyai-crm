import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './PageHeader.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Breadcrumbs for detail pages (e.g. [{ label: 'Chat history', href: '/chat' }, { label: 'Conversation' }]) */
  breadcrumbs?: BreadcrumbItem[];
  /** Right side: user email chip (shown when provided) */
  userEmail?: string;
  /** Right side: e.g. "163 conversations" */
  counts?: ReactNode;
  /** Right side: context actions (buttons, etc.) */
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, userEmail, counts, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-inner">
        <div className="page-header-left">
          {breadcrumbs != null && breadcrumbs.length > 0 && (
            <nav className="page-header-breadcrumbs" aria-label="Breadcrumb">
              <ol className="page-header-breadcrumbs-list">
                {breadcrumbs.map((item, i) => (
                  <li key={i} className="page-header-breadcrumb-item">
                    {i > 0 && <span className="page-header-breadcrumb-sep" aria-hidden>/</span>}
                    {item.href != null ? (
                      <Link to={item.href} className="page-header-breadcrumb-link">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="page-header-breadcrumb-current">{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="page-header-title">{title}</h1>
          {subtitle != null && <span className="page-header-subtitle">{subtitle}</span>}
        </div>
        <div className="page-header-right">
          {counts != null && <span className="page-header-counts">{counts}</span>}
          {actions != null && <div className="page-header-actions">{actions}</div>}
          {userEmail != null && userEmail !== '' && (
            <span className="page-header-user-chip" title={userEmail}>
              <span className="page-header-user-email">{userEmail}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

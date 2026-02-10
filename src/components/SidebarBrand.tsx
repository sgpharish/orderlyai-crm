import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

type LockupSrc = '/logo-horizontal.svg' | '/logo-horizontal.png' | '/logo.png';
const LOCKUP_SOURCES: LockupSrc[] = ['/logo-horizontal.png', '/logo-horizontal.svg', '/logo.png'];

interface SidebarBrandProps {
  /** Route when the brand row is clicked (e.g. /chat or /analytics) */
  to?: string;
}

export default function SidebarBrand({ to = '/chat' }: SidebarBrandProps) {
  const [logoSrc, setLogoSrc] = useState<LockupSrc>(LOCKUP_SOURCES[0]);
  const isFallback = logoSrc === '/logo.png';

  const handleImgError = () => {
    setLogoSrc((prev) => {
      const i = LOCKUP_SOURCES.indexOf(prev);
      return i >= 0 && i < LOCKUP_SOURCES.length - 1 ? LOCKUP_SOURCES[i + 1] : prev;
    });
  };

  const content = isFallback ? (
    <Logo variant="compact" showLabel to={undefined} className="sidebar-brand-logo-fallback" />
  ) : (
    <img
      src={logoSrc}
      alt="Orderly.ai"
      className="sidebar-brand-logo"
      loading="eager"
      onError={handleImgError}
    />
  );

  const ariaLabel = to === '/analytics' ? 'Go to Analytics' : 'Go to Chat history';
  return (
    <Link
      to={to}
      className="sidebar-brand"
      aria-label={ariaLabel}
    >
      {content}
    </Link>
  );
}

import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'full' | 'compact';
  showLabel?: boolean;
  to?: string;
  className?: string;
}

export default function Logo({ variant = 'full', showLabel = true, to, className = '' }: LogoProps) {
  const size = variant === 'compact' ? 36 : 40;
  const content = (
    <span className={`logo-wrap ${className}`}>
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        className="logo-img"
      />
      {variant === 'compact' && showLabel && (
        <span className="logo-wordmark">OrderlyAI</span>
      )}
      {showLabel && variant === 'full' && (
        <span className="logo-text">CRM</span>
      )}
    </span>
  );

  if (to) {
    return <Link to={to} className="logo-link">{content}</Link>;
  }
  return content;
}

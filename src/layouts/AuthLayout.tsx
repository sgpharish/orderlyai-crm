import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card glass-panel glass">
        <div className="auth-brand">
          <Logo variant="full" showLabel to={undefined} />
        </div>
        <Outlet />
      </div>
    </div>
  );
}

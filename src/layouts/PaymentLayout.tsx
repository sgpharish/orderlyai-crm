import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import './PaymentLayout.css';

export default function PaymentLayout() {
  return (
    <div className="payment-layout">
      <div className="payment-card glass-panel glass">
        <div className="payment-brand">
          <Logo variant="full" showLabel to={undefined} />
        </div>
        <Outlet />
      </div>
    </div>
  );
}

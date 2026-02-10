import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastList from './components/ToastList';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import PaymentLayout from './layouts/PaymentLayout';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Payment from './pages/Payment';
import ChatHistory from './pages/ChatHistory';
import ChatThread from './pages/ChatThread';
import Bookings from './pages/Bookings';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<AuthLayout />}>
              <Route index element={<Login />} />
            </Route>
            <Route path="/forgot-password" element={<AuthLayout />}>
              <Route index element={<ForgotPassword />} />
            </Route>
            <Route path="/reset-password" element={<AuthLayout />}>
              <Route index element={<ResetPassword />} />
            </Route>
            <Route path="/payments" element={<PaymentLayout />}>
              <Route index element={<Payment />} />
            </Route>

            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/chat" replace />} />
              <Route path="chat" element={<ChatHistory />} />
              <Route path="chat/:sessionId" element={<ChatThread />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="documents" element={<Documents />} />
              <Route path="documents/view/:documentId" element={<DocumentView />} />
              <Route path="analytics" element={<Navigate to="/analytics/messages" replace />} />
              <Route path="analytics/:tab" element={<Analytics />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastList />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

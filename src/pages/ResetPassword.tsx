import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { auth } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useToast } from '../contexts/ToastContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (token === null || token === '') setInvalidToken(true);
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setInvalidToken(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await auth.resetPassword(token, newPassword);
      showToast('success', 'Password has been reset. You can log in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed. The link may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invalidToken) {
    return (
      <>
        <h1 className="auth-title">Invalid reset link</h1>
        <p className="auth-subtitle">This link is missing or invalid. Request a new one from the sign-in page.</p>
        <p className="auth-footer">
          <Link to="/forgot-password">Request new reset link</Link>
          {' · '}
          <Link to="/login">Back to sign in</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="auth-title">Set new password</h1>
      <p className="auth-subtitle">Enter your new password below.</p>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="reset-new">New password</label>
          <div className="input-wrap">
            <input
              id="reset-new"
              type="password"
              className="input-text"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="reset-confirm">Confirm new password</label>
          <div className="input-wrap">
            <input
              id="reset-confirm"
              type="password"
              className="input-text"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="auth-actions">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>
        </div>
      </form>
      <p className="auth-footer">
        <Link to="/login">Back to sign in</Link>
      </p>
    </>
  );
}

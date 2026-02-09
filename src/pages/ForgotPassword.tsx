import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api/endpoints';
import { ApiError } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await auth.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="auth-title">Reset your password</h1>
      <p className="auth-subtitle">We’ll send a link to your email.</p>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="forgot-email">Email</label>
          <div className="input-wrap">
            <input
              id="forgot-email"
              type="email"
              className="input-text"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        {success && (
          <div className="auth-success" role="status">
            If that email is registered, you will receive a reset link.
          </div>
        )}
        <div className="auth-actions">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </div>
      </form>
      <p className="auth-footer">
        <Link to="/login">Back to sign in</Link>
      </p>
    </>
  );
}

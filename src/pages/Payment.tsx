/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { payments } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { PaymentContextResponse } from '../types/api';

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatExpiresAt(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Format card number with a space every 4 digits (max 16 digits). */
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Format expiry as MM/YY. */
function formatExpireDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Validate expiry MM/YY: month 01-12, year >= current (2-digit). */
function isValidExpiry(mmYY: string): boolean {
  const digits = mmYY.replace(/\D/g, '');
  if (digits.length !== 4) return false;
  const mm = parseInt(digits.slice(0, 2), 10);
  const yy = parseInt(digits.slice(2), 10);
  if (mm < 1 || mm > 12) return false;
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;
  return true;
}

interface FieldErrors {
  cardNumber?: string;
  cardHolderName?: string;
  expireDate?: string;
  cvv?: string;
  zipcode?: string;
}

function validateForm(
  cardNumber: string,
  cardHolderName: string,
  expireDate: string,
  cvv: string,
  zipcode: string
): FieldErrors {
  const err: FieldErrors = {};
  const digitsOnly = cardNumber.replace(/\s/g, '');
  if (!digitsOnly || digitsOnly.length < 13 || digitsOnly.length > 19) {
    err.cardNumber = 'Enter a valid card number (13–19 digits).';
  } else if (!/^\d+$/.test(digitsOnly)) {
    err.cardNumber = 'Card number must contain only digits.';
  }
  if (!cardHolderName || cardHolderName.trim().length < 2) {
    err.cardHolderName = 'Enter the name on the card.';
  }
  if (!expireDate || expireDate.replace(/\D/g, '').length !== 4) {
    err.expireDate = 'Enter expiry as MM/YY.';
  } else if (!isValidExpiry(expireDate)) {
    err.expireDate = 'Enter a valid future expiry date (MM/YY).';
  }
  if (!cvv || cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
    err.cvv = 'Enter a valid CVV (3 or 4 digits).';
  }
  if (!zipcode || zipcode.trim().length < 2) {
    err.zipcode = 'Enter billing zip / postal code.';
  }
  return err;
}

type PageState =
  | { status: 'no-token' }
  | { status: 'loading' }
  | { status: 'context-error'; message: string }
  | { status: 'ready'; context: PaymentContextResponse }
  | { status: 'submitting'; context: PaymentContextResponse }
  | { status: 'success'; message?: string }
  | { status: 'submit-error'; context: PaymentContextResponse; message: string };

export default function Payment() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<PageState>({ status: 'loading' });
  const [cardNumberDisplay, setCardNumberDisplay] = useState('');
  const [expireDateDisplay, setExpireDateDisplay] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (token === null || token.trim() === '') {
      setState({ status: 'no-token' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    payments
      .getContext(token)
      .then((context) => {
        if (!cancelled) setState({ status: 'ready', context });
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'This payment link is invalid or expired. Please request a new link from the chat.';
          setState({ status: 'context-error', message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === 'no-token') {
    return (
      <>
        <h1 className="payment-title">Payment link required</h1>
        <p className="payment-subtitle">
          This page requires a valid payment link. Please use the link sent to you in the chat.
        </p>
        <div className="payment-footer">
          <p>Request a new payment link from your WhatsApp or SMS conversation.</p>
        </div>
      </>
    );
  }

  if (state.status === 'loading') {
    return (
      <>
        <h1 className="payment-title">Loading…</h1>
        <div className="payment-summary" aria-hidden="true">
          <div className="payment-summary-title skeleton" style={{ width: '40%', height: 14 }} />
          <div className="payment-summary-row">
            <span className="skeleton" style={{ width: 80, height: 16 }} />
            <span className="skeleton" style={{ width: 100, height: 16 }} />
          </div>
          <div className="payment-summary-row">
            <span className="skeleton" style={{ width: 80, height: 16 }} />
            <span className="skeleton" style={{ width: 100, height: 16 }} />
          </div>
          <div className="payment-summary-row">
            <span className="skeleton" style={{ width: 80, height: 16 }} />
            <span className="skeleton" style={{ width: 120, height: 16 }} />
          </div>
        </div>
      </>
    );
  }

  if (state.status === 'context-error') {
    return (
      <>
        <h1 className="payment-title">Invalid or expired link</h1>
        <p className="payment-subtitle">{state.message}</p>
        <div className="payment-footer">
          <p>Please request a new payment link from your WhatsApp or SMS chat.</p>
        </div>
      </>
    );
  }

  if (state.status === 'success') {
    return (
      <>
        <h1 className="payment-title">Payment successful</h1>
        <p className="payment-subtitle">
          {state.message ?? 'Your booking is confirmed.'}
        </p>
        <div className="payment-success-message" role="status">
          Thank you for your payment. A confirmation has been sent to you on WhatsApp or SMS.
        </div>
        <div className="payment-footer">
          <p>You can close this page.</p>
        </div>
      </>
    );
  }

  const isFormState =
    state.status === 'ready' ||
    state.status === 'submitting' ||
    state.status === 'submit-error';
  if (!isFormState) {
    return null;
  }

  const { context } = state;
  const isSubmitting = state.status === 'submitting';
  const submitErrorMessage = state.status === 'submit-error' ? state.message : null;

  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCardNumberDisplay(formatCardNumber(e.target.value));
    setFieldErrors((prev) => ({ ...prev, cardNumber: undefined }));
  };

  const handleExpireDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setExpireDateDisplay(formatExpireDate(e.target.value));
    setFieldErrors((prev) => ({ ...prev, expireDate: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || token.trim() === '') return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const cardNumberRaw = (formData.get('cardNumber') as string)?.replace(/\s/g, '') ?? '';
    const cardHolderName = (formData.get('cardHolderName') as string)?.trim() ?? '';
    const expireDateRaw = (formData.get('expireDate') as string)?.trim() ?? '';
    const cvv = (formData.get('cvv') as string)?.trim() ?? '';
    const zipcode = (formData.get('zipcode') as string)?.trim() ?? '';

    const errors = validateForm(
      cardNumberRaw,
      cardHolderName,
      expireDateRaw,
      cvv,
      zipcode
    );
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const expireDateFormatted =
      expireDateRaw.length === 4 && !expireDateRaw.includes('/')
        ? `${expireDateRaw.slice(0, 2)}/${expireDateRaw.slice(2)}`
        : expireDateRaw.replace(/\s/g, '');

    setState({ status: 'submitting', context });
    try {
      const result = await payments.submit({
        token,
        cardNumber: cardNumberRaw,
        cardHolderName,
        expireDate: expireDateFormatted,
        cvv,
        zipcode,
      });
      if (result.success) {
        setState({
          status: 'success',
          message: result.message ?? 'Your booking is confirmed.',
        });
      } else {
        setState({
          status: 'submit-error',
          context,
          message: result.error ?? 'Payment could not be processed. Please try again.',
        });
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Payment could not be processed. Please check your details and try again.';
      setState({ status: 'submit-error', context, message });
    }
  };

  const isExpired = new Date(context.expiresAt) < new Date();

  return (
    <>
      <h1 className="payment-title">Complete your payment</h1>
      <p className="payment-subtitle">Review your booking and enter your card details below.</p>

      <section className="payment-summary" aria-label="Booking summary">
        <h2 className="payment-summary-title">Booking details</h2>
        <div className="payment-summary-row">
          <span className="payment-summary-label">Property</span>
          <span className="payment-summary-value">{context.propertyName}</span>
        </div>
        <div className="payment-summary-row">
          <span className="payment-summary-label">Check-in</span>
          <span className="payment-summary-value">{formatDate(context.checkInDate)}</span>
        </div>
        <div className="payment-summary-row">
          <span className="payment-summary-label">Check-out</span>
          <span className="payment-summary-value">{formatDate(context.checkOutDate)}</span>
        </div>
        <div className="payment-summary-row">
          <span className="payment-summary-label">Room type</span>
          <span className="payment-summary-value">{context.roomType}</span>
        </div>
        <div className="payment-summary-row">
          <span className="payment-summary-label">Guests</span>
          <span className="payment-summary-value">{context.guestCount}</span>
        </div>
        <div className="payment-summary-row">
          <span className="payment-summary-label">Confirmation code</span>
          <span className="payment-summary-value">{context.confirmationCode}</span>
        </div>
        <div className="payment-summary-row">
          <span className="payment-summary-label">Total amount</span>
          <span className="payment-summary-value amount">{formatAmount(context.totalAmount)}</span>
        </div>
        <p className="payment-expiry">Link expires at {formatExpiresAt(context.expiresAt)}</p>
      </section>

      {isExpired && (
        <div className="payment-error-message" role="alert">
          This payment link has expired. Please request a new link from the chat.
        </div>
      )}

      {!isExpired && (
        <>
          <h2 className="payment-form-section-title">Card details</h2>
          <form
            className="payment-form auth-form"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Payment form"
          >
            <div className="auth-field">
              <label htmlFor="payment-cardNumber">Card number</label>
              <div className={`input-wrap ${fieldErrors.cardNumber ? 'input-wrap-error' : ''}`}>
                <input
                  id="payment-cardNumber"
                  name="cardNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="input-text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumberDisplay}
                  onChange={handleCardNumberChange}
                  required
                  disabled={isSubmitting}
                  maxLength={19}
                  aria-invalid={!!fieldErrors.cardNumber}
                  aria-describedby={fieldErrors.cardNumber ? 'payment-cardNumber-error' : undefined}
                />
              </div>
              {fieldErrors.cardNumber && (
                <span id="payment-cardNumber-error" className="payment-field-error" role="alert">
                  {fieldErrors.cardNumber}
                </span>
              )}
            </div>
            <div className="auth-field">
              <label htmlFor="payment-cardHolderName">Name on card</label>
              <div className={`input-wrap ${fieldErrors.cardHolderName ? 'input-wrap-error' : ''}`}>
                <input
                  id="payment-cardHolderName"
                  name="cardHolderName"
                  type="text"
                  autoComplete="cc-name"
                  className="input-text"
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                  aria-invalid={!!fieldErrors.cardHolderName}
                  aria-describedby={fieldErrors.cardHolderName ? 'payment-cardHolderName-error' : undefined}
                  onFocus={() => setFieldErrors((prev) => ({ ...prev, cardHolderName: undefined }))}
                />
              </div>
              {fieldErrors.cardHolderName && (
                <span id="payment-cardHolderName-error" className="payment-field-error" role="alert">
                  {fieldErrors.cardHolderName}
                </span>
              )}
            </div>
            <div className="payment-row-two">
              <div className="auth-field">
                <label htmlFor="payment-expireDate">Expiry (MM/YY)</label>
                <div className={`input-wrap ${fieldErrors.expireDate ? 'input-wrap-error' : ''}`}>
                  <input
                    id="payment-expireDate"
                    name="expireDate"
                    type="text"
                    autoComplete="cc-exp"
                    className="input-text"
                    placeholder="MM/YY"
                    value={expireDateDisplay}
                    onChange={handleExpireDateChange}
                    required
                    disabled={isSubmitting}
                    maxLength={5}
                    aria-invalid={!!fieldErrors.expireDate}
                    aria-describedby={fieldErrors.expireDate ? 'payment-expireDate-error' : undefined}
                  />
                </div>
                {fieldErrors.expireDate && (
                  <span id="payment-expireDate-error" className="payment-field-error" role="alert">
                    {fieldErrors.expireDate}
                  </span>
                )}
              </div>
              <div className="auth-field">
                <label htmlFor="payment-cvv">CVV</label>
                <div className={`input-wrap ${fieldErrors.cvv ? 'input-wrap-error' : ''}`}>
                  <input
                    id="payment-cvv"
                    name="cvv"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="input-text"
                    placeholder="123"
                    required
                    disabled={isSubmitting}
                    maxLength={4}
                    aria-invalid={!!fieldErrors.cvv}
                    aria-describedby={fieldErrors.cvv ? 'payment-cvv-error' : undefined}
                    onFocus={() => setFieldErrors((prev) => ({ ...prev, cvv: undefined }))}
                  />
                </div>
                {fieldErrors.cvv && (
                  <span id="payment-cvv-error" className="payment-field-error" role="alert">
                    {fieldErrors.cvv}
                  </span>
                )}
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="payment-zipcode">Billing zip / postal code</label>
              <div className={`input-wrap ${fieldErrors.zipcode ? 'input-wrap-error' : ''}`}>
                <input
                  id="payment-zipcode"
                  name="zipcode"
                  type="text"
                  autoComplete="postal-code"
                  className="input-text"
                  placeholder="12345"
                  required
                  disabled={isSubmitting}
                  aria-invalid={!!fieldErrors.zipcode}
                  aria-describedby={fieldErrors.zipcode ? 'payment-zipcode-error' : undefined}
                  onFocus={() => setFieldErrors((prev) => ({ ...prev, zipcode: undefined }))}
                />
              </div>
              {fieldErrors.zipcode && (
                <span id="payment-zipcode-error" className="payment-field-error" role="alert">
                  {fieldErrors.zipcode}
                </span>
              )}
            </div>
            {submitErrorMessage && (
              <div className="auth-error payment-error-message" role="alert">
                {submitErrorMessage}
              </div>
            )}
            <div className="auth-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing…' : 'Pay now'}
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}

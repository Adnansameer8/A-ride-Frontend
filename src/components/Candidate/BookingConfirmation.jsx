import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Authcontext';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(10);

  const booking = location.state?.booking;

  useEffect(() => {
    if (!booking) {
      navigate('/explore');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking, navigate]);

  if (!booking) return null;

  // Clean Formatted ID
  const rawId = booking.id || booking.bookingId;
  const displayId = rawId ? `BKG-${rawId.split('-')[0].toUpperCase()}` : 'N/A';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

        .confirm-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'DM Sans', sans-serif;
        }

        .confirm-card {
          max-width: 600px;
          width: 100%;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 80px rgba(255, 76, 0, 0.2);
        }

        .confirm-header {
          background: linear-gradient(135deg, #ff4c00 0%, #ff7a00 100%);
          padding: 48px 40px;
          text-align: center;
          position: relative;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 48px;
          animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .confirm-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px;
          color: #ffffff;
          letter-spacing: 2px;
          margin: 0 0 12px;
        }

        .confirm-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          margin: 0;
        }

        .confirm-body {
          padding: 40px;
        }

        .booking-id {
          background: #f9fafb;
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-bottom: 32px;
        }

        .booking-id-label {
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .booking-id-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          color: #ff4c00;
          letter-spacing: 2px;
        }

        .details-grid {
          display: grid;
          gap: 20px;
          margin-bottom: 32px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .detail-label {
          font-size: 13px;
          color: #6b7280;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-weight: 600;
          color: #111827;
          text-align: right;
        }

        .info-box {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 32px;
        }

        .info-box-title {
          font-weight: 600;
          color: #c2410c;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-box-text {
          font-size: 14px;
          color: #9a3412;
          line-height: 1.6;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn {
          flex: 1;
          padding: 14px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-family: 'DM Sans', sans-serif;
        }

        .btn-primary {
          background: #ff4c00;
          color: #ffffff;
        }

        .btn-primary:hover {
          background: #e03d00;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .countdown {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #9ca3af;
        }

        .countdown-number {
          color: #ff4c00;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .confirm-header {
            padding: 36px 24px;
          }

          .confirm-title {
            font-size: 36px;
          }

          .confirm-body {
            padding: 28px 24px;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="confirm-root">
        <div className="confirm-card">
          <div className="confirm-header">
            <div className="success-icon">✓</div>
            <h1 className="confirm-title">Booking Confirmed!</h1>
            <p className="confirm-subtitle">
              Your adventure is just around the corner
            </p>
          </div>

          <div className="confirm-body">
            <div className="booking-id">
              <div className="booking-id-label">Booking ID</div>
              <div className="booking-id-value">{displayId}</div>
            </div>

            <div className="details-grid">
              <div className="detail-row">
                <span className="detail-label">Trip/Service</span>
                <span className="detail-value">{booking.tripName || booking.trackName || booking.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Booking Date</span>
                <span className="detail-value">{booking.bookingDate || new Date().toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Customer Name</span>
                <span className="detail-value">{booking.customerName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{booking.email}</span>
              </div>
              {booking.phone && (
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{booking.phone}</span>
                </div>
              )}
              {booking.price && (
                <div className="detail-row">
                  <span className="detail-label">Total Amount</span>
                  <span className="detail-value" style={{ color: '#ff4c00', fontSize: '18px' }}>
                    ₹{booking.price.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="info-box">
              <div className="info-box-title">
                <span>📧</span>
                <span>What's Next?</span>
              </div>
              <p className="info-box-text">
                A confirmation email has been sent to <strong>{booking.email}</strong>. 
                Our team will contact you within 24 hours to finalize the details. 
                Keep your booking ID handy for reference.
              </p>
            </div>

            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Back to Home
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/explore')}>
                Explore More
              </button>
            </div>

            <div className="countdown">
              Redirecting to home in <span className="countdown-number">{countdown}s</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingConfirmation;
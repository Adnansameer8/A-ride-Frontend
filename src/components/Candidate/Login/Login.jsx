import React, { useState, useEffect } from 'react'
import LoginImg from '../assets/LoginBackground.jpg'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  // Pull everything from your existing useAuth hook
  const { handleLogin, loading, error, isAuthenticated, clearAuthError } = useAuth()

  // If somehow already authenticated, useAuth's handleLogin will navigate away,
  // but this is a safety net redirect in case the user lands here already logged in
  useEffect(() => {
    return () => {
      // Clean up any lingering auth errors when the component unmounts
      clearAuthError()
    }
  }, [])

  const handleChange = (e) => {
    // Clear error as user starts re-typing
    if (error) clearAuthError()
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleLogin(formData)
    // handleLogin (in useAuth.js) already calls navigate('/') on success
    // and returns { success: false, error } on failure — error shows via Redux state
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          height: 100vh;
          width: 100%;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          width: 480px;
          min-width: 480px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          background: #0a0a0a;
          position: relative;
          z-index: 2;
        }

        .login-left::after {
          content: '';
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, #ff4c00 30%, #ff4c00 70%, transparent);
        }

        .brand { margin-bottom: 56px; }

        .brand-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px;
          letter-spacing: 6px;
          color: #ff4c00;
          line-height: 1;
        }

        .brand-tagline {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #555;
          margin-top: 6px;
        }

        .login-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 52px;
          letter-spacing: 2px;
          color: #f0f0f0;
          line-height: 1;
          margin-bottom: 8px;
        }

        .login-sub {
          font-size: 13px;
          color: #555;
          margin-bottom: 44px;
          letter-spacing: 0.3px;
        }

        .form-group { margin-bottom: 20px; }

        .form-label {
          display: block;
          font-size: 10px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 10px;
        }

        .input-wrap { position: relative; }

        .form-input {
          width: 100%;
          background: #141414;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 14px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #f0f0f0;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input::placeholder { color: #333; }

        .form-input:focus {
          border-color: #ff4c00;
          background: #161616;
        }

        /* Red border on inputs when there's an error */
        .form-input.input-error {
          border-color: #c0392b;
        }

        .toggle-pw {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #444;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .toggle-pw:hover { color: #ff4c00; }

        .forgot {
          display: block;
          text-align: right;
          font-size: 11px;
          color: #444;
          text-decoration: none;
          margin-top: 8px;
          letter-spacing: 0.3px;
          transition: color 0.2s;
        }
        .forgot:hover { color: #ff4c00; }

        /* ── ERROR BANNER ── */
        .error-banner {
          background: #1a0a0a;
          border: 1px solid #c0392b55;
          border-left: 3px solid #c0392b;
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .error-icon {
          color: #c0392b;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .error-text {
          font-size: 13px;
          color: #e57373;
          line-height: 1.5;
        }

        .btn-login {
          width: 100%;
          margin-top: 32px;
          padding: 15px;
          background: #ff4c00;
          border: none;
          border-radius: 6px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 3px;
          color: #fff;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          position: relative;
          overflow: hidden;
        }

        .btn-login:hover { background: #e03d00; }
        .btn-login:active { transform: scale(0.99); }
        .btn-login:disabled { background: #2a2a2a; color: #444; cursor: not-allowed; }

        .spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid #ffffff44;
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0;
        }

        .divider-line { flex: 1; height: 1px; background: #1e1e1e; }

        .divider-text {
          font-size: 11px;
          color: #333;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .register-link {
          text-align: center;
          font-size: 13px;
          color: #444;
        }

        .register-link a {
          color: #ff4c00;
          text-decoration: none;
          font-weight: 500;
          margin-left: 4px;
        }

        .register-link a:hover { text-decoration: underline; }

        /* ── RIGHT PANEL ── */
        .login-right {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .login-right-img {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: brightness(0.55);
          transition: transform 8s ease;
        }

        .login-right:hover .login-right-img { transform: scale(1.04); }

        .login-right-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #0a0a0a 0%, transparent 30%),
                      linear-gradient(to top, #0a0a0a 0%, transparent 40%);
        }

        .login-right-content {
          position: absolute;
          bottom: 52px;
          left: 52px;
          right: 52px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff12;
          border: 1px solid #ffffff1a;
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #ff4c00;
          margin-bottom: 20px;
        }

        .badge-dot {
          width: 6px; height: 6px;
          background: #ff4c00;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .right-headline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 64px;
          letter-spacing: 2px;
          color: #fff;
          line-height: 1;
          margin-bottom: 16px;
          text-shadow: 0 2px 40px #0008;
        }

        .right-headline span { color: #ff4c00; }

        .right-desc {
          font-size: 14px;
          color: #aaa;
          line-height: 1.7;
          max-width: 400px;
        }

        .stats { display: flex; gap: 32px; margin-top: 32px; }

        .stat-number {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          color: #ff4c00;
          letter-spacing: 1px;
        }

        .stat-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #555;
          margin-top: 2px;
        }

        @media (max-width: 768px) {
          .login-root { flex-direction: column; }
          .login-left { width: 100%; min-width: unset; padding: 40px 28px; }
          .login-left::after { display: none; }
          .login-right { display: none; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT: FORM ── */}
        <div className="login-left">
          <div className="brand">
            <div className="brand-logo">A-RIDE</div>
            <div className="brand-tagline">Ride Free. Ride Far.</div>
          </div>

          <h1 className="login-heading">Welcome Back</h1>
          <p className="login-sub">Sign in to your account to continue your journey</p>

          {/* ── ERROR BANNER — shown when Redux auth error exists ── */}
          {error && (
            <div className="error-banner">
              <span className="error-icon">✕</span>
              <span className="error-text">
                {typeof error === 'string'
                  ? error
                  : error?.message || 'Invalid email or password. Please try again.'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input${error ? ' input-error' : ''}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input${error ? ' input-error' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '64px' }}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <a href="/forgot-password" className="forgot">Forgot password?</a>
            </div>

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          <p className="register-link">
            Don't have an account?
            <a href="/register">Create one</a>
          </p>
        </div>

        {/* ── RIGHT: IMAGE ── */}
        <div className="login-right">
          <div
            className="login-right-img"
            style={{ backgroundImage: `url(${LoginImg})` }}
          />
          <div className="login-right-overlay" />
          <div className="login-right-content">
            <div className="badge">
              <div className="badge-dot" />
              Now Available Across India
            </div>
            <h2 className="right-headline">
              RIDE THE<br /><span>OPEN ROAD</span>
            </h2>
            <p className="right-desc">
              Premium motorcycle rentals for long trips, off-road adventures,
              and on-demand roadside services — wherever your journey takes you.
            </p>
            <div className="stats">
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Routes</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">200+</div>
                <div className="stat-label">Bikes</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

export default Login
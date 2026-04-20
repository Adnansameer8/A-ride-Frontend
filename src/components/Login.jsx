// components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from './Authcontext';
import LoginImg from '../assets/LoginBackground.jpg';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAdmin, isSupport } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  // ── NEW: Track errors per field ──
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(''); // For API errors
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const from = location.state?.from?.pathname || null;

  const redirectByRole = () => {
    if (from) return navigate(from, { replace: true });
    if (isAdmin())   return navigate('/admin/dashboard', { replace: true });
    if (isSupport()) return navigate('/support/dashboard', { replace: true });
    navigate('/', { replace: true });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear the specific field error when the user starts typing
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setGlobalError('');
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email validation (both modes)
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }

    // Password validation (both modes)
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    // Register specific validation
    if (isRegisterMode) {
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!formData.phone.trim()) {
        errors.phone = 'Mobile number is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        errors.phone = 'Enter a valid 10-digit Indian mobile number';
      }

      if (formData.password.length > 0 && formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0; // Returns true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setSuccessMsg('');
    
    // Run validation first
    if (!validateForm()) {
      return; // Stop submission if there are field errors
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        const data = await register(
          formData.name.trim(),
          formData.email,
          formData.phone,
          formData.password
        );
        setSuccessMsg(data.message || 'Account created! Please verify your email.');
        setTimeout(redirectByRole, 1500);
      } else {
        await login(formData.email, formData.password);
        redirectByRole();
      }
    } catch (err) {
      // Server/Auth errors shown at the top
      setGlobalError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode((m) => !m);
    setGlobalError('');
    setSuccessMsg('');
    setFieldErrors({});
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex; height: 100vh; width: 100%;
          background: #0a0a0a; font-family: 'DM Sans', sans-serif; overflow: hidden;
        }

        /* ── LEFT ── */
        .login-left {
          height: 100vh; max-height: 100vh;
          width: 480px; min-width: 480px;
          display: flex; flex-direction: column; justify-content: center;
          padding: 48px 56px; background: #0a0a0a;
          position: relative; z-index: 2; overflow-y: auto;
          -ms-overflow-style: none;  
          scrollbar-width: none;
        }
          .login-left::-webkit-scrollbar {
          display: none;
        }
        .login-left::after {
          content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 1px;
          background: linear-gradient(to bottom, transparent, #ff4c00 30%, #ff4c00 70%, transparent);
        }

        .brand { margin-bottom: 40px; }
        .brand-logo {
           font-family: "Sekuya", system-ui, sans-serif;
          letter-spacing: 6px; color: #ff4c00; line-height: 1;
        }
        .brand-tagline {
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          color: #555; margin-top: 1px;
        }

        .login-heading {
           font-family: "Sekuya", system-ui, sans-serif; font-size: 24px;
          margin-top: 1px; 
          letter-spacing: 2px; color: #f0f0f0; line-height: 1; margin-bottom: 2px;
        }
        .login-sub { font-size: 13px; color: #555; margin-bottom: 28px; }

        .alert {
          padding: 12px 16px; border-radius: 6px;
          font-size: 13px; margin-bottom: 18px;
        }
        .alert-error {
          background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); color: #ef4444;
        }
        .alert-success {
          background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.3); color: #10b981;
        }

        .form-group { margin-bottom: 16px; }
        .form-label {
          display: block; font-size: 10px; letter-spacing: 2.5px;
          text-transform: uppercase; color: #666; margin-bottom: 8px;
        }
        .input-wrap { position: relative; }
        
        .form-input {
          width: 100%; background: #141414; border: 1px solid #222;
          border-radius: 6px; padding: 13px 16px; font-size: 14px;
          font-family: 'DM Sans', sans-serif; color: #f0f0f0;
          outline: none; transition: border-color .2s;
        }
        .form-input::placeholder { color: #333; }
        .form-input:focus { border-color: #ff4c00; background: #161616; }
        
        /* ── NEW: Error styling ── */
        .form-input.input-error { border-color: #ef4444; }
        .field-error-msg {
          color: #ef4444; font-size: 12px; margin-top: 6px; display: block;
        }

        .toggle-pw {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #444;
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          transition: color .2s; font-family: 'DM Sans', sans-serif;
        }
        .toggle-pw:hover { color: #ff4c00; }

        .forgot {
          display: block; text-align: right; font-size: 11px; color: #444;
          text-decoration: none; margin-top: 6px; transition: color .2s;
        }
        .forgot:hover { color: #ff4c00; }

        .btn-login {
          width: 100%; margin-top: 10px; padding: 15px;
          background: #ff4c00; border: none; border-radius: 6px;
           font-family: "Sekuya", system-ui, sans-serif; font-size: 15px;
          letter-spacing: 2px; color: #fff; cursor: pointer;
          transition: background .2s, transform .1s;
        }
        .btn-login:hover { background: #e03d00; }
        .btn-login:active { transform: scale(.99); }
        .btn-login:disabled { background: #2a2a2a; color: #444; cursor: not-allowed; }

        .spinner {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid #ffffff44; border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex; align-items: center; gap: 12px; margin: 24px 0;
        }
        .divider-line { flex: 1; height: 1px; background: #1e1e1e; }
        .divider-text { font-size: 11px; color: #333; letter-spacing: 1px; text-transform: uppercase; }

        .switch-link { text-align: center; font-size: 13px; color: #444; }
        .switch-link a {
          color: #ff4c00; text-decoration: none; font-weight: 500;
          margin-left: 4px; cursor: pointer;
        }
        .switch-link a:hover { text-decoration: underline; }

        /* ── RIGHT ── */
        .login-right { flex: 1; position: relative; overflow: hidden; }
        .login-right-img {
          position: absolute; inset: 0; background-size: cover;
          background-position: center; filter: brightness(.55); transition: transform 8s ease;
        }
        .login-right:hover .login-right-img { transform: scale(1.04); }
        .login-right-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right, #0a0a0a 0%, transparent 30%),
                      linear-gradient(to top, #0a0a0a 0%, transparent 40%);
        }
        .login-right-content {
          position: absolute; bottom: 52px; left: 52px; right: 52px;
        }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #ffffff12; border: 1px solid #ffffff1a;
          backdrop-filter: blur(8px); padding: 6px 14px; border-radius: 20px;
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: #ff4c00; margin-bottom: 20px;
        }
        .badge-dot {
          width: 6px; height: 6px; background: #ff4c00; border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .right-headline {
          font-family: 'Bebas Neue', sans-serif; font-size: 64px;
          letter-spacing: 2px; color: #fff; line-height: 1;
          margin-bottom: 16px; text-shadow: 0 2px 40px #0008;
        }
        .right-headline span { color: #ff4c00; }
        .right-desc { font-size: 14px; color: #aaa; line-height: 1.7; max-width: 400px; }
        .stats { display: flex; gap: 32px; margin-top: 32px; }
        .stat-number {
          font-family: 'Bebas Neue', sans-serif; font-size: 28px;
          color: #ff4c00; letter-spacing: 1px;
        }
        .stat-label {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: #555; margin-top: 2px;
        }

        @media (max-width: 768px) {
          .login-root { flex-direction: column; }
          .login-left { width: 100%; min-width: unset; padding: 40px 24px; max-height: 100vh; }
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

          <h1 className="login-heading">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="login-sub">
            {isRegisterMode
              ? 'Sign up to start your riding journey'
              : 'Sign in to your account to continue'}
          </p>

          {/* Global API Errors show here */}
          {globalError && <div className="alert alert-error">{globalError}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSubmit} noValidate>

            {/* Name — register only */}
            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name" name="name" type="text"
                  className={`form-input ${fieldErrors.name ? 'input-error' : ''}`} 
                  placeholder="Your full name"
                  value={formData.name} onChange={handleChange}
                />
                {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email" name="email" type="email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`} 
                placeholder="you@example.com"
                value={formData.email} onChange={handleChange}
              />
              {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
            </div>

            {/* Phone — register only */}
            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Mobile Number</label>
                <input
                  id="phone" name="phone" type="tel"
                  className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`} 
                  placeholder="10-digit mobile number"
                  value={formData.phone} onChange={handleChange}
                  maxLength={10}
                />
                {fieldErrors.phone && <span className="field-error-msg">{fieldErrors.phone}</span>}
              </div>
            )}

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${fieldErrors.password ? 'input-error' : ''}`} 
                  placeholder="••••••••"
                  value={formData.password} onChange={handleChange}
                  style={{ paddingRight: '64px' }}
                />
                <button type="button" className="toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
              
              {!isRegisterMode && (
                <a href="/forgot-password" className="forgot">Forgot password?</a>
              )}
            </div>

            {/* Confirm password — register only */}
            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrap">
                  <input
                    id="confirmPassword" name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`} 
                    placeholder="••••••••"
                    value={formData.confirmPassword} onChange={handleChange}
                    style={{ paddingRight: '64px' }}
                  />
                  <button type="button" className="toggle-pw"
                    onClick={() => setShowConfirmPassword((v) => !v)}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span className="field-error-msg">{fieldErrors.confirmPassword}</span>}
              </div>
            )}

            <button className="btn-login" type="submit" disabled={isLoading}>
              {isLoading
                ? <span className="spinner" />
                : isRegisterMode ? 'Create Account' : 'Sign In'
              }
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          <p className="switch-link">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
            <a onClick={toggleMode}>
              {isRegisterMode ? 'Sign In' : 'Create one'}
            </a>
          </p>
        </div>

        {/* ── RIGHT: IMAGE ── */}
        <div className="login-right">
          <div className="login-right-img"
            style={{ backgroundImage: `url(${LoginImg})` }} />
          <div className="login-right-overlay" />
          <div className="login-right-content">
            <div className="badge">
              <div className="badge-dot" />
              Now Available Across Bengaluru
            </div>
            <h2 className="right-headline">
              RIDE <br /><span>Beyond Limits</span>
            </h2>
            <p className="right-desc">
             Experience a smarter way to ride — from curated long-distance journeys to thrilling off-road adventures, with instant roadside assistance whenever you need it.
            </p>
            <div className="stats">
              <div>
                <div className="stat-number">50+</div>
                <div className="stat-label">Routes</div>
              </div>
              <div>
                <div className="stat-number">200+</div>
                <div className="stat-label">Bikes</div>
              </div>
              <div>
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Login;
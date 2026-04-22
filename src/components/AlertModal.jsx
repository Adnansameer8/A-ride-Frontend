import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, Trash2, Info, X, Sparkles } from 'lucide-react';

const AlertModal = ({
  isOpen,
  type = 'primary',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = true
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [particles, setParticles] = useState([]);
  const particleTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setVisible(true);
      spawnParticles();
    }
  }, [isOpen]);

  const spawnParticles = () => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i / 12) * 360,
      distance: 60 + Math.random() * 40,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.4,
      duration: 0.8 + Math.random() * 0.5,
    }));
    setParticles(newParticles);
    particleTimerRef.current = setTimeout(() => setParticles([]), 1500);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      onCancel?.();
    }, 320);
  };

  const handleConfirm = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      onConfirm?.();
    }, 320);
  };

  useEffect(() => {
    return () => clearTimeout(particleTimerRef.current);
  }, []);

  if (!isOpen && !visible) return null;

  const themes = {
    primary: {
      icon: <Info size={28} />,
      gradient: 'linear-gradient(135deg, #ff5e00, #ff9a00)',
      glow: '#ff5e00',
      glowRgb: '255, 94, 0',
      ringColor: '#ff5e00',
      particleColors: ['#ff5e00', '#ff9a00', '#ffb347', '#ff6a00'],
      shimmer: 'linear-gradient(90deg, transparent, rgba(255,94,0,0.15), transparent)',
      label: 'Info',
    },
    success: {
      icon: <CheckCircle size={28} />,
      gradient: 'linear-gradient(135deg, #059669, #34d399)',
      glow: '#10b981',
      glowRgb: '16, 185, 129',
      ringColor: '#10b981',
      particleColors: ['#10b981', '#34d399', '#6ee7b7', '#059669'],
      shimmer: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.15), transparent)',
      label: 'Success',
    },
    danger: {
      icon: <Trash2 size={28} />,
      gradient: 'linear-gradient(135deg, #dc2626, #f87171)',
      glow: '#ef4444',
      glowRgb: '239, 68, 68',
      ringColor: '#ef4444',
      particleColors: ['#ef4444', '#f87171', '#fca5a5', '#dc2626'],
      shimmer: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.15), transparent)',
      label: 'Danger',
    },
    warning: {
      icon: <AlertTriangle size={28} />,
      gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
      glow: '#f59e0b',
      glowRgb: '245, 158, 11',
      ringColor: '#f59e0b',
      particleColors: ['#f59e0b', '#fbbf24', '#fde68a', '#d97706'],
      shimmer: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)',
      label: 'Warning',
    },
  };

  const t = themes[type] || themes.primary;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        background: closing ? 'rgba(5,10,24,0)' : 'rgba(5,10,24,0.6)',
        backdropFilter: closing ? 'blur(0px)' : 'blur(12px)',
        transition: 'background 0.32s ease, backdrop-filter 0.32s ease',
      }}
      onClick={handleClose}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes modalIn {
          0% { opacity: 0; transform: scale(0.82) translateY(28px) rotateX(8deg); }
          60% { opacity: 1; transform: scale(1.03) translateY(-4px) rotateX(0deg); }
          100% { opacity: 1; transform: scale(1) translateY(0) rotateX(0deg); }
        }
        @keyframes modalOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.88) translateY(16px); }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-5px) rotate(-3deg); }
          66% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.18); opacity: 0.2; }
          100% { transform: scale(1.36); opacity: 0; }
        }
        @keyframes ringPulse2 {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.28); opacity: 0.1; }
          100% { transform: scale(1.56); opacity: 0; }
        }
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes particleBurst {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes topBarShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes badgePop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          70% { transform: scale(1.15) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes textReveal {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes btnReady {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .am-confirm-btn:hover {
          transform: translateY(-3px) scale(1.02) !important;
          box-shadow: 0 12px 32px rgba(${t.glowRgb}, 0.5) !important;
          filter: brightness(1.08) !important;
        }
        .am-confirm-btn:active {
          transform: translateY(0) scale(0.97) !important;
        }
        .am-cancel-btn:hover {
          background: rgba(148,163,184,0.18) !important;
          border-color: rgba(148,163,184,0.5) !important;
          color: #f1f5f9 !important;
          transform: translateY(-2px) !important;
        }
        .am-cancel-btn:active {
          transform: scale(0.97) !important;
        }
        .am-close-btn:hover {
          background: rgba(239,68,68,0.18) !important;
          color: #ef4444 !important;
          transform: rotate(90deg) scale(1.1) !important;
        }
      `}</style>

      {/* Particle burst */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 100000 }}>
        {particles.map(p => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;
          const color = t.particleColors[Math.floor(Math.random() * t.particleColors.length)];
          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: color,
                top: -p.size / 2,
                left: -p.size / 2,
                '--tx': `${tx}px`,
                '--ty': `${ty}px`,
                animation: `particleBurst ${p.duration}s ease-out ${p.delay}s both`,
                boxShadow: `0 0 6px ${color}`,
              }}
            />
          );
        })}
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '28px',
          padding: '0',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: `0 40px 80px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px -20px rgba(${t.glowRgb}, 0.25)`,
          animation: closing
            ? 'modalOut 0.32s cubic-bezier(0.4, 0, 0.6, 1) forwards'
            : 'modalIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative',
          overflow: 'hidden',
          perspective: '800px',
        }}
      >
        {/* Animated top gradient bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, transparent, ${t.glow}, ${t.ringColor}, transparent)`,
          backgroundSize: '200% auto',
          animation: 'topBarShimmer 2.5s linear infinite',
        }} />

        {/* Subtle mesh background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, rgba(${t.glowRgb}, 0.08) 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        {/* Grid lines texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        {/* Close button */}
        {showCancel && (
          <button
            className="am-close-btn"
            onClick={handleClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(148,163,184,0.8)', cursor: 'pointer',
              padding: '7px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              zIndex: 2,
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}

        <div style={{ padding: '44px 32px 32px' }}>
          {/* Icon with pulsing rings */}
          <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '28px' }}>
            {/* Outer ring 2 */}
            <div style={{
              position: 'absolute', inset: '-24px',
              borderRadius: '50%',
              border: `1.5px solid rgba(${t.glowRgb}, 0.25)`,
              animation: 'ringPulse2 2.4s ease-out 0.3s infinite',
            }} />
            {/* Outer ring 1 */}
            <div style={{
              position: 'absolute', inset: '-14px',
              borderRadius: '50%',
              border: `1.5px solid rgba(${t.glowRgb}, 0.4)`,
              animation: 'ringPulse 2.4s ease-out infinite',
            }} />
            {/* Icon container */}
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%',
              background: t.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff',
              boxShadow: `0 8px 32px rgba(${t.glowRgb}, 0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
              animation: 'iconFloat 3.2s ease-in-out infinite',
              position: 'relative',
            }}>
              {/* Shimmer overlay on icon */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, width: '60%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmerSlide 2.5s ease-in-out infinite',
                }} />
              </div>
              {t.icon}
            </div>
          </div>

          {/* Badge label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: `rgba(${t.glowRgb}, 0.15)`,
            border: `1px solid rgba(${t.glowRgb}, 0.3)`,
            color: t.glow, fontSize: '11px', fontWeight: '700',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '100px',
            marginBottom: '16px',
            fontFamily: "'Syne', sans-serif",
            animation: 'badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
          }}>
            <Sparkles size={10} />
            {t.label}
          </div>

          {/* Title */}
          <h3 style={{
            margin: '0 0 12px',
            fontSize: '26px',
            fontWeight: '800',
            color: '#f8fafc',
            fontFamily: "'Syne', sans-serif",
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            animation: 'textReveal 0.45s ease 0.25s both',
          }}>
            {title}
          </h3>

          {/* Message */}
          <p style={{
            margin: '0 0 36px',
            fontSize: '14.5px',
            color: 'rgba(148,163,184,0.9)',
            lineHeight: '1.7',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: '400',
            animation: 'textReveal 0.45s ease 0.35s both',
          }}>
            {message}
          </p>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            marginBottom: '24px',
          }} />

          {/* Buttons */}
          <div style={{
            display: 'flex', gap: '12px',
            animation: 'btnReady 0.45s ease 0.45s both',
          }}>
            {showCancel && (
              <button
                className="am-cancel-btn"
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(148,163,184,0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                  transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                  letterSpacing: '0.01em',
                }}
              >
                {cancelText}
              </button>
            )}
            <button
              className="am-confirm-btn"
              onClick={handleConfirm}
              style={{
                flex: showCancel ? 1.6 : 1,
                padding: '14px 0',
                borderRadius: '14px',
                background: t.gradient,
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: "'Syne', sans-serif",
                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: `0 6px 20px rgba(${t.glowRgb}, 0.35)`,
                letterSpacing: '0.01em',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer on button */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '50%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmerSlide 2.2s ease-in-out 1s infinite',
                pointerEvents: 'none',
              }} />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
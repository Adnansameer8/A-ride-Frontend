import React, { useState } from 'react';
import Bikesvg from '../../../assets/Bikesvg.svg';

const About = () => {
  const [hovered, setHovered] = useState(null);

  const stats = [
    { number: '10K+', label: 'Active Riders' },
    { number: '500+', label: 'Routes Mapped' },
    { number: '50+', label: 'Cities Covered' },
    { number: '4.9★', label: 'Community Rating' },
  ];

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: "'Outfit', sans-serif",
      padding: '60px 20px',
      boxSizing: 'border-box',
    }} id="about-us">

      <style>{`
        @keyframes float {
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(-25px); }
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
        .bike-float { animation: float 4s ease-in-out infinite; }
        .fade-up { animation: fadeSlideUp 0.7s ease forwards; }

        @media (max-width: 768px) {
          .about-hero { flex-direction: column !important; text-align: center !important; }
          .about-hero-img { order: -1; }
          .stat-row { grid-template-columns: repeat(2, 1fr) !important; }
          .about-wrap { padding: 32px 20px !important; }
          .top-banner { padding: 40px 24px !important; }
        }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Main Card ── */}
        <div style={{
          borderRadius: '32px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          border: '1px solid #ffffff',
        }}>

          {/* ── Banner ── */}
          <div className="top-banner" style={{
            background: 'linear-gradient(135deg, #111111 60%, #1f1f1f 100%)',
            padding: '56px 60px',
            width:'1200px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Orange glow blob */}
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px',
              width: '320px', height: '320px',
              background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-80px', left: '30%',
              width: '260px', height: '260px',
              background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <span style={{
              display: 'inline-block',
              background: 'rgba(249,115,22,0.15)',
              border: '1px solid rgba(249,115,22,0.4)',
              color: '#fb923c',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              padding: '6px 18px',
              borderRadius: '20px',
              marginBottom: '18px',
            }}>
              Our Story
            </span>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: '900',
              color: '#ffffff',
              margin: '0 0 14px 0',
              lineHeight: 1.1,
              position: 'relative',
              zIndex: 1,
            }}>
              About{' '}
              <span style={{
                color: '#f97316',
                textShadow: '0 0 40px rgba(249,115,22,0.4)',
              }}>
                A-RIDE
              </span>
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
              maxWidth: '460px',
              lineHeight: 1.7,
              position: 'relative',
              zIndex: 1,
            }}>
              Born from a passion for the open road and the freedom of two wheels.
            </p>
          </div>

          {/* ── Story + Bike ── */}
          <div className="about-wrap about-hero" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '48px',
            padding: '56px 60px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
          }}>
            {/* Text */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
              }}>
                <div style={{
                  width: '32px', height: '3px',
                  background: '#f97316', borderRadius: '2px',
                }} />
                <span style={{
                  fontSize: '18px', fontWeight: '900',
                  letterSpacing: '3px', color: '#f97316',
                  textTransform: 'uppercase',
                }}>
                  Who We Are
                </span>
              </div>

              <h2 style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: '800',
                color: '#111111',
                marginBottom: '22px',
                lineHeight: 1.3,
              }}>
                Your Trusted Riding <br />Companion
              </h2>

              <p style={{
                fontSize: '1rem',
                lineHeight: 1.85,
                color: '#4b5563',
                marginBottom: '18px',
              }}>
                Welcome to{' '}
                <span style={{
                  color: '#f97316',
                  fontWeight: '700',
                }}>
                  A-RIDE
                </span>
                , your trusted companion for exploring the thrill of motorcycling.
                Our mission is to unite riders from all walks of life and create
                unforgettable experiences — whether it's through long road trips,
                exciting off-road adventures, or simply sharing the love of two wheels.
              </p>

              <p style={{
                fontSize: '1rem',
                lineHeight: 1.85,
                color: '#4b5563',
                marginBottom: '28px',
              }}>
                At A-RIDE, we believe that riding is not just about reaching a destination,
                but about embracing the journey, the freedom, and the community along the way.
                That's why we focus on{' '}
                <span style={{ color: '#111', fontWeight: '700' }}>safety</span>,{' '}
                <span style={{ color: '#111', fontWeight: '700' }}>passion</span>, and{' '}
                <span style={{ color: '#111', fontWeight: '700' }}>connection</span> —
                offering riders a platform to connect, share tips, and discover new routes together.
              </p>

              {/* <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '12px 20px',
              }}>
                <span style={{ fontSize: '20px' }}>🏍️</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#c2410c',
                }}>
                  Join 10,000+ riders on the road
                </span>
              </div> */}
            </div>

            {/* Bike Image */}
            <div className="about-hero-img" style={{
              flex: 1, minWidth: '440px',
              display: 'flex', justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div style={{ position: 'relative' }}>
                {/* Glow behind bike */}
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-18%, -50%)',
                  width: '440px', height: '480px',
                        borderRadius: '50%',
                  pointerEvents: 'none',
                }} />
                <img
                  src={Bikesvg}
                  alt="Bike Illustration"
                  className="bike-float"
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="stat-row" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: '#111111',
          }}>
            {stats.map((stat, i) => (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  background: hovered === i
                    ? 'rgba(249,115,22,0.1)'
                    : 'transparent',
                  transition: 'background 0.25s ease',
                  cursor: 'default',
                }}
              >
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: '900',
                  color: hovered === i ? '#f97316' : '#ffffff',
                  lineHeight: 1,
                  marginBottom: '8px',
                  transition: 'color 0.25s ease',
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
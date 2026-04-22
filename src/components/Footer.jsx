import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '/logo.png';

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="f-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .f-root {
          --brand:      #FF5C00;
          --brand-dim:  rgba(255,92,0,0.12);
          --brand-glow: rgba(255,92,0,0.25);
          --ink:        #0f0f0f;
          --ink-mid:    #3d3d3d;
          --ink-muted:  #888;
          --line:       rgba(0,0,0,0.08);
          --white:      #ffffff;
          --off-white:  #fafafa;

          position: relative;
          background: var(--off-white);
          font-family: 'Outfit', system-ui, sans-serif;
          overflow: hidden;
          isolation: isolate;
        }

        .f-root::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg,
            transparent 0%, var(--brand) 20%,
            #FF9500 50%, var(--brand) 80%, transparent 100%
          );
          z-index: 2;
        }

        .f-blob {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none; z-index: 0;
        }
        .f-blob-1 {
          width: 500px; height: 500px;
          background: rgba(255,92,0,0.06);
          top: -100px; right: -100px;
          animation: blobDrift 18s ease-in-out infinite alternate;
        }
        .f-blob-2 {
          width: 350px; height: 350px;
          background: rgba(255,149,0,0.05);
          bottom: 0; left: -80px;
          animation: blobDrift 24s ease-in-out infinite alternate-reverse;
        }
        @keyframes blobDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(30px,20px) scale(1.08); }
        }

        /* ═══ DESKTOP FOOTER ═══ */
        .f-body {
          position: relative; z-index: 1;
          padding: 72px 64px 56px;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 48px;
          max-width: 1280px; margin: 0 auto;
        }
        .f-logo-wrap {
          display: flex; align-items: center;
          margin-bottom: 20px; cursor: pointer; width: fit-content;
        }
        .f-logo-wrap img { height: 42px; width: auto; object-fit: contain; transition: all 0.3s ease; }
        .f-logo-wrap:hover img { filter: brightness(1.15) drop-shadow(0 0 8px rgba(255,92,0,0.5)); transform: scale(1.03); }
        .f-tagline { font-size: 14px; color: var(--ink-muted); line-height: 1.75; margin-bottom: 28px; max-width: 240px; }
        .f-stats { display: flex; gap: 24px; margin-bottom: 32px; }
        .f-stat { display: flex; flex-direction: column; gap: 2px; }
        .f-stat-num { font-size: 20px; font-weight: 800; color: var(--ink); line-height: 1; }
        .f-stat-label { font-size: 11px; font-weight: 600; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .f-stat-divider { width: 1px; background: var(--line); align-self: stretch; }
        .f-socials { display: flex; gap: 10px; }
        .f-social {
          width: 38px; height: 38px; border-radius: 10px;
          background: var(--white); border: 1.5px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.25s ease;
        }
        .f-social svg { width: 16px; height: 16px; fill: var(--ink-muted); transition: fill 0.25s ease; }
        .f-social:hover { background: var(--brand); border-color: var(--brand); transform: translateY(-3px); box-shadow: 0 8px 16px var(--brand-glow); }
        .f-social:hover svg { fill: white; }
        .f-col-title {
          font-size: 11px; font-weight: 800; color: var(--ink);
          letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 20px; position: relative; padding-bottom: 12px;
        }
        .f-col-title::after { content: ''; position: absolute; bottom: 0; left: 0; width: 24px; height: 2px; background: var(--brand); border-radius: 2px; }
        .f-col-links { display: flex; flex-direction: column; gap: 12px; }
        .f-link {
          background: none; border: none; padding: 0;
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500; color: var(--ink-muted);
          cursor: pointer; text-align: left; transition: all 0.2s ease;
          display: flex; align-items: center; gap: 6px; width: fit-content;
        }
        .f-link::before { content: ''; width: 0; height: 1.5px; background: var(--brand); transition: width 0.25s ease; display: inline-block; flex-shrink: 0; }
        .f-link:hover { color: var(--brand); transform: translateX(6px); }
        .f-link:hover::before { width: 10px; }
        .f-contact-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--brand-dim); color: var(--brand);
          font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 20px;
          margin-bottom: 16px; letter-spacing: 0.3px;
        }
        .f-contact-badge span { width: 6px; height: 6px; border-radius: 50%; background: var(--brand); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .f-contact-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .f-contact-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--white); border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .f-contact-icon svg { width: 14px; height: 14px; stroke: var(--brand); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .f-contact-text { font-size: 13px; color: var(--ink-mid); font-weight: 500; line-height: 1.4; }
        .f-bottom {
          position: relative; z-index: 1; border-top: 1px solid var(--line);
          padding: 24px 64px; display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; max-width: 1280px; margin: 0 auto;
        }
        .f-bottom-left { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .f-copyright { font-size: 13px; color: var(--ink-muted); font-weight: 500; }
        .f-made { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-muted); font-weight: 500; }
        .f-made svg { width: 12px; height: 12px; fill: var(--brand); animation: heartbeat 1.8s ease-in-out infinite; }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.25); } 28% { transform: scale(1); } 42% { transform: scale(1.15); } 56% { transform: scale(1); } }
        .f-bottom-links { display: flex; align-items: center; gap: 4px; }
        .f-bottom-btn { background: none; border: none; padding: 6px 12px; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; color: var(--ink-muted); cursor: pointer; transition: color 0.2s ease; }
        .f-bottom-btn:hover { color: var(--brand); }
        .f-bottom-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--line); }

        /* tablet */
        @media (max-width: 1100px) {
          .f-body { grid-template-columns: 1fr 1fr; padding: 56px 48px 48px; }
          .f-brand { grid-column: 1 / -1; }
        }

        /* ── switch between desktop/mobile ── */
        .f-desktop { display: block; }
        .f-mobile  { display: none; }

        @media (max-width: 600px) {
          .f-desktop { display: none; }
          .f-mobile  { display: block; }
        }

        /* ═══ MOBILE FOOTER ═══ */
        .fm {
          position: relative; z-index: 1;
          padding: 24px 20px 20px;
        }

        /* logo */
        .fm-logo { display: flex; align-items: center; margin-bottom: 8px; cursor: pointer; width: fit-content; }
        .fm-logo img { height: 32px; width: auto; object-fit: contain; }

        .fm-tagline { font-size: 12px; color: var(--ink-muted); line-height: 1.6; margin-bottom: 16px; }

        /* stats */
        .fm-stats {
          display: flex; margin-bottom: 18px;
          background: var(--white); border-radius: 12px;
          border: 1px solid var(--line); overflow: hidden;
        }
        .fm-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 10px 4px; gap: 2px; }
        .fm-stat + .fm-stat { border-left: 1px solid var(--line); }
        .fm-stat-num { font-size: 15px; font-weight: 800; color: var(--ink); }
        .fm-stat-label { font-size: 9px; font-weight: 600; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.4px; }

        /* links grid */
        .fm-links {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px 20px; margin-bottom: 18px;
        }
        .fm-link {
          background: none; border: none; padding: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 13px; font-weight: 500; color: var(--ink-mid);
          cursor: pointer; text-align: left;
        }

        /* socials */
        .fm-socials { display: flex; gap: 8px; margin-bottom: 18px; }
        .fm-social {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--white); border: 1.5px solid var(--line);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .fm-social svg { width: 15px; height: 15px; fill: var(--ink-muted); }

        /* bottom */
        .fm-bottom { border-top: 1px solid var(--line); padding-top: 14px; text-align: center; }
        .fm-legal { display: flex; flex-wrap: wrap; justify-content: center; gap: 0; margin-bottom: 6px; }
        .fm-legal-btn { background: none; border: none; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600; color: var(--ink-muted); cursor: pointer; padding: 2px 8px; }
        .fm-copy { font-size: 11px; color: #bbb; font-weight: 500; font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="f-blob f-blob-1" />
      <div className="f-blob f-blob-2" />

      {/* ── DESKTOP ── */}
      <div className="f-desktop">
        <div className="f-body">
          <div className="f-brand">
            <div className="f-logo-wrap" onClick={() => navigate('/home')}>
              <img src={logo} alt="A-Ride" />
            </div>
            <p className="f-tagline">There is no road too long.<br />Every mile tells a story — make yours unforgettable.</p>
            <div className="f-stats">
              <div className="f-stat"><span className="f-stat-num">500+</span><span className="f-stat-label">Routes</span></div>
              <div className="f-stat-divider" />
              <div className="f-stat"><span className="f-stat-num">12K+</span><span className="f-stat-label">Riders</span></div>
              <div className="f-stat-divider" />
              <div className="f-stat"><span className="f-stat-num">4.9★</span><span className="f-stat-label">Rating</span></div>
            </div>
            <div className="f-socials">
              <div className="f-social" onClick={() => window.open('https://twitter.com','_blank')}><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
              <div className="f-social" onClick={() => window.open('https://instagram.com','_blank')}><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
              <div className="f-social" onClick={() => window.open('https://linkedin.com','_blank')}><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></div>
              <div className="f-social" onClick={() => window.open('https://youtube.com','_blank')}><svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></div>
            </div>
          </div>

          <div className="f-col">
            <div className="f-col-title">Company</div>
            <div className="f-col-links">
              <button className="f-link" onClick={() => navigate('/home')}>About Us</button>
              <button className="f-link" onClick={() => navigate('/explore')}>Explore Rides</button>
              <button className="f-link" onClick={() => navigate('/services')}>Services</button>
              <button className="f-link">Careers</button>
              <button className="f-link">Blog</button>
            </div>
          </div>

          <div className="f-col">
            <div className="f-col-title">Support</div>
            <div className="f-col-links">
              <button className="f-link">Help Center</button>
              <button className="f-link">FAQ</button>
              <button className="f-link" onClick={() => navigate('/support')}>Contact Us</button>
              <button className="f-link">Safety Guidelines</button>
              <button className="f-link">Trip Insurance</button>
            </div>
          </div>

          <div className="f-col">
            <div className="f-col-title">Contact</div>
            <div className="f-contact-badge"><span />Available 24/7</div>
            <div className="f-contact-item">
              <div className="f-contact-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
              <span className="f-contact-text">support@aride.in</span>
            </div>
            <div className="f-contact-item">
              <div className="f-contact-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
              <span className="f-contact-text">+91 98765 43210</span>
            </div>
            <div className="f-contact-item">
              <div className="f-contact-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
              <span className="f-contact-text">Bengaluru, India</span>
            </div>
          </div>
        </div>

        <div className="f-bottom">
          <div className="f-bottom-left">
            <span className="f-copyright">© {year} A-RIDE. All rights reserved.</span>
            <div className="f-made">
              Made with
              <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              for riders
            </div>
          </div>
          <div className="f-bottom-links">
            <button className="f-bottom-btn">Privacy Policy</button>
            <div className="f-bottom-dot" />
            <button className="f-bottom-btn"  onClick={() => navigate("/terms")}>Terms & Conditions</button>
            <div className="f-bottom-dot" />
            <button className="f-bottom-btn">Cookie Policy</button>
            <div className="f-bottom-dot" />
            <button className="f-bottom-btn">Sitemap</button>
          </div>
        </div>
      </div>

      {/* ── MOBILE (simple & short) ── */}
      <div className="f-mobile">
        <div className="fm">

          <div className="fm-logo" onClick={() => navigate('/home')}>
            <img src={logo} alt="A-Ride" />
          </div>
          <p className="fm-tagline">Every mile tells a story — make yours unforgettable.</p>

          <div className="fm-stats">
            <div className="fm-stat"><span className="fm-stat-num">500+</span><span className="fm-stat-label">Routes</span></div>
            <div className="fm-stat"><span className="fm-stat-num">12K+</span><span className="fm-stat-label">Riders</span></div>
            <div className="fm-stat"><span className="fm-stat-num">4.9★</span><span className="fm-stat-label">Rating</span></div>
          </div>

          <div className="fm-links">
            <button className="fm-link" onClick={() => navigate('/home')}>About Us</button>
            <button className="fm-link">Help Center</button>
            <button className="fm-link" onClick={() => navigate('/explore')}>Explore Rides</button>
            <button className="fm-link">FAQ</button>
            <button className="fm-link" onClick={() => navigate('/services')}>Services</button>
            <button className="fm-link" onClick={() => navigate('/support')}>Contact Us</button>
            <button className="fm-link">Careers</button>
            <button className="fm-link">Blog</button>
          </div>

          <div className="fm-socials">
            <div className="fm-social" onClick={() => window.open('https://twitter.com','_blank')}><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
            <div className="fm-social" onClick={() => window.open('https://instagram.com','_blank')}><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
            <div className="fm-social" onClick={() => window.open('https://linkedin.com','_blank')}><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></div>
            <div className="fm-social" onClick={() => window.open('https://youtube.com','_blank')}><svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></div>
          </div>

          <div className="fm-bottom">
            <div className="fm-legal">
              <button className="fm-legal-btn">Privacy</button>
              <button className="fm-legal-btn" onClick={() => navigate("/terms")}>Terms</button>
              <button className="fm-legal-btn">Cookies</button>
              <button className="fm-legal-btn">Sitemap</button>
            </div>
            <span className="fm-copy">© {year} A-RIDE. All rights reserved.</span>
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;
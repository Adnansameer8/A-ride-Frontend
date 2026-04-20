import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer-root">
      <style>{`
        .footer-root {
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          padding: 120px 48px 40px;
          font-family: "Sekuya", system-ui, sans-serif;
          overflow: hidden;
          border-top: 2px solid #f3f4f6;
        }

        /* ── Giant Faint Watermark Background ── */
        .footer-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(120px, 22vw, 320px); /* Responsive sizing with limits */
          font-weight: 900;
          color: rgba(255, 94, 0, 0.03);
          user-select: none;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
          line-height: 1;
          letter-spacing: -0.02em;
          animation: watermarkFloat 20s ease-in-out infinite;
        }

        @keyframes watermarkFloat {
          0%, 100% { transform: translate(-50%, -50%) rotate(-2deg); }
          50% { transform: translate(-50%, -52%) rotate(2deg); }
        }

        .footer-container {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 80px;
          flex-wrap: wrap;
        }

        /* ── Left Side: Brand ── */
        .footer-brand {
          flex: 1 1 300px;
          min-width: 250px;
        }

        .footer-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(32px, 5vw, 44px);
          font-weight: 800;
          background: linear-gradient(135deg, #111827 0%, #ff5e00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 3px;
          margin-bottom: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
        }
        
        .footer-logo:hover {
          transform: translateY(-2px);
          letter-spacing: 5px;
        }

        .footer-tagline {
          font-size: clamp(14px, 2vw, 16px);
          color: #6b7280;
          line-height: 1.7;
          font-weight: 600;
          max-width: 280px;
          margin-bottom: 24px;
        }

        .footer-social-icons {
          display: flex;
          gap: 16px;
          margin-top: 24px;
        }

        .social-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .social-icon:hover {
          background: #ff5e00;
          border-color: #ff5e00;
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(255, 94, 0, 0.2);
        }

        .social-icon svg {
          width: 20px;
          height: 20px;
          fill: #6b7280;
          transition: fill 0.3s ease;
        }

        .social-icon:hover svg {
          fill: white;
        }

        /* ── Right Side: Links ── */
        .footer-links-wrapper {
          flex: 2 1 500px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 60px;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-column-title {
          font-size: 13px;
          font-weight: 800;
          color: #111827;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .footer-link {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          padding: 0;
          transition: all 0.2s ease;
          font-family: "Sekuya", system-ui, sans-serif;
          width: fit-content;
          position: relative;
        }

        .footer-link::before {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #ff5e00;
          transition: width 0.3s ease;
        }

        .footer-link:hover {
          color: #ff5e00;
          transform: translateX(4px);
        }

        .footer-link:hover::before {
          width: 100%;
        }

        /* ── Bottom Bar ── */
        .footer-bottom {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 60px auto 0;
          padding-top: 32px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer-copyright {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-link {
          font-size: 13px;
          color: #9ca3af;
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
          background: none;
          border: none;
          padding: 0;
          font-family: "Sekuya", system-ui, sans-serif;
        }

        .footer-bottom-link:hover {
          color: #ff5e00;
        }

        /* ══════════════════════════════════════
           RESPONSIVE DESIGN
        ══════════════════════════════════════ */

        /* Tablet Layout (1024px and below) */
        @media (max-width: 1024px) {
          .footer-root {
            padding: 100px 40px 40px;
          }

          .footer-container {
            gap: 60px;
          }

          .footer-links-wrapper {
            gap: 40px;
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-watermark {
            font-size: clamp(100px, 28vw, 280px);
          }

          .footer-bottom {
            margin-top: 50px;
            padding-top: 28px;
          }
        }

        /* Large Mobile Layout (768px and below) */
        @media (max-width: 768px) {
          .footer-root {
            padding: 80px 32px 32px;
          }

          .footer-container {
            gap: 50px;
            flex-direction: column;
          }

          .footer-brand {
            text-align: center;
            max-width: 100%;
          }

          .footer-tagline {
            max-width: 100%;
            margin-left: auto;
            margin-right: auto;
          }

          .footer-social-icons {
            justify-content: center;
          }

          .footer-links-wrapper {
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
          }

          .footer-column {
            text-align: left;
          }

          .footer-watermark {
            font-size: clamp(80px, 35vw, 240px);
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
          }

          .footer-bottom-links {
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        /* Small Mobile Layout (480px and below) */
        @media (max-width: 480px) {
          .footer-root {
            padding: 60px 24px 24px;
          }

          .footer-container {
            gap: 40px;
          }

          .footer-links-wrapper {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .footer-column {
            text-align: center;
          }

          .footer-link {
            margin: 0 auto;
          }

          .footer-watermark {
            font-size: clamp(60px, 45vw, 200px);
            opacity: 0.6;
          }

          .footer-social-icons {
            gap: 12px;
          }

          .social-icon {
            width: 36px;
            height: 36px;
          }

          .social-icon svg {
            width: 18px;
            height: 18px;
          }

          .footer-bottom {
            margin-top: 32px;
            padding-top: 20px;
          }

          .footer-bottom-links {
            gap: 16px;
          }
        }

        /* Extra Small Devices (360px and below) */
        @media (max-width: 360px) {
          .footer-root {
            padding: 50px 20px 20px;
          }

          .footer-watermark {
            font-size: clamp(50px, 50vw, 180px);
          }

          .footer-logo {
            font-size: 28px;
          }

          .footer-tagline {
            font-size: 13px;
          }

          .footer-link {
            font-size: 13px;
          }
        }
      `}</style>

      {/* Background Watermark */}
      <div className="footer-watermark">A-RIDE</div>

      <div className="footer-container">
        
        {/* Brand & Tagline */}
        <div className="footer-brand">
          <div className="footer-logo" onClick={() => navigate('/home')}>
            A-RIDE
          </div>
          <div className="footer-tagline">
            There is no road too long.<br/>
            Ride Free. Ride Far. 🏍️
          </div>

          {/* Social Icons */}
          <div className="footer-social-icons">
            <div className="social-icon" onClick={() => window.open('https://twitter.com', '_blank')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div className="social-icon" onClick={() => window.open('https://instagram.com', '_blank')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <div className="social-icon" onClick={() => window.open('https://linkedin.com', '_blank')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div className="social-icon" onClick={() => window.open('https://youtube.com', '_blank')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="footer-links-wrapper">
          <div className="footer-column">
            <div className="footer-column-title">Company</div>
            <button className="footer-link" onClick={() => navigate('/home')}>About Us</button>
            <button className="footer-link" onClick={() => navigate('/explore')}>Explore Rides</button>
            <button className="footer-link" onClick={() => navigate('/services')}>Services</button>
            <button className="footer-link">Careers</button>
            <button className="footer-link">Blog</button>
          </div>

          <div className="footer-column">
            <div className="footer-column-title">Support</div>
            <button className="footer-link">Help Center</button>
            <button className="footer-link">FAQ</button>
            <button className="footer-link" onClick={() => navigate('/support')}>Contact Support</button>
            <button className="footer-link">Safety Guidelines</button>
            <button className="footer-link">Trip Insurance</button>
          </div>

          <div className="footer-column">
            <div className="footer-column-title">Legal</div>
            <button className="footer-link">Terms of Service</button>
            <button className="footer-link">Privacy Policy</button>
            <button className="footer-link">Cookie Policy</button>
            <button className="footer-link">Cancellation Policy</button>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-copyright">
          © {new Date().getFullYear()} A-RIDE. All rights reserved.
        </div>
        <div className="footer-bottom-links">
          <button className="footer-bottom-link">Sitemap</button>
          <button className="footer-bottom-link">Accessibility</button>
          <button className="footer-bottom-link">Do Not Sell My Info</button>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
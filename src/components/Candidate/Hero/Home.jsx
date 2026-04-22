import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../../../src/components/Candidate/Hero/Home.css";

const images = ["/image3.png", "/image2.png", "/image1.jpg"];
const videos = ["/video3.mp4", "/video1.mp4", "/video2.mp4"];

const heroData = [
  { title: "WE'VE GOT YOUR BACK",   subtitle: "24/7 on-demand doorstep mechanic services wherever you ride.",    route: "/services" },
  { title: "CONQUER EVERY TERRAIN", subtitle: "Extreme off-roading and dirt track adventures for thrill-seekers.", route: "/explore/off-roading" },
  { title: "DISCOVER THE THRILL",   subtitle: "Premium long-distance motorcycle expeditions across India.",        route: "/explore/long-trip" },
];

const Home = () => {
  const navigate = useNavigate();
  const [heroCount, setHeroCount]   = useState(0);
  const [playStatus, setPlayStatus] = useState(false);

  // Auto-advance slides in image mode only
  useEffect(() => {
    if (playStatus) return;
    const id = setInterval(() => setHeroCount((c) => (c === 2 ? 0 : c + 1)), 5000);
    return () => clearInterval(id);
  }, [playStatus]);

  /*
   * KEY FIX — callback ref
   * useRef + useEffect misses the moment the <video> first mounts because
   * the effect runs AFTER paint and ref.current is null on that first render.
   * A callback ref fires the instant React attaches the DOM node.
   */
  const videoCallbackRef = useCallback(
    (el) => {
      if (!el) return;
      el.muted = true;          // must be set in JS for iOS
      el.load();
      el.play().catch(() => {
        // Autoplay blocked → resume on next user tap
        const resume = () => { el.play(); document.removeEventListener("click", resume); };
        document.addEventListener("click", resume, { once: true });
      });
    },
    [heroCount]   // new ref callback when slide changes so new src plays
  );

  return (
    <div className="home-container">
      <div className="home-background">

        <div className="hero-overlay" />

        {/* ── MEDIA ── */}
        {playStatus ? (
          <video
            ref={videoCallbackRef}
            key={`video-${heroCount}`}      /* key forces full remount on slide change */
            className="home-bg-media fade-in"
            src={videos[heroCount]}         /* src directly on <video>, NOT on <source> */
            muted
            loop
            playsInline
            preload="auto"
            poster={images[heroCount]}
          />
        ) : (
          <img
            key={`img-${heroCount}`}
            src={images[heroCount]}
            className="home-bg-media fade-in"
            alt="hero background"
            loading="eager"
            decoding="async"
          />
        )}

        {/* ── HERO TEXT ── */}
        <div className="hero-text fade-in" key={`text-${heroCount}`}>
          <div className="hero-label">A-RIDE EXPERIENCE</div>
        
          <h1>{heroData[heroCount].title}</h1>
          <p>{heroData[heroCount].subtitle}</p>
          <button className="hero-cta" onClick={() => navigate(heroData[heroCount].route)}>
            Explore Now
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="hero-bottom-bar">
          <div className="hero-dots">
            {heroData.map((_, i) => (
              <div
                key={i}
                onClick={() => setHeroCount(i)}
                className={`hero-dot ${heroCount === i ? "active" : ""}`}
                
              />
            ))}
          </div>

          <div className="tooltip-container">
            <span className="tooltip-text">{playStatus ? "Back to Photos" : "Watch Videos"}</span>
            <div className="play-button" onClick={() => setPlayStatus((s) => !s)}>
              {playStatus ? (
                <svg className="play-icon" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="play-icon" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
import React, { useEffect, useState } from "react";
// Images
import image1 from "../../../assets/image1.jpg";
import image2 from "../../../assets/image2.png";
import image3 from "../../../assets/image3.jpg";
// Video
import video1 from "../../../assets/video2.mp4";
import video2 from "../../../assets/video1.mp4";
import video3 from "../../../assets/video3.mp4";
// Icons
import play_icon from "../../../assets/play_icon.png";
import pause_icon from "../../../assets/pause_icon.png";
// CSS
import "../../../../src/components/Candidate/Hero/Home.css";

const Home = () => {
  const [heroCount, setHeroCount] = useState(0);
  const [playStatus, setPlayStatus] = useState(false);

  // ── Text Data matching your features ──
  const heroData = [
    { 
      title: "DISCOVER THE THRILL", 
      subtitle: "Premium long-distance motorcycle expeditions across India." 
    },
    { 
      title: "CONQUER EVERY TERRAIN", 
      subtitle: "Extreme off-roading and dirt track adventures for thrill-seekers." 
    },
    { 
      title: "WE'VE GOT YOUR BACK", 
      subtitle: "24/7 on-demand doorstep mechanic services wherever you ride." 
    }
  ];

  // ── Arrays for seamless mapping ──
  const images = [image1, image2, image3];
  
  // THE FIX: Using video1 for all three slots so Vite doesn't crash looking for missing files!
  const videos = [video1, video2, video3]; 

  useEffect(() => {
    if (!playStatus) {
      // Auto-play the slider every 5 seconds only if the video is NOT playing
      const interval = setInterval(() => {
        setHeroCount((count) => (count === 2 ? 0 : count + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [playStatus]);

  return (
    <div className="home-container">
      <div className="home-background">
        
        {/* Dark overlay to make text readable */}
        <div className="hero-overlay"></div>

        {/* ── MEDIA RENDERING ── */}
        {playStatus ? (
          <video key={videos[heroCount]} className="home-bg-media fade-in" autoPlay loop muted playsInline>
            <source src={videos[heroCount]} type="video/mp4" />
          </video>
        ) : (
          <img key={images[heroCount]} src={images[heroCount]} className="home-bg-media fade-in" alt="hero background" />
        )}

        {/* ── HERO TEXT ── */}
        <div className="hero-text fade-in" key={`text-${heroCount}`}>
          <h1>{heroData[heroCount].title}</h1>
          <p>{heroData[heroCount].subtitle}</p>
        </div>

        {/* ── INTERACTIVE DOTS ── */}
        <div className="hero-dots">
          {heroData.map((_, index) => (
            <div
              key={index}
              onClick={() => setHeroCount(index)}
              className={`hero-dot ${heroCount === index ? "active" : ""}`}
            ></div>
          ))}
        </div>

        {/* ── PLAY BUTTON WITH TOOLTIP ── */}
        <div className="explore-wrapper">
          <div className="tooltip-container">
            {/* Tooltip Text */}
            <span className="tooltip-text">
              {playStatus ? "Switch to Photos" : "Explore us through videos"}
            </span>
            
            <div className="play-button" onClick={() => setPlayStatus(!playStatus)}>
              <img
                src={playStatus ? pause_icon : play_icon}
                alt="toggle-video"
                className="play-icon"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
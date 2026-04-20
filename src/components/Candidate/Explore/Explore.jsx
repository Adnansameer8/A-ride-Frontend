import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();

  return (
    <div className="explore">
      <h1>Explore Our Rides</h1>
      <p>
       Discover experiences crafted for every kind of rider — from serene long-distance journeys to adrenaline-filled off-road adventures.
      </p>

      <div className="explore-categories">
        {/* Long Trip Card */}
        <div
          className="category-card1"
          onClick={() => navigate('/explore/long-trip')}
        >
          <span className="category-badge">Popular</span>
          <div className="flex">
            <img
              src="/longtrip.png"
              alt="Long Trip Motorcycle"
            />
          </div>
          <h2>Long Trip</h2>
          <p>
           Experience smooth, long-distance rides through breathtaking routes. Perfect for those who love the journey as much as the destination.
          </p>
        </div>

        {/* Off-Roading Card */}
        <div
          className="category-card2"
          onClick={() => navigate('/explore/off-roading')}
        >
          <span className="category-badge">Adventure</span>
          <div className="flex">
           <img
            src="/exploreoff.png"
            alt="Off-Roading Adventure"
            /* ── YOUR CUSTOM ZOOM STYLE ADDED HERE ── */
            className="custom-offroad-img"
          />
          </div>
          <h2>Off-Roading</h2>
          <p>
            Take on challenging terrains and fuel your adventure spirit. Our off-roading experiences are designed for thrill-seekers ready to conquer the unbeaten path.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Explore;
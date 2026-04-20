import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Authcontext";
import "./Category.css";

// Distinct default data for Off-Roading
const DEFAULT_OFFROAD_PLACES = [
  { name: "Spiti Valley Dirt Trail", fallback: "https://images.unsplash.com/photo-1596324121712-5bbc14482b74?q=80&w=2070&auto=format&fit=crop", duration: "7–9 days", season: "Jun–Oct", difficulty: "Hard", blurb: "Navigate treacherous water crossings and loose gravel in the cold desert.", priceWithBike: 24999, priceNoBike: 14999, tags: ["Dirt Track", "Mountains"], status: "approved", type: "Off-Roading" },
  { name: "Thar Desert Dune Bashing", fallback: "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?q=80&w=2070&auto=format&fit=crop", duration: "3–4 days", season: "Nov–Feb", difficulty: "Intermediate", blurb: "Master the art of riding in deep sand dunes under the scorching sun.", priceWithBike: 15999, priceNoBike: 9999, tags: ["Desert", "Sand"], status: "approved", type: "Off-Roading" },
  { name: "Western Ghats Mud Track", fallback: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop", duration: "2–3 days", season: "Jul–Sep", difficulty: "Hard", blurb: "Slush, mud, and dense forests. The ultimate monsoon off-road challenge.", priceWithBike: 8999, priceNoBike: 5999, tags: ["Mud", "Forest"], status: "approved", type: "Off-Roading" },
  { name: "Zanskar Valley Expedition", fallback: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop", duration: "10–12 days", season: "Jul–Sep", difficulty: "Extreme", blurb: "The most remote off-road tracks in India. Not for the faint-hearted.", priceWithBike: 34999, priceNoBike: 19999, tags: ["Extreme", "Mountains"], status: "approved", type: "Off-Roading" },
];

function Img({ src, fallback, alt }) {
  const [currentSrc, setSrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`media ${loaded ? "is-loaded" : ""}`}>
      {!loaded && <div className="skeleton" aria-hidden="true" />}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => { if (currentSrc !== fallback) setSrc(fallback); }}
      />
    </div>
  );
}

export default function OffRoading() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [offroadPlaces, setOffroadPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [priceMode, setPriceMode] = useState("with");
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => { loadTrips(); }, []);

  const loadTrips = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trips/approved`);
      const data = await response.json();
      if (data.success) {
        // STRICT FILTER: Only 'Off-Roading'
        const dbTrips = data.trips.filter(t => t.type === 'Off-Roading');
        setOffroadPlaces([...DEFAULT_OFFROAD_PLACES, ...dbTrips]);
      } else {
        setOffroadPlaces(DEFAULT_OFFROAD_PLACES);
      }
    } catch (err) {
      console.error('❌ Off-Roading - Failed to load:', err);
      setOffroadPlaces(DEFAULT_OFFROAD_PLACES);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return offroadPlaces;
    const q = search.toLowerCase();
    return offroadPlaces.filter(p => p.name.toLowerCase().includes(q) || (p.blurb && p.blurb.toLowerCase().includes(q)));
  }, [search, offroadPlaces]);

  const handleSubmitBooking = async () => {
    const token = localStorage.getItem('aride_token');
    const finalPrice = priceMode === "with" ? selected.priceWithBike : selected.priceNoBike;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customerName: form.name, phone: form.phone, email: form.email || user?.email,
        type: "Off-Roading", 
        price: finalPrice,
        details: { tripName: selected.name, priceMode: priceMode === "with" ? "With Bike" : "No Bike" }
      })
    });
    const data = await response.json();
    if (data.success) navigate('/booking-confirmation', { state: { booking: data.booking } });
  };

  const closeModal = () => { setSelected(null); setStep("details"); };

  return (
    <div className="page theme-redwhite">
      {/* ── UPDATED HERO SECTION TO MATCH LONG TRIP ── */}
      <section className="hero hero--off">
        <div className="hero__overlay" />
        <div className="hero__content">
          <h1 className="hero__title">Adventurous Off-Roading</h1>
          <p className="hero__subtitle">Challenge yourself with dirt tracks, mud, and extreme terrain.</p>
        </div>
      </section>

      {/* ── UPDATED TOOLBAR TO MATCH LONG TRIP ── */}
      <div className="toolbar">
        <div className="toggle">
          <button className={`toggle__btn ${priceMode==="with"?"active":""}`} onClick={()=> setPriceMode("with")}>With Bike</button>
          <button className={`toggle__btn ${priceMode==="without"?"active":""}`} onClick={()=> setPriceMode("without")}>Without Bike</button>
        </div>
        <div className="toolbar__right">
          <div className="searchbar"><input placeholder="Search trails…" value={search} onChange={(e)=> setSearch(e.target.value)} /></div>
        </div>
      </div>

      <div className="grid">
        {filtered.map((p, idx) => {
          const price = priceMode === "with" ? p.priceWithBike : p.priceNoBike;
          const imgUrl = p.imageUrl || p.fallback;

          return (
            <article key={p.id || idx} className="card">
              <div className="ribbon">{priceMode === "with" ? "With Bike" : "Without Bike"}</div>
              <div className="img"><Img src={imgUrl} fallback={p.fallback} alt={p.name} /></div>
              <div className="body">
                <div className="title-row">
                  <h3 className="card-title">{p.name}</h3>
                  <div className="price">₹{price?.toLocaleString()}</div>
                </div>
                <p className="blurb">{p.blurb}</p>
                <div className="meta">
                   <span className="pill">⏱ {p.duration}</span>
                   <span className="pill">⚠️ {p.difficulty || "Hard"}</span>
                </div>
                <div className="actions">
                  <button className="btn" onClick={()=> { setSelected(p); setStep("details"); }}>View</button>
                  <button className="btn primary" onClick={() => { if(!isAuthenticated) return navigate('/login'); setSelected(p); setStep("book"); setForm({name:user?.name || '', email:user?.email || '', phone:''}) }}>Book</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selected && (
        <div className="modal">
          <div className="overlay" onClick={closeModal}/>
          <div className="sheet">
            <div className="sheet-head"><strong>{selected.name}</strong><button className="close-x" onClick={closeModal}>✕</button></div>
            <div className="sheet-body">
              {step==="details" ? (
                <>
                  <p className="blurb">{selected.blurb}</p>
                  <div className="sheet-actions">
                    <button className="btn primary" onClick={() => { if(!isAuthenticated) return navigate('/login'); setStep("book"); }}>Proceed to Book</button>
                  </div>
                </>
              ) : (
                <>
                  <label className="label">Full Name</label>
                  <input className="input" value={form.name} onChange={e=> setForm({...form, name:e.target.value})} />
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e=> setForm({...form, phone:e.target.value})} />
                  <div className="sheet-actions">
                    <button className="btn primary" onClick={handleSubmitBooking}>Submit Booking</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
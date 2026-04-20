import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Authcontext";
import "./Category.css";

const DEFAULT_TAGS = ["Scenic", "High Passes", "Coastal", "Beaches", "Culture", "Heritage", "Pan-India", "Epic", "North-East", "Green"];

const DEFAULT_LONG_PLACES = [
  { name: "Leh–Ladakh Circuit", fallback: "https://images.pexels.com/photos/2607238/pexels-photo-2607238.jpeg", duration: "9–12 days", season: "Jun–Sep", difficulty: "Intermediate", blurb: "Pangong Tso, Khardung La & Nubra — the classic Himalayan loop.", priceWithBike: 22999, priceNoBike: 12999, tags: ["Scenic", "High Passes", "Epic"], status: "approved", type: "Long Trip" },
  { name: "Manali → Leh Highway", fallback: "https://discoverlehladakh.in/wp-content/uploads/2021/10/A-tourist-cab-on-Manali-Leh-highway-1140x530.jpg", duration: "7–10 days", season: "Jun–Sep", difficulty: "Intermediate", blurb: "Rohtang, Sarchu & Baralacha La — bucket-list passes and big skies.", priceWithBike: 19999, priceNoBike: 11999, tags: ["Scenic", "High Passes"], status: "approved", type: "Long Trip" },
  { name: "Konkan Coastal Ride (Mumbai → Goa)", fallback: "https://images.pexels.com/photos/633625/pexels-photo-633625.jpeg", duration: "4–6 days", season: "Oct–Feb", difficulty: "Easy", blurb: "Arabian coast, palm-lined roads and hidden beaches.", priceWithBike: 10999, priceNoBike: 7999, tags: ["Coastal", "Beaches", "Scenic"], status: "approved", type: "Long Trip" },
  { name: "Rajasthan Heritage Circuit", fallback: "https://images.pexels.com/photos/14558135/pexels-photo-14558135.jpeg", duration: "6–8 days", season: "Nov–Feb", difficulty: "Easy", blurb: "Jaisalmer dunes, Udaipur lakes & Jaipur forts.", priceWithBike: 14999, priceNoBike: 9999, tags: ["Culture", "Heritage", "Scenic"], status: "approved", type: "Long Trip" },
  { name: "Kanyakumari → Kashmir (K2K)", fallback: "https://images.pexels.com/photos/10975803/pexels-photo-10975803.jpeg", duration: "14–18 days", season: "Sep–Apr", difficulty: "Challenging", blurb: "From southern tip to snowy peaks — the spine of India on two wheels.", priceWithBike: 32999, priceNoBike: 18999, tags: ["Pan-India", "Epic", "Scenic"], status: "approved", type: "Long Trip" },
  { name: "Meghalaya & North-East Scenic Loop", fallback: "https://images.pexels.com/photos/33291821/pexels-photo-33291821.jpeg", duration: "7–9 days", season: "Oct–Apr", difficulty: "Intermediate", blurb: "Cherrapunji, Dawki & living root bridges — lush & misty.", priceWithBike: 18999, priceNoBike: 11499, tags: ["North-East", "Green", "Scenic"], status: "approved", type: "Long Trip" },
  { name: "ECR Coastal Cruise (Chennai → Pondicherry)", fallback: "https://images.pexels.com/photos/386009/pexels-photo-386009.jpeg", duration: "2–3 days", season: "Oct–Mar", difficulty: "Easy", blurb: "Sea-hugging East Coast Road, cafes, beaches & French vibes.", priceWithBike: 6999, priceNoBike: 4999, tags: ["Coastal", "Beaches", "Scenic"], status: "approved", type: "Long Trip" },
  { name: "Rann of Kutch White Salt Flats", fallback: "https://images.pexels.com/photos/1144176/pexels-photo-1144176.jpeg", duration: "4–5 days", season: "Nov–Feb", difficulty: "Easy–Intermediate", blurb: "Salt flats, desert sunsets & Kutch handicrafts.", priceWithBike: 11999, priceNoBike: 8999, tags: ["Culture", "Heritage", "Scenic"], status: "approved", type: "Long Trip" },
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

export default function LongTrip() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [longPlaces, setLongPlaces] = useState([]);
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [priceMode, setPriceMode] = useState("with");
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => { loadTrips(); }, []);

  // ── FIX: Fetch from API and Merge with Defaults ───────────────────
  const loadTrips = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trips/approved`);
      const data = await response.json();
      if (data.success) {
        // DEBUG: Log all trips to see what's coming from backend
        console.log('🔍 ALL APPROVED TRIPS:', data.trips.map(t => ({ name: t.name, type: t.type })));
        
        // STRICT FILTER: Only 'Long Trip' (exact match, case-sensitive)
        const dbTrips = data.trips.filter(t => t.type === 'Long Trip');
        
        console.log('✅ FILTERED LONG TRIPS:', dbTrips.map(t => t.name));
        
        setLongPlaces([...DEFAULT_LONG_PLACES, ...dbTrips]);
      } else {
        setLongPlaces(DEFAULT_LONG_PLACES);
      }
    } catch (err) {
      console.error('❌ Long Trip - Failed to load:', err);
      setLongPlaces(DEFAULT_LONG_PLACES);
    }
  };

  const filtered = useMemo(() => {
    let base = [...longPlaces];
    if (activeTag !== "All") base = base.filter(p => (p.tags || []).includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(p => p.name.toLowerCase().includes(q) || p.blurb.toLowerCase().includes(q));
    }
    const price = (p) => priceMode === "with" ? p.priceWithBike : p.priceNoBike;
    if (sort === "priceAsc") base.sort((a,b)=> price(a) - price(b));
    if (sort === "priceDesc") base.sort((a,b)=> price(b) - price(a));
    return base;
  }, [activeTag, search, sort, priceMode, longPlaces]);

  const handleSubmitBooking = async () => {
    const token = localStorage.getItem('aride_token');
    const finalPrice = priceMode === "with" ? selected.priceWithBike : selected.priceNoBike;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customerName: form.name, phone: form.phone, email: form.email || user?.email,
        type: "Long Trip", price: finalPrice,
        details: { tripName: selected.name, priceMode: priceMode === "with" ? "With Bike" : "No Bike" }
      })
    });
    const data = await response.json();
    if (data.success) navigate('/booking-confirmation', { state: { booking: data.booking } });
  };

  const closeModal = () => { setSelected(null); setStep("details"); };

  return (
    <div className="page theme-redwhite">
      <section className="hero hero--long">
        <div className="hero__overlay" />
        <div className="hero__content">
          <h1 className="hero__title">Long Trip Destinations</h1>
          <p className="hero__subtitle">Curated India rides • With Bike / Without Bike pricing.</p>
        </div>
      </section>

      <div className="toolbar">
        <div className="toggle">
          <button className={`toggle__btn ${priceMode==="with"?"active":""}`} onClick={()=> setPriceMode("with")}>With Bike</button>
          <button className={`toggle__btn ${priceMode==="without"?"active":""}`} onClick={()=> setPriceMode("without")}>Without Bike</button>
        </div>
        <div className="toolbar__right">
          <div className="searchbar"><input placeholder="Search routes…" value={search} onChange={(e)=> setSearch(e.target.value)} /></div>
        </div>
      </div>

      <div className="grid">
        {filtered.map((p, idx) => {
          const price = priceMode === "with" ? p.priceWithBike : p.priceNoBike;
          // Database entries use imageUrl, defaults use fallback
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
                   <span className="pill">🍃 {p.season || "All Season"}</span>
                </div>
                <div className="actions">
                  <button className="btn" onClick={()=> { setSelected(p); setStep("details"); }}>View</button>
                  <button className="btn primary" onClick={() => { if(!isAuthenticated) return navigate('/login'); setSelected(p); setStep("book"); setForm({name:user?.name, email:user?.email, phone:''}) }}>Book</button>
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
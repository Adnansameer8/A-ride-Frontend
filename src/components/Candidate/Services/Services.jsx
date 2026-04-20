import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { useAuth } from '../../Authcontext'; 
import { 
  Bold, LockIcon, LockKeyholeOpenIcon, CreditCard, RefreshCwIcon, Wallet, Fuel,
  Truck, Wrench, Battery, Settings, Hash, AlertTriangle, Clock 
} from "lucide-react"; 

// ─── SILENCE OSRM CONSOLE WARNING ───
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes("OSRM's demo server")) return;
  originalWarn.apply(console, args);
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const FIXED_LOCATION = { lat: 12.89806, lng: 77.61442 };
const RATE_PER_KM = 5;
const UNSERVICEABLE_KM = 700;
const DISABLED_KM = 700;

const BASE_SERVICES = [
  { value: "petrol",    label: "⛽ Petrol Delivery",   icon: <Fuel/>, desc: "Fuel delivered to your spot" },
  { value: "towing",    label: "🚛 Towing Service",     icon: <Truck/>, desc: "Vehicle towed to nearest garage" },
  { value: "mechanic",  label: "🔧 Mechanic On Spot",  icon: <Wrench/>, baseCharge: 500, desc: "Expert mechanic at your location" },
  { value: "battery",   label: "🔋 Electric Battery",  icon: <Battery/>, baseCharge: 500, desc: "Battery jump-start or replacement" },
  { value: "autospare", label: "🪛 Auto Spare Parts",  icon: <Settings/>, baseCharge: 500, desc: "Spare parts delivered instantly" },
];

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "N/A";
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function getTowingCharge(cc) {
  const n = Number(cc);
  if (!n || isNaN(n)) return null;
  if (n < 200) return 500;
  if (n < 400) return 700;
  if (n < 800) return 800;
  return 1000;
}

// ─── Login / Register Modal ──────────────────────────────────────────────────
function AuthModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)",
        zIndex: 20000, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "24px", padding: "40px",
          maxWidth: "400px", width: "100%", textAlign: "center",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
          animation: "modalIn 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
        <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#111", margin: "0 0 12px" }}>
          Authentication Required
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 30px", lineHeight: 1.5 }}>
          Please log in to your A-RIDE account to confirm this booking and track your mechanic.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            width: "100%", padding: "16px", borderRadius: "12px", border: "none",
            background: "#f97316", color: "#fff", fontSize: "16px", fontWeight: "800", 
            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 4px 16px rgba(249,115,22,0.35)", marginBottom: "16px"
          }}
        >
          Go to Sign In
        </button>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "#9ca3af", fontSize: "14px",
            fontWeight: "600", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Services() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceOpen, setServiceOpen] = useState(false);

  const { user: currentUser, isAuthenticated, logout } = useAuth();
  const authLoading = false; 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingSubmitRef = useRef(false);

  const [petrolLitres, setPetrolLitres] = useState("");
  const [bikeCc, setBikeCc] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bikeNumber, setBikeNumber] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [error, setError] = useState("");
  const [routeError, setRouteError] = useState("");

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const mapRef = useRef(null);
  const routingRef = useRef(null);
  const serviceDropRef = useRef(null);

  const distKm = routeInfo?.distanceKm ?? 0;
  const isUnserviceable = distKm > UNSERVICEABLE_KM && distKm <= DISABLED_KM;
  const isDisabled = distKm > DISABLED_KM;
  const requireOnlinePayment = distKm > 5;

  useEffect(() => {
    if (requireOnlinePayment) setPaymentMode("online");
  }, [requireOnlinePayment]);

  useEffect(() => {
    const handler = (e) => {
      if (serviceDropRef.current && !serviceDropRef.current.contains(e.target))
        setServiceOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

const buildMap = (c) => {
    // ── PREVENT CRASH IF USER LEFT THE PAGE ──
    const mapContainer = document.getElementById("services-map");
    if (!mapContainer) return; 

    if (routingRef.current) {
      try {
        routingRef.current.setWaypoints([]); 
        if (mapRef.current) {
          mapRef.current.removeControl(routingRef.current);
        }
      } catch (e) {}
      routingRef.current = null;
    }

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {}
      mapRef.current = null;
    }

    setRouteInfo(null); 
    setRouteError("");

    const map = L.map("services-map", { preferCanvas: true, zoomControl: true })
      .setView([c.lat, c.lng], 12);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

    const userIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#f97316;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(249,115,22,0.35);"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    });
    
    const svcIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;background:#111;border-radius:3px;border:3px solid #fff;box-shadow:0 0 0 3px rgba(17,17,17,0.25);"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    });

    L.marker([c.lat, c.lng], { icon: userIcon }).addTo(map)
      .bindPopup("<b style='color:#f97316'>📍 Your Location</b>").openPopup();
      
    L.marker([FIXED_LOCATION.lat, FIXED_LOCATION.lng], { icon: svcIcon }).addTo(map)
      .bindPopup("<b>🔧 A-RIDE Service Hub</b>");

    const control = L.Routing.control({
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1", profile: "driving" }),
      waypoints: [L.latLng(c.lat, c.lng), L.latLng(FIXED_LOCATION.lat, FIXED_LOCATION.lng)],
      lineOptions: { styles: [{ color: "#f97316", weight: 4, opacity: 0.9 }] },
      addWaypoints: false, routeWhileDragging: false,
      fitSelectedRoutes: true, showAlternatives: false, show: false,
    })
      .on("routesfound", (e) => {
        const s = e?.routes?.[0]?.summary;
        if (!s) return;
        const dKm = s.totalDistance / 1000;
        setRouteInfo({
          distanceKm: Number(dKm.toFixed(2)),
          formatted: formatTime(s.totalTime),
          distanceCharge: Math.round(dKm * RATE_PER_KM),
        });
      })
      .on("routingerror", () => {
        setRouteError("Could not fetch route.");
        const d = map.distance([c.lat, c.lng], [FIXED_LOCATION.lat, FIXED_LOCATION.lng]) / 1000;
        setRouteInfo({
          distanceKm: Number(d.toFixed(2)),
          formatted: formatTime((d / 40) * 3600),
          distanceCharge: Math.round(d * RATE_PER_KM),
        });
      })
      .addTo(map);

    setTimeout(() => {
      document.querySelectorAll(".leaflet-routing-container").forEach(el => el.style.display = "none");
    }, 600);

    routingRef.current = control;
  };

  const acquireLocation = async () => {
    setLoadingLocation(true);
    setRouteError("");
    const getGPS = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("Not supported"));
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: "gps" }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      });
      
    try {
      const c = await getGPS();
      setCoords(c); buildMap(c);
    } catch {
      try {
        // Handle IP API rate limits safely
        const r = await fetch("https://ipapi.co/json/");
        if (!r.ok) throw new Error("Rate limited"); 
        
        const d = await r.json();
        if (d?.latitude) {
          const c = { lat: Number(d.latitude), lng: Number(d.longitude), source: "ip" };
          setCoords(c); buildMap(c);
        } else throw new Error();
      } catch {
        // Failsafe: Default to Bangalore if GPS is denied and IP is blocked
        const c = { lat: 12.9716, lng: 77.5946, source: "default" };
        setCoords(c); buildMap(c);
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => { acquireLocation(); }, []);

  const getServiceCharge = () => {
    if (!selectedService) return null;
    if (selectedService.value === "petrol") {
      const l = Number(petrolLitres);
      return l > 0 ? l * 100 : null;
    }
    if (selectedService.value === "towing") return getTowingCharge(bikeCc);
    return selectedService.baseCharge;
  };

  const serviceCharge = getServiceCharge();
  const totalPrice = serviceCharge != null && routeInfo ? serviceCharge + routeInfo.distanceCharge : null;

  const validateForm = () => {
    if (!selectedService) { setError("Please select a service"); return false; }
    if (selectedService.value === "petrol" && !(Number(petrolLitres) > 0)) { setError("Enter litres needed"); return false; }
    if (selectedService.value === "towing" && !getTowingCharge(bikeCc)) { setError("Enter valid bike CC"); return false; }
    if (!name.trim()) { setError("Enter your name"); return false; }
    if (!phone.trim()) { setError("Enter your phone number"); return false; }
    if (!bikeNumber.trim()) { setError("Enter your bike number"); return false; }
    if (!acceptedTerms) { setError("Please accept Terms & Conditions"); return false; }
    return true;
  };

  const processBooking = () => {
    setError("");
    setBookingConfirmed(false);
    setShowPriceModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    processBooking();
  };

  const handleSeePrices = () => {
    if (!selectedService) { setError("Please select a service first"); return; }
    if (selectedService.value === "petrol" && !(Number(petrolLitres) > 0)) { setError("Enter litres needed"); return; }
    if (selectedService.value === "towing" && !getTowingCharge(bikeCc)) { setError("Enter valid bike CC"); return; }
    if (!routeInfo) { setError("Waiting for route…"); return; }
    setError("");
    setBookingConfirmed(false);
    setShowPriceModal(true);
  };

  const saveBookingToDatabase = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      
      // ─── EXACT GOOGLE MAPS LINK FIX HERE ───
      const mapsLink = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : null;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          customerName: name, 
          phone: phone,
          email: currentUser?.email || "user@example.com", 
          type: `Service - ${selectedService?.label.replace(/^[^ ]+ /, "")}`,
          price: totalPrice,
          details: {
            bikeNumber: bikeNumber,
            paymentMode: paymentMode,
            distanceKm: routeInfo?.distanceKm,
            eta: routeInfo?.formatted,
            locationLink: mapsLink, // This will now perfectly save the Google Maps URL
            extraDetails: selectedService?.value === 'petrol' ? `${petrolLitres}L` : 
                          selectedService?.value === 'towing' ? `${bikeCc}cc` : 'N/A'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        return data.booking; 
      } else {
        return null;
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      return null;
    }
  };

  const handleModalConfirm = async () => {
    if (!validateForm()) {
      alert("Please fill your Name, Phone Number, and Bike Number in the form to confirm the booking.");
      setShowPriceModal(false); 
      return;
    }

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    
    const bookingResult = await saveBookingToDatabase();
    if (bookingResult) {
      setConfirmedBooking(bookingResult);
      setBookingConfirmed(true); 
    } else {
      alert("Something went wrong saving your booking. Please try again.");
    }
  };

  const isFormDisabled = isUnserviceable || isDisabled;
  const displayId = confirmedBooking?.id ? `BKG-${confirmedBooking.id.split('-')[0].toUpperCase()}` : 'N/A';

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "'Outfit', sans-serif",
      paddingTop: "2px", boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .leaflet-routing-container { display: none !important; }
        input:focus { outline: none; border-color: #f97316 !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
        input::placeholder { color: #c4c9d4; }
        @media (max-width: 900px) {
          .main-grid { flex-direction: column !important; }
          .left-panel { max-width: 100% !important; flex: none !important; }
          .right-panel { height: 350px !important; }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes checkIn { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        
      `}</style>

      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); pendingSubmitRef.current = false; }}
        />
      )}

      <div className="main-grid" style={{ display: "flex", width: "100%", minHeight: "calc(100vh - 59px)" }}>

        {/* ── LEFT PANEL ── */}
        <div className="left-panel" style={{
          flex: "0 0 590px", maxWidth: "590px",
          background: "#ffffff", padding: "40px 40px 40px 48px",
          display: "flex", flexDirection: "column", justifyContent: "flex-start",
          borderRight: "1px solid #f0f0f0", boxSizing: "border-box", overflowY: "auto",
        }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "#fff7ed", border: "1.5px solid #fed7aa",
              borderRadius: "50px", padding: "5px 14px",
            }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#ea580c", letterSpacing: "2px", textTransform: "uppercase" }}>
              Services
              </span>
            </div>

            {!authLoading && (
              currentUser ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUser.displayName || currentUser.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={() => logout()} 
                    style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", fontWeight: "700", color: "#9ca3af", cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 2px 6px rgba(229,231,235,0.3)" }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: "800", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
                >
                  Log In
                </button>
              )
            )}
          </div>

          <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: "900", color: "#111", lineHeight: 1.1, margin: "0 0 8px 0", letterSpacing: "-1.5px" }}>
            NEVER RIDE <br /><span style={{ color: "#f97316" }}>ALONE.</span>
          </h1>
          <p style={{ fontSize: "15px", color: "#4b5563", margin: "0 0 24px 0", lineHeight: 1.8, fontWeight: "500", letterSpacing: "0.4px", maxWidth: "600px", marginInline: "auto" }}>
            The open road is unpredictable, but your journey doesn't have to be. From emergency fuel drops to heavy-duty towing and expert on-the-spot repairs, our elite mechanic network is on standby. Wherever you are, we’ve got your back.
          </p>

          {!currentUser && !authLoading && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: "14px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px", color: "#000000" }}><LockIcon /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "800", color: "#92400e", marginBottom: "2px" }}>Login required to confirm</div>
                <div style={{ fontSize: "11px", color: "#b45309" }}>You can see prices without logging in.</div>
              </div>
            </div>
          )}

          {isUnserviceable && (
            <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🚫</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#dc2626", marginBottom: "3px" }}>Currently Unserviceable</div>
                <div style={{ fontSize: "12px", color: "#ef4444", lineHeight: 1.5 }}>Your location ({routeInfo?.distanceKm} km) is beyond our 70 km service radius. We're expanding soon!</div>
              </div>
            </div>
          )}

          {isDisabled && (
            <div style={{ background: "#f3f4f6", border: "1.5px solid #d1d5db", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📍</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#6b7280", marginBottom: "3px" }}>Out of Service Range</div>
                <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 }}>You are {routeInfo?.distanceKm} km away — too far for our service. Available within 100 km only.</div>
              </div>
            </div>
          )}

          {requireOnlinePayment && !isFormDisabled && (
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "12px", padding: "11px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span><CreditCard /></span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#1d4ed8" }}>Online payment required for distances over 5 km</span>
            </div>
          )}

          <div style={{ background: "#fff", border: "2px solid #e5e7eb", borderRadius: "20px", overflow: "visible", marginBottom: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.07)", position: "relative", opacity: isFormDisabled ? 0.5 : 1, pointerEvents: isFormDisabled ? "none" : "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: "1.5px solid #f3f4f6" }}>
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#f97316", flexShrink: 0, boxShadow: "0 0 0 3px rgba(249,115,22,0.2)" }} />
              <span style={{ flex: 1, fontSize: "13px", color: coords ? "#111" : "#9ca3af", fontWeight: "600" }}>
                {loadingLocation ? "Detecting location…" : coords?.source === "gps" ? "📍 Your location (GPS)" : coords?.source === "ip" ? "📍 Approximate location (IP)" : "📍 Default — Bangalore"}
              </span>
              <button onClick={acquireLocation} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff7ed", border: "1px solid #fed7aa", cursor: "pointer", color: "#ea580c", fontSize: "13px", fontWeight: "600", padding: "2px 6px", borderRadius: "999px", transition: "all 0.2s ease", boxShadow: "0 2px 6px rgba(249,115,22,0.15)" }}>
                <RefreshCwIcon style={{ fontSize: "10px" }} /> Refresh
              </button>
            </div>

            <div style={{ margin: "0 16px", borderTop: "1.5px dashed #e5e7eb" }} />

            <div ref={serviceDropRef} style={{ position: "relative" }}>
              <div onClick={() => setServiceOpen(!serviceOpen)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer", background: serviceOpen ? "#fffbf7" : "#fff" }}>
                <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: selectedService ? "#111" : "#d1d5db", flexShrink: 0 }} />
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: selectedService ? "#111" : "#9ca3af", fontWeight: selectedService ? "600" : "500" }}>
                    {selectedService ? (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', '& svg': { width: '16px', height: '16px' } }}>
                          {selectedService.icon}
                        </span>
                        {selectedService.label.replace(/^[^ ]+ /, "")}
                      </>
                    ) : (
                      "Service needed"
                    )}
                  </span>
                <span style={{ fontSize: "10px", color: "#9ca3af", transform: serviceOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
              </div>

              {serviceOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", borderRadius: "16px", boxShadow: "0 16px 48px rgba(0,0,0,0.13)", border: "1px solid #f0f0f0", zIndex: 500, overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px 5px", fontSize: "10px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #f5f5f5" }}>Select Service</div>
                  {BASE_SERVICES.map((svc) => (
                    <div key={svc.value} onClick={() => { setSelectedService(svc); setServiceOpen(false); setPetrolLitres(""); setBikeCc(""); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", cursor: "pointer", background: selectedService?.value === svc.value ? "#f9fafb" : "#fff", borderLeft: selectedService?.value === svc.value ? "3px solid #f97316" : "3px solid transparent", borderBottom: "1px solid #f9f9f9", transition: "all 0.15s" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: selectedService?.value === svc.value ? "#fff7ed" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{svc.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#111" }}>{svc.label.replace(/^[^ ]+ /, "")}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{svc.desc}</div>
                      </div>
                      {selectedService?.value === svc.value && <span style={{ color: "#f97316", fontWeight: "900" }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedService?.value === "petrol" && (
              <div style={{ padding: "0 16px 14px", borderTop: "1.5px solid #f3f4f6" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "1.5px", textTransform: "uppercase", margin: "12px 0 8px" }}>How many litres?</div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="number" min="1" max="20" value={petrolLitres} onChange={e => setPetrolLitres(e.target.value)} placeholder="e.g. 2" style={{ flex: 1, padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#111", fontFamily: "'Outfit', sans-serif", fontWeight: "600" }} />
                  <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: "600", whiteSpace: "nowrap" }}>× ₹100/L</div>
                  {Number(petrolLitres) > 0 && <div style={{ fontSize: "15px", fontWeight: "800", color: "#f97316", whiteSpace: "nowrap" }}>= ₹{Number(petrolLitres) * 100}</div>}
                </div>
              </div>
            )}

            {selectedService?.value === "towing" && (
              <div style={{ padding: "0 16px 14px", borderTop: "1.5px solid #f3f4f6" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "1.5px", textTransform: "uppercase", margin: "12px 0 8px" }}>Bike Engine CC</div>
                <input type="number" min="50" value={bikeCc} onChange={e => setBikeCc(e.target.value)} placeholder="e.g. 150, 350, 650" style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#111", fontFamily: "'Outfit', sans-serif", fontWeight: "600" }} />
                {bikeCc && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { range: "< 200cc", charge: 500, active: Number(bikeCc) > 0 && Number(bikeCc) < 200 },
                      { range: "200–399cc", charge: 700, active: Number(bikeCc) >= 200 && Number(bikeCc) < 400 },
                      { range: "400–799cc", charge: 800, active: Number(bikeCc) >= 400 && Number(bikeCc) < 800 },
                      { range: "800cc+", charge: 1000, active: Number(bikeCc) >= 800 },
                    ].map(t => (
                      <div key={t.range} style={{ padding: "5px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", background: t.active ? "#fff7ed" : "#f3f4f6", color: t.active ? "#f97316" : "#9ca3af", border: t.active ? "1.5px solid #fed7aa" : "1.5px solid #e5e7eb" }}>
                        {t.range} — ₹{t.charge}
                      </div>
                    ))}
                  </div>
                )}
                {getTowingCharge(bikeCc) && <div style={{ marginTop: "8px", fontSize: "13px", fontWeight: "800", color: "#f97316" }}>Towing charge: ₹{getTowingCharge(bikeCc)}</div>}
              </div>
            )}
          </div>

          {routeInfo && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <div style={{ flex: 1, background: "#f9fafb", borderRadius: "12px", padding: "12px 14px", border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>Distance</div>
                <div style={{ fontSize: "17px", fontWeight: "800", color: isDisabled ? "#9ca3af" : "#f97316", marginTop: "3px" }}>{routeInfo.distanceKm} km</div>
              </div>
              <div style={{ flex: 1, background: "#f9fafb", borderRadius: "12px", padding: "12px 14px", border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>ETA</div>
                <div style={{ fontSize: "17px", fontWeight: "800", color: isDisabled ? "#9ca3af" : "#111", marginTop: "3px" }}>{isDisabled ? "—" : routeInfo.formatted}</div>
              </div>
              <div style={{ flex: 1, background: isDisabled ? "#f3f4f6" : "#fff7ed", borderRadius: "12px", padding: "12px 14px", border: isDisabled ? "1px solid #e5e7eb" : "1.5px solid #fed7aa" }}>
                <div style={{ fontSize: "9px", color: isDisabled ? "#9ca3af" : "#ea580c", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>Travel Fee</div>
                <div style={{ fontSize: "17px", fontWeight: "800", color: isDisabled ? "#9ca3af" : "#f97316", marginTop: "3px" }}>{isDisabled ? "—" : `₹${routeInfo.distanceCharge}`}</div>
              </div>
            </div>
          )}

          {routeInfo && !isFormDisabled && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Payment Mode</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["cash", "online"].map(mode => {
                  const forced = mode === "online" && requireOnlinePayment;
                  const disabled = mode === "cash" && requireOnlinePayment;
                  return (
                    <button
                      key={mode} disabled={disabled} onClick={() => !disabled && setPaymentMode(mode)}
                      style={{ flex: 1, padding: "11px 14px", borderRadius: "11px", border: paymentMode === mode ? `2px solid ${mode === "online" ? "#f97316" : "#111"}` : "2px solid #e5e7eb", background: paymentMode === mode ? (mode === "online" ? "#fff7ed" : "#111") : "#fff", color: paymentMode === mode ? (mode === "online" ? "#ea580c" : "#fff") : disabled ? "#d1d5db" : "#374151", fontSize: "13px", fontWeight: "700", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s", opacity: disabled ? 0.5 : 1 }}
                    >
                      {mode === "cash" ? <><Wallet size={16} style={{verticalAlign: 'bottom', marginRight:'4px'}}/> Cash</> : <><CreditCard size={16} style={{verticalAlign: 'bottom', marginRight:'4px'}}/> Online</>}
                      {forced && <span style={{ fontSize: "9px", display: "block", fontWeight: "600", color: "#f97316" }}>Required</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <button
              disabled={isFormDisabled} onClick={handleSeePrices}
              style={{ width: "100%", background: isFormDisabled ? "#e5e7eb" : "#111", color: isFormDisabled ? "#9ca3af" : "#fff", border: "none", borderRadius: "14px", padding: "15px", fontSize: "15px", fontWeight: "800", cursor: isFormDisabled ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: isFormDisabled ? "none" : "0 4px 20px rgba(17,17,17,0.18)", transition: "all 0.2s" }}
              onMouseEnter={e => { if (!isFormDisabled) { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,115,22,0.35)"; }}}
              onMouseLeave={e => { if (!isFormDisabled) { e.currentTarget.style.background = "#111"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(17,17,17,0.18)"; }}}
            >
              See prices
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ opacity: isFormDisabled ? 0.4 : 1, pointerEvents: isFormDisabled ? "none" : "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { val: name, set: setName, ph: "Your name", type: "text" },
                { val: phone, set: setPhone, ph: "Phone number", type: "tel" },
                { val: bikeNumber, set: setBikeNumber, ph: "Bike number (e.g. KA01AB1234)", type: "text" },
              ].map((f, i) => (
                <input
                  key={i} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} required
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "11px", fontSize: "13px", color: "#111", fontFamily: "'Outfit', sans-serif", fontWeight: "500" }}
                />
              ))}

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={acceptedTerms} onChange={e => { setAcceptedTerms(e.target.checked); if (e.target.checked) setError(""); }} style={{ width: "15px", height: "15px", accentColor: "#f97316", cursor: "pointer" }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>I agree to <a href="/Terms.html" target="_blank" rel="noopener noreferrer" style={{ color: "#f97316", fontWeight: "700", textDecoration: "none" }}>Terms & Conditions</a></span>
              </label>

              {error && <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600", background: "#fef2f2", borderRadius: "8px", padding: "9px 12px", border: "1px solid #fecaca" }}><AlertTriangle size={16} style={{ verticalAlign: "middle", marginRight: "8px" }} /> {error}</div>}

              <button
                type="submit" disabled={!acceptedTerms || isFormDisabled}
                style={{ width: "100%", padding: "15px", borderRadius: "13px", border: "none", fontSize: "14px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", cursor: acceptedTerms && !isFormDisabled ? "pointer" : "not-allowed", background: acceptedTerms && !isFormDisabled ? "#f97316" : "#e5e7eb", color: acceptedTerms && !isFormDisabled ? "#fff" : "#9ca3af", boxShadow: acceptedTerms && !isFormDisabled ? "0 4px 20px rgba(249,115,22,0.35)" : "none", transition: "all 0.2s" }}
              >
                {currentUser ? "Confirm Booking" : <span style={{ fontSize: "14px" }}><LockKeyholeOpenIcon size={16} style={{verticalAlign:'bottom', marginRight:'6px'}} /> Log in to Book</span>}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: MAP ── */}
        <div className="right-panel" style={{ flex: 1, position: "relative", minHeight: "400px" }}>
          <div id="services-map" style={{ width: "100%", height: "100%", minHeight: "400px" }} />

          {loadingLocation && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.9)", zIndex: 10, gap: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", border: "3px solid #f3f4f6", borderTop: "3px solid #f97316", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Fetching your location…</span>
            </div>
          )}

          {routeError && (
            <div style={{ position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "7px 14px", fontSize: "12px", color: "#dc2626", fontWeight: "600", zIndex: 10, whiteSpace: "nowrap" }}>⚠️ {routeError}</div>
          )}

          {routeInfo && selectedService && !isFormDisabled && (
            <div style={{ position: "absolute", bottom: "20px", left: "20px", zIndex: 1000, background: "#fff", borderRadius: "14px", padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #f0f0f0", minWidth: "200px", pointerEvents: "auto" }}>
              <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>Selected Service</div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "8px" }}>
                <span style={{ fontSize: "20px" }}>{selectedService.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#111" }}>{selectedService.label.replace(/^[^ ]+ /, "")}</div>
                  <div style={{ fontSize: "12px", color: "#f97316", fontWeight: "700" }}>{totalPrice ? `₹${totalPrice}` : "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Distance</div>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#111", marginTop: "2px" }}>{routeInfo.distanceKm} km</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>ETA</div>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#111", marginTop: "2px" }}>{routeInfo.formatted}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NEW: REDESIGNED PRICE MODAL ── */}
      {showPriceModal && selectedService && routeInfo && (
        <div
          onClick={() => { if (!bookingConfirmed) setShowPriceModal(false); }}
          style={{
            position: "fixed", inset: 0, 
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
            zIndex: 10000, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "24px", padding: "32px",
              maxWidth: "400px", width: "100%",maxHeight: "95vh", overflowY: "auto", scrollbarWidth: "none",
              boxShadow: "0 24px 80px rgba(0,0,0,0.15)",
              animation: "modalIn 0.25s cubic-bezier(.4,0,.2,1)",
            }}
          >
            {!bookingConfirmed ? (
              /* ── PRE-CONFIRM VIEW ── */
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    {selectedService.value === 'towing' ? <Truck size={32}/> : selectedService.value === 'petrol' ? <Fuel size={32}/> : <Wrench size={32}/>}
                  </div>
                  <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#111", margin: "0 0 4px 0" }}>Price Breakdown</h2>
                  <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>{selectedService.label.replace(/^[^ ]+ /, "")}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {[
                    {
                      label: selectedService.value === "petrol"
                        ? `Petrol charge (${petrolLitres}L × ₹100)`
                        : selectedService.value === "towing"
                        ? `Towing charge (${bikeCc}cc bike)`
                        : "Service base charge",
                      value: `₹${serviceCharge}`,
                    },
                    {
                      label: `Distance charge (${routeInfo.distanceKm} km × ₹${RATE_PER_KM}/km)`,
                      value: `₹${routeInfo.distanceCharge}`,
                    },
                    { label: "ETA", value: routeInfo.formatted },
                    { 
                      label: "Payment mode", 
                      value: paymentMode === "online" ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={16} color="#0284c7" /> Online</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Wallet size={16} color="#16a34a" /> Cash</span>
                      )
                    },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px", background: "#fff",
                      borderRadius: "12px", border: "1px solid #f3f4f6",
                    }}>
                      <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "700" }}>{row.label}</span>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: "#111" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "20px", background: "#fffaf5",
                  borderRadius: "16px", border: "2px solid #fed7aa", marginBottom: "24px",
                }}>
                  <span style={{ fontSize: "18px", fontWeight: "900", color: "#111" }}>Total</span>
                  <span style={{ fontSize: "24px", fontWeight: "900", color: "#f97316" }}>₹{totalPrice}</span>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setShowPriceModal(false)}
                    style={{
                      flex: 1, padding: "16px", borderRadius: "12px",
                      border: "2px solid #e5e7eb", background: "#fff",
                      fontSize: "15px", fontWeight: "800", cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif", color: "#6b7280",
                      transition: "0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    style={{
                      flex: 2, padding: "16px", borderRadius: "12px", border: "none",
                      background: "#f97316", color: "#fff",
                      fontSize: "15px", fontWeight: "800", cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      boxShadow: "0 4px 16px rgba(249,115,22,0.25)",
                      transition: "0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    Confirm — ₹{totalPrice}
                  </button>
                </div>
              </>
            ) : (
              /* ── POST-CONFIRM VIEW ── */
              <div style={{ textAlign: "center" }}>
                {paymentMode === "online" ? (
                  <>
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#eff6ff", border: "3px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 16px", animation: "checkIn 0.4s cubic-bezier(.4,0,.2,1)" }}>📞</div>
                    <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#111", margin: "0 0 8px" }}>Booking Received!</h2>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>Our team will contact you within <span style={{ color: "#f97316", fontWeight: "800" }}>4 minutes</span> to confirm payment and dispatch your service.</p>

                    <div style={{ background: "#f9fafb", borderRadius: "14px", padding: "16px", marginBottom: "20px", border: "1px solid #f0f0f0", textAlign: "left" }}>
                      {[
                        { icon: <Hash size={16}/>, label: "Booking ID", value: displayId },
                        { icon: <Wrench size={16}/>, label: "Service", value: selectedService.label.replace(/^[^ ]+ /, "") },
                        { icon: <CreditCard size={16}/>, label: "Total", value: `₹${totalPrice}` },
                        { icon: <Clock size={16}/>, label: "ETA", value: routeInfo.formatted },
                      ].map((row, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                          <span style={{ fontSize: "16px", width: "24px", textAlign: "center", color: '#475569' }}>{row.icon}</span>
                          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", flex: 1 }}>{row.label}</span>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: i === 0 ? "#f97316" : "#111" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s ease-in-out infinite" }} />
                      <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "700" }}>Connecting you with our team…</span>
                    </div>

                    <button onClick={() => { setShowPriceModal(false); setBookingConfirmed(false); }} style={{ width: "100%", padding: "14px", borderRadius: "11px", border: "none", background: "#111", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Done</button>
                  </>
                ) : (
                  <>
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#f0fdf4", border: "3px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 16px", animation: "checkIn 0.4s cubic-bezier(.4,0,.2,1)" }}>✅</div>
                    <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#111", margin: "0 0 8px" }}>Booking Confirmed!</h2>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>Your service is on the way. Keep <span style={{ color: "#f97316", fontWeight: "800" }}>₹{totalPrice}</span> ready for cash payment on arrival.</p>

                    <div style={{ background: "#f9fafb", borderRadius: "14px", padding: "16px", marginBottom: "20px", border: "1px solid #f0f0f0", textAlign: "left" }}>
                      {[
                        { icon: <Hash size={16}/>, label: "Booking ID", value: displayId },
                        { icon: <Wrench size={16}/>, label: "Service", value: selectedService.label.replace(/^[^ ]+ /, "") },
                        { icon: <Wallet size={16}/>, label: "Total (Cash)", value: `₹${totalPrice}` },
                        { icon: <Clock size={16}/>, label: "ETA", value: routeInfo.formatted },
                      ].map((row, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                          <span style={{ fontSize: "16px", width: "24px", textAlign: "center", color: '#475569' }}>{row.icon}</span>
                          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", flex: 1 }}>{row.label}</span>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: i === 0 ? "#f97316" : "#111" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => { setShowPriceModal(false); setBookingConfirmed(false); }} style={{ width: "100%", padding: "14px", borderRadius: "11px", border: "none", background: "#22c55e", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 4px 16px rgba(34,197,94,0.35)" }}>Done</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

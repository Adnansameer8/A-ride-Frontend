import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { useAuth } from '../../Authcontext';
import {
  LockIcon, LockKeyholeOpenIcon, CreditCard, RefreshCwIcon, Wallet, Fuel,
  Truck, Wrench, Battery, Settings, Hash, AlertTriangle, Clock, Zap, Package,
  MapPin, Navigation, CheckCircle, Star, X, Move, Search, Palette
} from "lucide-react";

// ─── Silence OSRM console warning ───────────────────────────────────────────
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

// ─── Fallback config (no location fallback) ─────────────────────────────────
const FALLBACK_CONFIG = {
  ratePerKm: 10,
  unserviceableKm: 70,
  disabledKm: 700,
  onlinePaymentThresholdKm: 5,
  fixedLocation: { lat: 12.89806, lng: 77.61442 },
  hubLocations: [],
};

const FALLBACK_SERVICES = [
  { value: "petrol", label: "Petrol Delivery", icon: "fuel", desc: "Fuel delivered to your spot", pricing: "per_litre", pricePerUnit: 100, enabled: true },
  { value: "towing", label: "Towing Service", icon: "truck", desc: "Vehicle towed to nearest garage", pricing: "per_cc", ccTiers: [{ maxCc: 199, charge: 500 }, { maxCc: 399, charge: 700 }, { maxCc: 799, charge: 800 }, { maxCc: 99999, charge: 1000 }], enabled: true },
  { value: "mechanic", label: "Mechanic On Spot", icon: "wrench", desc: "Expert mechanic at your location", pricing: "fixed", baseCharge: 500, enabled: true },
  { value: "battery", label: "Electric Battery", icon: "battery", desc: "Battery jump-start or replacement", pricing: "fixed", baseCharge: 500, enabled: true },
  { value: "autospare", label: "Auto Spare Parts", icon: "settings", desc: "Spare parts delivered instantly", pricing: "fixed", baseCharge: 500, enabled: true },
];

// ─── Hub accent colours (cycles) ─────────────────────────────────────────────
const HUB_COLORS = [
  { dot: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: "#ea580c" },
  { dot: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  { dot: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", text: "#047857" },
  { dot: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" },
  { dot: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8", text: "#be185d" },
];

// ─── Map line colours matching hub colours ────────────────────────────────────
const LINE_COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

// ─── Bangalore bounding box (viewbox) ────────────────────────────────────────
const BANGALORE_VIEWBOX = "77.4,12.8,77.7,13.1";

// ─── Haversine distance ───────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Icon renderer ────────────────────────────────────────────────────────────
const IconMap = {
  fuel: <Fuel size={18} />, truck: <Truck size={18} />, wrench: <Wrench size={18} />,
  battery: <Battery size={18} />, settings: <Settings size={18} />,
  zap: <Zap size={18} />, package: <Package size={18} />,
};
const ServiceIcon = ({ icon, customEmoji, size = 18 }) => {
  if (customEmoji) return <span style={{ fontSize: size + 2, lineHeight: 1 }}>{customEmoji}</span>;
  const el = IconMap[icon];
  if (!el) return <Wrench size={size} />;
  return React.cloneElement(el, { size });
};

// ─── Bike number formatter / validator ────────────────────────────────────────
const BIKE_NUMBER_REGEX = /^[A-Z]{2}\s?-?\s?\d{2}\s?-?\s?[A-Z]{1,3}\s?-?\s?\d{4}$/i;
const validateBikeNumber = (val) => BIKE_NUMBER_REGEX.test(val.replace(/\s/g, '').toUpperCase());
const formatBikeNumber = (val) => {
  const c = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length <= 2) return c;
  if (c.length <= 4) return `${c.slice(0, 2)}-${c.slice(2)}`;
  if (c.length <= 7) return `${c.slice(0, 2)}-${c.slice(2, 4)}-${c.slice(4)}`;
  return `${c.slice(0, 2)}-${c.slice(2, 4)}-${c.slice(4, c.length - 4)}-${c.slice(-4)}`;
};

const PHONE_REGEX = /^[6-9]\d{9}$/;

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "N/A";
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function getTowingCharge(cc, tiers) {
  const n = Number(cc);
  if (!n || isNaN(n) || !tiers?.length) return null;
  const sorted = [...tiers].sort((a, b) => a.maxCc - b.maxCc);
  for (const tier of sorted) { if (n <= tier.maxCc) return tier.charge; }
  return sorted[sorted.length - 1].charge;
}

// ─── Auth Modal ──────────────────────────────────────────────────────────────
function AuthModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px", padding: "40px", maxWidth: "400px", width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", animation: "modalIn 0.25s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
        <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#111", margin: "0 0 12px" }}>Authentication Required</h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 30px", lineHeight: 1.5 }}>Please log in to your A-RIDE account to confirm this booking and track your mechanic.</p>
        <button onClick={() => navigate('/login')} style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: "#f97316", color: "#fff", fontSize: "16px", fontWeight: "800", cursor: "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: "0 4px 16px rgba(249,115,22,0.35)", marginBottom: "16px" }}>
          Go to Sign In
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Hub Selection Modal ──────────────────────────────────────────────────────
function HubSelectionModal({ hubs, coords, hubRouteInfoMap, selectedHubId, onSelect, onClose }) {
  const hubsWithDist = useMemo(() => {
    return hubs
      .map((h, i) => {
        const lat = parseFloat(h.lat), lng = parseFloat(h.lng);
        const routeDist = hubRouteInfoMap[h.id]?.distanceKm ?? null;
        const dist = routeDist !== null ? routeDist :
          (!isNaN(lat) && !isNaN(lng) && coords)
            ? parseFloat(haversine(coords.lat, coords.lng, lat, lng).toFixed(2))
            : null;
        return { ...h, _dist: dist, _colorIdx: i % HUB_COLORS.length };
      })
      .sort((a, b) => {
        if (a._dist === null) return 1;
        if (b._dist === null) return -1;
        return a._dist - b._dist;
      });
  }, [hubs, coords, hubRouteInfoMap]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 15000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px", padding: "28px", maxWidth: "440px", width: "100%", maxHeight: "85vh", overflowY: "auto", scrollbarWidth: "none", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", animation: "modalIn 0.25s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#fff7ed", border: "2px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Navigation size={24} color="#f97316" />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#111", margin: "0 0 6px" }}>Choose a Service Hub</h2>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Select the hub to dispatch from. Nearest shown first.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {hubsWithDist.map((hub, idx) => {
            const col = HUB_COLORS[hub._colorIdx];
            const isSelected = selectedHubId === hub.id;
            const isNearest = idx === 0;
            const ri = hubRouteInfoMap[hub.id];
            return (
              <button key={hub.id} onClick={() => onSelect(hub)}
                style={{ width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: "14px", border: `2px solid ${isSelected ? col.dot : '#e5e7eb'}`, background: isSelected ? col.bg : "#fff", cursor: "pointer", transition: "all 0.18s", fontFamily: "'Outfit', sans-serif", boxShadow: isSelected ? `0 4px 16px ${col.dot}22` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: col.bg, border: `2px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPin size={18} color={col.dot} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: "#111" }}>{hub.name}</span>
                      {isNearest && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa", borderRadius: "8px", padding: "2px 7px", fontSize: "10px", fontWeight: "700" }}>
                          <Star size={9} /> Nearest
                        </span>
                      )}
                      {isSelected && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: col.bg, color: col.dot, border: `1px solid ${col.border}`, borderRadius: "8px", padding: "2px 7px", fontSize: "10px", fontWeight: "700" }}>
                          <CheckCircle size={9} /> Selected
                        </span>
                      )}
                    </div>
                    {hub.address && <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hub.address}</div>}
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      {hub._dist !== null && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: col.bg, color: col.text, border: `1px solid ${col.border}`, borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: "700" }}>
                          <MapPin size={10} /> {hub._dist} km away
                        </span>
                      )}
                      {ri?.formatted && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: "700" }}>
                          <Clock size={10} /> {ri.formatted}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <CheckCircle size={20} color={col.dot} style={{ flexShrink: 0 }} />}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: "16px", padding: "13px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'Outfit', sans-serif", color: "#6b7280" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Manual Location Modal – read‑only map, Bangalore‑only search, fixed cleanup ──
function ManualLocationModal({ onClose, onSave, initialCoords }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState(initialCoords || { lat: 12.9716, lng: 77.5946 });
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const debounceTimeout = useRef(null);
  const containerId = "manual-map";

  const locationIQToken = import.meta.env.VITE_LOCATIONIQ_TOKEN;

  // Autocomplete search with LocationIQ – restricted to Bangalore
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!searchQuery.trim() || !locationIQToken) return;

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api.locationiq.com/v1/autocomplete.php?key=${locationIQToken}&q=${encodeURIComponent(searchQuery)}&format=json&limit=8&viewbox=${BANGALORE_VIEWBOX}&bounded=1&countrycodes=in`;
        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) setSuggestions(data);
        else setSuggestions([]);
      } catch (err) {
        console.error("LocationIQ autocomplete error:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchQuery, locationIQToken]);

  const handleSuggestionClick = async (suggestion) => {
    if (!locationIQToken) return;
    setLoading(true);
    try {
      const url = `https://api.locationiq.com/v1/search.php?key=${locationIQToken}&q=${encodeURIComponent(suggestion.display_name)}&format=json&limit=1&viewbox=${BANGALORE_VIEWBOX}&bounded=1&countrycodes=in`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCoords({ lat, lng });
        setSearchQuery(suggestion.display_name);
        setSuggestions([]);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        }
      } else {
        // Fallback to OSM Nominatim
        const fbUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(suggestion.display_name)}&format=json&limit=1&viewbox=${BANGALORE_VIEWBOX}&bounded=1&countrycodes=in`;
        const fbRes = await fetch(fbUrl, { headers: { 'User-Agent': 'A-Ride-App/1.0' } });
        const fbData = await fbRes.json();
        if (fbData && fbData[0]) {
          const lat = parseFloat(fbData[0].lat);
          const lng = parseFloat(fbData[0].lon);
          setCoords({ lat, lng });
          setSearchQuery(suggestion.display_name);
          setSuggestions([]);
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
            if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          }
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Leaflet map – with proper cleanup
  useEffect(() => {
    // Clean up any existing map instance before creating new one
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check if container already has a leaflet map instance (from previous unmounted modal)
    if (container._leaflet_id) {
      try {
        const existingMap = L.DomUtil.get(container);
        if (existingMap && existingMap._leaflet_id) {
          existingMap.remove();
        }
      } catch (e) {
        console.warn("Error removing existing map", e);
      }
    }

    const map = L.map(containerId).setView([coords.lat, coords.lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    const marker = L.marker([coords.lat, coords.lng], { draggable: false }).addTo(map);
    markerRef.current = marker;
    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // empty deps – run only on mount

  // Update marker position when coords change (from suggestion)
  useEffect(() => {
    if (mapRef.current && markerRef.current && coords) {
      mapRef.current.setView([coords.lat, coords.lng], 15);
      markerRef.current.setLatLng([coords.lat, coords.lng]);
    }
  }, [coords]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", animation: "modalIn 0.25s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", margin: 0 }}>Set your location (Bengaluru only)</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "8px 12px", background: "#fff" }}>
              <Search size={18} color="#9ca3af" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search for any Bengaluru location (e.g. Jayanagar, RV College...)" style={{ flex: 1, border: "none", padding: "8px 12px", fontSize: "14px", outline: "none" }} />
              {loading && <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid #e5e7eb", borderTop: "2px solid #f97316", animation: "spin 0.6s linear infinite" }} />}
            </div>
            {suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                {suggestions.map((sug, idx) => (
                  <div key={idx} onClick={() => handleSuggestionClick(sug)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontSize: "13px" }}>
                    <div style={{ fontWeight: "500" }}>{sug.display_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: "16px", borderRadius: "16px", overflow: "hidden", border: "2px solid #e5e7eb", height: "280px" }}>
            <div id={containerId} style={{ width: "100%", height: "100%" }}></div>
          </div>
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={14} /> Marker shows the selected location. Search above to change.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "#fff", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { onSave(coords); onClose(); }} style={{ flex: 2, padding: "12px", borderRadius: "12px", background: "#f97316", color: "#fff", border: "none", fontWeight: "800", cursor: "pointer" }}>Use this location</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Services() {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, logout } = useAuth();
  const authLoading = false;

  const [svcConfig, setSvcConfig] = useState(FALLBACK_CONFIG);
  const [services, setServices] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [coords, setCoords] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [showManualLocationModal, setShowManualLocationModal] = useState(false);

  const [hubRouteInfoMap, setHubRouteInfoMap] = useState({});
  const [selectedHub, setSelectedHub] = useState(null);
  const [userPickedHub, setUserPickedHub] = useState(false);
  const [showHubModal, setShowHubModal] = useState(false);

  const [selectedService, setSelectedService] = useState(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [petrolLitres, setPetrolLitres] = useState("");
  const [bikeCc, setBikeCc] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bikeNumber, setBikeNumber] = useState("");
  const [bikeName, setBikeName] = useState("");
  const [bikeColor, setBikeColor] = useState("#f97316");
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [description, setDescription] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [modalValidationError, setModalValidationError] = useState("");

  const anyModalOpen = showPriceModal || showAuthModal || showHubModal || showManualLocationModal;

  const mapRef = useRef(null);
  const routingRefs = useRef({});
  const serviceDropRef = useRef(null);

  const RATE_PER_KM = svcConfig.ratePerKm;
  const UNSERVICEABLE_KM = svcConfig.unserviceableKm;
  const DISABLED_KM = svcConfig.disabledKm;
  const ONLINE_THRESHOLD_KM = svcConfig.onlinePaymentThresholdKm;

  const DEFAULT_HUB = {
    id: 'default-modzilla',
    name: 'Modzilla Tech Garage',
    address: 'Default Service Hub',
    lat: svcConfig.fixedLocation.lat,
    lng: svcConfig.fixedLocation.lng,
    enabled: true,
    isDefault: true,
  };

  const activeHubs = useMemo(() => {
    const hubs = (svcConfig.hubLocations || []).filter(h => h.enabled);
    const alreadyHasDefault = hubs.some(h => h.id === DEFAULT_HUB.id);
    return hubs.length > 0 ? (alreadyHasDefault ? hubs : [...hubs, DEFAULT_HUB]) : [DEFAULT_HUB];
  }, [svcConfig]);

  const nearestHub = useMemo(() => {
    if (!coords || !activeHubs.length) return null;
    const withDist = activeHubs.map(h => {
      const roadDist = hubRouteInfoMap[h.id]?.distanceKm ?? null;
      const hDist = haversine(coords.lat, coords.lng, parseFloat(h.lat), parseFloat(h.lng));
      return { hub: h, dist: roadDist !== null ? roadDist : hDist };
    });
    withDist.sort((a, b) => a.dist - b.dist);
    return withDist[0]?.hub ?? null;
  }, [coords, activeHubs, hubRouteInfoMap]);

  const routeInfo = selectedHub ? hubRouteInfoMap[selectedHub.id] : null;
  const distKm = routeInfo?.distanceKm ?? 0;
  const isUnserviceable = distKm > UNSERVICEABLE_KM && distKm <= DISABLED_KM;
  const isDisabled = distKm > DISABLED_KM;
  const requireOnlinePayment = distKm > ONLINE_THRESHOLD_KM;
  const isFormDisabled = isUnserviceable || isDisabled;
  const currentDistanceCharge = routeInfo ? Math.round(routeInfo.distanceKm * RATE_PER_KM) : 0;

  const selectedHubColor = selectedHub
    ? HUB_COLORS[activeHubs.findIndex(h => h.id === selectedHub.id) % HUB_COLORS.length]
    : HUB_COLORS[0];

  // Predefined bike colours (5)
  const presetColors = ["#111111", "#f97316", "#3b82f6", "#10b981", "#ec4899"];

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || currentUser.fullName || "");
      setPhone(currentUser.phone || currentUser.phoneNumber || "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!coords || !activeHubs.length || userPickedHub || selectedHub) return;
    const withDist = activeHubs.map(h => ({
      hub: h,
      dist: haversine(coords.lat, coords.lng, parseFloat(h.lat), parseFloat(h.lng))
    }));
    withDist.sort((a, b) => a.dist - b.dist);
    setSelectedHub(withDist[0].hub);
  }, [coords, activeHubs]);

  useEffect(() => {
    if (!selectedHub || !coords || !mapRef.current) return;
    drawRouteToHub(mapRef.current, coords, selectedHub, activeHubs);
  }, [selectedHub]);

  useEffect(() => { if (requireOnlinePayment) setPaymentMode("online"); }, [requireOnlinePayment]);

  useEffect(() => {
    if (nearestHub && !userPickedHub) setSelectedHub(nearestHub);
  }, [nearestHub, userPickedHub]);

  useEffect(() => {
    if (configLoaded && coords) buildMap(coords, activeHubs);
  }, [configLoaded, activeHubs.length]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [svcRes, cfgRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/services/config`, { cache: 'no-store' }),
          fetch(`${import.meta.env.VITE_API_URL}/services/settings`, { cache: 'no-store' }),
        ]);
        if (svcRes.ok) {
          const d = await svcRes.json();
          setServices((d.success && d.services?.length) ? d.services.filter(s => s.enabled) : FALLBACK_SERVICES.filter(s => s.enabled));
        } else { setServices(FALLBACK_SERVICES.filter(s => s.enabled)); }
        if (cfgRes.ok) {
          const d = await cfgRes.json();
          if (d.success && d.config) setSvcConfig({ ...FALLBACK_CONFIG, ...d.config, hubLocations: d.config.hubLocations || [] });
        }
      } catch {
        setServices(FALLBACK_SERVICES.filter(s => s.enabled));
      } finally { setConfigLoaded(true); }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const h = (e) => { if (serviceDropRef.current && !serviceDropRef.current.contains(e.target)) setServiceOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const drawRouteToHub = (map, c, hub, allHubs) => {
    Object.values(routingRefs.current).forEach(ctrl => {
      try { ctrl.setWaypoints([]); if (map) map.removeControl(ctrl); } catch { }
    });
    routingRefs.current = {};

    const lat = parseFloat(hub.lat), lng = parseFloat(hub.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const idx = allHubs.findIndex(h => h.id === hub.id);
    const col = LINE_COLORS[Math.max(0, idx) % LINE_COLORS.length];

    const control = L.Routing.control({
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1", profile: "driving" }),
      waypoints: [L.latLng(c.lat, c.lng), L.latLng(lat, lng)],
      lineOptions: { styles: [{ color: col, weight: 5, opacity: 1 }] },
      addWaypoints: false, routeWhileDragging: false,
      fitSelectedRoutes: false, showAlternatives: false, show: false,
    })
      .on("routesfound", (e) => {
        const s = e?.routes?.[0]?.summary;
        if (!s) return;
        const dKm = s.totalDistance / 1000;
        setHubRouteInfoMap(prev => ({
          ...prev,
          [hub.id]: {
            distanceKm: Number(dKm.toFixed(2)),
            formatted: formatTime(s.totalTime),
            distanceCharge: Math.round(dKm * RATE_PER_KM),
            _routeLoaded: true,
          }
        }));
      })
      .on("routingerror", () => {
        const d = map.distance([c.lat, c.lng], [lat, lng]) / 1000;
        setHubRouteInfoMap(prev => ({
          ...prev,
          [hub.id]: {
            distanceKm: Number(d.toFixed(2)),
            formatted: formatTime((d / 40) * 3600),
            distanceCharge: Math.round(d * RATE_PER_KM),
            _routeLoaded: false,
          }
        }));
      })
      .addTo(map);

    routingRefs.current[hub.id] = control;
    setTimeout(() => {
      document.querySelectorAll(".leaflet-routing-container").forEach(el => el.style.display = "none");
    }, 600);
  };

  const buildMap = (c, hubs) => {
    const mapContainer = document.getElementById("services-map");
    if (!mapContainer) return;

    Object.values(routingRefs.current).forEach(ctrl => {
      try { ctrl.setWaypoints([]); if (mapRef.current) mapRef.current.removeControl(ctrl); } catch { }
    });
    routingRefs.current = {};

    if (mapRef.current) { try { mapRef.current.remove(); } catch { } mapRef.current = null; }
    setHubRouteInfoMap({});
    setUserPickedHub(false);
    setSelectedHub(null);

    const map = L.map("services-map", { preferCanvas: true, zoomControl: true }).setView([c.lat, c.lng], 12);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);

    const userIcon = L.divIcon({ className: "", html: `<div style="width:14px;height:14px;background:#f97316;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(249,115,22,0.35);"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });
    L.marker([c.lat, c.lng], { icon: userIcon }).addTo(map).bindPopup("<b style='color:#f97316'>📍 Your Location</b>").openPopup();

    hubs.forEach((hub, idx) => {
      const lat = parseFloat(hub.lat), lng = parseFloat(hub.lng);
      if (isNaN(lat) || isNaN(lng)) return;
      const col = LINE_COLORS[idx % LINE_COLORS.length];
      const hubIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:${col};border-radius:3px;border:3px solid #fff;box-shadow:0 0 0 3px ${col}66;"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
      });
      L.marker([lat, lng], { icon: hubIcon }).addTo(map).bindPopup(`<b style="color:${col}">🔧 ${hub.name}</b>`);
    });

    const routeTarget = selectedHub ?? hubs.reduce((best, h) => {
      const d = haversine(c.lat, c.lng, parseFloat(h.lat), parseFloat(h.lng));
      const bd = haversine(c.lat, c.lng, parseFloat(best.lat), parseFloat(best.lng));
      return d < bd ? h : best;
    }, hubs[0]);

    if (routeTarget) drawRouteToHub(map, c, routeTarget, hubs);
  };

  // Location acquisition – GPS only, no IP fallback
  const acquireLocation = async () => {
    setLoadingLocation(true);
    setLocationErrorMsg("");
    setCoords(null);

    const getGPS = () => new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, source: "gps" }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });

    try {
      const gpsCoords = await getGPS();
      setCoords(gpsCoords);
      buildMap(gpsCoords, activeHubs);
      setLocationErrorMsg("");
    } catch (gpsErr) {
      console.warn("GPS failed:", gpsErr);
      setLocationErrorMsg("Could not detect your location. Please set it manually.");
      setShowManualLocationModal(true);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleManualLocationSave = (manualCoords) => {
    setCoords({ ...manualCoords, source: "manual", accuracy: null });
    buildMap(manualCoords, activeHubs);
    setLocationErrorMsg("");
  };

  useEffect(() => { acquireLocation(); }, []);

  const getServiceCharge = () => {
    if (!selectedService) return null;
    if (selectedService.pricing === "per_litre") { const l = Number(petrolLitres); return l > 0 ? l * (selectedService.pricePerUnit || 100) : null; }
    if (selectedService.pricing === "per_cc") return getTowingCharge(bikeCc, selectedService.ccTiers);
    return selectedService.baseCharge;
  };

  const serviceCharge = getServiceCharge();
  const totalPrice = serviceCharge != null && routeInfo ? serviceCharge + currentDistanceCharge : null;

  const validateAll = () => {
    const errs = {};
    if (!selectedService) { setError("Please select a service"); return false; }
    if (selectedService.pricing === "per_litre" && !(Number(petrolLitres) > 0)) { setError("Enter litres needed"); return false; }
    if (selectedService.pricing === "per_cc" && !getTowingCharge(bikeCc, selectedService.ccTiers)) { setError("Enter valid bike CC"); return false; }
    if (!selectedHub) { setError("Please select a service hub"); return false; }

    if (!name.trim()) errs.name = "Name is required";
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) errs.phone = "Phone number is required";
    else if (!PHONE_REGEX.test(cleanPhone)) errs.phone = "Enter a valid 10-digit Indian mobile number";
    if (!bikeNumber.trim()) errs.bikeNumber = "Bike number is required";
    else if (!validateBikeNumber(bikeNumber)) errs.bikeNumber = "Use format: KA-05-KM-4512";
    if (!bikeName.trim()) errs.bikeName = "Bike model name is required";
    if (!bikeColor) errs.bikeColor = "Bike colour is required";
    if (!description.trim()) errs.description = "Please describe your issue briefly";

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Please fix the errors below");
      return false;
    }
    if (!acceptedTerms) {
      setError("Please accept Terms & Conditions");
      return false;
    }
    setError("");
    return true;
  };

  const handleSeePrices = () => {
    if (!selectedService) { setError("Please select a service first"); return; }
    if (selectedService.pricing === "per_litre" && !(Number(petrolLitres) > 0)) { setError("Enter litres needed"); return; }
    if (selectedService.pricing === "per_cc" && !getTowingCharge(bikeCc, selectedService.ccTiers)) { setError("Enter valid bike CC"); return; }
    if (!routeInfo) { setError("Waiting for route…"); return; }
    setError(""); setBookingConfirmed(false); setShowPriceModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    setBookingConfirmed(false); setShowPriceModal(true);
  };

  const saveBookingToDatabase = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const mapsLink = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : null;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customerName: name, phone, email: currentUser?.email || "",
          type: `Service - ${selectedService?.label}`,
          price: totalPrice,
          details: {
            bikeNumber, bikeName, bikeColor, description, paymentMode,
            distanceKm: routeInfo?.distanceKm, eta: routeInfo?.formatted, locationLink: mapsLink,
            hubId: selectedHub?.id, hubName: selectedHub?.name,
            extraDetails: selectedService?.pricing === 'per_litre' ? `${petrolLitres}L` : selectedService?.pricing === 'per_cc' ? `${bikeCc}cc` : 'N/A',
          }
        })
      });
      const data = await response.json();
      return data.success ? data.booking : null;
    } catch { return null; }
  };

  const handleModalConfirm = async () => {
    // Re-validate all fields and show error inside modal if any
    const errs = {};
    if (!selectedService) errs.service = "Please select a service";
    if (selectedService?.pricing === "per_litre" && !(Number(petrolLitres) > 0)) errs.service = "Enter litres needed";
    if (selectedService?.pricing === "per_cc" && !getTowingCharge(bikeCc, selectedService.ccTiers)) errs.service = "Enter valid bike CC";
    if (!selectedHub) errs.hub = "Please select a service hub";
    if (!name.trim()) errs.name = "Name is required";
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) errs.phone = "Phone number is required";
    else if (!PHONE_REGEX.test(cleanPhone)) errs.phone = "Enter a valid 10-digit Indian mobile number";
    if (!bikeNumber.trim()) errs.bikeNumber = "Bike number is required";
    else if (!validateBikeNumber(bikeNumber)) errs.bikeNumber = "Use format: KA-05-KM-4512";
    if (!bikeName.trim()) errs.bikeName = "Bike model name is required";
    if (!bikeColor) errs.bikeColor = "Bike colour is required";
    if (!description.trim()) errs.description = "Please describe your issue briefly";
    if (!acceptedTerms) errs.terms = "Please accept Terms & Conditions";

    if (Object.keys(errs).length > 0) {
      setModalValidationError(Object.values(errs)[0]);
      return;
    }
    setModalValidationError("");

    if (!currentUser) { setShowAuthModal(true); return; }
    const bookingResult = await saveBookingToDatabase();
    if (bookingResult) { setConfirmedBooking(bookingResult); setBookingConfirmed(true); }
    else setModalValidationError("Something went wrong saving your booking. Please try again.");
  };

  const resetForm = () => {
    setSelectedService(null); setPetrolLitres(""); setBikeCc("");
    setBikeNumber(""); setBikeName(""); setBikeColor("#f97316");
    setDescription(""); setAcceptedTerms(false); setPaymentMode("cash");
    setError(""); setFieldErrors({}); setModalValidationError("");
    setShowPriceModal(false); setBookingConfirmed(false); setConfirmedBooking(null);
    if (currentUser) {
      setName(currentUser.name || currentUser.fullName || "");
      setPhone(currentUser.phone || currentUser.phoneNumber || "");
    } else { setName(""); setPhone(""); }
  };

  const displayId = confirmedBooking?.id ? `BKG-${confirmedBooking.id.split('-')[0].toUpperCase()}` : 'N/A';

  const FieldError = ({ field }) => fieldErrors[field] ? (
    <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "600", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
      <AlertTriangle size={11} /> {fieldErrors[field]}
    </div>
  ) : null;

  const locationLabel = () => {
    if (loadingLocation) return "Detecting location…";
    if (coords?.source === "gps") return "📍 Your location (GPS)";
    if (coords?.source === "manual") return "📍 Manually set location";
    return "📍 Location not set";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Outfit', sans-serif", paddingTop: "2px", boxSizing: "border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .leaflet-routing-container { display: none !important; }
        input:focus, textarea:focus { outline: none; border-color: #f97316 !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
        input::placeholder { color: #c4c9d4; }
        @media (max-width: 900px) {
          .main-grid { flex-direction: column !important; }
          .left-panel { max-width: 100% !important; flex: none !important; padding: 24px !important; }
          .right-panel { height: 350px !important; }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes checkIn { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
      `}</style>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showHubModal && (
        <HubSelectionModal
          hubs={activeHubs} coords={coords} hubRouteInfoMap={hubRouteInfoMap}
          selectedHubId={selectedHub?.id}
          onSelect={(hub) => { setSelectedHub(hub); setUserPickedHub(true); setShowHubModal(false); }}
          onClose={() => setShowHubModal(false)}
        />
      )}
      {showManualLocationModal && (
        <ManualLocationModal
          onClose={() => setShowManualLocationModal(false)}
          onSave={handleManualLocationSave}
          initialCoords={coords || { lat: 12.9716, lng: 77.5946 }}
        />
      )}

      <div className="main-grid" style={{ display: "flex", width: "100%", minHeight: "calc(100vh - 59px)" }}>
        {/* LEFT PANEL */}
        <div className="left-panel" style={{
          flex: "0 0 590px", maxWidth: "590px", background: "#ffffff",
          padding: "40px 40px 40px 48px", display: "flex", flexDirection: "column",
          justifyContent: "flex-start", borderRight: "1px solid #f0f0f0",
          boxSizing: "border-box", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: "50px", padding: "5px 14px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#ea580c", letterSpacing: "2px", textTransform: "uppercase" }}>Services</span>
            </div>
            {!authLoading && (currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser.displayName || currentUser.email?.split("@")[0]}
                </span>
                <button onClick={() => logout()} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", fontWeight: "700", color: "#9ca3af", cursor: "pointer" }}>Sign out</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>Log In</button>
            ))}
          </div>

          <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: "900", color: "#111", lineHeight: 1.1, margin: "0 0 8px 0", letterSpacing: "-1.5px" }}>
            NEVER RIDE <br /><span style={{ color: "#f97316" }}>ALONE.</span>
          </h1>
          <p style={{ fontSize: "15px", color: "#4b5563", margin: "0 0 24px 0", lineHeight: 1.8, fontWeight: "500", letterSpacing: "0.4px" }}>
            The open road is unpredictable, but your journey doesn't have to be. From emergency fuel drops to heavy-duty towing and expert on-the-spot repairs, our elite mechanic network is on standby.
          </p>

          {!currentUser && !authLoading && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: "14px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <LockIcon size={18} color="#92400e" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "800", color: "#92400e", marginBottom: "2px" }}>Login required to confirm</div>
                <div style={{ fontSize: "11px", color: "#b45309" }}>You can see prices without logging in.</div>
              </div>
            </div>
          )}

          {isUnserviceable && (
            <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🚫</span>
              <div><div style={{ fontSize: "13px", fontWeight: "800", color: "#dc2626", marginBottom: "3px" }}>Currently Unserviceable</div><div style={{ fontSize: "12px", color: "#ef4444", lineHeight: 1.5 }}>Your location ({routeInfo?.distanceKm} km) is beyond our {UNSERVICEABLE_KM} km service radius. We're expanding soon!</div></div>
            </div>
          )}
          {isDisabled && (
            <div style={{ background: "#f3f4f6", border: "1.5px solid #d1d5db", borderRadius: "14px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📍</span>
              <div><div style={{ fontSize: "13px", fontWeight: "800", color: "#6b7280", marginBottom: "3px" }}>Out of Service Range</div><div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 }}>You are {routeInfo?.distanceKm} km away — too far for our service.</div></div>
            </div>
          )}
          {requireOnlinePayment && !isFormDisabled && (
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "12px", padding: "11px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={16} color="#1d4ed8" />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#1d4ed8" }}>Online payment required for distances over {ONLINE_THRESHOLD_KM} km</span>
            </div>
          )}

          <div style={{ background: "#fff", border: "2px solid #e5e7eb", borderRadius: "20px", overflow: "visible", marginBottom: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.07)", opacity: isFormDisabled ? 0.5 : 1, pointerEvents: isFormDisabled ? "none" : "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: "1.5px solid #f3f4f6", flexWrap: "wrap" }}>
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: coords?.source === "gps" ? "#22c55e" : "#f97316", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: "150px" }}>
                <span style={{ fontSize: "13px", color: coords ? "#111" : "#9ca3af", fontWeight: "600" }}>{locationLabel()}</span>
                {locationErrorMsg && <div style={{ fontSize: "10px", color: "#dc2626", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={10} /> {locationErrorMsg}</div>}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setShowManualLocationModal(true)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>Manual</button>
                <button onClick={acquireLocation} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff7ed", border: "1px solid #fed7aa", cursor: "pointer", color: "#ea580c", fontSize: "13px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px" }}>
                  <RefreshCwIcon size={12} /> Refresh
                </button>
              </div>
            </div>
            <div style={{ margin: "0 16px", borderTop: "1.5px dashed #e5e7eb" }} />
            <div ref={serviceDropRef} style={{ position: "relative" }}>
              <div onClick={() => setServiceOpen(!serviceOpen)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer", background: serviceOpen ? "#fffbf7" : "#fff" }}>
                <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: selectedService ? "#111" : "#d1d5db", flexShrink: 0 }} />
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: selectedService ? "#111" : "#9ca3af", fontWeight: selectedService ? "600" : "500" }}>
                  {selectedService ? <><ServiceIcon icon={selectedService.icon} customEmoji={selectedService.customEmoji} size={16} /> {selectedService.label}</> : "Service needed"}
                </span>
                <span style={{ fontSize: "10px", color: "#9ca3af", transform: serviceOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
              </div>
              {serviceOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", borderRadius: "16px", boxShadow: "0 16px 48px rgba(0,0,0,0.13)", border: "1px solid #f0f0f0", zIndex: 500, overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px 5px", fontSize: "10px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #f5f5f5" }}>Select Service</div>
                  {(services.length > 0 ? services : FALLBACK_SERVICES.filter(s => s.enabled)).map((svc) => (
                    <div key={svc.value} onClick={() => { setSelectedService(svc); setServiceOpen(false); setPetrolLitres(""); setBikeCc(""); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", cursor: "pointer", background: selectedService?.value === svc.value ? "#f9fafb" : "#fff", borderLeft: selectedService?.value === svc.value ? "3px solid #f97316" : "3px solid transparent", borderBottom: "1px solid #f9f9f9" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: selectedService?.value === svc.value ? "#fff7ed" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ServiceIcon icon={svc.icon} customEmoji={svc.customEmoji} size={18} /></div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: "13px", fontWeight: "700", color: "#111" }}>{svc.label}</div><div style={{ fontSize: "11px", color: "#9ca3af" }}>{svc.desc}</div></div>
                      {selectedService?.value === svc.value && <span style={{ color: "#f97316", fontWeight: "900" }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedService?.pricing === "per_litre" && (
              <div style={{ padding: "0 16px 14px", borderTop: "1.5px solid #f3f4f6" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "1.5px", textTransform: "uppercase", margin: "12px 0 8px" }}>How many litres?</div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="number" min="1" max="20" value={petrolLitres} onChange={e => setPetrolLitres(e.target.value)} placeholder="e.g. 2" style={{ flex: 1, padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#111", fontFamily: "'Outfit', sans-serif", fontWeight: "600" }} />
                  <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: "600", whiteSpace: "nowrap" }}>× ₹{selectedService.pricePerUnit || 100}/L</div>
                  {Number(petrolLitres) > 0 && <div style={{ fontSize: "15px", fontWeight: "800", color: "#f97316", whiteSpace: "nowrap" }}>= ₹{Number(petrolLitres) * (selectedService.pricePerUnit || 100)}</div>}
                </div>
              </div>
            )}
            {selectedService?.pricing === "per_cc" && (
              <div style={{ padding: "0 16px 14px", borderTop: "1.5px solid #f3f4f6" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "1.5px", textTransform: "uppercase", margin: "12px 0 8px" }}>Bike Engine CC</div>
                <input type="number" min="50" value={bikeCc} onChange={e => setBikeCc(e.target.value)} placeholder="e.g. 150, 350, 650" style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", color: "#111", fontFamily: "'Outfit', sans-serif", fontWeight: "600" }} />
                {bikeCc && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {(selectedService.ccTiers || []).map(t => {
                      const active = Number(bikeCc) > 0 && Number(bikeCc) <= t.maxCc && (selectedService.ccTiers.filter(x => x.maxCc < t.maxCc).every(x => Number(bikeCc) > x.maxCc));
                      return <div key={t.maxCc} style={{ padding: "5px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", background: active ? "#fff7ed" : "#f3f4f6", color: active ? "#f97316" : "#9ca3af", border: active ? "1.5px solid #fed7aa" : "1.5px solid #e5e7eb" }}>≤{t.maxCc}cc — ₹{t.charge}</div>;
                    })}
                  </div>
                )}
                {getTowingCharge(bikeCc, selectedService.ccTiers) && <div style={{ marginTop: "8px", fontSize: "13px", fontWeight: "800", color: "#f97316" }}>Towing charge: ₹{getTowingCharge(bikeCc, selectedService.ccTiers)}</div>}
              </div>
            )}
          </div>

          {selectedHub && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Service Hub</div>
              <button onClick={() => setShowHubModal(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "14px", border: `2px solid ${selectedHubColor.border}`, background: selectedHubColor.bg, cursor: "pointer", textAlign: "left" }}>
                <MapPin size={16} color={selectedHubColor.dot} />
                <div style={{ flex: 1 }}><div style={{ fontSize: "13px", fontWeight: "800", color: "#111" }}>{selectedHub.name}</div>{selectedHub.address && <div style={{ fontSize: "11px", color: "#9ca3af" }}>{selectedHub.address}</div>}</div>
                {activeHubs.length > 1 && <span style={{ fontSize: "11px", color: selectedHubColor.dot, fontWeight: "700" }}>Change →</span>}
              </button>
            </div>
          )}

          {routeInfo && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, background: "#f9fafb", borderRadius: "12px", padding: "12px 14px", border: "1px solid #f0f0f0" }}><div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>Distance</div><div style={{ fontSize: "17px", fontWeight: "800", color: isDisabled ? "#9ca3af" : "#f97316", marginTop: "3px" }}>{routeInfo.distanceKm} km</div></div>
              <div style={{ flex: 1, background: "#f9fafb", borderRadius: "12px", padding: "12px 14px", border: "1px solid #f0f0f0" }}><div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>ETA</div><div style={{ fontSize: "17px", fontWeight: "800", color: isDisabled ? "#9ca3af" : "#111", marginTop: "3px" }}>{isDisabled ? "—" : routeInfo.formatted}</div></div>
              <div style={{ flex: 1, background: isDisabled ? "#f3f4f6" : "#fff7ed", borderRadius: "12px", padding: "12px 14px", border: isDisabled ? "1px solid #e5e7eb" : "1.5px solid #fed7aa" }}><div style={{ fontSize: "9px", color: isDisabled ? "#9ca3af" : "#ea580c", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase" }}>Travel Fee</div><div style={{ fontSize: "17px", fontWeight: "800", color: isDisabled ? "#9ca3af" : "#f97316", marginTop: "3px" }}>{isDisabled ? "—" : `₹${currentDistanceCharge}`}</div></div>
            </div>
          )}

          {routeInfo && !isFormDisabled && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#c4c9d4", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>Payment Mode</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["cash", "online"].map(mode => {
                  const forced = mode === "online" && requireOnlinePayment;
                  const disabled = mode === "cash" && requireOnlinePayment;
                  return <button key={mode} disabled={disabled} onClick={() => !disabled && setPaymentMode(mode)} style={{ flex: 1, padding: "11px 14px", borderRadius: "11px", border: paymentMode === mode ? `2px solid ${mode === "online" ? "#f97316" : "#111"}` : "2px solid #e5e7eb", background: paymentMode === mode ? (mode === "online" ? "#fff7ed" : "#111") : "#fff", color: paymentMode === mode ? (mode === "online" ? "#ea580c" : "#fff") : disabled ? "#d1d5db" : "#374151", fontSize: "13px", fontWeight: "700", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>{mode === "cash" ? <><Wallet size={15} style={{ verticalAlign: "bottom", marginRight: "4px" }} />Cash</> : <><CreditCard size={15} style={{ verticalAlign: "bottom", marginRight: "4px" }} />Online</>}{forced && <span style={{ fontSize: "9px", display: "block", fontWeight: "600", color: "#f97316" }}>Required</span>}</button>;
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <button disabled={isFormDisabled} onClick={handleSeePrices} style={{ width: "100%", background: isFormDisabled ? "#e5e7eb" : "#111", color: isFormDisabled ? "#9ca3af" : "#fff", border: "none", borderRadius: "14px", padding: "15px", fontSize: "15px", fontWeight: "800", cursor: isFormDisabled ? "not-allowed" : "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { if (!isFormDisabled) { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,115,22,0.35)"; } }}
              onMouseLeave={e => { if (!isFormDisabled) { e.currentTarget.style.background = "#111"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(17,17,17,0.18)"; } }}>
              See prices
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ opacity: isFormDisabled ? 0.4 : 1, pointerEvents: isFormDisabled ? "none" : "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div><input type="text" value={name} onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: "" })); }} placeholder="Your name" required style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `2px solid ${fieldErrors.name ? "#fca5a5" : "#e5e7eb"}`, borderRadius: "11px", fontSize: "13px", color: "#111", fontWeight: "500" }} /><FieldError field="name" /></div>
              <div><input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setFieldErrors(p => ({ ...p, phone: "" })); }} placeholder="Phone number (10 digits)" required style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `2px solid ${fieldErrors.phone ? "#fca5a5" : "#e5e7eb"}`, borderRadius: "11px", fontSize: "13px", color: "#111", fontWeight: "500" }} /><FieldError field="phone" /></div>
              <div><input type="text" value={bikeNumber} onChange={e => { setBikeNumber(formatBikeNumber(e.target.value)); setFieldErrors(p => ({ ...p, bikeNumber: "" })); }} placeholder="Bike number (e.g. KA-05-KM-4512)" required maxLength={13} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `2px solid ${fieldErrors.bikeNumber ? "#fca5a5" : "#e5e7eb"}`, borderRadius: "11px", fontSize: "13px", color: "#111", fontWeight: "500" }} /><FieldError field="bikeNumber" /></div>
              <div><input type="text" value={bikeName} onChange={e => { setBikeName(e.target.value); setFieldErrors(p => ({ ...p, bikeName: "" })); }} placeholder="Bike model name (e.g. Royal Enfield Classic 350)" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `2px solid ${fieldErrors.bikeName ? "#fca5a5" : "#e5e7eb"}`, borderRadius: "11px", fontSize: "13px", color: "#111", fontWeight: "500" }} /><FieldError field="bikeName" /></div>

              {/* Bike colour picker: 5 presets + Other button */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", marginBottom: "8px" }}>Bike colour *</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {presetColors.map(col => (
                    <button key={col} type="button" onClick={() => { setBikeColor(col); setShowCustomColorPicker(false); setFieldErrors(p => ({ ...p, bikeColor: "" })); }}
                      style={{ width: "28px", height: "28px", borderRadius: "50%", background: col, border: bikeColor === col ? "3px solid #f97316" : "2px solid #e5e7eb", cursor: "pointer", boxShadow: bikeColor === col ? "0 0 0 2px #fff, 0 0 0 4px #f97316" : "none" }} />
                  ))}
                  <button type="button" onClick={() => setShowCustomColorPicker(!showCustomColorPicker)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e5e7eb", background: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}><Palette size={14} /> Other</button>
                  {showCustomColorPicker && (
                    <input type="color" value={bikeColor} onChange={e => { setBikeColor(e.target.value); setFieldErrors(p => ({ ...p, bikeColor: "" })); }} style={{ width: "40px", height: "40px", border: "none", cursor: "pointer", borderRadius: "8px" }} />
                  )}
                </div>
                <FieldError field="bikeColor" />
              </div>

              <div><textarea value={description} onChange={e => { setDescription(e.target.value); setFieldErrors(p => ({ ...p, description: "" })); }} placeholder="Briefly describe your issue…" rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `2px solid ${fieldErrors.description ? "#fca5a5" : "#e5e7eb"}`, borderRadius: "11px", fontSize: "13px", color: "#111", fontWeight: "500", resize: "vertical" }} /><FieldError field="description" /></div>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={acceptedTerms} onChange={e => { setAcceptedTerms(e.target.checked); if (e.target.checked) setError(""); }} style={{ width: "15px", height: "15px", accentColor: "#f97316", cursor: "pointer" }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  I agree to{" "}
                  <span
                    onClick={() => navigate("/terms")}
                    style={{
                      color: "#f97316",
                      fontWeight: "700",
                      cursor: "pointer",
                      textDecoration: "none"
                    }}
                  >
                    Terms & Conditions
                  </span>
                </span>
              </label>

              {error && <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600", background: "#fef2f2", borderRadius: "8px", padding: "9px 12px", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={14} /> {error}</div>}

              <button type="submit" disabled={!acceptedTerms || isFormDisabled} style={{ width: "100%", padding: "15px", borderRadius: "13px", border: "none", fontSize: "14px", fontWeight: "800", cursor: acceptedTerms && !isFormDisabled ? "pointer" : "not-allowed", background: acceptedTerms && !isFormDisabled ? "#f97316" : "#e5e7eb", color: acceptedTerms && !isFormDisabled ? "#fff" : "#9ca3af", transition: "all 0.2s" }}>
                {currentUser ? "Confirm Booking" : <span><LockKeyholeOpenIcon size={15} style={{ verticalAlign: "bottom", marginRight: "6px" }} />Log in to Book</span>}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT PANEL – Map */}
        <div className="right-panel" style={{ flex: 1, position: "relative", minHeight: "400px" }}>
          <div id="services-map" style={{ width: "100%", height: "100%", minHeight: "400px" }} />
          {loadingLocation && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.9)", zIndex: 10, gap: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", border: "3px solid #f3f4f6", borderTop: "3px solid #f97316", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>Fetching your location…</span>
            </div>
          )}
          {routeInfo && selectedService && !isFormDisabled && (
            <div style={{ position: "absolute", bottom: "20px", left: "20px", zIndex: 1000, background: "#fff", borderRadius: "14px", padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #f0f0f0", minWidth: "200px" }}>
              <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>Selected Service</div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}><ServiceIcon icon={selectedService.icon} customEmoji={selectedService.customEmoji} size={16} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: "12px", fontWeight: "800", color: "#111" }}>{selectedService.label}</div><div style={{ fontSize: "12px", color: "#f97316", fontWeight: "700" }}>{totalPrice ? `₹${totalPrice}` : "—"}</div></div>
              </div>
              <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Distance</div><div style={{ fontSize: "12px", fontWeight: "800", color: "#111", marginTop: "2px" }}>{routeInfo.distanceKm} km</div></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>ETA</div><div style={{ fontSize: "12px", fontWeight: "800", color: "#111", marginTop: "2px" }}>{routeInfo.formatted}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRICE MODAL with inline validation error */}
      {showPriceModal && selectedService && routeInfo && (
        <div onClick={() => { if (!bookingConfirmed) setShowPriceModal(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px", padding: "32px", maxWidth: "400px", width: "100%", maxHeight: "95vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.15)", animation: "modalIn 0.25s cubic-bezier(.4,0,.2,1)" }}>
            {!bookingConfirmed ? (
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "#fff7ed", border: "2px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#f97316" }}><ServiceIcon icon={selectedService.icon} customEmoji={selectedService.customEmoji} size={24} /></div>
                  <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#111", margin: "0 0 4px 0" }}>Price Breakdown</h2>
                  <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>{selectedService.label}</p>
                </div>
                {(bikeName || bikeNumber) && (
                  <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", border: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><div style={{ width: "16px", height: "16px", borderRadius: "4px", background: bikeColor, flexShrink: 0, border: "1.5px solid rgba(0,0,0,0.1)" }} /><div><div style={{ fontSize: "13px", fontWeight: "800", color: "#111" }}>{bikeName || "—"}</div><div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{bikeNumber}</div></div></div>
                  </div>
                )}
                {activeHubs.length > 1 && selectedHub && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Service Hub</div>
                    <button onClick={() => { setShowPriceModal(false); setShowHubModal(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", border: `2px solid ${selectedHubColor.border}`, background: selectedHubColor.bg, cursor: "pointer", textAlign: "left" }}>
                      <MapPin size={16} color={selectedHubColor.dot} /><div style={{ flex: 1 }}><div style={{ fontSize: "13px", fontWeight: "800", color: "#111" }}>{selectedHub.name}</div>{selectedHub.address && <div style={{ fontSize: "11px", color: "#9ca3af" }}>{selectedHub.address}</div>}</div><span style={{ fontSize: "11px", color: selectedHubColor.dot, fontWeight: "700" }}>Change</span>
                    </button>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {[{ label: selectedService.pricing === "per_litre" ? `${selectedService.label} (${petrolLitres}L × ₹${selectedService.pricePerUnit || 100})` : selectedService.pricing === "per_cc" ? `Towing charge (${bikeCc}cc bike)` : "Service base charge", value: `₹${serviceCharge}` }, { label: `Distance charge (${routeInfo.distanceKm} km × ₹${RATE_PER_KM}/km)`, value: `₹${currentDistanceCharge}` }, { label: "ETA", value: routeInfo.formatted }, { label: "Payment mode", value: paymentMode === "online" ? <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><CreditCard size={15} color="#0284c7" /> Online</span> : <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Wallet size={15} color="#16a34a" /> Cash</span> }].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#fff", borderRadius: "12px", border: "1px solid #f3f4f6" }}><span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "700" }}>{row.label}</span><span style={{ fontSize: "15px", fontWeight: "800", color: "#111" }}>{row.value}</span></div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#fffaf5", borderRadius: "16px", border: "2px solid #fed7aa", marginBottom: "24px" }}><span style={{ fontSize: "18px", fontWeight: "900", color: "#111" }}>Total</span><span style={{ fontSize: "24px", fontWeight: "900", color: "#f97316" }}>₹{totalPrice}</span></div>
                {modalValidationError && <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600", background: "#fef2f2", borderRadius: "8px", padding: "9px 12px", marginBottom: "16px", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={14} /> {modalValidationError}</div>}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => { setShowPriceModal(false); setModalValidationError(""); }} style={{ flex: 1, padding: "16px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "#fff", fontSize: "15px", fontWeight: "800", cursor: "pointer", color: "#6b7280" }}>Back</button>
                  <button onClick={handleModalConfirm} style={{ flex: 2, padding: "16px", borderRadius: "12px", border: "none", background: "#f97316", color: "#fff", fontSize: "15px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }}>Confirm — ₹{totalPrice}</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: paymentMode === "online" ? "#eff6ff" : "#f0fdf4", border: `3px solid ${paymentMode === "online" ? "#bfdbfe" : "#bbf7d0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 16px", animation: "checkIn 0.4s cubic-bezier(.4,0,.2,1)" }}>{paymentMode === "online" ? "📞" : "✅"}</div>
                <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#111", margin: "0 0 8px" }}>{paymentMode === "online" ? "Booking Received!" : "Booking Confirmed!"}</h2>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>{paymentMode === "online" ? <>Our team will contact you within <span style={{ color: "#f97316", fontWeight: "800" }}>4 minutes</span> to confirm payment.</> : <>Keep <span style={{ color: "#f97316", fontWeight: "800" }}>₹{totalPrice}</span> ready for cash payment on arrival.</>}</p>
                <div style={{ background: "#f9fafb", borderRadius: "14px", padding: "16px", marginBottom: "20px", border: "1px solid #f0f0f0", textAlign: "left" }}>
                  {[{ icon: <Hash size={15} />, label: "Booking ID", value: displayId }, { icon: <ServiceIcon icon={selectedService.icon} customEmoji={selectedService.customEmoji} size={15} />, label: "Service", value: selectedService.label }, { icon: <Wrench size={15} />, label: "Bike", value: `${bikeName} (${bikeNumber})` }, { icon: <MapPin size={15} />, label: "Hub", value: selectedHub?.name || "—" }, { icon: paymentMode === "online" ? <CreditCard size={15} /> : <Wallet size={15} />, label: "Total", value: `₹${totalPrice}` }, { icon: <Clock size={15} />, label: "ETA", value: routeInfo.formatted }].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i < 5 ? "1px solid #f0f0f0" : "none" }}><span style={{ color: "#475569", width: "22px", flexShrink: 0 }}>{row.icon}</span><span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", flex: 1 }}>{row.label}</span><span style={{ fontSize: "13px", fontWeight: "800", color: i === 0 ? "#f97316" : "#111" }}>{row.value}</span></div>
                  ))}
                </div>
                {paymentMode === "online" && (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s ease-in-out infinite" }} /><span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "700" }}>Connecting you with our team…</span></div>)}
                <button onClick={resetForm} style={{ width: "100%", padding: "14px", borderRadius: "11px", border: "none", background: paymentMode === "online" ? "#111" : "#22c55e", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: "pointer" }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
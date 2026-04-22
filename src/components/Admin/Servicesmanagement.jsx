import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../Authcontext';
import AlertModal from '../../components/AlertModal';
import {
  Fuel, Truck, Wrench, Battery, Settings, Plus, Trash2,
  Save, X, Edit3, ToggleLeft, ToggleRight, AlertTriangle,
  ChevronDown, ChevronUp, MapPin, Zap, Package, Navigation,
  Clock, Route, CheckCircle, Info, Star, Loader2, Building2,
  PlusCircle, Pencil, Hash, Globe, Locate
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// ── Icon map ─────────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
  { value: 'fuel',      label: 'Fuel',        icon: <Fuel size={16}/> },
  { value: 'truck',     label: 'Truck',        icon: <Truck size={16}/> },
  { value: 'wrench',    label: 'Wrench',       icon: <Wrench size={16}/> },
  { value: 'battery',   label: 'Battery',      icon: <Battery size={16}/> },
  { value: 'settings',  label: 'Spare Parts',  icon: <Settings size={16}/> },
  { value: 'zap',       label: 'Electric',     icon: <Zap size={16}/> },
  { value: 'package',   label: 'Package',      icon: <Package size={16}/> },
  { value: 'star',      label: 'Premium',      icon: <Star size={16}/> },
  { value: 'navigation',label: 'Navigation',   icon: <Navigation size={16}/> },
];

const ICON_RENDER = {
  fuel:       <Fuel size={18}/>,
  truck:      <Truck size={18}/>,
  wrench:     <Wrench size={18}/>,
  battery:    <Battery size={18}/>,
  settings:   <Settings size={18}/>,
  zap:        <Zap size={18}/>,
  package:    <Package size={18}/>,
  star:       <Star size={18}/>,
  navigation: <Navigation size={18}/>,
};

// ── Common emoji sets for custom icon picker ──────────────────────────────────
const EMOJI_PRESETS = [
  '🔧','🔩','⛽','🚗','🚕','🚙','🚛','🏍','🛵','🚘',
  '🔋','⚡','🛞','🪛','🔦','🧰','🪝','⚙️','🔑','🛣',
  '🚦','🅿️','🏪','🏬','📦','🪜','🧲','💡','🌡','🪤',
];

const EMPTY_SERVICE = {
  value: '', label: '', icon: 'wrench', customEmoji: '', desc: '',
  baseCharge: 500, enabled: true,
  pricing: 'fixed',
  pricePerUnit: 100,
  ccTiers: [
    { maxCc: 199,   charge: 500  },
    { maxCc: 399,   charge: 700  },
    { maxCc: 799,   charge: 800  },
    { maxCc: 99999, charge: 1000 },
  ],
};

// ── Empty hub location ────────────────────────────────────────────────────────
const EMPTY_HUB = { id: '', name: '', lat: '', lng: '', address: '', enabled: true };

const DEFAULT_CONFIG = {
  ratePerKm: 10,
  unserviceableKm: 70,
  disabledKm: 700,
  onlinePaymentThresholdKm: 5,
  fixedLocation: { lat: 12.89806, lng: 77.61442 },  // legacy single hub (kept for backward compat)
  hubLocations: [],   // NEW: array of hub locations
};

const slug = (str) => str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

// ── Haversine distance (km) ───────────────────────────────────────────────────
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

// ── ETA estimate (road speed ~40 km/h average) ───────────────────────────────
function estimateETA(distKm) {
  if (!distKm || isNaN(distKm)) return 'N/A';
  const mins = Math.ceil((distKm / 40) * 60);
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

export default function ServicesManagement() {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();

  const [services, setServices] = useState([]);
  const [config, setConfig]     = useState(DEFAULT_CONFIG);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  const [showAddModal, setShowAddModal]     = useState(false);
  const [editService, setEditService]       = useState(null);
  const [formData, setFormData]             = useState({ ...EMPTY_SERVICE });
  const [expandedConfig, setExpandedConfig] = useState(false);
  const [alertConfig, setAlertConfig]       = useState({ isOpen: false });

  // Hub location management
  const [showHubModal, setShowHubModal]     = useState(false);
  const [editHubId, setEditHubId]           = useState(null);
  const [hubForm, setHubForm]               = useState({ ...EMPTY_HUB });
  const [userCoords, setUserCoords]         = useState(null);  // for nearest-hub preview
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Dynamic ETA state
  const [etaMap, setEtaMap] = useState({});  // hubId -> { distKm, eta }

  // Custom emoji input
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !hasAnyRole(ROLES.ADMIN)) { navigate('/'); return; }
    loadData();
  }, [user]);

  // ── Close emoji picker on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target))
        setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('aride_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [svcRes, cfgRes] = await Promise.all([
        fetch(`${API}/services/config`,   { headers }),
        fetch(`${API}/services/settings`, { headers }),
      ]);
      if (svcRes.ok) {
        const d = await svcRes.json();
        setServices(d.success && d.services ? d.services : getDefaultServices());
      } else setServices(getDefaultServices());
      if (cfgRes.ok) {
        const d = await cfgRes.json();
        if (d.success && d.config) setConfig({ ...DEFAULT_CONFIG, ...d.config, hubLocations: d.config.hubLocations || [] });
      }
    } catch {
      setServices(getDefaultServices());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultServices = () => [
    { value: 'petrol',    label: 'Petrol Delivery',  icon: 'fuel',     desc: 'Fuel delivered to your spot',           pricing: 'per_litre', pricePerUnit: 100,  enabled: true },
    { value: 'towing',    label: 'Towing Service',    icon: 'truck',    desc: 'Vehicle towed to nearest garage',       pricing: 'per_cc',    ccTiers: [{ maxCc: 199, charge: 500 }, { maxCc: 399, charge: 700 }, { maxCc: 799, charge: 800 }, { maxCc: 99999, charge: 1000 }], enabled: true },
    { value: 'mechanic',  label: 'Mechanic On Spot',  icon: 'wrench',   desc: 'Expert mechanic at your location',      pricing: 'fixed',     baseCharge: 500,    enabled: true },
    { value: 'battery',   label: 'Electric Battery',  icon: 'battery',  desc: 'Battery jump-start or replacement',     pricing: 'fixed',     baseCharge: 500,    enabled: true },
    { value: 'autospare', label: 'Auto Spare Parts',  icon: 'settings', desc: 'Spare parts delivered instantly',       pricing: 'fixed',     baseCharge: 500,    enabled: true },
  ];

  // ── Compute dynamic ETA for all hubs when userCoords or hubs change ─────────
  useEffect(() => {
    if (!userCoords || !config.hubLocations?.length) return;
    const map = {};
    config.hubLocations.forEach(hub => {
      const lat = parseFloat(hub.lat), lng = parseFloat(hub.lng);
      if (isNaN(lat) || isNaN(lng)) return;
      const distKm = parseFloat(haversine(userCoords.lat, userCoords.lng, lat, lng).toFixed(2));
      map[hub.id] = { distKm, eta: estimateETA(distKm) };
    });
    setEtaMap(map);
  }, [userCoords, config.hubLocations]);

  // ── Detect admin's location for nearest-hub preview ──────────────────────────
  const detectLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setDetectingLocation(false); },
      ()    => { showToast('Could not detect location', 'error'); setDetectingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Nearest hub to userCoords ────────────────────────────────────────────────
  const nearestHub = React.useMemo(() => {
    if (!userCoords || !config.hubLocations?.length) return null;
    let best = null, bestDist = Infinity;
    config.hubLocations.forEach(hub => {
      const lat = parseFloat(hub.lat), lng = parseFloat(hub.lng);
      if (isNaN(lat) || isNaN(lng) || !hub.enabled) return;
      const d = haversine(userCoords.lat, userCoords.lng, lat, lng);
      if (d < bestDist) { bestDist = d; best = hub; }
    });
    return best;
  }, [userCoords, config.hubLocations]);

  // ── Save all ─────────────────────────────────────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('aride_token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const [res1, res2] = await Promise.all([
        fetch(`${API}/services/config`,   { method: 'PUT', headers, body: JSON.stringify({ services }) }),
        fetch(`${API}/services/settings`, { method: 'PUT', headers, body: JSON.stringify({ config }) }),
      ]);
      if (!res1.ok || !res2.ok) throw new Error('Backend refused');
      showToast('All changes saved successfully!');
    } catch {
      showToast('Failed to save. Check backend connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle service ────────────────────────────────────────────────────────────
  const toggleEnabled = (value) =>
    setServices(s => s.map(svc => svc.value === value ? { ...svc, enabled: !svc.enabled } : svc));

  // ── Delete service (with AlertModal) ─────────────────────────────────────────
  const triggerDelete = (service) => {
    setAlertConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Service?',
      message: `This will permanently remove "${service.label}". Click "Save All Changes" to apply.`,
      confirmText: 'Yes, Delete',
      onConfirm: () => {
        setServices(s => s.filter(svc => svc.value !== service.value));
        setAlertConfig({ isOpen: false });
        showToast(`${service.label} removed.`, 'info');
      },
      onCancel: () => setAlertConfig({ isOpen: false }),
    });
  };

  // ── Add / Edit service ────────────────────────────────────────────────────────
  const openAdd = () => { setFormData({ ...EMPTY_SERVICE }); setEditService(null); setShowAddModal(true); };
  const openEdit = (svc) => { setFormData({ ...EMPTY_SERVICE, ...svc }); setEditService(svc.value); setShowAddModal(true); };

  const saveForm = () => {
    if (!formData.label.trim()) return;
    const svcValue = editService || slug(formData.label) || `service_${Date.now()}`;
    const svc = { ...formData, value: svcValue };
    if (editService) {
      setServices(s => s.map(sv => sv.value === editService ? svc : sv));
    } else {
      if (services.find(s => s.value === svcValue)) { showToast('Name already exists.', 'error'); return; }
      setServices(s => [...s, svc]);
    }
    setShowAddModal(false);
    showToast(editService ? 'Service updated!' : 'New service added!');
  };

  // ── CC tier helpers ───────────────────────────────────────────────────────────
  const addTier    = () => setFormData(f => ({ ...f, ccTiers: [...f.ccTiers, { maxCc: 9999, charge: 500 }] }));
  const updateTier = (i, key, val) => setFormData(f => { const t = [...f.ccTiers]; t[i] = { ...t[i], [key]: Number(val) }; return { ...f, ccTiers: t }; });
  const removeTier = (i) => setFormData(f => ({ ...f, ccTiers: f.ccTiers.filter((_, idx) => idx !== i) }));

  // ── Hub location CRUD ─────────────────────────────────────────────────────────
  const openAddHub = () => {
    setHubForm({ ...EMPTY_HUB, id: `hub_${Date.now()}` });
    setEditHubId(null);
    setShowHubModal(true);
  };
  const openEditHub = (hub) => { setHubForm({ ...hub }); setEditHubId(hub.id); setShowHubModal(true); };

  const saveHub = () => {
    if (!hubForm.name.trim() || !hubForm.lat || !hubForm.lng) { showToast('Name, Lat & Lng are required.', 'error'); return; }
    const hub = { ...hubForm, lat: parseFloat(hubForm.lat), lng: parseFloat(hubForm.lng) };
    if (editHubId) {
      setConfig(c => ({ ...c, hubLocations: c.hubLocations.map(h => h.id === editHubId ? hub : h) }));
    } else {
      setConfig(c => ({ ...c, hubLocations: [...(c.hubLocations || []), hub] }));
    }
    setShowHubModal(false);
    showToast(editHubId ? 'Hub updated!' : 'Hub added!');
  };

  const deleteHub = (id) => {
    setAlertConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete Hub Location?',
      message: 'This service hub will be removed. Users near this hub will be re-routed to the next closest hub.',
      confirmText: 'Delete Hub',
      onConfirm: () => {
        setConfig(c => ({ ...c, hubLocations: c.hubLocations.filter(h => h.id !== id) }));
        setAlertConfig({ isOpen: false });
        showToast('Hub removed.', 'info');
      },
      onCancel: () => setAlertConfig({ isOpen: false }),
    });
  };

  const toggleHubEnabled = (id) =>
    setConfig(c => ({ ...c, hubLocations: c.hubLocations.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h) }));

  // ── Render icon (Lucide or custom emoji) ──────────────────────────────────────
  const renderServiceIcon = (svc, size = 18) => {
    if (svc.customEmoji) return <span style={{ fontSize: size + 4, lineHeight: 1 }}>{svc.customEmoji}</span>;
    return ICON_RENDER[svc.icon] || <Wrench size={size} />;
  };

  // ────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid #f3f4f6', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280', fontWeight: '600' }}>Loading services config…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '28px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .svc-card { background: #fff; border-radius: 16px; border: 2px solid #f3f4f6; padding: 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: box-shadow 0.2s, border-color 0.2s; }
        .svc-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09); border-color: #e5e7eb; }
        .svc-card.disabled-card { opacity: 0.55; }
        .hub-card { background: #fff; border-radius: 14px; border: 2px solid #f3f4f6; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: all 0.2s; }
        .hub-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: #e2e8f0; }
        .hub-card.nearest-hub { border-color: #f97316; background: #fffaf5; }
        .tag { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .tag-fixed   { background: #eff6ff; color: #3b82f6; }
        .tag-litre   { background: #f0fdf4; color: #16a34a; }
        .tag-cc      { background: #fff7ed; color: #ea580c; }
        .tag-on      { background: #d1fae5; color: #065f46; }
        .tag-off     { background: #f3f4f6; color: #9ca3af; }
        .tag-nearest { background: #fff7ed; color: #f97316; }
        .icon-btn { background: none; border: none; cursor: pointer; border-radius: 8px; padding: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .icon-btn:hover { background: #f3f4f6; }
        .form-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
        .form-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
        .form-input { width: 100%; padding: 11px 14px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: 'Outfit', sans-serif; font-weight: 500; outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
       .modal-overlay {
  position: fixed; inset: 0;
  background: rgba(30, 58, 138, 0.45);
  backdrop-filter: blur(10px) brightness(0.6) saturate(1.4);
  -webkit-backdrop-filter: blur(10px) brightness(0.6) saturate(1.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 5000; padding: 20px;
}
.modal-box {
  background: #fff; border-radius: 24px; padding: 0;
  width: 100%; max-width: 520px; max-height: 92vh;
  overflow-y: auto; scrollbar-width: none;
  box-shadow: 0 32px 100px rgba(30,58,138,0.25), 0 0 0 1px rgba(255,255,255,0.15);
  animation: modalIn 0.25s cubic-bezier(.4,0,.2,1);
}
.modal-box::-webkit-scrollbar { display: none; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 28px 20px; border-bottom: 1.5px solid #f3f4f6;
}
.modal-body { padding: 24px 28px; }
.modal-footer {
  display: flex; gap: 12px;
  padding: 20px 28px; background: #f9fafb;
  border-top: 1.5px solid #f3f4f6;
  border-radius: 0 0 24px 24px;
}
.modal-footer-btn {
  flex: 1; padding: 13px; border-radius: 12px; font-size: 14px;
  font-weight: 800; cursor: pointer; font-family: 'Outfit', sans-serif; transition: 0.2s;
}
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .radio-pill { display: flex; gap: 8px; flex-wrap: wrap; }
        .radio-pill label { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151; transition: all 0.15s; }
        .radio-pill label.active { border-color: #f97316; background: #fff7ed; color: #ea580c; }
        .cfg-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .cfg-input { width: 120px; padding: 8px 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; font-family: 'Outfit', sans-serif; font-weight: 700; text-align: right; outline: none; transition: border-color 0.2s; }
        .cfg-input:focus { border-color: #f97316; }
        .toast { position: fixed; bottom: 28px; right: 28px; padding: 14px 22px; border-radius: 14px; font-weight: 700; font-size: 14px; z-index: 9999; animation: slideUp 0.3s ease; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
        .toast-success { background: #111; color: #fff; }
        .toast-error   { background: #ef4444; color: #fff; }
        .toast-info    { background: #3b82f6; color: #fff; }
        .grid-services { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .grid-hubs { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-top: 20px; }
        .tier-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .tier-row input { flex: 1; padding: 8px 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-family: 'Outfit', sans-serif; font-weight: 600; outline: none; }
        .tier-row input:focus { border-color: #f97316; }
        select.form-input { background: #fff; cursor: pointer; }
        .toggle-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 13px; padding: 5px 10px; border-radius: 8px; transition: background 0.15s; }
        .toggle-btn:hover { background: #f3f4f6; }
        .emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; padding: 12px; background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; position: absolute; z-index: 100; box-shadow: 0 12px 40px rgba(0,0,0,0.15); top: calc(100% + 6px); left: 0; right: 0; }
        .emoji-btn { background: none; border: 1.5px solid transparent; border-radius: 8px; padding: 6px; cursor: pointer; font-size: 20px; text-align: center; transition: all 0.15s; }
        .emoji-btn:hover { border-color: #f97316; background: #fff7ed; }
        .icon-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .icon-option { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151; transition: all 0.15s; }
        .icon-option.active { border-color: #f97316; background: #fff7ed; color: #ea580c; }
        .icon-option:hover:not(.active) { border-color: #d1d5db; background: #f9fafb; }
        .eta-badge { display: inline-flex; align-items: center; gap: 4px; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 8px; padding: 3px 8px; font-size: 11px; font-weight: 700; }
        .dist-badge { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 8px; padding: 3px 8px; font-size: 11px; font-weight: 700; }
        .nearest-badge { display: inline-flex; align-items: center; gap: 4px; background: #fff7ed; color: #f97316; border: 1px solid #fed7aa; border-radius: 8px; padding: 3px 8px; font-size: 11px; font-weight: 700; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#111827', margin: '0 0 6px', fontFamily: "'Sekuya', 'Outfit', sans-serif" }}>Services Management</h1>
          <p style={{ fontSize: '15px', fontWeight: '500', color: '#64748b', margin: 0 }}>Add, edit, price, toggle services and manage hub locations with live ETA.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '12px', border: '2px solid #e5e7eb', background: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: '#374151', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
          >
            <Plus size={18} /> Add Service
          </button>
          <button onClick={saveAll} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '12px', border: 'none', background: saving ? '#e5e7eb' : '#f97316', color: saving ? '#9ca3af' : '#fff', fontSize: '14px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(249,115,22,0.3)', transition: 'all 0.2s' }}
          >
            {saving ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={18} />}
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* ── GLOBAL CONFIG CARD ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '2px solid #f3f4f6', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <button onClick={() => setExpandedConfig(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={18} color="#f97316" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#111' }}>Global Pricing & Location Config</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>Rate/km, service radius, hub locations</div>
            </div>
          </div>
          {expandedConfig ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
        </button>

        {expandedConfig && (
          <div style={{ padding: '0 24px 28px', borderTop: '1.5px solid #f3f4f6' }}>

            {/* Pricing config rows */}
            {[
              { label: 'Rate per KM (₹)', key: 'ratePerKm', help: 'Distance charge applied to every booking' },
              { label: 'Unserviceable beyond (km)', key: 'unserviceableKm', help: 'Show warning beyond this distance' },
              { label: 'Fully disabled beyond (km)', key: 'disabledKm', help: 'Block booking entirely beyond this distance' },
            ].map(row => (
              <div key={row.key} className="cfg-row">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{row.label}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{row.help}</div>
                </div>
                <input type="number" className="cfg-input" value={config[row.key]}
                  onChange={e => setConfig(c => ({ ...c, [row.key]: Number(e.target.value) }))} />
              </div>
            ))}

            {/* Online payment threshold — separate row with extra info */}
            <div className="cfg-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>Online payment required beyond (km)</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Force online payment for bookings beyond this road distance</div>
                </div>
                <input type="number" className="cfg-input" value={config.onlinePaymentThresholdKm}
                  onChange={e => setConfig(c => ({ ...c, onlinePaymentThresholdKm: Number(e.target.value) }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px', width: '100%' }}>
                <Info size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '600', lineHeight: 1.5 }}>
                  Currently set to <strong>{config.onlinePaymentThresholdKm} km</strong>. Customers beyond this road distance will be required to pay online — cash option will be disabled for them. This uses actual road distance (OSRM routing), not straight-line distance.
                </span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                ── HUB LOCATIONS SECTION ──
            ══════════════════════════════════════════════════════════════ */}
            <div style={{ marginTop: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} color="#f97316" /> Service Hub Locations
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>
                    Users are automatically routed to the nearest enabled hub. ETA updates live.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={detectLocation} disabled={detectingLocation}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#374151', transition: 'all 0.15s' }}
                    title="Detect your location to preview nearest hub"
                  >
                    {detectingLocation
                      ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                      : <Locate size={14} />}
                    {detectingLocation ? 'Detecting…' : 'Preview Nearest'}
                  </button>
                  <button onClick={openAddHub}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#111', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    <PlusCircle size={14} /> Add Hub
                  </button>
                </div>
              </div>

              {/* Nearest hub banner */}
              {nearestHub && (
                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Navigation size={16} color="#f97316" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#ea580c' }}>Nearest hub to your location: </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{nearestHub.name}</span>
                    {etaMap[nearestHub.id] && (
                      <span style={{ fontSize: '12px', color: '#f97316', marginLeft: '8px' }}>
                        · {etaMap[nearestHub.id].distKm} km · ETA {etaMap[nearestHub.id].eta}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Hub location grid */}
              {(!config.hubLocations || config.hubLocations.length === 0) ? (
                <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  <Building2 size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>No hub locations added yet</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Add your first service hub above. Users will be routed to the nearest one.</div>
                </div>
              ) : (
                <div className="grid-hubs">
                  {config.hubLocations.map(hub => {
                    const isNearest = nearestHub?.id === hub.id;
                    const hubEta = etaMap[hub.id];
                    return (
                      <div key={hub.id} className={`hub-card${isNearest ? ' nearest-hub' : ''}`}>
                        {/* Hub header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: hub.enabled ? '#fff7ed' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MapPin size={18} color={hub.enabled ? '#f97316' : '#9ca3af'} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>{hub.name}</span>
                              {isNearest && <span className="nearest-badge"><Star size={10} /> Nearest</span>}
                              <span className={`tag ${hub.enabled ? 'tag-on' : 'tag-off'}`}>{hub.enabled ? 'Active' : 'Off'}</span>
                            </div>
                            {hub.address && (
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hub.address}</div>
                            )}
                          </div>
                        </div>

                        {/* Coords row */}
                        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                            <span style={{ color: '#9ca3af' }}>Lat </span>{hub.lat}
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                            <span style={{ color: '#9ca3af' }}>Lng </span>{hub.lng}
                          </span>
                        </div>

                        {/* Dynamic ETA row */}
                        {hubEta ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="dist-badge"><Route size={10} /> {hubEta.distKm} km</span>
                            <span className="eta-badge"><Clock size={10} /> {hubEta.eta}</span>
                            <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: 'auto' }}>from your location</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#d1d5db', fontStyle: 'italic' }}>
                            Click "Preview Nearest" to see ETA
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button className="toggle-btn" onClick={() => toggleHubEnabled(hub.id)} style={{ color: hub.enabled ? '#10b981' : '#9ca3af' }}>
                            {hub.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            {hub.enabled ? 'Active' : 'Disabled'}
                          </button>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="icon-btn" onClick={() => openEditHub(hub)} style={{ color: '#ea580c' }}><Pencil size={15} /></button>
                            <button className="icon-btn" onClick={() => window.open(`https://www.google.com/maps?q=${hub.lat},${hub.lng}`, '_blank')} style={{ color: '#3b82f6' }} title="Open in Google Maps"><Globe size={15} /></button>
                            <button className="icon-btn" onClick={() => deleteHub(hub.id)} style={{ color: '#ef4444', background: '#fef2f2' }}><Trash2 size={15} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add hub placeholder */}
                  <button onClick={openAddHub}
                    style={{ background: 'none', border: '2px dashed #e5e7eb', borderRadius: '14px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', transition: 'all 0.2s', minHeight: '140px' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; e.currentTarget.style.background = '#fffaf5'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                  >
                    <PlusCircle size={24} />
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Add Hub Location</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── SERVICES GRID ── */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>Services</h2>
        <span style={{ fontSize: '12px', background: '#f3f4f6', color: '#6b7280', padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>
          {services.filter(s => s.enabled).length} active / {services.length} total
        </span>
      </div>

      <div className="grid-services">
        {services.map(svc => (
          <div key={svc.value} className={`svc-card${svc.enabled ? '' : ' disabled-card'}`}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: svc.enabled ? '#fff7ed' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: svc.enabled ? '#f97316' : '#9ca3af' }}>
                {renderServiceIcon(svc)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#111' }}>{svc.label}</span>
                  <span className={`tag ${svc.enabled ? 'tag-on' : 'tag-off'}`}>{svc.enabled ? 'Active' : 'Off'}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px', fontWeight: '500' }}>{svc.desc}</div>
              </div>
            </div>

            {/* Pricing summary */}
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 14px' }}>
              {svc.pricing === 'per_litre' && (
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                  <span className="tag tag-litre" style={{ marginRight: '8px' }}>Per Litre</span>
                  ₹{svc.pricePerUnit}/L
                </div>
              )}
              {svc.pricing === 'per_cc' && (
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                  <span className="tag tag-cc" style={{ marginRight: '8px' }}>CC-Based</span>
                  {svc.ccTiers?.length} tier{svc.ccTiers?.length !== 1 ? 's' : ''} · ₹{svc.ccTiers?.[0]?.charge}–₹{svc.ccTiers?.[svc.ccTiers.length - 1]?.charge}
                </div>
              )}
              {svc.pricing === 'fixed' && (
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                  <span className="tag tag-fixed" style={{ marginRight: '8px' }}>Fixed</span>
                  ₹{svc.baseCharge} base charge
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <button className="toggle-btn" onClick={() => toggleEnabled(svc.value)} style={{ color: svc.enabled ? '#10b981' : '#9ca3af' }}>
                {svc.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                {svc.enabled ? 'Enabled' : 'Disabled'}
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="icon-btn" title="Edit" onClick={() => openEdit(svc)} style={{ color: '#ea580c' }}><Edit3 size={16} /></button>
                <button onClick={() => triggerDelete(svc)} className="icon-btn" style={{ background: '#fef2f2', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}

        {/* Add placeholder */}
        <button onClick={openAdd}
          style={{ background: 'none', border: '2px dashed #e5e7eb', borderRadius: '16px', padding: '28px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#94a3b8', transition: 'all 0.2s', minHeight: '160px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; e.currentTarget.style.background = '#fffaf5'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
        >
          <Plus size={28} />
          <span style={{ fontSize: '14px', fontWeight: '700' }}>Add New Service</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          ── ADD / EDIT SERVICE MODAL ──
      ════════════════════════════════════════════════════════ */}
      {showAddModal && (
  <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff7ed', border: '2px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
            <Wrench size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: '900', color: '#111', fontSize: '20px', lineHeight: 1.2 }}>
              {editService ? 'Edit Service' : 'Add New Service'}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
              {editService ? 'Update service details below' : 'Fill in details to create a new service'}
            </p>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowAddModal(false)} style={{ color: '#9ca3af' }}>
          <X size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="modal-body">
        {/* Service Name */}
        <div className="form-row">
          <label className="form-label">Service Name *</label>
          <input className="form-input" value={formData.label}
            onChange={e => setFormData(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Flat Tyre Fix" />
        </div>

        {/* Description */}
        <div className="form-row">
          <label className="form-label">Short Description</label>
          <input className="form-input" value={formData.desc}
            onChange={e => setFormData(f => ({ ...f, desc: e.target.value }))} placeholder="e.g. Tyre changed on-spot" />
        </div>

        {/* Icon picker */}
        <div className="form-row">
          <label className="form-label">Icon / Emoji</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {[{ key: 'lucide', label: 'Lucide Icon' }, { key: 'emoji', label: 'Custom Emoji' }].map(tab => (
              <button key={tab.key}
                onClick={() => setFormData(f => ({ ...f, _iconTab: tab.key }))}
                style={{ padding: '7px 16px', borderRadius: '10px', border: '2px solid', borderColor: (formData._iconTab || 'lucide') === tab.key ? '#f97316' : '#e5e7eb', background: (formData._iconTab || 'lucide') === tab.key ? '#fff7ed' : '#fff', color: (formData._iconTab || 'lucide') === tab.key ? '#ea580c' : '#6b7280', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Outfit', sans-serif" }}>
                {tab.label}
              </button>
            ))}
          </div>
          {(formData._iconTab || 'lucide') === 'lucide' && (
            <div className="icon-grid">
              {ICON_OPTIONS.map(o => (
                <div key={o.value}
                  className={`icon-option${formData.icon === o.value && !formData.customEmoji ? ' active' : ''}`}
                  onClick={() => setFormData(f => ({ ...f, icon: o.value, customEmoji: '' }))}>
                  {o.icon}
                  <span style={{ fontSize: '12px' }}>{o.label}</span>
                </div>
              ))}
            </div>
          )}
          {(formData._iconTab) === 'emoji' && (
            <div ref={emojiPickerRef} style={{ position: 'relative' }}>
              <input className="form-input" value={formData.customEmoji}
                onChange={e => setFormData(f => ({ ...f, customEmoji: e.target.value }))}
                placeholder="Paste or type an emoji"
                onFocus={() => setShowEmojiPicker(true)} />
              {showEmojiPicker && (
                <div className="emoji-grid">
                  {EMOJI_PRESETS.map(em => (
                    <button key={em} className="emoji-btn"
                      onClick={() => { setFormData(f => ({ ...f, customEmoji: em })); setShowEmojiPicker(false); }}>
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pricing type */}
        <div className="form-row">
          <label className="form-label">Pricing Type</label>
          <div className="radio-pill">
            {[
              { v: 'fixed',     label: 'Fixed Charge', icon: <Hash size={13}/> },
              { v: 'per_litre', label: 'Per Litre',    icon: <Fuel size={13}/> },
              { v: 'per_cc',    label: 'CC-Based Tiers', icon: <Settings size={13}/> },
            ].map(opt => (
              <label key={opt.v} className={formData.pricing === opt.v ? 'active' : ''}
                onClick={() => setFormData(f => ({ ...f, pricing: opt.v }))}>
                {opt.icon} {opt.label}
              </label>
            ))}
          </div>
        </div>

        {formData.pricing === 'fixed' && (
          <div className="form-row">
            <label className="form-label">Base Charge (₹)</label>
            <input type="number" className="form-input" value={formData.baseCharge}
              onChange={e => setFormData(f => ({ ...f, baseCharge: Number(e.target.value) }))} />
          </div>
        )}
        {formData.pricing === 'per_litre' && (
          <div className="form-row">
            <label className="form-label">Price per Litre (₹)</label>
            <input type="number" className="form-input" value={formData.pricePerUnit}
              onChange={e => setFormData(f => ({ ...f, pricePerUnit: Number(e.target.value) }))} />
          </div>
        )}
        {formData.pricing === 'per_cc' && (
          <div className="form-row">
            <label className="form-label">CC Tiers</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Max CC</span>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Charge (₹)</span>
              <span style={{ width: '32px' }} />
            </div>
            {formData.ccTiers.map((tier, i) => (
              <div key={i} className="tier-row">
                <input type="number" value={tier.maxCc === 99999 ? '' : tier.maxCc}
                  placeholder={i === formData.ccTiers.length - 1 ? '∞ (last)' : ''}
                  onChange={e => updateTier(i, 'maxCc', e.target.value || 99999)} />
                <input type="number" value={tier.charge}
                  onChange={e => updateTier(i, 'charge', e.target.value)} />
                <button className="icon-btn" onClick={() => removeTier(i)} style={{ color: '#ef4444', width: '32px' }}><X size={14} /></button>
              </div>
            ))}
            <button onClick={addTier}
              style={{ width: '100%', padding: '8px', border: '1.5px dashed #d1d5db', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#94a3b8', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#94a3b8'; }}>
              + Add Tier
            </button>
          </div>
        )}

        {/* Enabled toggle */}
        <div className="form-row" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: '10px', padding: '12px 14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>Service Active</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Users can see and book this service</div>
          </div>
          <button className="toggle-btn" onClick={() => setFormData(f => ({ ...f, enabled: !f.enabled }))} style={{ color: formData.enabled ? '#10b981' : '#9ca3af' }}>
            {formData.enabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
          </button>
        </div>

        {!formData.label.trim() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626', fontWeight: '600', marginTop: '12px' }}>
            <AlertTriangle size={15} /> Service name is required.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button className="modal-footer-btn" onClick={() => setShowAddModal(false)}
          style={{ border: '2px solid #e5e7eb', background: '#fff', color: '#6b7280' }}>
          Cancel
        </button>
        <button className="modal-footer-btn" onClick={saveForm} disabled={!formData.label.trim()}
          style={{ flex: 2, border: 'none', background: formData.label.trim() ? '#f97316' : '#e5e7eb', color: formData.label.trim() ? '#fff' : '#9ca3af', cursor: formData.label.trim() ? 'pointer' : 'not-allowed', boxShadow: formData.label.trim() ? '0 4px 16px rgba(249,115,22,0.3)' : 'none' }}>
          {editService ? 'Save Changes' : 'Add Service'}
        </button>
      </div>

    </div>
  </div>
)}

      {/* ════════════════════════════════════════════════════════
          ── ADD / EDIT HUB MODAL ──
      ════════════════════════════════════════════════════════ */}
      {showHubModal && (
  <div className="modal-overlay" onClick={() => setShowHubModal(false)}>
    <div className="modal-box" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff7ed', border: '2px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#f97316" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: '900', color: '#111', fontSize: '20px', lineHeight: 1.2 }}>
              {editHubId ? 'Edit Hub Location' : 'Add Hub Location'}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
              {editHubId ? 'Update hub details below' : 'Add a new dispatch hub for routing'}
            </p>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowHubModal(false)} style={{ color: '#9ca3af' }}>
          <X size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="modal-body">
        <div className="form-row">
          <label className="form-label">Hub Name *</label>
          <input className="form-input" value={hubForm.name}
            onChange={e => setHubForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. A-RIDE Koramangala Hub" />
        </div>

        <div className="form-row">
          <label className="form-label">Address (optional)</label>
          <input className="form-input" value={hubForm.address}
            onChange={e => setHubForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. 5th Block, Koramangala, Bengaluru" />
        </div>

        <div className="form-row">
          <label className="form-label">Coordinates *</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>Latitude</div>
              <input type="number" step="0.00001" className="form-input"
                value={hubForm.lat} onChange={e => setHubForm(f => ({ ...f, lat: e.target.value }))} placeholder="e.g. 12.9352" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>Longitude</div>
              <input type="number" step="0.00001" className="form-input"
                value={hubForm.lng} onChange={e => setHubForm(f => ({ ...f, lng: e.target.value }))} placeholder="e.g. 77.6245" />
            </div>
          </div>
          {hubForm.lat && hubForm.lng && (
            <a href={`https://www.google.com/maps?q=${hubForm.lat},${hubForm.lng}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#3b82f6', fontWeight: '700', textDecoration: 'none', marginTop: '6px' }}>
              <Globe size={12} /> Preview on Google Maps
            </a>
          )}
        </div>

        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={14} color="#0284c7" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600', lineHeight: 1.5 }}>
            To get precise coordinates: open Google Maps, right-click your location and select "What's here?". Copy the lat/lng shown.
          </span>
        </div>

        <div className="form-row" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: '10px', padding: '12px 14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>Hub Active</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Users will be routed to this hub</div>
          </div>
          <button className="toggle-btn" onClick={() => setHubForm(f => ({ ...f, enabled: !f.enabled }))} style={{ color: hubForm.enabled ? '#10b981' : '#9ca3af' }}>
            {hubForm.enabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button className="modal-footer-btn" onClick={() => setShowHubModal(false)}
          style={{ border: '2px solid #e5e7eb', background: '#fff', color: '#6b7280' }}>
          Cancel
        </button>
        <button className="modal-footer-btn" onClick={saveHub}
          style={{ flex: 2, border: 'none', background: '#f97316', color: '#fff', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}>
          {editHubId ? 'Update Hub' : 'Add Hub'}
        </button>
      </div>

    </div>
  </div>
)}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <AlertTriangle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── AlertModal ── */}
      <AlertModal {...alertConfig} />
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Authcontext';
import { 
  User, Mail, Phone, Calendar, 
  MapPin, ShieldCheck, X, HelpCircle, 
  CreditCard, Hash, Bike, Wrench 
} from 'lucide-react';

// ─── Inline SVG Icons ──────────────────────────────────────────────────────
const Icons = {
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  rupee: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a4.5 4.5 0 0 0 0 9H19a4.5 4.5 0 0 1 0 9H6"/>
    </svg>
  ),
  bike: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  ),
  wrench: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  hash: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
  explore: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
};

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: Icons.clock, bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  approved: { label: 'Approved', icon: Icons.check, bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  rejected: { label: 'Rejected', icon: Icons.close, bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

// ─── Booking Detail Modal ───────────────────────────────────────────────────
const BookingModal = ({ booking, onClose }) => {
  if (!booking) return null;
  
  const isTrip = booking.type?.includes('Trip') || booking.type?.includes('Roading');
  const status = STATUS_CONFIG[booking.status || 'pending'];
  const tripTitle = booking.details?.tripName || booking.details?.trackName || booking.type;
  
  // Clean Formatted ID
  const displayId = booking.id ? `BKG-${booking.id.split('-')[0].toUpperCase()}` : 'N/A';

  return (
    <div className="mb-modal-overlay" onClick={onClose}>
      <div className="mb-modal-sheet" onClick={e => e.stopPropagation()}>
        
        {/* Header Section */}
        <div className="mb-modal-head" style={{ 
          background: isTrip 
            ? 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' 
            : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' 
        }}>
          <div className="mb-modal-head-top">
            <div className="mb-modal-type-pill">
              {isTrip ? <Bike size={14}/> : <Wrench size={14}/>}
              {booking.type}
            </div>
            <button className="mb-modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <h2 className="mb-modal-title">{tripTitle}</h2>
          <div className="mb-modal-id-row">
            <Hash size={12} />
            <span>ID: {displayId}</span>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-modal-status-banner" style={{ background: status.bg, color: status.color }}>
          <div className="mb-status-content">
            <ShieldCheck size={16} />
            <span>Booking Status: <strong>{status.label}</strong></span>
          </div>
        </div>

        <div className="mb-modal-body">
          {/* Details Grid */}
          <div className="mb-modal-grid">
            <div className="mb-detail-item">
              <div className="mb-detail-icon"><User size={18} /></div>
              <div className="mb-detail-info">
                <label>Customer</label>
                <span>{booking.customerName}</span>
              </div>
            </div>

            <div className="mb-detail-item">
              <div className="mb-detail-icon"><Mail size={18} /></div>
              <div className="mb-detail-info">
                <label>Email Address</label>
                <span>{booking.email}</span>
              </div>
            </div>

            <div className="mb-detail-item">
              <div className="mb-detail-icon"><Phone size={18} /></div>
              <div className="mb-detail-info">
                <label>Phone</label>
                <span>{booking.phone || 'Not Provided'}</span>
              </div>
            </div>

            <div className="mb-detail-item">
              <div className="mb-detail-icon"><Calendar size={18} /></div>
              <div className="mb-detail-info">
                <label>Booking Date</label>
                <span>{new Date(booking.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="mb-detail-item">
              <div className="mb-detail-icon"><MapPin size={18} /></div>
              <div className="mb-detail-info">
                <label>Plan / Mode</label>
                <span>{booking.details?.priceMode || 'Standard'}</span>
              </div>
            </div>

            <div className="mb-detail-item highlight">
              <div className="mb-detail-icon"><CreditCard size={18} /></div>
              <div className="mb-detail-info">
                <label>Amount Paid</label>
                <span className="price-tag">₹{booking.price?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-modal-footer">
            <button className="btn-modal-secondary" onClick={onClose}>
              Dismiss
            </button>
            <button className="btn-modal-primary" onClick={() => window.location.href = 'mailto:support@aride.com'}>
              <HelpCircle size={16} />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const MyBookings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [typeF, setTypeF]       = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchHistory();
  }, [isAuthenticated]);

  // ── FETCH FROM POSTGRESQL ──────────────────────────────────────
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAllBookings(data.bookings);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return allBookings.filter(b => {
      const q = search.toLowerCase();
      const tripTitle = b.details?.tripName || b.details?.trackName || b.type || "";
      const matchSearch =
        !q ||
        tripTitle.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q);
      
      const matchStatus = statusF === 'all' || (b.status || 'pending') === statusF;
      const matchType =
        typeF === 'all' ||
        (typeF === 'trip' && (b.type?.includes('Trip') || b.type?.includes('Roading'))) ||
        (typeF === 'service' && b.type?.includes('Service'));
      
      return matchSearch && matchStatus && matchType;
    });
  }, [allBookings, search, statusF, typeF]);

  const counts = useMemo(() => ({
    total: allBookings.length,
    pending:  allBookings.filter(b => (b.status || 'pending') === 'pending').length,
    approved: allBookings.filter(b => b.status === 'approved').length,
    spent: allBookings
      .filter(b => b.status === 'approved')
      .reduce((s, b) => s + (parseFloat(b.price) || 0), 0),
  }), [allBookings]);

  if (loading) return <div style={{padding: '100px', textAlign: 'center'}}>Loading your adventures...</div>;

  return (
    <>
      <style>{`
        /* ... (Keeping your existing CSS Styles) ... */
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .mb-root { min-height: 100vh; background: #f4f4f0; font-family: 'DM Sans', sans-serif; color: #111; }
        .mb-hero { background: #0c0c0c; position: relative; overflow: hidden; padding: 52px 48px 56px; }
        .mb-hero-inner { position: relative; z-index: 1; max-width: 1160px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 32px; }
        .mb-hero h1 { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2.8rem, 6vw, 5rem); letter-spacing: 3px; color: #fff; line-height: 1; margin-bottom: 10px; }
        .mb-hero h1 span { color: #ff5e00; }
        .mb-hero-stats { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
        .mb-stat-chip { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 20px; text-align: center; min-width: 90px; }
        .mb-stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: #fff; letter-spacing: 1px; line-height: 1; }
        .mb-stat-lbl { font-size: 10px; color: rgba(255,255,255,0.35); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
        .mb-body { max-width: 1160px; margin: 0 auto; padding: 36px 24px 80px; }
        .mb-filters { background: white; border-radius: 18px; padding: 20px 24px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 28px; border: 1.5px solid #e9e9e5; }
        .mb-search-wrap { position: relative; flex: 1; min-width: 220px; }
        .mb-search { width: 100%; padding: 11px 16px 11px 40px; background: #f7f7f4; border: 1.5px solid #e5e5e0; border-radius: 12px; outline: none; }
        .mb-chip { padding: 9px 16px; border: 1.5px solid #e5e5e0; border-radius: 999px; background: white; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; color: #666; transition: all 0.18s; }
        .mb-chip.on-approved { background: #d1fae5; border-color: #10b981; color: #065f46; }
        .mb-chip.on-pending  { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
        .mb-list { display: flex; flex-direction: column; gap: 16px; }
        .mb-card { background: white; border: 1.5px solid #e9e9e5; border-radius: 20px; overflow: hidden; display: flex; cursor: pointer; transition: 0.2s; }
        .mb-card:hover { border-color: #ff5e00; transform: translateY(-2px); }
        .mb-card-inner { flex: 1; padding: 22px 24px; display: flex; align-items: center; gap: 20px; }
        .mb-card-main { flex: 1; }
        .mb-card-name { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; text-transform: uppercase; }
        .mb-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; }
        
        /* Modal Styles */
        .mb-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .mb-modal-sheet { background: white; width: 100%; max-width: 580px; border-radius: 28px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes modalPop { from { transform: scale(0.95) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .mb-modal-head { padding: 32px; color: white; }
        .mb-modal-head-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .mb-modal-type-pill { background: rgba(255, 255, 255, 0.15); padding: 6px 14px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .mb-modal-close-btn { background: rgba(255, 255, 255, 0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .mb-modal-close-btn:hover { background: #ef4444; }
        .mb-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 2.5rem; margin: 0; line-height: 1; letter-spacing: 1px; }
        .mb-modal-id-row { display: flex; align-items: center; gap: 6px; font-size: 11px; opacity: 0.5; margin-top: 8px; font-family: monospace; }
        .mb-modal-status-banner { padding: 12px 32px; font-size: 14px; font-weight: 600; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .mb-status-content { display: flex; align-items: center; gap: 10px; }
        .mb-modal-body { padding: 32px; }
        .mb-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
        .mb-detail-item { display: flex; gap: 15px; padding: 16px; background: #f9fafb; border-radius: 18px; border: 1px solid #f3f4f6; }
        .mb-detail-item.highlight { background: #fff7ed; border-color: #ffedd5; }
        .mb-detail-icon { color: #ff5e00; background: white; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .mb-detail-info label { display: block; font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .mb-detail-info span { font-size: 14px; font-weight: 700; color: #111827; }
        .price-tag { color: #ff5e00 !important; font-size: 20px !important; }
        .mb-modal-footer { display: flex; gap: 15px; }
        .btn-modal-primary { flex: 2; background: linear-gradient(135deg, #ff5e00, #ff9a00); color: white; border: none; padding: 16px; border-radius: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 15px -3px rgba(255, 94, 0, 0.3); transition: 0.2s; }
        .btn-modal-secondary { flex: 1; background: #f3f4f6; color: #4b5563; border: none; padding: 16px; border-radius: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-modal-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 20px -3px rgba(255, 94, 0, 0.4); }
        .btn-modal-secondary:hover { background: #e5e7eb; }
      `}</style>

      <div className="mb-root">
        <div className="mb-hero">
          <div className="mb-hero-inner">
            <div>
              <h1>MY <span>BOOKINGS</span></h1>
              <p style={{color: 'rgba(255,255,255,0.5)'}}>Welcome back, {user?.name || 'Rider'}.</p>
            </div>
            <div className="mb-hero-stats">
              <div className="mb-stat-chip"><div className="mb-stat-val">{counts.total}</div><div className="mb-stat-lbl">Total</div></div>
              <div className="mb-stat-chip"><div className="mb-stat-val" style={{ color: '#10b981' }}>{counts.approved}</div><div className="mb-stat-lbl">Approved</div></div>
              <div className="mb-stat-chip"><div className="mb-stat-val" style={{ color: '#ff5e00' }}>₹{(counts.spent / 1000).toFixed(1)}k</div><div className="mb-stat-lbl">Spent</div></div>
            </div>
          </div>
        </div>

        <div className="mb-body">
          <div className="mb-filters">
            <div className="mb-search-wrap">
               <input className="mb-search" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="mb-filter-chips">
              {['all', 'approved', 'pending', 'rejected'].map(v => (
                <button key={v} className={`mb-chip ${statusF === v ? `on-${v}` : ''}`} onClick={() => setStatusF(v)}>{v}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '20px'}}>
              <h3>No bookings found.</h3>
              <button onClick={() => navigate('/explore')} style={{marginTop: '20px', padding: '10px 20px', background: '#ff5e00', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer'}}>Book Your First Trip</button>
            </div>
          ) : (
            <div className="mb-list">
              {filtered.map((b) => {
                const cfg = STATUS_CONFIG[b.status || 'pending'];
                return (
                  <div key={b.id} className="mb-card" onClick={() => setSelected(b)}>
                    <div className="mb-card-inner">
                      <div className="mb-card-main">
                        {/* Clean Formatted ID on Card */}
                        <div style={{fontSize: '10px', color: '#ff5e00', fontWeight: 'bold'}}>
                          BKG-{b.id.split('-')[0].toUpperCase()}
                        </div>
                        <div className="mb-card-name">{b.details?.tripName || b.details?.trackName || b.type}</div>
                        <div style={{fontSize: '12px', color: '#666'}}>{new Date(b.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div className="mb-status-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</div>
                        <div style={{fontFamily: 'Bebas Neue', fontSize: '1.5rem', marginTop: '5px'}}>₹{b.price?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && <BookingModal booking={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

export default MyBookings;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Authcontext';
import {
  Plus, Edit2, Trash2, Check, X, Search,
  Calendar, DollarSign, MapPin, Tag, Image as ImageIcon
} from 'lucide-react';

const TripManagementadminadmin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSupport } = useAuth();

  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Long Trip',
    duration: '',
    season: '',
    difficulty: 'Easy',
    blurb: '',
    priceWithBike: '',
    priceNoBike: '',
    imageUrl: '',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!isAdmin() && !isSupport()) {
      navigate('/');
      return;
    }
    loadTrips();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trips, searchTerm, filterType, filterStatus]);

  // ── FETCH FROM DB ───────────────────────────────────────────
  const loadTrips = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch('http://localhost:5000/api/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setTrips(data.trips);
    } catch (err) {
      console.error("Failed to load trips:", err);
    }
  };

  const applyFilters = () => {
    let filtered = [...trips];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.name.toLowerCase().includes(search) || trip.blurb.toLowerCase().includes(search)
      );
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(trip => {
        if (filterType === 'long-trip') return trip.type === 'Long Trip';
        if (filterType === 'off-roading') return trip.type === 'Off-Roading';
        return true;
      });
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(trip => trip.status === filterStatus);
    }
    setFilteredTrips(filtered);
  };

  // ── SAVE TO DB ──────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch('http://localhost:5000/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, id: editingTrip?.id })
      });

      // ── THE FIX: If unauthorized, clear session and redirect ──
      if (response.status === 401) {
        alert("Your session has expired or your account was removed. Redirecting to login...");
        localStorage.removeItem('aride_token');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        resetForm();
        loadTrips();
        alert('Trip saved successfully!');
      } else {
        alert(`Failed to save: ${data.message}`);
      }
    } catch (err) {
      alert("Network error: Could not reach the server.");
    }
  };

  const handleDelete = async (tripId) => {
    if (!window.confirm('Delete this trip permanently?')) return;

    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        alert(`Server Error: ${response.status}. The backend route is missing!`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        loadTrips();
      } else {
        alert(`Failed to delete: ${data.message}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error: Could not reach the server.");
    }
  };

  // Approval/Rejection logic uses the same upsert route but updates status
  const handleStatusUpdate = async (tripId, newStatus) => {
    try {
      const token = localStorage.getItem('aride_token');
      await fetch(`http://localhost:5000/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      loadTrips();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData({
      name: trip.name, type: trip.type, duration: trip.duration, season: trip.season,
      difficulty: trip.difficulty, blurb: trip.blurb, priceWithBike: trip.priceWithBike,
      priceNoBike: trip.priceNoBike, imageUrl: trip.imageUrl || '', tags: trip.tags || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTrip(null);
    setFormData({ name: '', type: 'Long Trip', duration: '', season: '', difficulty: 'Easy', blurb: '', priceWithBike: '', priceNoBike: '', imageUrl: '', tags: [] });
    setTagInput('');
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'rejected') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#fef3c7', color: '#92400e' };
  };

  return (
    <div className="trip-management" style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px", fontFamily: "'Sekuya', system-ui, sans-serif" }}>
      <style>{`
        .management-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-create { padding: 12px 24px; background: #ff5e00; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        
        /* ── TOOLBAR CSS ── */
        .toolbar-container { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; background: white; padding: 16px; border-radius: 16px; border: 2px solid #f3f4f6; }
        .search-wrap { position: relative; flex: 1; min-width: 280px; }
        .search-input { width: 100%; padding: 12px 16px 12px 42px; border-radius: 10px; border: 2px solid #e2e8f0; font-size: 14px; font-family: inherit; outline: none; transition: 0.2s; }
        .search-input:focus { border-color: #ff5e00; box-shadow: 0 0 0 3px rgba(255, 94, 0, 0.1); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .filter-select { padding: 12px 16px; border-radius: 10px; border: 2px solid #e2e8f0; font-size: 14px; font-family: inherit; outline: none; background: white; cursor: pointer; font-weight: 600; color: #1e293b; }
        .filter-select:focus { border-color: #ff5e00; }

        .trip-card { background: white; border-radius: 16px; padding: 24px; border: 2px solid #f3f4f6; display: grid; grid-template-columns: 200px 1fr auto; gap: 24px; align-items: center; margin-bottom: 20px; }
        .trip-image { width: 200px; height: 140px; border-radius: 12px; object-fit: cover; background: #f3f4f6; }
        .action-btn { padding: 10px 16px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
        .modal-overlay { position: fixed; margin-top: 60px; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: white; border-radius: 20px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-input { padding: 12px; border: 2px solid #e5e7eb; border-radius: 12px; width: 100%; outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: #ff5e00; }
      `}</style>

      <div className="management-header">
        <div className="header-left">
          <h1>Trip Management</h1>
          <p style={{ fontFamily: "'outline',san-serif", fontSize: "20px", fontWeight: "500", color: "#64748b", margin: 0 }}>Create and manage Long Trip and Off-Roading experiences.</p>
        </div>
        <button className="btn-create" onClick={() => setShowModal(true)}><Plus size={20} /> Create New Trip</button>
      </div>

      {/* ── NEW OMNI-SEARCH & FILTER TOOLBAR ── */}
      <div className="toolbar-container">
        <div className="search-wrap">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search trips by name or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Trip Types</option>
          <option value="long-trip">Long Trip</option>
          <option value="off-roading">Off-Roading</option>
        </select>

        <select 
          className="filter-select"
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="trips-grid">
        {filteredTrips.map(trip => {
          const statusStyle = getStatusColor(trip.status);
          return (
            <div
              key={trip.id}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                padding: "16px 20px",
                borderRadius: "16px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                border: "2px solid #f3f4f6",
                marginBottom: "16px"
              }}
            >
              {/* Status Badge TOP-LEFT */}
              <span
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  padding: "5px 12px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  zIndex: 2,
                  border: `1px solid ${statusStyle.color}40`
                }}
              >
                {trip.status.toUpperCase()}
              </span>

              {/* LEFT: Image */}
              <img
                src={trip.imageUrl || 'https://images.pexels.com/photos/163210/motorcyclist-motorcycle-sunrise-163210.jpeg'}
                alt={trip.name}
                style={{
                  width: "180px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "14px"
                }}
              />

              {/* CENTER: Info */}
              <div style={{ flex: 1, marginLeft: "20px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 4px", fontFamily: "'outline',san-serif" }}>
                  {trip.name}
                </h3>

                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, fontFamily: "'outline', sans-serif" }}>
                  {trip.blurb}
                </p>

                <div style={{
                  display: "flex",
                  gap: "14px",
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "#9ca3af",
                  fontFamily: "'outline', sans-serif"
                }}>
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Calendar size={14} /> {trip.duration}</span>
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><DollarSign size={14} /> ₹{trip.priceWithBike}</span>
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><MapPin size={14} /> {trip.type}</span>
                </div>
              </div>

              {/* RIGHT: Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => handleEdit(trip)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
                    transition: "0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <Edit2 size={14} /> Edit
                </button>
                
                {/* STRICT ADMIN CHECK FOR DELETE */}
                {isAdmin() && (
                  <button
                    onClick={() => handleDelete(trip.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "600",
                      boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
                      transition: "0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}

                {isAdmin() && trip.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(trip.id, "approved")}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "#10b981", color: "#fff", border: "none",
                        padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "600"
                      }}
                    >
                      <Check size={14} /> Approve
                    </button>

                    <button
                      onClick={() => handleStatusUpdate(trip.id, "rejected")}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "#f59e0b", color: "#fff", border: "none",
                        padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "600"
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filteredTrips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#475569' }}>No trips found</div>
            <p style={{ margin: '4px 0 0' }}>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ margin: "0 0 20px", fontWeight: "900", color: "#111" }}>{editingTrip ? 'Edit Trip' : 'Create New Trip'}</h2>
            <div className="form-grid">
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Trip Name</label>
                <input className="form-input" placeholder="e.g. Leh-Ladakh Circuit" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Trip Category</label>
                <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="Long Trip">Long Trip</option>
                  <option value="Off-Roading">Off-Roading</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Duration</label>
                <input className="form-input" placeholder="e.g. 5 Days / 4 Nights" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
              </div>
              
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Best Season</label>
                <input className="form-input" placeholder="e.g. June - September" value={formData.season} onChange={e => setFormData({ ...formData, season: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Price (With Bike) ₹</label>
                <input className="form-input" type="number" placeholder="e.g. 24999" value={formData.priceWithBike} onChange={e => setFormData({ ...formData, priceWithBike: e.target.value })} />
              </div>
              
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Price (Without Bike) ₹</label>
                <input className="form-input" type="number" placeholder="e.g. 14999" value={formData.priceNoBike} onChange={e => setFormData({ ...formData, priceNoBike: e.target.value })} />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Short Description</label>
                <textarea className="form-input" style={{ minHeight: "80px", resize: "vertical" }} placeholder="Describe the experience..." value={formData.blurb} onChange={e => setFormData({ ...formData, blurb: e.target.value })} />
              </div>
              
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Cover Image URL</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <ImageIcon size={20} color="#94a3b8" />
                  <input className="form-input" style={{ flex: 1 }} placeholder="https://example.com/image.jpg" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'flex-end', borderTop: "1px solid #f3f4f6", paddingTop: "20px" }}>
              <button className="btn-create" style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => {
                resetForm();
                setShowModal(false); 
              }}>Cancel</button>
              <button className="btn-create" onClick={handleSubmit}>Save Trip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagementadminadmin;
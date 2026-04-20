import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, ROLES } from '../Authcontext';
import { Search, Eye, Edit3, X, Download, Trash2, MapPin  } from 'lucide-react';
const API = import.meta.env.VITE_API_URL;

const BookingManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasAnyRole } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingData, setEditingData] = useState({
    id: '', tempName: '', tempPrice: 0, tempStatus: '', details: {}
  });

  useEffect(() => {
    if (!user || !hasAnyRole(ROLES.ADMIN, ROLES.SUPPORT)) { navigate('/'); return; }
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${API}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setBookings(data.bookings);
    } catch (error) {}
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${API}/bookings/${editingData.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          status: editingData.tempStatus,
          price: parseFloat(editingData.tempPrice),
          details: { ...editingData.details, tripName: editingData.tempName } 
        })
      });

      const data = await response.json();
      if (data.success) {
        setBookings(bookings.map(b => b.id === editingData.id ? data.booking : b));
        setShowEditModal(false);
      }
    } catch (error) {}
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedBookings.length} booking(s)?`)) return;
    try {
      const token = localStorage.getItem('aride_token');
      await Promise.all(selectedBookings.map(id => fetch(`${API}/bookings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })));
      setBookings(bookings.filter(b => !selectedBookings.includes(b.id)));
      setSelectedBookings([]); 
    } catch (error) {}
  };

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ field, direction });
  };

  const processedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true; 
      
      const tripName = booking.details?.tripName || booking.details?.trackName || booking.type || '';
      
      const matchesSearch = 
        booking.customerName?.toLowerCase().includes(q) || 
        booking.id?.toLowerCase().includes(q) || 
        booking.phone?.includes(q) ||
        booking.email?.toLowerCase().includes(q) ||
        booking.status?.toLowerCase().includes(q) ||
        tripName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || (booking.status || 'pending') === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    if (sortConfig.field) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch(sortConfig.field) {
          case 'id': aVal = a.id || ''; bVal = b.id || ''; break; // Added Sort for ID
          case 'customer': aVal = a.customerName?.toLowerCase() || ''; bVal = b.customerName?.toLowerCase() || ''; break;
          case 'phone': aVal = a.phone || ''; bVal = b.phone || ''; break;
          case 'type': aVal = (a.details?.tripName || a.details?.trackName || a.type || '').toLowerCase(); bVal = (b.details?.tripName || b.details?.trackName || b.type || '').toLowerCase(); break;
          case 'amount': aVal = a.price || 0; bVal = b.price || 0; break;
          case 'status': aVal = a.status || 'pending'; bVal = b.status || 'pending'; break;
          case 'date': aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0; bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0; break;
          case 'location': 
            const getLocRank = (booking) => {
              if (!booking.type?.toLowerCase().includes('service')) return 3; 
              if (booking.details?.locationLink) return 1; 
              return 2; 
            };
            aVal = getLocRank(a);
            bVal = getLocRank(b);
            break;
            
          default: aVal = ''; bVal = '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [bookings, searchQuery, statusFilter, sortConfig]);

  const handleSelectAll = (e) => setSelectedBookings(e.target.checked ? processedBookings.map(b => b.id) : []);
  const handleSelectOne = (e, id) => setSelectedBookings(e.target.checked ? [...selectedBookings, id] : selectedBookings.filter(bId => bId !== id));

  const handleExportExcel = () => {
    if (selectedBookings.length === 0) return;
    const dataToExport = bookings.filter(b => selectedBookings.includes(b.id));
    const headers = ['Booking ID', 'Customer Name', 'Email', 'Phone', 'Trip/Service', 'Location', 'Amount', 'Status', 'Date'];
    const rows = dataToExport.map(b => {
      const isService = b.type?.toLowerCase().includes('service');
      const locationText = isService ? (b.details?.locationLink || 'No Link') : 'Not Applicable';
      return [
        b.id, `"${b.customerName || ''}"`, `"${b.email || ''}"`, `"${b.phone || ''}"`, `"${b.details?.tripName || b.details?.trackName || b.type || ''}"`,
        `"${locationText}"`, b.price || 0, (b.status || 'pending').toUpperCase(), b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', `ARide_Bookings.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const SortHeader = ({ label, field }) => {
    const isActive = sortConfig.field === field;
    const isAsc = isActive && sortConfig.direction === 'asc';
    const isDesc = isActive && sortConfig.direction === 'desc';
    return (
      <th onClick={() => handleSort(field)} className="sortable-th">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {label}
          <span className="sort-arrows"><span style={{ color: isAsc ? '#ff5e00' : '#cbd5e1' }}>↑</span><span style={{ color: isDesc ? '#ff5e00' : '#cbd5e1', marginLeft: '-2px' }}>↓</span></span>
        </div>
      </th>
    );
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        .table-card { background: white; border-radius: 16px; overflow: hidden; border: 2px solid #f3f4f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .b-table { width: 100%; border-collapse: collapse; }
        .b-table th { padding: 16px; background: #f8fafc; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #edf2f7; white-space: nowrap; }
        .b-table th:hover { background: #f1f5f9; }
        .b-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; vertical-align: middle; }
        .sortable-th { cursor: pointer; user-select: none; transition: background 0.2s; }
        .sortable-th:hover { background: #f1f5f9; }
        .sort-arrows { font-size: 14px; font-weight: 900; letter-spacing: -2px; display: inline-flex; }
        .btn-action { padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-view { background: #f1f5f9; color: #475569; }
        .btn-edit { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
        .btn-export { background: #10b981; color: white; padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .btn-delete-bulk { background: #ef4444; color: white; padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
        .edit-modal { background: white; padding: 30px; border-radius: 24px; width: 100%; max-width: 450px; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
        .form-input { width: 100%; padding: 12px; border-radius: 10px; border: 2px solid #e2e8f0; margin-top: 6px; margin-bottom: 16px; font-family: inherit; font-weight: 600; outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: #ff5e00; }
        .form-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
        .custom-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #ff5e00; }
        
        .toolbar-container { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; background: white; padding: 16px; border-radius: 16px; border: 2px solid #f3f4f6; }
        .search-wrap { position: relative; flex: 1; min-width: 280px; }
        .search-input { width: 100%; padding: 12px 16px 12px 42px; border-radius: 10px; border: 2px solid #e2e8f0; font-size: 14px; font-family: inherit; outline: none; transition: 0.2s; }
        .search-input:focus { border-color: #ff5e00; box-shadow: 0 0 0 3px rgba(255, 94, 0, 0.1); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .filter-select { padding: 12px 16px; border-radius: 10px; border: 2px solid #e2e8f0; font-size: 14px; font-family: inherit; outline: none; background: white; cursor: pointer; font-weight: 600; color: #1e293b; }
        .filter-select:focus { border-color: #ff5e00; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "24px", flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#111827", margin: "0 0 8px", fontFamily: "'Sekuya', sans-serif" }}>Booking Management</h1>
          <p style={{ fontFamily: "'outline',san-serif", fontSize: "16px", fontWeight: "500", color: "#64748b", margin: 0 }}>Review, edit, export, and manage bookings.</p>
        </div>
        
        {/* Bulk Actions */}
        {selectedBookings.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn-export" onClick={handleExportExcel}><Download size={18} /> Export ({selectedBookings.length})</button>
            {/* ── STRICT CHECK: Only physical admins get the delete button ── */}
            {user?.role === 'admin' && (
              <button className="btn-delete-bulk" onClick={handleDeleteSelected}><Trash2 size={18} /> Delete ({selectedBookings.length})</button>
            )}
          </div>
        )}
      </div>

      <div className="toolbar-container">
        <div className="search-wrap">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search ID, customer, email, phone, or service..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">View All Statuses</option>
          <option value="pending">Pending Only</option>
          <option value="approved">Approved Only</option>
          <option value="completed">Completed Only</option>
          <option value="rejected">Rejected Only</option>
          <option value="cancelled">Cancelled Only</option>
        </select>
      </div>

      <div className="table-card">
        <table className="b-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input type="checkbox" className="custom-checkbox" onChange={handleSelectAll} checked={processedBookings.length > 0 && selectedBookings.length === processedBookings.length}/>
              </th>
              {/* ── NEW BOOKING ID COLUMN ── */}
              <SortHeader label="Booking ID" field="id" />
              <SortHeader label="Customer" field="customer" />
              <SortHeader label="Phone" field="phone" />
              <SortHeader label="Trip/Service" field="type" />
              <SortHeader label="Location" field="location" />
              <SortHeader label="Amount" field="amount" />
              <SortHeader label="Status" field="status" />
              <SortHeader label="Date" field="date" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedBookings.map(booking => {
              const isService = booking.type?.toLowerCase().includes('service');

              return (
                <tr key={booking.id} style={{ background: selectedBookings.includes(booking.id) ? '#fff7ed' : 'transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" className="custom-checkbox" checked={selectedBookings.includes(booking.id)} onChange={(e) => handleSelectOne(e, booking.id)}/>
                  </td>
                  
                  {/* ── BOOKING ID DATA ── */}
                  <td>
                    <span style={{ fontSize: '13px', color: '#ff5e00', fontWeight: '800', fontFamily: 'monospace', background: '#fff7ed', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                      #{booking.id.split('-')[0].toUpperCase()}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontWeight: '700' }}>{booking.customerName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{booking.email}</div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#475569' }}>{booking.phone || 'N/A'}</td>
                  
                  <td>{booking.details?.tripName || booking.details?.trackName || booking.type}</td>
                  
                  <td style={{ fontSize: '13px' }}>
                    {!isService ? (
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Not Applicable</span>
                    ) : booking.details?.locationLink ? (
                      <a href={booking.details.locationLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> Map
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No Link</span>
                    )}
                  </td>

                  <td style={{ fontWeight: '800', color: '#111' }}>₹{booking.price?.toLocaleString()}</td>
                  <td>
                    <span style={{ 
                      color: booking.status === 'approved' ? '#10b981' : booking.status === 'rejected' ? '#ef4444' : booking.status === 'completed' ? '#3b82f6' : '#f59e0b', 
                      fontWeight: '800', textTransform: 'uppercase', fontSize: '12px',
                      background: booking.status === 'approved' ? '#d1fae5' : booking.status === 'rejected' ? '#fee2e2' : booking.status === 'completed' ? '#dbeafe' : '#fef3c7',
                      padding: '4px 8px', borderRadius: '6px'
                    }}>
                      {booking.status || 'pending'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: '#64748b', fontSize: '13px' }}>{formatDate(booking.createdAt)}</td>

                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* ── UPDATED VIEW BUTTON LINK ── */}
                      <button className="btn-action btn-view"onClick={() => navigate(`/admin/bookings/${booking.id}`)}><Eye size={16} /> View</button>
                      
                      {/* STRICT ADMIN CHECK FOR EDIT */}
                      {user?.role === 'admin' && (
                        <button className="btn-action btn-edit" onClick={() => {
                          setEditingData({ id: booking.id, tempName: booking.details?.tripName || booking.type, tempPrice: booking.price, tempStatus: booking.status || 'pending', details: booking.details });
                          setShowEditModal(true);
                        }}><Edit3 size={16} /> Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {processedBookings.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}><Search size={48} /></div>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#475569' }}>No bookings found</div>
                  <p style={{ margin: '4px 0 0' }}>Try adjusting your search or filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── EDIT MODAL ── */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontWeight: "900", color: "#111" }}>Edit Booking</h2>
              <X size={24} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowEditModal(false)} />
            </div>
            <label className="form-label">Trip/Service Name</label>
            <input className="form-input" value={editingData.tempName} onChange={(e) => setEditingData({...editingData, tempName: e.target.value})} />
            
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" value={editingData.tempPrice} onChange={(e) => setEditingData({...editingData, tempPrice: e.target.value})} />
            
            <label className="form-label">Booking Status</label>
            <select className="form-input" value={editingData.tempStatus} onChange={(e) => setEditingData({...editingData, tempStatus: e.target.value})}>
              <option value="pending">PENDING</option>
              <option value="approved">APPROVED</option>
              <option value="completed">COMPLETED</option>
              <option value="rejected">REJECTED</option>
              <option value="cancelled">CANCELLED</option>
            </select>
            
            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button className="btn-action" style={{ flex: 1, background: "#f1f5f9", justifyContent: "center" }} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-action" style={{ flex: 2, background: "#ff5e00", color: "#fff", justifyContent: "center" }} onClick={handleSaveChanges}>Update Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
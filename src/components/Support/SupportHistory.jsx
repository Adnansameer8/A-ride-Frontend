import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../Authcontext';
import { Search, CheckCircle, XCircle, Eye, ArrowLeft, Calendar, Wrench } from 'lucide-react';

const SupportHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, approved, rejected

  useEffect(() => {
    // Security Check: Only Support or Admin
    if (!user || (user.role !== ROLES.SUPPORT && user.role !== ROLES.ADMIN)) {
      navigate('/');
      return;
    }
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        // Only show Approved and Rejected for this page
        const history = data.bookings.filter(b => b.status === 'approved' || b.status === 'rejected');
        setBookings(history);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const filteredHistory = bookings.filter(b => {
    const matchesSearch = b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        .history-card { background: white; border-radius: 16px; overflow: hidden; border: 2px solid #f3f4f6; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .h-table { width: 100%; border-collapse: collapse; }
        .h-table th { padding: 16px; background: #f8fafc; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #edf2f7; }
        .h-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; }
        .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate('/support/dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6b7280', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#111827", margin: "0 0 8px" ,fontFamily: "'Sekuya', sans-serif" }}>Action History</h1>
          <p style={{ fontFamily: "'outline',san-serif", fontSize: "20px", fontWeight: "500", margin: 0 }}>View all bookings previously approved or rejected by the team.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={20} />
            <input 
              placeholder="Search by customer name..." 
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            style={{ padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', fontWeight: '600' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All History</option>
            <option value="approved">Approved Only</option>
            <option value="rejected">Rejected Only</option>
          </select>
        </div>

        <div className="history-card">
          <table className="h-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service/Trip</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Processed Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{booking.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{booking.email}</div>
                  </td>
                  <td>{booking.details?.tripName || booking.details?.trackName || booking.type}</td>
                  <td style={{ fontWeight: '800' }}>₹{booking.price?.toLocaleString()}</td>
                  <td>
                    <div className="status-pill" style={{ 
                      background: booking.status === 'approved' ? '#d1fae5' : '#fee2e2',
                      color: booking.status === 'approved' ? '#065f46' : '#991b1b'
                    }}>
                      {booking.status === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {booking.status}
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '13px' }}>
                    {new Date(booking.updatedAt || booking.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button 
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                      style={{ padding: '8px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                    >
                      <Eye size={14} /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredHistory.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
              <div>No history found matching your criteria.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportHistory;
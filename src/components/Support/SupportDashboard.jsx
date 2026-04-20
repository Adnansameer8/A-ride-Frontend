import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../Authcontext';
import { Calendar, Wrench, Clock, CheckCircle, AlertCircle, MessageSquare, Ticket, ChevronRight, User, Eye, BookAlertIcon } from 'lucide-react';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [viewedTimestamps, setViewedTimestamps] = useState(() => 
    JSON.parse(localStorage.getItem('aride_ticket_views') || '{}')
  );

  useEffect(() => {
    if (!user || (user.role !== ROLES.SUPPORT && user.role !== ROLES.ADMIN)) {
      navigate('/');
      return;
    }
    
    loadDashboardData();
    
    // Auto-refresh dashboard data every 5 seconds
    const intervalId = setInterval(() => {
      loadDashboardData();
      setViewedTimestamps(JSON.parse(localStorage.getItem('aride_ticket_views') || '{}'));
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      
      const [bookingsRes, ticketsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/support/tickets/all`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const bookingsData = await bookingsRes.json();
      const ticketsData = await ticketsRes.json();
      
      if (bookingsData.success) setBookings(bookingsData.bookings);
      if (ticketsData.success) setTickets(ticketsData.tickets);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    if (newStatus === 'rejected' && !window.confirm('Are you sure you want to reject this booking?')) return;
    
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      } else {
        alert(`Failed to update: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Network error.");
    }
  };

  const isUnread = (t) => {
    if (!t.conversation || t.conversation.length === 0) return false;
    const lastMsg = t.conversation[t.conversation.length - 1];
    if (lastMsg.sender !== 'user') return false;
    const lastViewed = viewedTimestamps[t.id] || 0;
    const lastMsgTime = new Date(lastMsg.timestamp).getTime();
    return lastMsgTime > lastViewed;
  };

  const pendingBookings = useMemo(() => 
    bookings.filter(b => !b.status || b.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), 
  [bookings]);

  const activeTickets = useMemo(() => {
    let active = tickets.filter(t => t.status !== 'closed');
    active.sort((a, b) => {
      const aUnread = isUnread(a);
      const bUnread = isUnread(b);
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
    return active;
  }, [tickets, viewedTimestamps]);

  const unreadTicketCount = tickets.filter(t => isUnread(t)).length;

  const todayBookingsCount = useMemo(() => {
    const today = new Date().toLocaleDateString();
    return bookings.filter(b => new Date(b.createdAt).toLocaleDateString() === today).length;
  }, [bookings]);

  return (
    <>
      <style>{`
        .support-dashboard { 
          min-height: 100vh; 
          background: #f9fafb; 
          padding: 24px; 
          font-family: "'Outfit', sans-serif"; 
        }

        /* ── CLEAN THEME HEADER ── */
        .dash-header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .header-title { 
          font-size: 32px; 
          font-weight: 900; 
          color: #111827; 
          margin: 0 0 8px; 
          font-family: 'Sekuya', sans-serif; 
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .header-subtitle { 
          font-size: 18px; 
          font-weight: 500; 
          color: #475569; 
          margin: 0;
        }
        .history-btn { 
          background: #111827; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 12px; 
          font-weight: 700; 
          cursor: pointer; 
          transition: 0.2s; 
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .history-btn:hover { 
          background: #ff5e00; 
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255,94,0,0.2);
        }

        /* ── STATS CARDS ── */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; border: 2px solid #f3f4f6; display: flex; align-items: center; gap: 16px; transition: 0.2s; }
        .stat-card:hover { border-color: #cbd5e1; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04); }
        .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-info h3 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
        .stat-info p { margin: 4px 0 0; font-size: 26px; font-weight: 900; color: #111827; line-height: 1; }

        /* ── MAIN COLUMNS ── */
        .main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        
        .section-card { background: white; border-radius: 20px; padding: 24px; border: 2px solid #f3f4f6; display: flex; flex-direction: column; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f8fafc; }
        .section-title { font-size: 20px; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 8px; font-family: 'Sekuya', sans-serif; }
        .view-all-link { color: #ff5e00; font-weight: 700; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 4px; transition: 0.2s; }
        .view-all-link:hover { gap: 8px; }

        /* ── LISTS & ITEMS ── */
        .items-list { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 600px; padding-right: 8px; }
        .items-list::-webkit-scrollbar { width: 6px; }
        .items-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        .b-card { padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; transition: 0.2s; }
        .b-card:hover { border-color: #cbd5e1; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .b-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .b-name { font-size: 16px; font-weight: 800; color: #111; margin-bottom: 2px; }
        .b-type { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .type-trip { background: #dbeafe; color: #1e40af; }
        .type-service { background: #fef3c7; color: #92400e; }
        .b-detail { font-size: 13px; color: #64748b; font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 4px; }
        .b-price { font-weight: 800; color: #111; }
        
        .b-actions { display: flex; gap: 8px; margin-top: 16px; }
        .act-btn { flex: 1; padding: 10px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; }
        .btn-approve { background: #10b981; color: white; }
        .btn-approve:hover { background: #059669; }
        .btn-reject { background: #fee2e2; color: #ef4444; }
        .btn-reject:hover { background: #fecaca; }
        .btn-view { background: #e2e8f0; color: #333; }
        .btn-view:hover { background: #cbd5e1; }

        /* ── TICKET CARDS ── */
        .t-card { padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; gap: 12px; }
        .t-card:hover { border-color: #ff5e00; background: white; box-shadow: 0 4px 12px rgba(255,94,0,0.06); transform: translateX(4px); }
        .t-card.unread { background: #fff1f2; border-color: #fecaca; border-left: 4px solid #ef4444; }
        .t-card.unread:hover { border-color: #ef4444; }
        
        .t-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .t-subject { font-weight: 800; color: #111; font-size: 15px; line-height: 1.3; margin-bottom: 4px; }
        .t-user { font-size: 12px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .t-date { font-size: 11px; color: #94a3b8; font-weight: 700; white-space: nowrap; }

        .unread-badge { background: #ef4444; color: white; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 6px; animation: pulse 2s infinite; margin-left: 8px; vertical-align: middle; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

        .empty-state { text-align: center; padding: 40px 20px; color: #94a3b8; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
        .empty-state h3 { color: #475569; margin: 0 0 8px; font-weight: 800; font-size: 20px; }

        @media (max-width: 1024px) { .main-content { grid-template-columns: 1fr; } }
      `}</style>

      <div className="support-dashboard">
        {/* ── THEMED HEADER ── */}
        <div className="dash-header-container">
          <div>
            <h1 className="header-title">Support Dashboard</h1>
            <p className="header-subtitle">Welcome back, {user?.name?.split(' ')[0]}. Here is what needs your attention today.</p>
          </div>
          <button className="history-btn"  onClick={() => navigate('/support/history')}>
            <Calendar size={18} /> View Full History
          </button>
        </div>

        {/* ── STATS CARDS (Clean Theme) ── */}
        <div className="stats-grid">
          <div className="stat-card" style={{ borderColor: unreadTicketCount > 0 ? '#fecaca' : '#f3f4f6', background: unreadTicketCount > 0 ? '#fff1f2' : 'white' }}>
            <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
              <MessageSquare size={24} />
            </div>
            <div className="stat-info">
              <h3 style={{ color: unreadTicketCount > 0 ? '#ef4444' : '#64748b' }}>New Messages</h3>
              <p>{unreadTicketCount}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <h3>Pending Approvals</h3>
              <p>{pendingBookings.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <Ticket size={24} />
            </div>
            <div className="stat-info">
              <h3>Active Tickets</h3>
              <p>{activeTickets.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#059669' }}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-info">
              <h3>Today's Bookings</h3>
              <p>{todayBookingsCount}</p>
            </div>
          </div>
        </div>

        {/* ── MAIN COLUMNS ── */}
        <div className="main-content">
          
          {/* LEFT: PENDING BOOKINGS */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <Clock size={24} color="#ff5e00" /> Pending Bookings
              </h2>
              <span className="view-all-link" onClick={() => navigate('/admin/bookings')}>
                View All <ChevronRight size={16} />
              </span>
            </div>

            {pendingBookings.length > 0 ? (
              <div className="items-list">
                {pendingBookings.map(booking => {
                  const isTrip = booking.type === 'Long Trip' || booking.type === 'Off Roading';
                  return (
                    <div key={booking.id} className="b-card">
                      <div className="b-header">
                        <div>
                          <div className="b-name">{booking.customerName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{booking.phone || booking.email}</div>
                        </div>
                        <span className={`b-type ${isTrip ? 'type-trip' : 'type-service'}`}>
                          {isTrip ? 'Trip' : 'Service'}
                        </span>
                      </div>
                      
                      <div className="b-detail">
                        <span>{booking.details?.tripName || booking.details?.trackName || booking.type}</span>
                        <span className="b-price">₹{booking.price?.toLocaleString()}</span>
                      </div>
                      <div className="b-detail">
                        <span>{new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>

                      <div className="b-actions">
                        <button className="act-btn btn-approve" onClick={() => handleStatusChange(booking.id, 'approved')}>
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button className="act-btn btn-reject" onClick={() => handleStatusChange(booking.id, 'rejected')}>
                          <AlertCircle size={16} /> Reject
                        </button>
                        <button className="act-btn btn-view" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                          <Eye size={16} /> View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><BookAlertIcon size={48} /></div>
                <h3>All caught up!</h3>
                <p>No pending bookings require approval.</p>
              </div>
            )}
          </div>

          {/* RIGHT: PRIORITY TICKETS */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <Ticket size={24} color="#4f46e5" /> Priority Tickets
              </h2>
              <span className="view-all-link" onClick={() => navigate('/admin/tickets')}>
                Manage Tickets <ChevronRight size={16} />
              </span>
            </div>

            {activeTickets.length > 0 ? (
              <div className="items-list">
                {activeTickets.map(t => {
                  const unread = isUnread(t);
                  return (
                    <div 
                      key={t.id} 
                      className={`t-card ${unread ? 'unread' : ''}`}
                      onClick={() => navigate('/admin/tickets')} 
                    >
                      <div className="t-header">
                        <div style={{ flex: 1 }}>
                          <div className="t-subject">
                            {t.subject}
                            {unread && <span className="unread-badge">NEW</span>}
                          </div>
                          <div className="t-user">
                            <User size={14} /> {t.name}
                          </div>
                        </div>
                        <span className="t-date">
                          {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                         <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', color: '#64748b', textTransform: 'uppercase' }}>
                            {t.category}
                         </span>
                         <span style={{ fontSize: '11px', fontWeight: '800', color: unread ? '#ef4444' : '#ff5e00' }}>
                          {unread ? 'RESPOND NOW →' : 'VIEW CHAT →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><CheckCircle size={48} /></div>
                <h3>Inbox Zero</h3>
                <p>There are no active support tickets.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default SupportDashboard;
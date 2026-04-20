import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Authcontext';
import {
  Users, Calendar, Wrench, TrendingUp, 
  UserPlus, ChevronRight, AlertCircle, CheckCircle, Clock, MapPin, Banknote,
  Ticket
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    tripBookings: 0,
    serviceBookings: 0,
    pendingApprovals: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    totalTrips: 0,
    pendingTrips: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings for local filtering
  const [errorMsg, setErrorMsg] = useState("");

  // Default to current month (YYYY-MM format)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('aride_token');

      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // 1. Fetch Users from Postgres Backend
      const userResponse = await fetch(`${API}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();

      // 2. Fetch Bookings from Postgres Backend
      const bookingResponse = await fetch(`${API}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookingData = await bookingResponse.json();

      // Check if backend blocked us due to role permissions
      if (bookingData.message === "Not authorized to view all bookings") {
        setErrorMsg("Your account is not an Admin! Please update your role in Supabase.");
        return;
      }

      if (bookingData.success) {
        const fetchedBookings = bookingData.bookings;
        const allUsers = userData.success ? userData.users : [];
        
        setAllBookings(fetchedBookings); // Save for monthly calculations

        // Categorize the overall data
        const tripBookings = fetchedBookings.filter(b => b.type === 'Long Trip' || b.type === 'Off Roading');
        const serviceBookings = fetchedBookings.filter(b => b.type?.includes('Service'));
        
        const pending = fetchedBookings.filter(b => b.status === 'pending').length;
        const approved = fetchedBookings.filter(b => b.status === 'approved').length;
        const rejected = fetchedBookings.filter(b => b.status === 'rejected').length;

        const allTrips = JSON.parse(localStorage.getItem('aride_trips') || '[]');
        const pendingTrips = allTrips.filter(t => t.status === 'pending').length;

        setStats({
          totalUsers: allUsers.length,
          totalBookings: fetchedBookings.length,
          tripBookings: tripBookings.length,
          serviceBookings: serviceBookings.length,
          pendingApprovals: pending,
          approvedBookings: approved,
          rejectedBookings: rejected,
          totalTrips: allTrips.length,
          pendingTrips: pendingTrips
        });

        // Sort by newest first and grab top 5
        const sortedBookings = [...fetchedBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentBookings(sortedBookings.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  // ── Calculate Monthly Stats Dynamically ──
  const monthlyStats = useMemo(() => {
    // Filter bookings that match the selected YYYY-MM
    const monthlyBookings = allBookings.filter(b => {
      if (!b.createdAt) return false;
      return b.createdAt.startsWith(selectedMonth);
    });

    const trips = monthlyBookings.filter(b => b.type === 'Long Trip' || b.type === 'Off Roading').length;
    const services = monthlyBookings.filter(b => b.type?.includes('Service')).length;
    
    // Only calculate revenue for approved/completed bookings (optional: remove status check if you want total potential revenue)
    const revenue = monthlyBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    return { trips, services, revenue };
  }, [allBookings, selectedMonth]);

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers,
      color: '#3b82f6',
      bgColor: 'white',
      link: '/admin/users'
    },
    {
      icon: Calendar,
      label: 'Overall Trip Bookings',
      value: stats.tripBookings,
      color: '#10b981',
      bgColor: 'white',
      link: '/admin/trips'
    },
    {
      icon: Wrench,
      label: 'Overall Service Bookings',
      value: stats.serviceBookings,
      color: '#f59e0b',
      bgColor: 'white',
      link: '/admin/bookings?type=service'
    },
    {
      icon: Clock,
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      color: '#ef4444',
      bgColor: 'white',
      link: '/admin/bookings?status=pending'
    }
  ];

  const quickActions = [
    {
      label: 'Manage Trips',
      icon: MapPin,
      color: '#8b5cf6',
      badge: stats.pendingTrips > 0 ? stats.pendingTrips : null,
      action: () => navigate('/admin/trips')
    },
    {
      label: 'Add New User',
      icon: UserPlus,
      color: '#ff5e00',
      action: () => navigate('/admin/users/add')
    },
    {
      label: 'View All Bookings',
      icon: Calendar,
      color: '#10b981',
      action: () => navigate('/admin/bookings')
    },
    {
      label: 'Manage Users',
      icon: Users,
      color: '#3b82f6',
      action: () => navigate('/admin/users')
    },
    {
      label: 'Support Tickets',
      icon: Ticket,
      color: '#3b82f6',
      action: () => navigate('/admin/tickets')
    }
  ];

  // Helper to format month nicely (e.g., "October 2023")
  const getMonthName = (yyyy_mm) => {
  const [year, month] = yyyy_mm.split('-'); // ✅ correct
  const date = new Date(year, month - 1);
  return date.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });
};

  return (
    <>
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sekuya&display=swap');

        .admin-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f0e8e2 100%);
          padding: 24px;
          font-family: 'Sekuya', system-ui, sans-serif;
          font-weight: 400;
          font-style: normal;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 8px;
        }

        .dashboard-subtitle {
          color: #6b7280;
          font-size: 15px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e8f0;
          transition: all 0.3s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: var(--card-color);
          transform: scaleX(0);
          transition: transform 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          border-color: var(--card-color);
        }

        .stat-card:hover::before {
          transform: scaleX(1);
        }

        .stat-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .stat-label {
          font-size: 10px;
          font-weight: 300;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
        }

        /* ── NEW MONTHLY SECTION STYLES ── */
        .monthly-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid #f3f4f6;
          margin-bottom: 32px;
        }
        
        .monthly-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .month-selector {
          padding: 10px 16px;
          border-radius: 10px;
          border: 2px solid #e5e7eb;
          font-family: inherit;
          font-weight: 700;
          color: #111827;
          background: #f9fafb;
          cursor: pointer;
          outline: none;
          transition: 0.2s;
        }
        
        .month-selector:focus {
          border-color: #ff5e00;
          background: white;
        }

        .monthly-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .monthly-card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .section-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid #f3f4f6;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .view-all-btn {
          font-size: 14px;
          color: #ff5e00;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: gap 0.2s;
        }

        .view-all-btn:hover {
          gap: 8px;
        }

        .booking-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .booking-item {
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
          cursor: pointer;
        }

        .booking-item:hover {
          background: white;
          border-color: #ff5e00;
          transform: translateX(4px);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .booking-name {
          font-family: "Sekuya", system-ui, sans-serif;
          font-weight: 700;
          color: #111827;
          font-size: 15px;
        }

        .booking-status {
          font-family: 'outline', sans-serif;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-pending { background: #fef3c7; color: #92400e; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-completed { background: #e0e7ff; color: #047857; }

        .booking-details {
          font-family: 'outline', sans-serif;
          font-size: 13px;
          color: #6b7280;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-btn {
          padding: 16px;
          background: white;
          border: 2px solid #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .action-btn:hover {
          border-color: var(--action-color);
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .action-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-label-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .action-label {
          font-weight: 700;
          color: #111827;
          font-size: 15px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .dashboard-content { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title"> Welcome back, {user?.name || "Admin"}!</h1>
          <p className="dashboard-subtitle">Here's what's happening with your business today.</p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: 'bold' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Overall Stats Grid */}
        <div className="stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="stat-card"
                style={{ '--card-color': stat.color }}
                onClick={() => navigate(stat.link)}
              >
                <div
                  className="stat-icon-wrapper"
                  style={{ background: stat.bgColor, color: stat.color }}
                >
                  <Icon size={28} />
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Recent Bookings */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Recent Bookings</h2>
              <div className="view-all-btn" onClick={() => navigate('/admin/bookings')}>
                View All
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="booking-list">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => {
                  const specificName = booking.details?.tripName || booking.details?.trackName || booking.type;
                  const dateObj = new Date(booking.createdAt);
                  const dateFormatted = isNaN(dateObj) ? "Just now" : dateObj.toLocaleDateString();

                  return (
                    <div
                      key={booking.id}
                      className="booking-item"
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                    >
                      <div className="booking-header">
                        <span className="booking-name">{booking.customerName}</span>
                        <span className={`booking-status status-${booking.status || 'pending'}`}>
                          {booking.status || 'pending'}
                        </span>
                      </div>
                      <div className="booking-details">
                        <div style={{ fontWeight: '600', color: '#374151', marginBottom: '2px' }}>{specificName}</div>
                        <div>{booking.type} • ₹{booking.price?.toLocaleString()} • {dateFormatted}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div>No bookings yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>

            <div className="quick-actions">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div
                    key={index}
                    className="action-btn"
                    style={{ '--action-color': action.color }}
                    onClick={action.action}
                  >
                    <div
                      className="action-icon"
                      style={{ background: `${action.color}15`, color: action.color }}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="action-label-wrapper">
                      <span className="action-label">{action.label}</span>
                      {action.badge && (
                        <span className="action-badge" style={{background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px'}}>{action.badge}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
        
        {/* ── NEW: MONTHLY PERFORMANCE SECTION ── */}
        <div className="monthly-section">
          <div className="monthly-header">
            <h2 className="section-title">Performance: {getMonthName(selectedMonth)}</h2>
            <input 
              type="month" 
              className="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          
          <div className="monthly-grid">
            <div className="monthly-card">
              <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '12px', borderRadius: '10px' }}>
                <Calendar size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Trips Booked</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>{monthlyStats.trips}</div>
              </div>
            </div>
            
            <div className="monthly-card">
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '10px' }}>
                <Wrench size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Services Booked</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>{monthlyStats.services}</div>
              </div>
            </div>

            <div className="monthly-card">
              <div style={{ background: '#dcfce7', color: '#059669', padding: '12px', borderRadius: '10px' }}>
                <Banknote size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Revenue Collected</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>₹{monthlyStats.revenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
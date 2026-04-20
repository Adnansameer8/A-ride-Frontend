import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Authcontext';
import { 
  User, Shield, Edit2, Save, X, LogOut, Clock, TrendingUp
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, updateUserInfo } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [userBookings, setUserBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedTrips: 0,
    totalSpent: 0,
    memberSince: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUserData();
    loadUserHistory();
  }, [isAuthenticated, user]);

  const loadUserData = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      });

      // Format "Member Since" from createdAt date
      const date = user.createdAt ? new Date(user.createdAt) : new Date();
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      setStats(prev => ({ ...prev, memberSince: formattedDate }));
    }
  };

  // ── NEW: Fetch Real History from PostgreSQL ──
  const loadUserHistory = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      // Use the specific endpoint for current user history
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setUserBookings(data.bookings);
        
        // Calculate Statistics
        const totalSpent = data.bookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
        const approvedCount = data.bookings.filter(b => b.status === 'approved').length;
        
        setStats(prev => ({
          ...prev,
          totalBookings: data.bookings.length,
          completedTrips: approvedCount,
          totalSpent: totalSpent
        }));
      }
    } catch (error) {
      console.error("Error loading user history:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── NEW: Save Profile to PostgreSQL ──
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      // Route is established in authRoutes
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Update AuthContext so state reflects changes immediately
        if (updateUserInfo) updateUserInfo(data.user);
        setIsEditing(false);
        alert('Profile updated in database!');
      }
    } catch (error) {
      alert('Failed to update profile.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { bg: '#d1fae5', color: '#065f46' };
      case 'rejected': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#fef3c7', color: '#92400e' };
    }
  };

  if (!user) return null;

  return (
    <>
      <style>{`
        .profile-page { min-height: 100vh; background: #f9fafb; padding: 40px 20px; font-family: 'Outfit', sans-serif; }
        .profile-container { max-width: 1200px; margin: 0 auto; }
        .profile-header { background: #111827; border-radius: 24px; padding: 48px; margin-bottom: 32px; color: white; }
        .profile-top { display: flex; align-items: center; gap: 32px; margin-bottom: 32px; }
        .profile-avatar { width: 100px; height: 100px; border-radius: 24px; background: linear-gradient(135deg, #ff5e00, #ff9a00); display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; }
        .profile-role { background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #ff5e00; text-transform: uppercase; display: inline-flex; align-items: center; gap: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .stat-value { font-size: 28px; font-weight: 800; color: #ff5e00; }
        .profile-content { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .profile-card { background: white; border-radius: 20px; padding: 32px; border: 2px solid #f3f4f6; }
        .form-input { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 12px; margin-top: 8px; font-family: inherit; }
        .form-input:disabled { background: #f9fafb; border-color: transparent; color: #4b5563; }
        .booking-item { padding: 16px; background: #f9fafb; border-radius: 12px; margin-bottom: 12px; border: 1px solid #eee; }
        @media (max-width: 768px) { .profile-content, .stats-grid { grid-template-columns: 1fr; } .profile-top { flex-direction: column; text-align: center; } }
      `}</style>

      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-top">
              <div className="profile-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <div>
                <h1 style={{fontSize: '32px', fontWeight: '800', margin: 0}}>{user.name}</h1>
                <div style={{marginTop: '8px'}}>
                  <span className="profile-role"><Shield size={14}/> {user.role}</span>
                </div>
                <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} style={{background:'#ff5e00', color:'white', border:'none', padding:'10px 20px', borderRadius:'12px', cursor:'pointer', fontWeight:'600'}}>Edit Profile</button>
                  ) : (
                    <>
                      <button onClick={handleSave} style={{background:'#10b981', color:'white', border:'none', padding:'10px 20px', borderRadius:'12px', cursor:'pointer', fontWeight:'600'}}>Save Changes</button>
                      <button onClick={() => setIsEditing(false)} style={{background:'#6b7280', color:'white', border:'none', padding:'10px 20px', borderRadius:'12px', cursor:'pointer', fontWeight:'600'}}>Cancel</button>
                    </>
                  )}
                  <button onClick={handleLogout} style={{background:'#ef4444', color:'white', border:'none', padding:'10px 20px', borderRadius:'12px', cursor:'pointer', fontWeight:'600'}}>Logout</button>
                </div>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-item"><div className="stat-value">{stats.totalBookings}</div><div style={{fontSize:'12px', opacity:0.7, textTransform:'uppercase', letterSpacing:'1px'}}>Total Bookings</div></div>
              <div className="stat-item"><div className="stat-value">{stats.completedTrips}</div><div style={{fontSize:'12px', opacity:0.7, textTransform:'uppercase', letterSpacing:'1px'}}>Approved</div></div>
              <div className="stat-item"><div className="stat-value">₹{(stats.totalSpent / 1000).toFixed(1)}K</div><div style={{fontSize:'12px', opacity:0.7, textTransform:'uppercase', letterSpacing:'1px'}}>Total Spent</div></div>
              <div className="stat-item"><div className="stat-value">{stats.memberSince}</div><div style={{fontSize:'12px', opacity:0.7, textTransform:'uppercase', letterSpacing:'1px'}}>Member Since</div></div>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-card">
              <h3 style={{margin: '0 0 20px 0', fontSize: '20px'}}>Personal Details</h3>
              <div>
                <label style={{fontSize:'12px', fontWeight:'700', color:'#9ca3af'}}>FULL NAME</label>
                <input name="name" className="form-input" value={formData.name} onChange={handleInputChange} disabled={!isEditing} />
                
                <label style={{fontSize:'12px', fontWeight:'700', marginTop:'20px', display:'block', color:'#9ca3af'}}>PHONE NUMBER</label>
                <input name="phone" className="form-input" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} />
                
                <label style={{fontSize:'12px', fontWeight:'700', marginTop:'20px', display:'block', color:'#9ca3af'}}>LOCATION</label>
                <input name="location" className="form-input" value={formData.location} onChange={handleInputChange} disabled={!isEditing} />
                
                <label style={{fontSize:'12px', fontWeight:'700', marginTop:'20px', display:'block', color:'#9ca3af'}}>BIO</label>
                <textarea name="bio" className="form-input" style={{minHeight:'100px'}} value={formData.bio} onChange={handleInputChange} disabled={!isEditing} />
              </div>
            </div>

            <div className="profile-card">
              <h3 style={{margin: '0 0 20px 0', fontSize: '20px'}}>Recent Activity</h3>
              <div>
                {userBookings.length > 0 ? (
                  userBookings.slice(0, 5).map((booking) => {
                    const statusStyle = getStatusColor(booking.status);
                    return (
                      <div key={booking.id} className="booking-item">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <span style={{fontWeight:'700', color: '#111827'}}>{booking.details?.tripName || booking.type}</span>
                          <span style={{fontSize:'10px', background:statusStyle.bg, color:statusStyle.color, padding:'4px 10px', borderRadius:'10px', fontWeight:'800', textTransform:'uppercase'}}>{booking.status}</span>
                        </div>
                        <div style={{fontSize:'13px', color:'#6b7280', marginTop:'8px'}}>
                          ₹{booking.price?.toLocaleString()} • {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{textAlign:'center', padding:'40px 0'}}>
                    <Clock size={40} style={{color:'#e5e7eb', marginBottom:'10px'}}/>
                    <p style={{color:'#9ca3af', margin:0}}>No bookings found in your history.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../Authcontext';
import { Search, UserPlus, Edit, Trash2, Shield, User as UserIcon } from 'lucide-react';

const UserManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: ROLES.USER
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  // ── Fetch Users from PostgreSQL ───────────────────────────
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  // ── Add User via Backend API ──────────────────────────────
// ── Add OR Update User via Backend API ──────────────────────────────
  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('aride_token');
      let response;

      if (editingUser) {
        // ── EDIT EXISTING USER ──
        response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password, // Will only update if they typed something new
            role: formData.role
          })
        });
      } else {
        // ── ADD NEW USER ──
        response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: formData.role
          })
        });
      }

      const data = await response.json();

      if (response.ok || data.success) {
        alert(editingUser ? 'User updated successfully!' : 'User added successfully!');
        resetForm();
        loadUsers(); // Refresh the table automatically
      } else {
        alert(`Failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Network error. Make sure your backend is running.");
    }
  };

  const handleDeleteUser = async (userId) => {
    // Add a confirmation dialog so admins don't click it by accident
    if (!window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      const data = await response.json();

      if (response.ok || data.success) {
        alert("User deleted successfully.");
        loadUsers(); // Refresh the table to remove the deleted user visually
      } else {
        alert(`Failed to delete user: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Network error. Could not reach the server to delete the user.");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || ROLES.USER
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', password: '', role: ROLES.USER });
  };

  const getRoleBadge = (role) => {
    const styles = {
      [ROLES.ADMIN]: { bg: '#fee2e2', color: '#dc2626', icon: Shield },
      [ROLES.SUPPORT]: { bg: '#dbeafe', color: '#1d4ed8', icon: UserIcon },
      [ROLES.USER]: { bg: '#f3f4f6', color: '#374151', icon: UserIcon }
    };
    
    const style = styles[role] || styles[ROLES.USER];
    const Icon = style.icon;
    
    return (
      <span style={{
        background: style.bg, color: style.color, padding: '6px 12px',
        borderRadius: '20px', fontSize: '12px', fontWeight: '800',
        textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center',
        gap: '6px', letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Icon size={14} />
        {role}
      </span>
    );
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        
        .user-management {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 2rem;
          font-family: 'Outfit', sans-serif;
        }

        .page-header {
          background: white; border-radius: 24px; padding: 2.5rem; margin-bottom: 2rem;
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.2);
        }

        .page-title {
          font-size: 2.5rem; font-weight: 900; color: #1e293b; margin: 0;
        }

        .add-user-btn { padding: 12px 24px; background: #ff5e00; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        
        .add-user-btn:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(249, 115, 22, 0.4); }

        .filters-section {
          background: white; border-radius: 24px; padding: 2rem; margin-bottom: 2rem;
          box-shadow: 0 15px 40px rgba(0,0,0,0.06); border: 1px solid rgba(255,255,255,0.3);
        }

        .filters-row { display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; }
        .search-box { flex: 1; min-width: 280px; position: relative; }
        .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input {
          width: 100%; padding: 1rem 1rem 1rem 3.5rem; border-radius: 16px;
          border: 2px solid #e2e8f0; background: #f8fafc; font-size: 1rem; font-family: inherit;
        }
        .search-input:focus { outline: none; border-color: #f97316; background: white; }

        .role-filter { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .role-filter-btn {
          padding: 0.875rem 1.5rem; border-radius: 16px; border: 2px solid #e2e8f0;
          background: #f8fafc; font-weight: 800; cursor: pointer; transition: all 0.3s ease;
          font-size: 0.875rem; color: #475569;
        }
        .role-filter-btn.active, .role-filter-btn:hover {
          background: #f97316; color: white; border-color: #f97316;
        }

        .users-table-container {
          background: white; border-radius: 24px; overflow: hidden;
          box-shadow: 0 25px 70px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.3);
        }
        .users-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .users-table thead { background: #f8fafc; }
        .users-table th { padding: 1.5rem; font-size: 0.75rem; font-weight: 900; color: #64748b; text-transform: uppercase; text-align: left; }
        .users-table td { padding: 1.5rem; border-top: 1px solid #f1f5f9; vertical-align: middle; }
        .users-table tbody tr:hover { background: #fef7f2; }

        .user-info { display: flex; align-items: center; gap: 1rem; }
        .user-avatar {
          width: 3.5rem; height: 3.5rem; border-radius: 50%; background: #f97316;
          display: flex; align-items: center; justify-content: center; font-weight: 900;
          color: white; font-size: 1.25rem; flex-shrink: 0;
        }
        .user-name { font-weight: 800; font-size: 1rem; color: #1e293b; }
        .user-email { font-size: 0.875rem; color: #64748b; }

        .action-buttons { display: flex; gap: 0.75rem; }
        .action-btn {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
          border-radius: 12px; font-weight: 800; font-size: 0.875rem; cursor: pointer; border: none;
        }
        .edit-btn { background: #dbeafe; color: #1d4ed8; }
        .delete-btn { background: #fee2e2; color: #dc2626; }


        /* ── COMPLETELY BULLETPROOF MODAL CSS ── */
        .um-modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;
        }
        
        .um-modal {
          background: #fff; width: 100%; max-width: 500px; border-radius: 24px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .um-header { padding: 30px 30px 20px; border-bottom: 1px solid #f1f5f9; display: block; text-align: left; }
        .um-title { font-size: 24px; font-weight: 900; color: #111; margin: 0 0 8px 0; line-height: 1.2; }
        .um-subtitle { font-size: 14px; color: #64748b; margin: 0; }

        .um-body { padding: 24px 30px; display: flex; flex-direction: column; gap: 20px; max-height: 60vh; overflow-y: auto; }
        .um-group { display: flex; flex-direction: column; gap: 8px; text-align: left; }
        .um-label { font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .um-input {
          width: 100%; padding: 14px 16px; border-radius: 12px; border: 2px solid #e2e8f0;
          background: #f8fafc; font-size: 15px; font-family: 'Outfit', sans-serif; transition: 0.2s;
        }
        .um-input:focus { outline: none; border-color: #f97316; background: #fff; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }

        .um-footer { padding: 20px 30px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
        .um-btn { flex: 1; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 800; border: none; cursor: pointer; transition: 0.2s; }
        .um-btn-cancel { background: #fff; color: #475569; border: 2px solid #e2e8f0; }
        .um-btn-cancel:hover { background: #f1f5f9; }
        .um-btn-submit { background: #f97316; color: #fff; }
        .um-btn-submit:hover { background: #ea580c; transform: translateY(-2px); }

        @media (max-width: 768px) {
          .page-header, .filters-section { border-radius: 20px; flex-direction: column; align-items: stretch; gap: 16px; }
        }
      `}</style>

      <div className="user-management">
        {/* HEADER */}
        <div className="page-header">
         <div>
  <h1
    className="page-title"
    style={{
      fontFamily: '"Sekuya", system-ui, sans-serif',
      fontSize: "30px",
      marginBottom: "6px"   // 🔥 controls gap
    }}
  >
    User Management
  </h1>

  <p
    
    style={{ fontFamily: "'outline',san-serif", fontSize: "20px", fontWeight: "500" }}
  >
    Manage user accounts, roles, and permissions for the ARide platform.
  </p>
</div>
          <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
            <UserPlus size={24} />
            Add New User
          </button>
        </div>

        {/* FILTERS */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="search-box">
              <Search className="search-icon" size={24} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="role-filter">
              {['all', ROLES.ADMIN, ROLES.SUPPORT, ROLES.USER].map(role => (
                <button
                  key={role}
                  className={`role-filter-btn ${filterRole === role ? 'active' : ''}`}
                  onClick={() => setFilterRole(role)}
                >
                  {role === 'all' ? 'All Users' : role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "'Outfit', sans-serif" }}>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="user-details" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        <div className="user-name">{user.name || 'Unnamed User'}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit-btn" onClick={() => openEditModal(user)}>
                        <Edit size={18} />
                        Edit
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 size={18} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── BULLETPROOF MODAL ── */}
        {showAddModal && (
          <div className="um-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
            <div className="um-modal">
              
              <div className="um-header">
                <h2 className="um-title">{editingUser ? "Edit User" : "Add New User"}</h2>
                <p className="um-subtitle">Enter the details below to register a new account.</p>
              </div>

              <div className="um-body">
                <div className="um-group">
                  <label className="um-label">Full Name *</label>
                  <input
                    type="text"
                    className="um-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="um-group">
                  <label className="um-label">Email Address *</label>
                  <input
                    type="email"
                    className="um-input"
                    value={formData.email}
                    disabled={!!editingUser}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </div>

                <div className="um-group">
                  <label className="um-label">Phone Number</label>
                  <input
                    type="tel"
                    className="um-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit number"
                  />
                </div>

                <div className="um-group">
                  <label className="um-label">
                    {editingUser ? "New Password" : "Password *"}
                  </label>
                  <input
                    type="password"
                    className="um-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password"
                  />
                </div>

                <div className="um-group">
                  <label className="um-label">Role *</label>
                  <select
                    className="um-input"
                    style={{ cursor: 'pointer' }}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value={ROLES.USER}>User</option>
                    <option value={ROLES.SUPPORT}>Support</option>
                    <option value={ROLES.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>

              <div className="um-footer">
                <button className="um-btn um-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button className="um-btn um-btn-submit" onClick={handleAddOrUpdate}>
                  {editingUser ? "Update User" : "Add User"}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;
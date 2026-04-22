import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../Authcontext';
import AlertModal from '../../components/AlertModal';
import {
  Search, UserPlus, Edit, Trash2, Shield,
  User as UserIcon, ChevronUp, ChevronDown,
  ChevronsUpDown, CheckCircle, AlertTriangle
} from 'lucide-react';

const UserManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [users, setUsers]               = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);

  // ── Sort state ──
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir]     = useState('desc');

  // ── Checkbox selection ──
  const [selectedUsers, setSelectedUsers] = useState([]);

  // ── Alert modal ──
  const [alertConfig, setAlertConfig] = useState({ isOpen: false });

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: ROLES.USER
  });

  const truncate = (str, n = 13) =>
    str && str.length > n ? str.substring(0, n) + '...' : str || 'N/A';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return; }
    loadUsers();
  }, [isAdmin, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setUsers(data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Sort handler ──
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} color="#f97316" />
      : <ChevronDown size={13} color="#f97316" />;
  };

  // ── Checkbox handlers ──
  const handleSelectAll = (e) => {
    setSelectedUsers(e.target.checked ? processedUsers.map(u => u.id) : []);
  };
  const handleSelectOne = (e, id) => {
    setSelectedUsers(prev =>
      e.target.checked ? [...prev, id] : prev.filter(x => x !== id)
    );
  };

  // ── Filtered + sorted users ──
  const processedUsers = useMemo(() => {
    let list = users.filter(user => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });

    list = [...list].sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (sortField === 'createdAt') {
        aVal = new Date(aVal); bVal = new Date(bVal);
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, searchQuery, filterRole, sortField, sortDir]);

  // ── Add / Update user ──
  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('aride_token');
      let response;
      if (editingUser) {
        response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            name: formData.name, email: formData.email,
            phone: formData.phone, password: formData.password, role: formData.role
          })
        });
      } else {
        response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      const data = await response.json();
      if (response.ok || data.success) {
        showToast(editingUser ? 'User updated successfully!' : 'User added successfully!');
        resetForm();
        loadUsers();
      } else {
        showToast(`Failed: ${data.message}`, 'error');
      }
    } catch {
      showToast('Network error. Make sure your backend is running.', 'error');
    }
  };

  // ── Delete user — uses AlertModal ──
  const handleDeleteUser = (userId, userName) => {
    setAlertConfig({
      isOpen: true,
      type: 'danger',
      title: 'Delete User?',
      message: `This will permanently delete "${userName || 'this user'}". This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setAlertConfig({ isOpen: false });
        try {
          const token = localStorage.getItem('aride_token');
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok || data.success) {
            showToast('User deleted successfully.', 'info');
            setSelectedUsers(prev => prev.filter(id => id !== userId));
            loadUsers();
          } else {
            showToast(`Failed to delete: ${data.message}`, 'error');
          }
        } catch {
          showToast('Network error. Could not delete user.', 'error');
        }
      },
      onCancel: () => setAlertConfig({ isOpen: false }),
    });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '', email: user.email || '',
      phone: user.phone || '', password: '', role: user.role || ROLES.USER
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', password: '', role: ROLES.USER });
  };

  const getRoleBadge = (role) => {
    const map = {
      [ROLES.ADMIN]:   { bg: '#fee2e2', color: '#dc2626', label: 'Admin' },
      [ROLES.SUPPORT]: { bg: '#dbeafe', color: '#1d4ed8', label: 'Support' },
      [ROLES.USER]:    { bg: '#f3f4f6', color: '#374151', label: 'User' },
    };
    const s = map[role] || map[ROLES.USER];
    return (
      <span style={{
        background: s.bg, color: s.color, padding: '4px 8px',
        borderRadius: '6px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase'
      }}>
        {s.label}
      </span>
    );
  };

  const thStyle = (field) => ({
    padding: '14px 16px', fontSize: '11px', fontWeight: '800', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left',
    cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap',
    background: sortField === field ? '#fff7ed' : '#f8fafc',
    transition: 'background 0.15s',
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .user-management { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 2rem; font-family: 'Outfit', sans-serif; }
        .page-header { background: white; border-radius: 24px; padding: 2rem 2.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
        .add-user-btn { padding: 11px 20px; background: #f97316; color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 16px rgba(249,115,22,0.3); font-family: 'Outfit', sans-serif; }
        .add-user-btn:hover { background: #ea580c; transform: translateY(-2px); }
        .filters-section { background: white; border-radius: 16px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .search-box { flex: 1; min-width: 240px; position: relative; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input { width: 100%; padding: 10px 12px 10px 40px; border-radius: 10px; border: 2px solid #e5e7eb; background: #f9fafb; font-size: 14px; font-family: 'Outfit', sans-serif; font-weight: 500; transition: 0.2s; }
        .search-input:focus { outline: none; border-color: #f97316; background: white; }
        .role-filter { display: flex; gap: 8px; flex-wrap: wrap; }
        .role-filter-btn { padding: 8px 16px; border-radius: 10px; border: 2px solid #e5e7eb; background: #f9fafb; font-weight: 700; font-size: 13px; cursor: pointer; color: #475569; transition: all 0.15s; font-family: 'Outfit', sans-serif; }
        .role-filter-btn.active, .role-filter-btn:hover { background: #f97316; color: white; border-color: #f97316; }
        .table-container { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1.5px solid #f1f5f9; }
        .table-meta { padding: 14px 20px; border-bottom: 1.5px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .users-table { width: 100%; border-collapse: collapse; }
        .users-table thead { background: #f8fafc; }
        .users-table th { border-bottom: 1.5px solid #f3f4f6; }
        .users-table td { padding: 13px 16px; border-bottom: 1px solid #f9fafb; font-size: 14px; vertical-align: middle; }
        .users-table tbody tr:hover { background: #fef7f2; }
        .users-table tbody tr.selected-row { background: #fff7ed; }
        .th-inner { display: flex; align-items: center; gap: 5px; }
        .user-avatar { width: 34px; height: 34px; border-radius: 50%; background: #f97316; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 14px; flex-shrink: 0; }
        .action-buttons { display: flex; gap: 8px; }
        .btn-action { display: inline-flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; border: none; font-family: 'Outfit', sans-serif; transition: all 0.15s; }
        .btn-edit { background: #dbeafe; color: #1d4ed8; }
        .btn-edit:hover { background: #bfdbfe; }
        .btn-delete { background: #fee2e2; color: #dc2626; }
        .btn-delete:hover { background: #fecaca; }
        .custom-checkbox { width: 16px; height: 16px; accent-color: #f97316; cursor: pointer; }
        .empty-state { padding: 60px 20px; text-align: center; color: #94a3b8; }
        .um-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        .um-modal { background: #fff; width: 100%; max-width: 500px; border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.3); animation: slideUp 0.25s cubic-bezier(.4,0,.2,1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .um-header { padding: 28px 28px 20px; border-bottom: 1px solid #f1f5f9; }
        .um-title { font-size: 22px; font-weight: 900; color: #111; margin: 0 0 6px; }
        .um-subtitle { font-size: 13px; color: #64748b; margin: 0; }
        .um-body { padding: 22px 28px; display: flex; flex-direction: column; gap: 18px; max-height: 60vh; overflow-y: auto; }
        .um-group { display: flex; flex-direction: column; gap: 6px; }
        .um-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .um-input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 2px solid #e5e7eb; background: #f9fafb; font-size: 14px; font-family: 'Outfit', sans-serif; transition: 0.2s; }
        .um-input:focus { outline: none; border-color: #f97316; background: #fff; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
        .um-footer { padding: 18px 28px; background: #f9fafb; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
        .um-btn { flex: 1; padding: 13px; border-radius: 11px; font-size: 14px; font-weight: 800; border: none; cursor: pointer; font-family: 'Outfit', sans-serif; transition: 0.2s; }
        .um-btn-cancel { background: #fff; color: #475569; border: 2px solid #e5e7eb; }
        .um-btn-cancel:hover { background: #f1f5f9; }
        .um-btn-submit { background: #f97316; color: #fff; box-shadow: 0 4px 14px rgba(249,115,22,0.3); }
        .um-btn-submit:hover { background: #ea580c; }
        .toast { position: fixed; bottom: 28px; right: 28px; padding: 13px 20px; border-radius: 13px; font-weight: 700; font-size: 14px; z-index: 9999; animation: slideUp 0.3s ease; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); font-family: 'Outfit', sans-serif; }
        .toast-success { background: #111; color: #fff; }
        .toast-error   { background: #ef4444; color: #fff; }
        .toast-info    { background: #3b82f6; color: #fff; }
      `}</style>

      <div className="user-management">

        {/* ── HEADER ── */}
        <div className="page-header">
          <div>
            <h1 style={{ fontFamily: '"Sekuya", system-ui, sans-serif', fontSize: '30px', fontWeight: '900', color: '#111827', margin: '0 0 6px' }}>
              User Management
            </h1>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#64748b', margin: 0 }}>
              Manage user accounts, roles, and permissions for the ARide platform.
            </p>
          </div>
          <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} /> Add New User
          </button>
        </div>

        {/* ── FILTERS ── */}
        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input type="text" className="search-input" placeholder="Search by name or email..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="role-filter">
            {['all', ROLES.ADMIN, ROLES.SUPPORT, ROLES.USER].map(role => (
              <button key={role}
                className={`role-filter-btn ${filterRole === role ? 'active' : ''}`}
                onClick={() => setFilterRole(role)}>
                {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="table-container">

          {/* Meta row */}
          <div className="table-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
                {processedUsers.length} user{processedUsers.length !== 1 ? 's' : ''}
              </span>
              {selectedUsers.length > 0 && (
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#f97316', background: '#fff7ed', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fed7aa' }}>
                  {selectedUsers.length} selected
                </span>
              )}
            </div>
            {selectedUsers.length > 0 && (
              <button onClick={() => setSelectedUsers([])}
                style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Clear selection
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="users-table">
              <thead>
                <tr>
                  <th style={{ ...thStyle(null), width: '44px' }}>
                    <input type="checkbox" className="custom-checkbox"
                      checked={selectedUsers.length === processedUsers.length && processedUsers.length > 0}
                      onChange={handleSelectAll} />
                  </th>
                  <th style={thStyle('name')} onClick={() => handleSort('name')}>
                    <div className="th-inner">Name / Email <SortIcon field="name" /></div>
                  </th>
                  <th style={thStyle('phone')} onClick={() => handleSort('phone')}>
                    <div className="th-inner">Phone <SortIcon field="phone" /></div>
                  </th>
                  <th style={thStyle('role')} onClick={() => handleSort('role')}>
                    <div className="th-inner">Role <SortIcon field="role" /></div>
                  </th>
                  <th style={thStyle('createdAt')} onClick={() => handleSort('createdAt')}>
                    <div className="th-inner">Joined <SortIcon field="createdAt" /></div>
                  </th>
                  <th style={thStyle(null)}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: "'Outfit', sans-serif" }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading users...</div>
                    </td>
                  </tr>
                ) : processedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>No users found</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Try adjusting your search or filters</div>
                    </td>
                  </tr>
                ) : (
                  processedUsers.map(user => (
                    <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected-row' : ''}>

                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" className="custom-checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleSelectOne(e, user.id)} />
                      </td>

                      {/* Name + Email */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#111' }} title={user.name}>
                              {truncate(user.name || 'Unnamed')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }} title={user.email}>
                              {truncate(user.email)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ fontWeight: '600', color: '#475569' }} title={user.phone}>
                        {truncate(user.phone)}
                      </td>

                      {/* Role */}
                      <td>{getRoleBadge(user.role)}</td>

                      {/* Joined */}
                      <td style={{ fontWeight: '600', color: '#64748b', fontSize: '13px' }}>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action btn-edit" onClick={() => openEditModal(user)}>
                            <Edit size={14} /> Edit
                          </button>
                          <button className="btn-action btn-delete" onClick={() => handleDeleteUser(user.id, user.name)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ADD / EDIT MODAL ── */}
        {showAddModal && (
          <div className="um-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
            <div className="um-modal">
              <div className="um-header">
                <h2 className="um-title">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                <p className="um-subtitle">
                  {editingUser ? 'Update the details for this account.' : 'Enter the details below to register a new account.'}
                </p>
              </div>
              <div className="um-body">
                <div className="um-group">
                  <label className="um-label">Full Name *</label>
                  <input type="text" className="um-input" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe" />
                </div>
                <div className="um-group">
                  <label className="um-label">Email Address *</label>
                  <input type="email" className="um-input" value={formData.email}
                    disabled={!!editingUser}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    style={{ opacity: editingUser ? 0.6 : 1 }} />
                </div>
                <div className="um-group">
                  <label className="um-label">Phone Number</label>
                  <input type="tel" className="um-input" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit number" />
                </div>
                <div className="um-group">
                  <label className="um-label">{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input type="password" className="um-input" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password" />
                </div>
                <div className="um-group">
                  <label className="um-label">Role *</label>
                  <select className="um-input" style={{ cursor: 'pointer' }} value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value={ROLES.USER}>User</option>
                    <option value={ROLES.SUPPORT}>Support</option>
                    <option value={ROLES.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>
              <div className="um-footer">
                <button className="um-btn um-btn-cancel" onClick={resetForm}>Cancel</button>
                <button className="um-btn um-btn-submit" onClick={handleAddOrUpdate}>
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ALERT MODAL ── */}
        <AlertModal {...alertConfig} />

        {/* ── TOAST ── */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'error'   && <AlertTriangle size={16} />}
            {toast.type === 'info'    && <CheckCircle size={16} />}
            {toast.msg}
          </div>
        )}

      </div>
    </>
  );
};

export default UserManagement;
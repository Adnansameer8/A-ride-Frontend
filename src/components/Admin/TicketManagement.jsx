import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../Authcontext';
import { Eye, X, Send, CheckCircle, Paperclip, CheckCheck, User, Trash2, Download, Ticket, AlertCircle, MessageSquare } from 'lucide-react'; 

const TicketManagement = () => {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // ── UNREAD NOTIFICATION TRACKING ──
  const [viewedTimestamps, setViewedTimestamps] = useState(() => 
    JSON.parse(localStorage.getItem('aride_ticket_views') || '{}')
  );
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevConvLengthRef = useRef(0);

  // ── 2-SECOND AUTO REFRESH ──
  useEffect(() => {
    if (!user || !hasAnyRole(ROLES.ADMIN, ROLES.SUPPORT)) {
      navigate('/');
      return;
    }
    
    fetchTickets(); 
    
    const intervalId = setInterval(() => {
      fetchTickets();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [user]);

  // Update selected ticket silently when new data arrives
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
        // Keep marking it as read while the modal is open
        const newViews = { ...viewedTimestamps, [updated.id]: Date.now() };
        setViewedTimestamps(newViews);
        localStorage.setItem('aride_ticket_views', JSON.stringify(newViews));
      }
    }
  }, [tickets]);

  // Smart Auto-Scroll
  useEffect(() => {
    if (selectedTicket) {
      const currentLength = selectedTicket.conversation?.length || 0;
      if (currentLength > prevConvLengthRef.current) {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      prevConvLengthRef.current = currentLength;
    } else {
      prevConvLengthRef.current = 0;
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/support/tickets/all`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      // Fail silently on polling errors
    }
  };

  const handleOpenTicket = (t) => {
    setSelectedTicket(t);
    // Mark as read immediately when clicked
    const newViews = { ...viewedTimestamps, [t.id]: Date.now() };
    setViewedTimestamps(newViews);
    localStorage.setItem('aride_ticket_views', JSON.stringify(newViews));
  };

  // ── ACCURATE UNREAD LOGIC ──
  const isUnread = (t) => {
    if (!t.conversation || t.conversation.length === 0) return false;
    const lastMsg = t.conversation[t.conversation.length - 1];
    
    // If the staff sent the last message, it is NOT unread
    if (lastMsg.sender !== 'user') return false;
    
    const lastViewed = viewedTimestamps[t.id] || 0;
    const lastMsgTime = new Date(lastMsg.timestamp).getTime();
    
    return lastMsgTime > lastViewed;
  };

  // ── ADDED 4TH STAT CARD: NEW MESSAGES ──
  const ticketStats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'closed').length;
    const active = total - resolved;
    const unread = tickets.filter(t => isUnread(t)).length; // Calculates unread count
    return { total, active, resolved, unread };
  }, [tickets, viewedTimestamps]);

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  // ── FORCE UNREAD TO TOP OF TABLE ──
  const processedTickets = useMemo(() => {
    let filtered = [...tickets];
    
    filtered.sort((a, b) => {
      const unreadA = isUnread(a);
      const unreadB = isUnread(b);
      
      // Feature: Unread messages instantly jump to the top
      if (unreadA && !unreadB) return -1;
      if (!unreadA && unreadB) return 1;

      // Normal Sorting for the rest of the tickets
      let aVal = '', bVal = '';
      switch(sortConfig.field) {
        case 'user': aVal = a.name?.toLowerCase() || ''; bVal = b.name?.toLowerCase() || ''; break;
        case 'subject': aVal = a.subject?.toLowerCase() || ''; bVal = b.subject?.toLowerCase() || ''; break;
        case 'category': aVal = a.category?.toLowerCase() || ''; bVal = b.category?.toLowerCase() || ''; break;
        case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
        case 'date': 
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default: break;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [tickets, sortConfig, viewedTimestamps]);

  const SortHeader = ({ label, field }) => {
    const isActive = sortConfig.field === field;
    const isAsc = isActive && sortConfig.direction === 'asc';
    const isDesc = isActive && sortConfig.direction === 'desc';

    return (
      <th onClick={() => handleSort(field)} style={{ cursor: 'pointer', transition: '0.2s', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {label}
          <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '-2px', display: 'inline-flex' }}>
            <span style={{ color: isAsc ? '#ff5e00' : '#cbd5e1' }}>↑</span>
            <span style={{ color: isDesc ? '#ff5e00' : '#cbd5e1', marginLeft: '-2px' }}>↓</span>
          </span>
        </div>
      </th>
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        alert("File size must be less than 10MB"); return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({ name: file.name, data: reader.result, isImage: file.type.startsWith('image/') }); 
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null; 
  };

  const handleSendReply = async (isResolving) => {
    if (!replyText.trim() && !selectedFile && !isResolving) return;

    const token = localStorage.getItem('aride_token');
    const payload = { reply: replyText, attachment: selectedFile, status: isResolving ? 'closed' : 'open' };

    const res = await fetch(`${import.meta.env.VITE_API_URL}/support/tickets/${selectedTicket.id}/reply`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if ((await res.json()).success) {
      setReplyText(''); setSelectedFile(null); fetchTickets(); 
      if (isResolving) setSelectedTicket(null); 
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (user?.role !== 'admin') return alert("Only Admins can delete tickets.");
    if (!window.confirm("Are you sure you want to permanently delete this ticket?")) return;
    
    const token = localStorage.getItem('aride_token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/support/tickets/${ticketId}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    if ((await res.json()).success) {
      setTickets(tickets.filter(t => t.id !== ticketId));
      if (selectedTicket && selectedTicket.id === ticketId) setSelectedTicket(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (user?.role !== 'admin') return alert("Only Admins can delete tickets.");
    if (!window.confirm(`Delete ${selectedTickets.length} ticket(s)?`)) return;
    
    const token = localStorage.getItem('aride_token');
    await Promise.all(selectedTickets.map(id =>
      fetch(`${import.meta.env.VITE_API_URL}/support/tickets/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    ));
    setTickets(tickets.filter(t => !selectedTickets.includes(t.id)));
    setSelectedTickets([]); 
  };

  const handleExportExcel = () => {
    if (selectedTickets.length === 0) return;
    const dataToExport = tickets.filter(t => selectedTickets.includes(t.id));
    const headers = ['Ticket ID', 'User Name', 'Email', 'Subject', 'Category', 'Status', 'Date'];
    const rows = dataToExport.map(t => [
      t.id, `"${t.name || ''}"`, `"${t.email || ''}"`, `"${t.subject || ''}"`, `"${t.category || ''}"`,
      (t.status || 'open').toUpperCase(), t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', `ARide_Tickets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleSelectAll = (e) => setSelectedTickets(e.target.checked ? processedTickets.map(t => t.id) : []);
  const handleSelectOne = (e, id) => setSelectedTickets(e.target.checked ? [...selectedTickets, id] : selectedTickets.filter(tId => tId !== id));

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e5e8f0; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-info h3 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
        .stat-info p { margin: 4px 0 0; font-size: 24px; font-weight: 800; color: #111827; }

        .table-card { background: white; border-radius: 16px; overflow: hidden; border: 2px solid #f3f4f6; }
        .b-table { width: 100%; border-collapse: collapse; }
        .b-table th { padding: 16px; background: #f8fafc; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #edf2f7; }
        .b-table th:hover { background: #f1f5f9; }
        .b-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; vertical-align: middle; }
        
        .btn-action { padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-view { background: #f1f5f9; color: #475569; }
        .btn-view:hover { background: #e2e8f0; }

        /* ── DYNAMIC UNREAD BUTTON STYLES ── */
        .btn-view-unread { 
          background: #ef4444; 
          color: white; 
          animation: pulse-btn 2s infinite; 
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .btn-view-unread:hover { background: #dc2626; transform: translateY(-1px); }

        @keyframes pulse-btn {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .btn-delete { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .btn-delete:hover { background: #fecaca; }
        
        .btn-export { background: #10b981; color: white; padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .btn-export:hover { background: #059669; transform: translateY(-2px); }
        .btn-delete-bulk { background: #ef4444; color: white; padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
        .btn-delete-bulk:hover { background: #dc2626; transform: translateY(-2px); }

        .custom-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #ff5e00; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-open { background: #fef3c7; color: #d97706; }
        .status-closed { background: #dcfce7; color: #059669; }

        .unread-badge { background: #ef4444; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 8px; margin-left: 8px; display: inline-block; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        .chat-modal { background: white; border-radius: 24px; width: 100%; max-width: 500px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.25); }
        
        .chat-bg { background: #111827; background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; padding: 20px; height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; color: white; line-height: 1.4; position: relative; word-wrap: break-word; }
        
        .bubble-staff { align-self: flex-end; background: #ff5e00; border-bottom-right-radius: 2px; }
        .bubble-user { align-self: flex-start; background: #374151; border-bottom-left-radius: 2px; }
        .b-meta { font-size: 10px; opacity: 0.7; margin-top: 4px; display: flex; flex-direction: column; align-items: flex-end; }
        
        .image-preview-overlay { position: absolute; bottom: 100%; left: 0; right: 0; padding: 12px 20px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border-top: 1px solid #f1f5f9; display: flex; align-items: center; z-index: 20; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); }
        .image-preview-box { position: relative; display: inline-block; }
        .image-preview-img { height: 80px; border-radius: 8px; border: 2px solid #e2e8f0; object-fit: cover; }
        .file-preview-card { padding: 12px 16px; background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; font-weight: 700; color: #333; font-size: 13px; }
        .image-remove-btn { position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border-radius: 50%; cursor: pointer; padding: 4px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4); }
        
        .chat-image { max-width: 100%; border-radius: 8px; margin-bottom: 6px; cursor: pointer; }
        .chat-file { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255,255,255,0.2); border-radius: 8px; color: white; text-decoration: none; font-weight: 600; margin-bottom: 6px; font-size: 13px; }
        .chat-file:hover { background: rgba(255,255,255,0.3); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "24px", flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: "900", color: "#111827", margin: "0 0 8px", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>SUPPORT TICKETS</h1>
          <p style={{ fontSize: "18px", fontWeight: "500", margin: 0, color: "#475569" }}>Review, respond, and manage customer support requests.</p>
        </div>

        {selectedTickets.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn-export" onClick={handleExportExcel}>
              <Download size={18} /> Export
            </button>
            {user?.role === 'admin' && (
              <button className="btn-delete-bulk" onClick={handleDeleteSelected}>
                <Trash2 size={18} /> Delete Selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── UPDATED: 4 STAT CARDS ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <MessageSquare size={24} />
          </div>
          <div className="stat-info">
            <h3>New Messages</h3>
            <p>{ticketStats.unread}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <Ticket size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Tickets</h3>
            <p>{ticketStats.total}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Active</h3>
            <p>{ticketStats.active}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#059669' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Resolved</h3>
            <p>{ticketStats.resolved}</p>
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="b-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  className="custom-checkbox"
                  onChange={handleSelectAll}
                  checked={processedTickets.length > 0 && selectedTickets.length === processedTickets.length}
                />
              </th>
              <SortHeader label="User Info" field="user" />
              <SortHeader label="Subject" field="subject" />
              <SortHeader label="Category" field="category" />
              <SortHeader label="Date" field="date" />
              <SortHeader label="Status" field="status" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedTickets.map(t => {
              const unread = isUnread(t);
              
              let rowBg = 'transparent';
              if (selectedTickets.includes(t.id)) rowBg = '#fff7ed';
              else if (unread) rowBg = '#fff1f2'; 

              return (
                <tr key={t.id} style={{ background: rowBg, borderLeft: unread ? '3px solid #ef4444' : '3px solid transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedTickets.includes(t.id)}
                      onChange={(e) => handleSelectOne(e, t.id)}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: '#111' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{t.email}</div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#333' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {t.subject}
                      {unread && <span className="unread-badge">NEW</span>}
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize', color: '#64748b', fontWeight: '600' }}>{t.category}</td>
                  <td style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{formatDate(t.createdAt)}</td>
                  <td>
                    <span className={`status-badge status-${t.status === 'closed' ? 'closed' : 'open'}`}>
                      {t.status === 'closed' ? 'Resolved' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className={`btn-action ${unread ? 'btn-view-unread' : 'btn-view'}`} 
                        onClick={() => handleOpenTicket(t)}
                      >
                        <Eye size={16} /> {unread ? 'New Message' : 'View'}
                      </button>
                      
                      {user?.role === 'admin' && (
                        <button className="btn-action btn-delete" onClick={() => handleDeleteTicket(t.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {processedTickets.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: '600' }}>No support tickets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="chat-modal" onClick={e => e.stopPropagation()}>
            
            <div style={{ background: '#ff5e00', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={20} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '18px', fontFamily: 'Barlow Condensed', textTransform: 'uppercase' }}>{selectedTicket.subject}</div>
                    <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 600 }}>{selectedTicket.name} • {selectedTicket.email}</div>
                  </div>
              </div>
              <X size={24} style={{ cursor: 'pointer', color: 'white' }} onClick={() => setSelectedTicket(null)} />
            </div>

            <div className="chat-bg">
              {(() => {
                let lastDate = null;

                const formatChatDate = (dateObj) => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  if (dateObj.toDateString() === today.toDateString()) return 'Today';
                  if (dateObj.toDateString() === yesterday.toDateString()) return 'Yesterday';
                  return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                };

                return (selectedTicket.conversation || []).map((m, i) => {
                  const msgDateObj = new Date(m.timestamp);
                  const dateStr = msgDateObj.toLocaleDateString();
                  const showDate = lastDate !== dateStr;
                  lastDate = dateStr;

                  return (
                    <React.Fragment key={i}>
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '16px 0 8px 0' }}>
                          <span style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '4px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {formatChatDate(msgDateObj)}
                          </span>
                        </div>
                      )}

                      <div className={`bubble bubble-${m.sender}`}>
                        {m.attachment && m.attachment.isImage && (
                          <a href={m.attachment.data} target="_blank" rel="noopener noreferrer"><img src={m.attachment.data} alt="Attachment" className="chat-image" /></a>
                        )}
                        {m.attachment && !m.attachment.isImage && (
                          <a href={m.attachment.data} download={m.attachment.name} className="chat-file">📄 {m.attachment.name}</a>
                        )}
                        {m.image && typeof m.image === 'string' && (
                          <a href={m.image} target="_blank" rel="noopener noreferrer"><img src={m.image} alt="Attachment" className="chat-image" /></a>
                        )}
                        {m.text && <div>{m.text}</div>}
                        
                        <div className="b-meta">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {msgDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {m.sender === 'staff' && <CheckCheck size={12} />}
                          </div>
                          {/* SHOW STAFF NAME BELOW TIME */}
                          {m.sender === 'staff' && (
                            <span style={{ fontSize: '9px', opacity: 0.6, fontStyle: 'italic', marginTop: '2px' }}>
                              By {m.staffName || 'Support Agent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
              <div ref={chatEndRef} />
            </div>

            <div style={{ position: 'relative', padding: '20px', background: '#f9fafb', borderTop: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center' }}>
              {selectedFile && (
                <div className="image-preview-overlay">
                  <div className="image-preview-box">
                    {selectedFile.isImage ? <img src={selectedFile.data} alt="Preview" className="image-preview-img" /> : <div className="file-preview-card">📄 {selectedFile.name}</div>}
                    <X size={16} className="image-remove-btn" onClick={() => setSelectedFile(null)} />
                  </div>
                </div>
              )}
              
              <input type="file" accept="image/*, .pdf, .doc, .docx, .txt" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              
              <button onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px' }} title="Attach File/Photo">
                <Paperclip size={22} />
              </button>

              <input 
                style={{ flex: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }} 
                placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendReply(false)}
              />
              
              <button onClick={() => handleSendReply(false)} title="Send Reply" style={{ background: '#ff5e00', border: 'none', width: 44, height: 44, borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={18} />
              </button>

              {selectedTicket.status !== 'closed' && (
                <button onClick={() => handleSendReply(true)} title="Mark as Resolved" style={{ background: '#10b981', border: 'none', height: 44, padding: '0 16px', borderRadius: '25px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                  <CheckCircle size={18} /> Resolve
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );  
};

export default TicketManagement;
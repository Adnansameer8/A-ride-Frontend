import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Authcontext';
import { Send, X, User, CheckCheck, Paperclip } from 'lucide-react';

const Support = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [userReply, setUserReply] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); 
  
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', category: '', bookingId: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const [viewedTimestamps, setViewedTimestamps] = useState(() => 
    JSON.parse(localStorage.getItem('aride_user_ticket_views') || '{}')
  );

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null); 
  const prevConvLengthRef = useRef(0);

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: user.name, email: user.email }));
      fetchMyTickets();

      const intervalId = setInterval(() => {
        fetchMyTickets();
      }, 2000);

      return () => clearInterval(intervalId);
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
        const newViews = { ...viewedTimestamps, [updated.id]: Date.now() };
        setViewedTimestamps(newViews);
        localStorage.setItem('aride_user_ticket_views', JSON.stringify(newViews));
      }
    }
  }, [tickets]);

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

  const fetchMyTickets = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/support/tickets/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {}
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('aride_token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if ((await res.json()).success) {
      alert("Ticket Raised!");
      setForm({ ...form, subject: '', message: '', bookingId: '', category: '' });
      fetchMyTickets();
    }
    setSubmitting(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        alert("File size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          name: file.name,
          data: reader.result,
          isImage: file.type.startsWith('image/')
        }); 
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null; 
  };

  const handleSendMessage = async () => {
    if (!userReply.trim() && !selectedFile) return; 
    
    const token = localStorage.getItem('aride_token');
    const payload = { reply: userReply, attachment: selectedFile };

    const res = await fetch(`${import.meta.env.VITE_API_URL}/support/tickets/${selectedTicket.id}/user-reply`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if ((await res.json()).success) {
      setUserReply('');
      setSelectedFile(null); 
      fetchMyTickets(); 
    }
  };

  const handleOpenTicket = (t) => {
    setSelectedTicket(t);
    const newViews = { ...viewedTimestamps, [t.id]: Date.now() };
    setViewedTimestamps(newViews);
    localStorage.setItem('aride_user_ticket_views', JSON.stringify(newViews));
  };

  const isUnread = (t) => {
    if (!t.conversation || t.conversation.length === 0) return false;
    const lastMsg = t.conversation[t.conversation.length - 1];
    if (lastMsg.sender !== 'staff') return false;
    
    const lastViewed = viewedTimestamps[t.id] || 0;
    const lastMsgTime = new Date(lastMsg.timestamp).getTime();
    return lastMsgTime > lastViewed;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        .sp-hero { background: #0a0a0a; padding: 72px 20px 80px; text-align: center; color: white; border-bottom: 3px solid #ff5e00; }
        .sp-body { max-width: 1180px; margin: 0 auto; padding: 48px 24px; display: grid; grid-template-columns: 1fr 380px; gap: 28px; }
        .sp-card { background: white; padding: 32px; border-radius: 20px; border: 2px solid #f3f4f6; }
        .sp-input { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px; font-family: inherit; }
        .sp-btn { width: 100%; padding: 16px; background: #ff5e00; color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }
        
        .chat-bg { background: #111827; background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; padding: 20px; height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; color: white; line-height: 1.4; position: relative; word-wrap: break-word; }
        .bubble-user { align-self: flex-end; background: #ff5e00; border-bottom-right-radius: 2px; }
        .bubble-staff { align-self: flex-start; background: #374151; border-bottom-left-radius: 2px; }
        .b-meta { font-size: 10px; opacity: 0.7; margin-top: 4px; display: flex; flex-direction: column; align-items: flex-end; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        
        .image-preview-overlay { position: absolute; bottom: 100%; left: 0; right: 0; padding: 12px 20px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border-top: 1px solid #f1f5f9; display: flex; align-items: center; z-index: 20; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); }
        .image-preview-box { position: relative; display: inline-block; }
        .image-preview-img { height: 80px; border-radius: 8px; border: 2px solid #e2e8f0; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .file-preview-card { padding: 12px 16px; background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; font-weight: 700; color: #333; font-size: 13px; }
        .image-remove-btn { position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border-radius: 50%; cursor: pointer; padding: 4px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4); transition: 0.2s; }
        .image-remove-btn:hover { transform: scale(1.1); background: #dc2626; }
        
        .chat-image { max-width: 100%; border-radius: 8px; margin-bottom: 6px; cursor: pointer; }
        .chat-file { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255,255,255,0.2); border-radius: 8px; color: white; text-decoration: none; font-weight: 600; margin-bottom: 6px; font-size: 13px; }
        .chat-file:hover { background: rgba(255,255,255,0.3); }

        .unread-badge {
          background: #ef4444; color: white; font-size: 10px; font-weight: 800;
          padding: 2px 6px; border-radius: 8px; margin-left: 8px;
          animation: pulse 2s infinite; display: inline-block;
        }
        .text-pulse-red { color: #ef4444 !important; animation: pulse-text 2s infinite; }
        
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        @keyframes pulse-text { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        @media (max-width: 768px) { .sp-body { grid-template-columns: 1fr; } }
      `}</style>

      <section className="sp-hero">
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '3.5rem', letterSpacing: '2px' }}>WE'VE GOT YOUR <span style={{color: '#ff5e00'}}>BACK</span></h1>
        <p style={{ opacity: 0.8 }}>Operational 24/7 across the entire rider network.</p>
      </section>

      <div className="sp-body">
        <div className="sp-card">
          <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>RAISE A NEW TICKET</h2>
          <form onSubmit={handleRaiseTicket}>
            <input className="sp-input" placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
            <div style={{ display: 'flex', gap: '15px' }}>
                <select className="sp-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                  <option value="">Category</option>
                  <option value="booking">Booking</option>
                  <option value="bike">Bike Issue</option>
                  <option value="trip">Trip Route</option>
                </select>
                <input className="sp-input" placeholder="Booking ID (Optional)" value={form.bookingId} onChange={e => setForm({...form, bookingId: e.target.value})} />
            </div>
            <textarea className="sp-input" style={{ height: '120px', resize: 'none' }} placeholder="Tell us what's happening..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
            <button className="sp-btn" type="submit" disabled={submitting}>{submitting ? 'RAISING TICKET...' : 'SUBMIT SUPPORT REQUEST'}</button>
          </form>
        </div>

        <div className="sp-card">
          <h2 style={{ fontFamily: 'Barlow Condensed', fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>YOUR TICKETS</h2>
          {tickets.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No active tickets.</p> : 
            tickets.map(t => {
              const unread = isUnread(t);
              return (
                <div 
                  key={t.id} 
                  onClick={() => handleOpenTicket(t)} 
                  style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s', background: unread ? '#fff1f2' : 'transparent', borderLeft: unread ? '3px solid #ef4444' : '3px solid transparent' }} 
                  className="ticket-item-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center' }}>
                        {t.subject}
                        {unread && <span className="unread-badge">NEW</span>}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: t.status === 'closed' ? '#10b981' : '#f59e0b', textTransform: 'uppercase' }}>{t.status}</span>
                  </div>
                  <div className={unread ? "text-pulse-red" : ""} style={{ fontSize: '11px', color: '#ff5e00', fontWeight: 700 }}>
                    {unread ? 'NEW MESSAGE - CLICK TO OPEN →' : 'CLICK TO OPEN CHAT →'}
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ background: '#ff5e00', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={20} />
                  <span style={{ fontWeight: 800, fontSize: '18px', fontFamily: 'Barlow Condensed' }}>ADVENTURE SUPPORT CHAT</span>
              </div>
              <X style={{ cursor: 'pointer' }} onClick={() => setSelectedTicket(null)} />
            </div>

            <div className="chat-bg">
              {/* ── NEW: DYNAMIC DATE SEPARATORS & SENDER NAME ── */}
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
                      {/* DATE SEPARATOR BUBBLE */}
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
                            {m.sender === 'user' && <CheckCheck size={12} />}
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
                style={{ flex: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} 
                placeholder="Type your reply..." value={userReply} onChange={e => setUserReply(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              />
              
              <button onClick={handleSendMessage} style={{ background: '#ff5e00', border: 'none', width: 44, height: 44, borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={18} />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
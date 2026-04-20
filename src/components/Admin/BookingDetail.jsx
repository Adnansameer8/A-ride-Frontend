import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, User, Phone, Mail, Calendar, MapPin, CreditCard, Clock, Hash, Navigation } from 'lucide-react';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBooking(); }, [id]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) {
        const found = data.bookings.find(b => b.id === id);
        setBooking(found);
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('aride_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) setBooking(data.booking);
    } catch (error) {}
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#f97316', fontWeight: 'bold' }}>Loading Details...</div>;
  if (!booking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#ef4444', fontWeight: 'bold' }}>Booking Not Found</div>;

  const getSpecificName = (b) => b.details?.tripName || b.details?.trackName || b.type;
  const formatDate = (dateString) => { const d = new Date(dateString); return isNaN(d) ? "Just now" : d.toLocaleString(); };
  const displayBookingId = booking.id ? `BKG-${booking.id.split('-')[0].toUpperCase()}` : 'N/A';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6b7280', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#111'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
          <div style={{ background: 'linear-gradient(135deg, #ff5e00, #ff9a00)', padding: '32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={14} /> Booking ID</div>
              <div style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '1px' }}>{displayBookingId}</div>
            </div>
            <div style={{ background: '#fff', color: booking.status === 'approved' ? '#10b981' : booking.status === 'rejected' ? '#ef4444' : '#ff5e00', padding: '8px 20px', borderRadius: '99px', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {booking.status || 'PENDING'}
            </div>
          </div>

          <div style={{ padding: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              <div>
                <h3 style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>Customer Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '12px' }}><User size={20} color="#ff5e00" /></div>
                    <div><div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Full Name</div><div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>{booking.customerName}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '12px' }}><Mail size={20} color="#ff5e00" /></div>
                    <div><div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Email Address</div><div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>{booking.email}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '12px' }}><Phone size={20} color="#ff5e00" /></div>
                    <div><div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Phone Number</div><div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>{booking.phone}</div></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>Service Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}><MapPin size={20} color="#3b82f6" /></div>
                    <div><div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Trip / Service Name</div><div style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>{getSpecificName(booking)}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}><Clock size={20} color="#3b82f6" /></div>
                    <div><div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Category & Extras</div><div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>{booking.type} {booking.details?.duration ? `• ${booking.details.duration}` : ''}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}><Calendar size={20} color="#3b82f6" /></div>
                    <div><div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Booked On</div><div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>{formatDate(booking.createdAt)}</div></div>
                  </div>
                  
                  {/* ── LOCATION MAP LINK ADDED HERE ── */}
                  {booking.details?.locationLink && (
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}><Navigation size={20} color="#3b82f6" /></div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Customer Live Location</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '2px' }}>
                          <a href={booking.details.locationLink} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5e00', textDecoration: 'none' }}>📍 Open in Google Maps</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px', background: '#fffbeb', borderRadius: '16px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', border: '1px solid #fde68a' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '14px' }}><CreditCard size={28} color="#d97706" /></div>
                 <div>
                   <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount Paid</div>
                   <div style={{ fontSize: '32px', fontWeight: '900', color: '#92400e' }}>₹{booking.price?.toLocaleString()}</div>
                 </div>
               </div>
               {(booking.details?.paymentMode || booking.details?.priceMode) && (
                 <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>Mode</div>
                   <div style={{ fontSize: '18px', fontWeight: '800', color: '#92400e' }}>{booking.details.paymentMode || booking.details.priceMode}</div>
                 </div>
               )}
            </div>
          </div>

          {(!booking.status || booking.status === 'pending') && (
            <div style={{ padding: '24px 40px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
               <button onClick={() => handleStatusChange('approved')} style={{ flex: 1, minWidth: '200px', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'transform 0.2s' }}>
                 <CheckCircle size={22} /> Approve Booking
               </button>
               <button onClick={() => handleStatusChange('rejected')} style={{ flex: 1, minWidth: '200px', padding: '16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)', transition: 'transform 0.2s' }}>
                 <XCircle size={22} /> Reject Booking
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
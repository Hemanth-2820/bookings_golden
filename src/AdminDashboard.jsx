import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Search, Filter, Phone, Calendar as CalendarIcon, 
  Trash2, Edit, ChevronDown, CheckCircle, Clock, AlertCircle, FileText, MessageSquare, Settings, DollarSign
} from 'lucide-react';
import { sendBookingWhatsAppMessage } from './data';

export default function AdminDashboard({
  bookings,
  filterDate,
  eventsList = [],
  addonsList = [],
  onClearDateFilter,
  onOpenNewBooking,
  onOpenSettings,
  onOpenAccounting,
  onBackToCalendar,
  onDeleteBooking,
  onEditBooking
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [addonFilter, setAddonFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Date filter from calendar click if any
      if (filterDate && b.date !== filterDate) return false;

      // Event filter
      if (eventFilter !== 'ALL' && b.event !== eventFilter) return false;

      // Addon filter
      if (addonFilter !== 'ALL') {
        const hasAddon = b.addons?.some(a => a.id.toLowerCase() === addonFilter.toLowerCase() || a.name.toLowerCase().includes(addonFilter.toLowerCase()));
        if (!hasAddon) return false;
      }

      // Payment filter
      if (paymentFilter !== 'ALL' && b.paymentStatus !== paymentFilter) return false;

      // Search term (Name or Mobile)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(term);
        const matchesMobile = b.mobile.includes(term);
        const matchesId = b.id.toLowerCase().includes(term);
        if (!matchesName && !matchesMobile && !matchesId) return false;
      }

      return true;
    });
  }, [bookings, filterDate, eventFilter, addonFilter, paymentFilter, searchTerm]);

  return (
    <div className="admin-dashboard-container">
      {/* Top Navigation & Status Bar */}
      <div className="dash-top-bar">
        <div className="top-left">
          <button 
            className="btn-back-calendar"
            onClick={onBackToCalendar}
            title="Return to Calendar View"
          >
            <ArrowLeft size={18} />
            <span>CALENDAR VIEW</span>
          </button>
          
          <div className="dash-heading-wrap">
            <h1 className="dash-title">Bookings Manager</h1>
            <span className="dash-subtitle">Admin telephonic customer booking dashboard</span>
          </div>
        </div>

        <div className="top-right">
          <button 
            className="btn-accounting-toggle"
            onClick={onOpenAccounting}
            title="Open Financial Accounting, Spending Bills & Invoices"
          >
            <DollarSign size={17} />
            <span>Accounting & Bills</span>
          </button>

          <button 
            className="btn-settings-toggle"
            onClick={onOpenSettings}
            title="Configure Add-on items, prices, and event categories"
          >
            <Settings size={17} />
            <span>Manage Form Options</span>
          </button>

          <button 
            className="btn-create-booking"
            onClick={() => onOpenNewBooking()}
          >
            <Plus size={18} />
            <span>New Booking (Call)</span>
          </button>
        </div>
      </div>

      {/* Date Filter Notification banner if activated */}
      {filterDate && (
        <div className="date-filter-banner">
          <CalendarIcon size={16} />
          <span>Showing bookings for selected date: <strong>{filterDate}</strong></span>
          <button className="btn-clear-date-filter" onClick={onClearDateFilter}>
            Show All Dates
          </button>
        </div>
      )}

      {/* Search & Quick Filter Bar */}
      <div className="dash-filter-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by customer name or phone number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {/* Event Filter dropdown */}
          <div className="select-wrapper">
            <label>Event:</label>
            <select 
              value={eventFilter} 
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="ALL">All Events</option>
              {eventsList.map(evt => (
                <option key={evt} value={evt}>{evt}</option>
              ))}
            </select>
          </div>

          {/* Addon Filter dropdown */}
          <div className="select-wrapper">
            <label>Addon:</label>
            <select 
              value={addonFilter} 
              onChange={(e) => setAddonFilter(e.target.value)}
            >
              <option value="ALL">All Add-ons</option>
              {addonsList.map(addon => (
                <option key={addon.id} value={addon.id}>
                  {addon.name} {addon.price > 0 ? `(₹${addon.price})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment status filter */}
          <div className="select-wrapper">
            <label>Payment:</label>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Advance Paid">Advance Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Admin Booking Table Styled Exactly like Page 2 PDF */}
      <div className="pdf-table-container">
        <table className="pdf-admin-table">
          <thead>
            {/* Header matching Page 2: 01 | Name | Mobile | Event ▼ | No. of Guests | Addon ▼ | Time slot ▼ | Payment ▼ */}
            <tr className="pdf-header-row">
              <th className="th-col col-idx">#</th>
              <th className="th-col col-name">Name</th>
              <th className="th-col col-mobile">Mobile</th>
              <th className="th-col col-dropdown">
                <div className="th-inner">
                  <span>Event</span>
                  <span className="th-caret">▼</span>
                </div>
              </th>
              <th className="th-col col-guests">No. of Guests</th>
              <th className="th-col col-dropdown">
                <div className="th-inner">
                  <span>Addon</span>
                  <span className="th-caret">▼</span>
                </div>
              </th>
              <th className="th-col col-dropdown">
                <div className="th-inner">
                  <span>Time slot</span>
                  <span className="th-caret">▼</span>
                </div>
              </th>
              <th className="th-col col-dropdown">
                <div className="th-inner">
                  <span>Payment</span>
                  <span className="th-caret">▼</span>
                </div>
              </th>
              <th className="th-col col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-records-cell">
                  <div className="empty-state">
                    <p>No bookings found matching the current filters.</p>
                    <button 
                      className="btn-create-booking sm"
                      onClick={() => onOpenNewBooking(filterDate || undefined)}
                    >
                      <Plus size={16} />
                      <span>Take New Call Booking</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBookings.map((b, index) => {
                const rowNum = String(index + 1).padStart(2, '0');
                return (
                  <tr key={b.id} className="pdf-data-row">
                    <td className="td-col td-idx">{rowNum}</td>
                    <td className="td-col td-name font-bold">
                      <div className="customer-name-wrap">
                        <span>{b.name}</span>
                        {b.notes && <span className="notes-badge" title={b.notes}>📝 Notes</span>}
                      </div>
                    </td>
                    <td className="td-col td-mobile">
                      <div className="mobile-cell">
                        <Phone size={13} className="phone-icon" />
                        <span>{b.mobile}</span>
                      </div>
                    </td>
                    <td className="td-col td-event">
                      <span className="event-pill">{b.event}</span>
                    </td>
                    <td className="td-col td-guests text-center">
                      <span className="guest-badge">{b.noOfGuests} Guests</span>
                    </td>
                    <td className="td-col td-addon">
                      <div className="addon-list-cell">
                        {b.addons && b.addons.length > 0 ? (
                          b.addons.map((addon, aIdx) => (
                            <span key={aIdx} className="addon-chip" title={addon.detail || `₹${addon.price}`}>
                              {addon.name}
                              {addon.price > 0 && <span className="addon-chip-price">₹{addon.price}</span>}
                              {addon.quantity && ` (x${addon.quantity})`}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </div>
                    </td>
                    <td className="td-col td-timeslot">
                      <div className="timeslot-cell">
                        <div className="date-sub">{b.date}</div>
                        <div className="time-sub">{b.timeSlot}</div>
                      </div>
                    </td>
                    <td className="td-col td-payment">
                      <div className="payment-cell">
                        <span className={`payment-status-badge status-${(b.paymentStatus || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                          {b.paymentStatus || 'Pending'}
                        </span>
                        <div className="amount-breakdown">
                          <span>Total: ₹{b.totalAmount || 0}</span>
                          {b.paymentStatus === 'Advance Paid' && (
                            <span className="due-sub">Due: ₹{(b.totalAmount || 0) - (b.advancePaid || 0)}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="td-col td-actions">
                      <div className="row-action-btns">
                        <button 
                          className="btn-action-icon whatsapp"
                          onClick={() => sendBookingWhatsAppMessage(b)}
                          title="Send/Resend WhatsApp Booking Confirmation"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          className="btn-action-icon edit"
                          onClick={() => onEditBooking(b)}
                          title="Edit Booking"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-action-icon delete"
                          onClick={() => onDeleteBooking(b.id)}
                          title="Cancel/Delete Booking"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="dash-summary-footer">
        <div>Total Bookings: <strong>{filteredBookings.length}</strong></div>
        <div>
          Total Revenue Projected: <strong>₹{filteredBookings.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0).toLocaleString('en-IN')}</strong>
        </div>
      </div>
    </div>
  );
}

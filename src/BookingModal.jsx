import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Calculator, PhoneCall, Clock, AlertTriangle, Sparkles, ShieldCheck, MessageSquare } from 'lucide-react';
import { 
  EVENTS_LIST, 
  STANDARD_ADDONS, 
  DURATION_OPTIONS,
  OPERATING_START_MINUTES,
  OPERATING_END_MINUTES,
  CLEANING_BUFFER_MINUTES,
  getPossibleStartTimes,
  minutesTo12Hour,
  minutesTo24h,
  timeToMinutes,
  checkSlotAvailability,
  sendBookingWhatsAppMessage
} from './data';

export default function BookingModal({
  isOpen,
  initialDate,
  editingBooking,
  existingBookings = [],
  eventsList = EVENTS_LIST,
  addonsList = STANDARD_ADDONS,
  onClose,
  onSaveBooking
}) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [event, setEvent] = useState(EVENTS_LIST[0]);
  const [noOfGuests, setNoOfGuests] = useState(2);
  const [date, setDate] = useState('');
  
  // Timing state: 10:00 AM to 9:00 PM start, 1h to 2h duration, 11:00 AM to 10:00 PM end
  const [startTimeMinutes, setStartTimeMinutes] = useState(OPERATING_START_MINUTES); // 600 = 10:00 AM
  const [durationMinutes, setDurationMinutes] = useState(120); // 2 hours default (options: 60, 90, 120)

  // Selected addons map: { [addonId]: { selected: boolean, customPrice: number, quantity: number, detail: string } }
  const [addonsState, setAddonsState] = useState({});
  const [paymentStatus, setPaymentStatus] = useState('Advance Paid');
  const [advancePaid, setAdvancePaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const allPossibleStarts = useMemo(() => getPossibleStartTimes(), []);

  // Filter existing bookings on the currently selected date
  const bookingsOnThisDate = useMemo(() => {
    if (!date) return [];
    return existingBookings.filter(b => b.date === date);
  }, [existingBookings, date]);

  // Calculated End Time Minutes based on duration
  const endTimeMinutes = startTimeMinutes + durationMinutes;

  // Buffer end time
  const cleaningEndMinutes = endTimeMinutes + CLEANING_BUFFER_MINUTES;

  // Check availability with cleaning buffer
  const availabilityStatus = useMemo(() => {
    if (!date) return { available: true };
    return checkSlotAvailability(
      startTimeMinutes, 
      endTimeMinutes, 
      bookingsOnThisDate, 
      editingBooking?.id
    );
  }, [startTimeMinutes, endTimeMinutes, bookingsOnThisDate, editingBooking, date]);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (editingBooking) {
      setName(editingBooking.name || '');
      setMobile(editingBooking.mobile || '');
      setEvent(editingBooking.event || (eventsList[0] || 'Birthday Party'));
      setNoOfGuests(editingBooking.noOfGuests || 2);
      setDate(editingBooking.date || '');
      setStartTimeMinutes(editingBooking.startMinutes || (editingBooking.startTime ? timeToMinutes(editingBooking.startTime) : OPERATING_START_MINUTES));
      setDurationMinutes(editingBooking.durationMinutes || 120);
      setPaymentStatus(editingBooking.paymentStatus || 'Advance Paid');
      setAdvancePaid(editingBooking.advancePaid ?? '');
      setPaymentMethod(editingBooking.paymentMethod || 'UPI / GPay');
      setNotes(editingBooking.notes || '');

      // Load existing addons
      const stateObj = {};
      addonsList.forEach(std => {
        const found = editingBooking.addons?.find(a => a.id === std.id);
        if (found) {
          stateObj[std.id] = {
            selected: true,
            customPrice: found.price || 0,
            quantity: found.quantity || 1,
            detail: found.detail || ''
          };
        } else {
          stateObj[std.id] = {
            selected: false,
            customPrice: std.fixed ? std.price : 0,
            quantity: 1,
            detail: ''
          };
        }
      });
      setAddonsState(stateObj);
    } else {
      // New Booking defaults
      setName('');
      setMobile('');
      setEvent(eventsList[0] || 'Birthday Party');
      setNoOfGuests(2);
      setDate(initialDate || '2026-10-16');
      setStartTimeMinutes(OPERATING_START_MINUTES); // 10:00 AM
      setDurationMinutes(120); // 2 hours
      setPaymentStatus('Advance Paid');
      setAdvancePaid('1000');
      setPaymentMethod('UPI / GPay');
      setNotes('');

      const stateObj = {};
      addonsList.forEach(std => {
        if (std.id === 'venue') return; // Venue is base rental, not an optional addon
        stateObj[std.id] = {
          selected: false,
          customPrice: std.fixed ? std.price : (std.id === 'cake' ? 1000 : (std.id === 'bouquet' ? 600 : 0)),
          quantity: 1,
          detail: ''
        };
      });
      setAddonsState(stateObj);
    }
  }, [isOpen, initialDate, editingBooking, eventsList, addonsList]);

  // Venue is mandatory base amount (cannot be unselected):
  // 1 hour (60 min) = ₹999 fixed
  // 1.5 hours (90 min) = ₹999 + 50% = ₹1,499
  // 2 hours (120 min) = ₹999 + ₹999 = ₹1,998
  const baseVenuePrice = 999;
  const calculatedVenuePrice = useMemo(() => {
    if (durationMinutes === 60) {
      return baseVenuePrice; // 999
    } else if (durationMinutes === 90) {
      return Math.round(baseVenuePrice * 1.5); // 1499
    } else if (durationMinutes === 120) {
      return baseVenuePrice * 2; // 1998
    }
    return Math.round((baseVenuePrice / 60) * durationMinutes);
  }, [durationMinutes]);

  // Compute live total: Mandatory Venue Base Price + Selected Add-ons
  const addonsTotal = Object.entries(addonsState).reduce((acc, [id, item]) => {
    if (!item.selected || id === 'venue') return acc;
    const std = addonsList.find(a => a.id === id);
    if (!std) return acc;

    if (std.isPerNumber) {
      return acc + (std.price * (item.quantity || 1));
    } else if (std.fixed) {
      return acc + std.price;
    } else {
      return acc + (Number(item.customPrice) || 0);
    }
  }, 0);

  const totalAmount = calculatedVenuePrice + addonsTotal;

  const handleToggleAddon = (id) => {
    setAddonsState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected: !prev[id]?.selected
      }
    }));
  };

  const handleUpdateAddon = (id, field, value) => {
    setAddonsState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !date) {
      alert("Please fill in Customer Name, Mobile Number and Date");
      return;
    }

    if (!availabilityStatus.available) {
      alert(`Cannot book this slot: ${availabilityStatus.reason}\nPlease select another start time or adjust duration.`);
      return;
    }

    if (endTimeMinutes > OPERATING_END_MINUTES) {
      alert("Booking cannot end after 10:00 PM. Please choose an earlier start time or shorter duration.");
      return;
    }

    // Prepare addons list (Venue is the base rental item, followed by chosen addons)
    const finalAddons = [
      {
        id: 'venue',
        name: 'Venue Base Rental',
        price: calculatedVenuePrice,
        quantity: 1,
        detail: `${durationMinutes / 60} Hour(s) Venue Rental`
      }
    ];

    Object.entries(addonsState).forEach(([id, item]) => {
      if (item.selected && id !== 'venue') {
        const std = addonsList.find(a => a.id === id);
        let calcPrice = 0;
        if (std && std.isPerNumber) {
          calcPrice = std.price * (item.quantity || 1);
        } else if (std && std.fixed) {
          calcPrice = std.price;
        } else {
          calcPrice = Number(item.customPrice) || 0;
        }

        finalAddons.push({
          id,
          name: std ? std.name : id,
          price: calcPrice,
          quantity: item.quantity,
          detail: item.detail
        });
      }
    });

    const formattedTimeSlot = `${minutesTo12Hour(startTimeMinutes)} - ${minutesTo12Hour(endTimeMinutes)} (${durationMinutes / 60} hr${durationMinutes > 60 ? 's' : ''})`;

    const bookingPayload = {
      id: editingBooking ? editingBooking.id : Date.now().toString().slice(-4),
      name: name.trim(),
      mobile: mobile.trim(),
      event,
      date,
      startTime: minutesTo24h(startTimeMinutes),
      endTime: minutesTo24h(endTimeMinutes),
      startMinutes: startTimeMinutes,
      endMinutes: endTimeMinutes,
      durationMinutes,
      timeSlot: formattedTimeSlot,
      cleaningUntil: minutesTo12Hour(cleaningEndMinutes),
      noOfGuests: Number(noOfGuests) || 1,
      addons: finalAddons,
      totalAmount,
      advancePaid: Number(advancePaid) || 0,
      paymentStatus,
      paymentMethod,
      notes: notes.trim(),
      createdAt: editingBooking ? editingBooking.createdAt : new Date().toISOString()
    };

    onSaveBooking(bookingPayload);

    // If WhatsApp confirmation is enabled, trigger the message directly to the registered number
    if (sendWhatsApp) {
      sendBookingWhatsAppMessage(bookingPayload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge">
              <PhoneCall size={14} />
              <span>{editingBooking ? "UPDATE BOOKING" : "PHONE CALL BOOKING"}</span>
            </div>
            <h2>{editingBooking ? `Edit Booking #${editingBooking.id}` : "Book For Customer (Admin Dispatch)"}</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form-scroll">
          {/* Section 1: Customer Details */}
          <div className="form-section">
            <h3 className="section-title">1. Customer Information</h3>
            <div className="form-row-2">
              <div className="form-field">
                <label>Customer Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Mobile Number *</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Event & Dynamic Slot Scheduling (10am to 10pm window + 30 min cleaning buffer) */}
          <div className="form-section">
            <h3 className="section-title">2. Event & Timing (10:00 AM - 10:00 PM)</h3>
            <div className="form-row-3">
              <div className="form-field">
                <label>Event Type *</label>
                <select value={event} onChange={(e) => setEvent(e.target.value)}>
                  {eventsList.map((evt) => (
                    <option key={evt} value={evt}>{evt}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Booking Date *</label>
                <input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>No. of Guests</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={noOfGuests}
                  onChange={(e) => setNoOfGuests(e.target.value)}
                />
              </div>
            </div>

            {/* Existing bookings on that date reminder for Admin */}
            {bookingsOnThisDate.length > 0 && (
              <div className="date-occupied-strip">
                <span className="strip-title">Already booked slots on this date:</span>
                <div className="occupied-chips">
                  {bookingsOnThisDate.map((b) => (
                    <span key={b.id} className="occupied-chip">
                      <strong>{b.timeSlot}</strong> (+ 30m clean till {b.cleaningUntil || minutesTo12Hour(b.endMinutes + 30)}) - {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Presence / Duration Preference: 1 hour to 2 hours */}
            <div className="timing-controls-box mt-3">
              <div className="duration-selection-row">
                <label className="sub-label">Customer Presence Duration (1h to 2h max):</label>
                <div className="duration-pills">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      className={`duration-pill-btn ${durationMinutes === opt.value ? 'active' : ''}`}
                      onClick={() => setDurationMinutes(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start time selector from 10:00 AM to 9:00 PM */}
              <div className="time-select-row mt-2">
                <div className="form-field flex-1">
                  <label className="sub-label">From (Start Time: 10:00 AM to 09:00 PM):</label>
                  <select 
                    value={startTimeMinutes} 
                    onChange={(e) => setStartTimeMinutes(Number(e.target.value))}
                    className="time-select-dropdown"
                  >
                    {allPossibleStarts.map((t) => {
                      // Check individual starting time against existing bookings
                      const singleCheck = checkSlotAvailability(
                        t.minutes, 
                        t.minutes + durationMinutes, 
                        bookingsOnThisDate, 
                        editingBooking?.id
                      );
                      const isPastClosing = (t.minutes + durationMinutes) > OPERATING_END_MINUTES;
                      const isUnavailable = !singleCheck.available || isPastClosing;

                      return (
                        <option 
                          key={t.minutes} 
                          value={t.minutes}
                          disabled={isUnavailable}
                        >
                          {t.label12} {isPastClosing ? '(Exceeds 10 PM)' : (isUnavailable ? '(Booked / Gap)' : '(Available)')}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="slot-result-badge">
                  <div className="slot-result-label">To (Calculated End Time):</div>
                  <div className="slot-result-val">{minutesTo12Hour(endTimeMinutes)}</div>
                </div>
              </div>

              {/* Real-time Buffer & Conflict Status Indicator */}
              <div className="cleaning-buffer-info-card">
                <div className="buffer-text">
                  <Clock size={15} />
                  <span>
                    Booked Slot: <strong>{minutesTo12Hour(startTimeMinutes)} to {minutesTo12Hour(endTimeMinutes)}</strong>
                    {' '} | <strong>30-min cleaning gap</strong> reserved until <strong>{minutesTo12Hour(cleaningEndMinutes)}</strong>
                  </span>
                </div>

                {availabilityStatus.available ? (
                  <div className="status-tag available">
                    <ShieldCheck size={16} />
                    <span>Slot Available to Book</span>
                  </div>
                ) : (
                  <div className="status-tag conflict">
                    <AlertTriangle size={16} />
                    <span>Booked slot not available ({availabilityStatus.reason})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Add-ons & Live Rates */}
          <div className="form-section">
            <div className="venue-base-card">
              <div className="venue-base-left">
                <span className="venue-base-title">Venue Base Rental (Mandatory)</span>
                <span className="venue-base-desc">
                  {durationMinutes === 60 && "1 Hour Booking @ ₹999/- fixed"}
                  {durationMinutes === 90 && "1.5 Hours Booking @ ₹999 + 50% = ₹1,499/-"}
                  {durationMinutes === 120 && "2 Hours Booking @ ₹999 + ₹999 = ₹1,998/-"}
                </span>
              </div>
              <div className="venue-base-price">
                <span>₹{calculatedVenuePrice.toLocaleString('en-IN')}/-</span>
              </div>
            </div>

            <div className="addons-section-header mt-3">
              <h3 className="section-title">Additional Add-on Items</h3>
              <span className="addon-counter-badge">
                Selected: {Object.entries(addonsState).filter(([id, a]) => a.selected && id !== 'venue').length}
              </span>
            </div>

            <div className="addons-grid">
              {addonsList.filter(addon => addon.id !== 'venue').map((addon) => {
                const state = addonsState[addon.id] || { selected: false, customPrice: 0, quantity: 1, detail: '' };

                return (
                  <div 
                    key={addon.id} 
                    className={`addon-card ${state.selected ? 'checked' : ''}`}
                  >
                    <div className="addon-card-top" onClick={() => handleToggleAddon(addon.id)}>
                      <input 
                        type="checkbox" 
                        checked={state.selected} 
                        onChange={() => {}}
                      />
                      <div className="addon-meta">
                        <span className="addon-title">{addon.name}</span>
                        <span className="addon-pricing">
                          {addon.fixed && `₹${addon.price}/-`}
                          {addon.isPerNumber && `₹${addon.price}/- per number`}
                          {!addon.fixed && !addon.isPerNumber && `(${addon.note || 'based on requirement'})`}
                        </span>
                      </div>
                    </div>

                    {/* Sub-inputs if selected */}
                    {state.selected && (
                      <div className="addon-expand-fields">
                        {/* Per number multiplier with easy tap +/- buttons and manual input */}
                        {addon.isPerNumber && (
                          <div className="addon-inline-field">
                            <label>Count of Numbers:</label>
                            <div className="stepper-wrap">
                              <button
                                type="button"
                                className="btn-stepper minus"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cur = Number(state.quantity) || 1;
                                  if (cur > 1) handleUpdateAddon(addon.id, 'quantity', cur - 1);
                                }}
                              >
                                -
                              </button>
                              <input 
                                type="number" 
                                min="1" 
                                max="20"
                                className="stepper-input"
                                value={state.quantity === undefined ? 1 : state.quantity}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    handleUpdateAddon(addon.id, 'quantity', '');
                                  } else {
                                    const parsed = parseInt(raw, 10);
                                    handleUpdateAddon(addon.id, 'quantity', isNaN(parsed) ? 1 : parsed);
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!state.quantity || Number(state.quantity) < 1) {
                                    handleUpdateAddon(addon.id, 'quantity', 1);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="btn-stepper plus"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cur = Number(state.quantity) || 1;
                                  handleUpdateAddon(addon.id, 'quantity', cur + 1);
                                }}
                              >
                                +
                              </button>
                            </div>
                            <span className="addon-subtotal-tag">
                              ₹{((Number(state.quantity) || 1) * addon.price).toLocaleString('en-IN')}/-
                            </span>
                          </div>
                        )}

                        {/* Custom requirement price & details */}
                        {!addon.fixed && !addon.isPerNumber && (
                          <div className="addon-custom-wrap">
                            <div className="custom-input-group">
                              <label>Quoted Price (₹):</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 1200"
                                value={state.customPrice}
                                onChange={(e) => handleUpdateAddon(addon.id, 'customPrice', e.target.value)}
                              />
                            </div>
                            <input 
                              type="text" 
                              placeholder={`Requirement detail (e.g. ${addon.id === 'cake' ? 'Flavor/Weight' : 'Color/Type'})...`}
                              value={state.detail || ''}
                              onChange={(e) => handleUpdateAddon(addon.id, 'detail', e.target.value)}
                              className="custom-detail-input"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Total & Payment Tracking */}
          <div className="form-section payment-section-card">
            <div className="total-calculation-box">
              <div className="calc-left">
                <span className="total-label">Total Booking Amount</span>
                <span className="total-calc-hint">Base + All selected Add-ons</span>
              </div>
              <div className="calc-price-display">
                <span className="currency-symbol">₹</span>
                <span className="total-number">{totalAmount.toLocaleString('en-IN')}</span>
                <span className="rupee-suffix">/-</span>
              </div>
            </div>

            <div className="form-row-3 mt-3">
              <div className="form-field">
                <label>Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="Completed">Completed (Full)</option>
                  <option value="Advance Paid">Advance Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="form-field">
                <label>Advance Received (₹)</label>
                <input 
                  type="number" 
                  value={advancePaid} 
                  placeholder="0"
                  onChange={(e) => setAdvancePaid(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Payment Mode</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="UPI / GPay">UPI / GPay</option>
                  <option value="UPI / PhonePe">UPI / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="form-field mt-2">
              <label>Special Instructions / Notes from Call</label>
              <textarea 
                rows="2" 
                placeholder="Customer requests, specific theme, cake delivery timings, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* WhatsApp Confirmation Dispatch Switch */}
            <div className="whatsapp-dispatch-toggle">
              <label className="whatsapp-label">
                <input 
                  type="checkbox" 
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                />
                <div className="whatsapp-toggle-info">
                  <div className="whatsapp-title-line">
                    <MessageSquare size={16} className="whatsapp-green-icon" />
                    <strong>Send WhatsApp Booking Confirmation</strong>
                  </div>
                  <span className="whatsapp-subtext">
                    Automatically sends instant WhatsApp confirmation to registered customer ({mobile || 'customer mobile'}) with event slot, venue rules & payment invoice.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions-bar">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit-booking"
              disabled={!availabilityStatus.available}
              style={{ opacity: availabilityStatus.available ? 1 : 0.5, cursor: availabilityStatus.available ? 'pointer' : 'not-allowed' }}
            >
              <Check size={18} />
              <span>{editingBooking ? "Save Changes" : "Confirm Booking"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

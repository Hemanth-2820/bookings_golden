// Slot & Time Helper utilities
// Hours operation: Start from 10:00 AM, End by 10:00 PM
// Slot duration: 1 hour, 1.5 hours, or 2 hours (based on customer presence/preference)
// Buffer / Cleaning gap: 30 minutes (half an hour) required between bookings

export const DURATION_OPTIONS = [
  { label: "1 Hour", value: 60 },
  { label: "1.5 Hours", value: 90 },
  { label: "2 Hours", value: 120 }
];

// Helper to convert "HH:MM" (24h) to minutes from midnight
export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to format minutes to 12h AM/PM string like "10:00 AM"
export function minutesTo12Hour(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = String(m).padStart(2, '0');
  return `${String(displayH).padStart(2, '0')}:${displayM} ${ampm}`;
}

// Format "HH:MM" 24h to minutes from midnight
export function minutesTo24h(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Operating window:
// Earliest Start: 10:00 AM (600 mins) to latest start: 09:00 PM (1260 mins)
// Ending times: from 11:00 AM (660 mins) to latest 10:00 PM (1320 mins)
export const OPERATING_START_MINUTES = 10 * 60; // 10:00 AM (600)
export const OPERATING_END_MINUTES = 22 * 60;   // 10:00 PM (1320)
export const CLEANING_BUFFER_MINUTES = 30;     // 30 min cleaning gap

// Standard available start times (every 30 mins from 10:00 AM to 9:00 PM)
export function getPossibleStartTimes() {
  const starts = [];
  // Starts up to 9:00 PM (1260) so that a minimum 1h booking ends by 10:00 PM
  for (let m = OPERATING_START_MINUTES; m <= 21 * 60; m += 30) {
    starts.push({
      minutes: m,
      label24: minutesTo24h(m),
      label12: minutesTo12Hour(m)
    });
  }
  return starts;
}

// Check if a proposed slot (startMin to endMin) conflicts with existing bookings on a date
// including the mandatory 30-minute cleaning buffer after (and before) each booking
export function checkSlotAvailability(proposedStartMin, proposedEndMin, existingBookingsOnDate, ignoreBookingId = null) {
  // Proposed booking requires cleaning time after: effective occupied window is proposedStartMin to (proposedEndMin + CLEANING_BUFFER_MINUTES)
  // And any existing booking from existStart to existEnd also blocks up to (existEnd + CLEANING_BUFFER_MINUTES)
  for (const b of existingBookingsOnDate) {
    if (ignoreBookingId && b.id === ignoreBookingId) continue;
    if (!b.startMinutes || !b.endMinutes) continue;

    const existingStart = b.startMinutes;
    // Buffer time after existing booking:
    const existingBlockedEnd = b.endMinutes + CLEANING_BUFFER_MINUTES;
    const proposedBlockedEnd = proposedEndMin + CLEANING_BUFFER_MINUTES;

    // Check overlap:
    // Slot 1: [proposedStartMin, proposedBlockedEnd)
    // Slot 2: [existingStart, existingBlockedEnd)
    if (proposedStartMin < existingBlockedEnd && existingStart < proposedBlockedEnd) {
      return {
        available: false,
        conflictWith: b,
        reason: `Overlaps with booking (${b.timeSlot}) or 30-min cleaning buffer (needs gap until ${minutesTo12Hour(existingBlockedEnd)})`
      };
    }
  }

  return { available: true };
}

// Generate formatted WhatsApp message and open link for confirmation
export function sendBookingWhatsAppMessage(booking) {
  if (!booking || !booking.mobile) return;

  // Normalize phone number (defaulting to India country code 91 if 10 digits)
  let cleanNumber = booking.mobile.replace(/[^0-9]/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }

  const addonsList = booking.addons && booking.addons.length > 0
    ? booking.addons.map(a => `  • ${a.name}${a.quantity && a.quantity > 1 ? ` (x${a.quantity})` : ''} - ₹${a.price}/-`).join('\n')
    : '  • None';

  const balanceDue = (booking.totalAmount || 0) - (booking.advancePaid || 0);

  const message = 
`🎉 *BOOKING CONFIRMED!* 🎉

Dear *${booking.name}*,
Thank you for booking with us! Your reservation has been successfully confirmed.

📋 *Booking Details:*
• *Booking ID:* #${booking.id}
• *Event:* ${booking.event}
• *Date:* ${booking.date}
• *Slot Time:* ${booking.timeSlot}
• *Guests:* ${booking.noOfGuests}

✨ *Selected Add-ons:*
${addonsList}

💰 *Payment Breakdown:*
• *Total Amount:* ₹${(booking.totalAmount || 0).toLocaleString('en-IN')}/-
• *Advance Paid:* ₹${(booking.advancePaid || 0).toLocaleString('en-IN')}/-
• *Balance Due:* ₹${balanceDue.toLocaleString('en-IN')}/-
• *Payment Status:* ${booking.paymentStatus}

${booking.notes ? `📝 *Notes:* ${booking.notes}\n\n` : ''}📍 *Venue Sanitized & Prepared for your slot.*
Please arrive 10-15 minutes prior to your slot time.

If you have any questions or updates, feel free to reply directly to this number. Have a wonderful celebration! 🎊`;

  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

  // Try opening WhatsApp directly, fallback to anchor click to prevent popup blockers
  try {
    const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Initial sample bookings store (Empty for production live deployment)
export const INITIAL_BOOKINGS = [];

export const EVENTS_LIST = [
  "Birthday Party",
  "Couple Surprise",
  "Anniversary",
  "Baby Shower",
  "Bride-to-be",
  "Others"
];

export const STANDARD_ADDONS = [
  { id: "venue", name: "Venue", price: 999, fixed: true, defaultChecked: true },
  { id: "fog", name: "Fog", price: 900, fixed: true },
  { id: "bubbles", name: "Bubbles", price: 400, fixed: true },
  { id: "cake", name: "Cake", price: 0, fixed: false, note: "based on requirement" },
  { id: "candle", name: "Candle", price: 300, fixed: true },
  { id: "petals", name: "Petals", price: 350, fixed: true },
  { id: "bouquet", name: "Bouquet", price: 0, fixed: false, note: "based on requirement" },
  { id: "photo_video", name: "Photo / video", price: 1500, fixed: true },
  { id: "message_box", name: "Message box", price: 100, fixed: true },
  { id: "led_number", name: "Led number", price: 150, isPerNumber: true, note: "₹150 per number" },
  { id: "others", name: "Others", price: 0, fixed: false, note: "Custom extra requirement" }
];

export const MAX_SLOTS_PER_DAY = 3;

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

// Initial sample bookings store with updated slot times & 30-min buffer
export const INITIAL_BOOKINGS = [
  {
    id: "01",
    name: "Rahul Sharma",
    mobile: "9876543210",
    event: "Birthday Party",
    date: "2026-10-13",
    startTime: "10:00",
    endTime: "12:00",
    startMinutes: 600, // 10:00 AM
    endMinutes: 720,   // 12:00 PM (2 hours)
    durationMinutes: 120,
    timeSlot: "10:00 AM - 12:00 PM (2 hrs)",
    cleaningUntil: "12:30 PM",
    noOfGuests: 15,
    addons: [
      { id: "venue", name: "Venue", price: 999 },
      { id: "fog", name: "Fog", price: 900 },
      { id: "led_number", name: "Led number", price: 300, quantity: 2, detail: "Digits: 25" },
      { id: "cake", name: "Cake", price: 1200, detail: "1.5kg Chocolate Truffle" }
    ],
    totalAmount: 3399,
    advancePaid: 1500,
    paymentStatus: "Advance Paid",
    paymentMethod: "UPI / GPay",
    notes: "Cake arrival expected around 10:30 AM",
    createdAt: "2026-10-10T14:30:00Z"
  },
  {
    id: "02",
    name: "Pooja Hegde",
    mobile: "9988776655",
    event: "Couple Surprise",
    date: "2026-10-13",
    startTime: "13:00",
    endTime: "14:30",
    startMinutes: 780, // 01:00 PM (After 12:30 PM cleaning)
    endMinutes: 870,   // 02:30 PM (1.5 hours)
    durationMinutes: 90,
    timeSlot: "01:00 PM - 02:30 PM (1.5 hrs)",
    cleaningUntil: "03:00 PM",
    noOfGuests: 2,
    addons: [
      { id: "venue", name: "Venue", price: 999 },
      { id: "candle", name: "Candle", price: 300 },
      { id: "petals", name: "Petals", price: 350 },
      { id: "message_box", name: "Message box", price: 100 },
      { id: "bouquet", name: "Bouquet", price: 800, detail: "Red Roses & Orchids" }
    ],
    totalAmount: 2549,
    advancePaid: 2549,
    paymentStatus: "Completed",
    paymentMethod: "Cash",
    notes: "Dim romantic warm lights requested",
    createdAt: "2026-10-11T11:00:00Z"
  },
  {
    id: "03",
    name: "Kavita Rao",
    mobile: "9811223344",
    event: "Anniversary",
    date: "2026-10-13",
    startTime: "15:30",
    endTime: "17:30",
    startMinutes: 930, // 03:30 PM (After 3:00 PM cleaning)
    endMinutes: 1050,  // 05:30 PM (2 hours)
    durationMinutes: 120,
    timeSlot: "03:30 PM - 05:30 PM (2 hrs)",
    cleaningUntil: "06:00 PM",
    noOfGuests: 6,
    addons: [
      { id: "venue", name: "Venue", price: 999 },
      { id: "photo_video", name: "Photo / video", price: 1500 },
      { id: "cake", name: "Cake", price: 950, detail: "Red Velvet" }
    ],
    totalAmount: 3449,
    advancePaid: 2000,
    paymentStatus: "Advance Paid",
    paymentMethod: "UPI / PhonePe",
    notes: "Day 13 is fully booked (No slots available)",
    createdAt: "2026-10-11T15:00:00Z"
  },
  {
    id: "04",
    name: "Anand Verma",
    mobile: "9123456789",
    event: "Anniversary",
    date: "2026-10-14",
    startTime: "19:00",
    endTime: "21:00",
    startMinutes: 1140, // 07:00 PM
    endMinutes: 1260,  // 09:00 PM (2 hours)
    durationMinutes: 120,
    timeSlot: "07:00 PM - 09:00 PM (2 hrs)",
    cleaningUntil: "09:30 PM",
    noOfGuests: 6,
    addons: [
      { id: "venue", name: "Venue", price: 999 },
      { id: "photo_video", name: "Photo / video", price: 1500 },
      { id: "cake", name: "Cake", price: 950, detail: "Red Velvet" }
    ],
    totalAmount: 3449,
    advancePaid: 1000,
    paymentStatus: "Advance Paid",
    paymentMethod: "Card",
    notes: "10th wedding anniversary",
    createdAt: "2026-10-12T16:20:00Z"
  },
  {
    id: "05",
    name: "Sneha Reddy",
    mobile: "9701122334",
    event: "Bride-to-be",
    date: "2026-10-18",
    startTime: "16:00",
    endTime: "17:00",
    startMinutes: 960,  // 04:00 PM
    endMinutes: 1020,  // 05:00 PM (1 hour)
    durationMinutes: 60,
    timeSlot: "04:00 PM - 05:00 PM (1 hr)",
    cleaningUntil: "05:30 PM",
    noOfGuests: 12,
    addons: [
      { id: "venue", name: "Venue", price: 999 },
      { id: "bubbles", name: "Bubbles", price: 400 },
      { id: "fog", name: "Fog", price: 900 },
      { id: "photo_video", name: "Photo / video", price: 1500 }
    ],
    totalAmount: 3799,
    advancePaid: 0,
    paymentStatus: "Pending",
    paymentMethod: "Pending",
    notes: "Pink & pastel theme preference",
    createdAt: "2026-10-15T18:00:00Z"
  }
];

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

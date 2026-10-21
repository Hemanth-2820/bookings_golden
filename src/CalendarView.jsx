import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Eye, Calendar as CalendarIcon, Clock, Users, IndianRupee } from 'lucide-react';
import { MAX_SLOTS_PER_DAY } from './data';

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const DAYS_HEADER = [
  { name: "SUNDAY", shortName: "SUN", colorClass: "day-sunday" },
  { name: "MONDAY", shortName: "MON", colorClass: "day-weekday" },
  { name: "TUESDAY", shortName: "TUE", colorClass: "day-weekday" },
  { name: "WEDNESDAY", shortName: "WED", colorClass: "day-weekday" },
  { name: "THURSDAY", shortName: "THU", colorClass: "day-weekday" },
  { name: "FRIDAY", shortName: "FRI", colorClass: "day-weekday" },
  { name: "SATURDAY", shortName: "SAT", colorClass: "day-saturday" },
];

export default function CalendarView({
  bookings,
  currentYear,
  currentMonth,
  onChangeMonth,
  onOpenNewBooking,
  onOpenDashboard,
  onSelectDateBookings,
  onLogout
}) {
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  // Calculate days for the calendar
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Prev & Next month names for the header tabs
  const prevMonthIndex = (currentMonth + 11) % 12;
  const nextMonthIndex = (currentMonth + 1) % 12;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  // Build grid cells
  const calendarCells = [];
  // Empty cells before day 1
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ empty: true, key: `empty-${i}` });
  }
  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayBookings = bookings.filter(b => b.date === dateStr);
    const bookingCount = dayBookings.length;

    // Slot status rules:
    // >= MAX_SLOTS_PER_DAY -> No slots available (Solid Red underline)
    // 1 or 2 slots booked -> Few slots available (Solid Orange underline)
    // 0 booked -> available
    let slotStatus = 'available';
    if (bookingCount >= MAX_SLOTS_PER_DAY) {
      slotStatus = 'no_slots';
    } else if (bookingCount > 0) {
      slotStatus = 'few_slots';
    }

    // Number text color based on day of week
    let numberColorClass = 'text-weekday';
    if (dayOfWeek === 0) numberColorClass = 'text-sunday';
    else if (dayOfWeek === 6) numberColorClass = 'text-saturday';

    calendarCells.push({
      empty: false,
      day,
      dayOfWeek,
      dateStr,
      dayBookings,
      bookingCount,
      slotStatus,
      numberColorClass,
      key: `day-${day}`
    });
  }

  return (
    <div className="calendar-page-container">
      {/* Top Banner / Call Header for Admin */}
      <div className="admin-banner">
        <div className="banner-left">
          <span className="badge-admin">ADMIN BOOKING PORTAL</span>
          <span className="banner-subtext">Quick telephone booking dispatch & date occupancy status</span>
        </div>
        <div className="banner-actions">
          <button 
            className="btn-create-booking"
            onClick={() => onOpenNewBooking()}
            title="Customer on Call - Add New Booking"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Book for Customer (Call)</span>
          </button>
          <button 
            className="btn-dashboard-toggle"
            onClick={onOpenDashboard}
          >
            <span>DASHBOARD</span>
          </button>
          {onLogout && (
            <button 
              className="btn-logout-toggle"
              onClick={onLogout}
              title="Log out of Admin Portal"
            >
              <span>Lock</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Exact-PDF Calendar Sheet */}
      <div className="calendar-sheet">
        {/* Year Label */}
        <div className="calendar-year-title">{currentYear}</div>

        {/* Month Navigation Row */}
        <div className="calendar-month-row">
          <button 
            className="month-side-link"
            onClick={() => onChangeMonth(prevMonthYear, prevMonthIndex)}
          >
            <ChevronLeft size={16} />
            <span>{MONTH_NAMES[prevMonthIndex]}</span>
          </button>

          <h2 className="current-month-heading">{MONTH_NAMES[currentMonth]}</h2>

          <button 
            className="month-side-link"
            onClick={() => onChangeMonth(nextMonthYear, nextMonthIndex)}
          >
            <span>{MONTH_NAMES[nextMonthIndex]}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Grid matching reference PDF Page 1 */}
        <div className="calendar-table-frame">
          <table className="calendar-table">
            <thead>
              <tr>
                {DAYS_HEADER.map((d) => (
                  <th key={d.name} className={`calendar-th ${d.colorClass}`}>
                    <span className="th-desktop-text">{d.name}</span>
                    <span className="th-mobile-text">{d.shortName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Split cells into chunks of 7 */}
              {Array.from({ length: Math.ceil(calendarCells.length / 7) }).map((_, rowIndex) => {
                const rowCells = calendarCells.slice(rowIndex * 7, rowIndex * 7 + 7);
                // Fill any remainder row with empty if not full 7
                while (rowCells.length < 7) {
                  rowCells.push({ empty: true, key: `empty-tail-${rowCells.length}` });
                }

                return (
                  <tr key={`row-${rowIndex}`}>
                    {rowCells.map((cell) => {
                      if (cell.empty) {
                        return <td key={cell.key} className="calendar-td td-empty"></td>;
                      }

                      return (
                        <td 
                          key={cell.key} 
                          className={`calendar-td td-date ${cell.bookingCount > 0 ? 'has-bookings' : ''}`}
                          onClick={() => {
                            if (cell.bookingCount > 0) {
                              onSelectDateBookings(cell.dateStr);
                            } else {
                              onOpenNewBooking(cell.dateStr);
                            }
                          }}
                        >
                          <div className="day-cell-content">
                            <span className={`day-number ${cell.numberColorClass}`}>
                              {cell.day}
                            </span>
                            
                            {/* PDF style thick underline indicator */}
                            {cell.slotStatus === 'no_slots' && (
                              <div className="slot-indicator indicator-no-slots" title={`${cell.bookingCount} slot(s) booked - Fully booked`}></div>
                            )}
                            {cell.slotStatus === 'few_slots' && (
                              <div className="slot-indicator indicator-few-slots" title={`${cell.bookingCount} slot(s) booked - Few slots available`}></div>
                            )}

                            {/* Booking quick counter tag */}
                            {cell.bookingCount > 0 && (
                              <span className="day-booking-tag">
                                {cell.bookingCount} {cell.bookingCount === 1 ? 'Booking' : 'Bookings'}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Legend & Dashboard button matching bottom of PDF Page 1 */}
        <div className="calendar-footer-row">
          <div className="legend-items-wrap">
            <div className="legend-item">
              <span className="legend-bar bar-no-slots"></span>
              <span className="legend-text">No slots available</span>
            </div>
            <div className="legend-item">
              <span className="legend-bar bar-few-slots"></span>
              <span className="legend-text">Few slots available</span>
            </div>
          </div>

          <button 
            id="btn-goto-dashboard"
            className="pdf-dashboard-pill-btn"
            onClick={onOpenDashboard}
          >
            DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}

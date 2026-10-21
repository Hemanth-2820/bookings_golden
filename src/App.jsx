import React, { useState, useEffect } from 'react';
import CalendarView from './CalendarView';
import AdminDashboard from './AdminDashboard';
import BookingModal from './BookingModal';
import AdminSettingsModal from './AdminSettingsModal';
import AccountingView from './AccountingView';
import AdminLogin from './AdminLogin';
import { INITIAL_BOOKINGS, EVENTS_LIST, STANDARD_ADDONS } from './data';
import { fetchBookingsFromApi, saveBookingToApi, deleteBookingFromApi } from './api';
import './App.css';

function App() {
  // Password authentication state (check session)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('golden_admin_auth') === 'true';
  });

  // Current view: 'calendar', 'dashboard', 'accounting'
  const [currentView, setCurrentView] = useState('calendar');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Manageable Events list
  const [eventsList, setEventsList] = useState(() => {
    try {
      const saved = localStorage.getItem('golden_admin_events');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return EVENTS_LIST;
  });

  // Manageable Addons & Pricing list
  const [addonsList, setAddonsList] = useState(() => {
    try {
      const saved = localStorage.getItem('golden_admin_addons');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return STANDARD_ADDONS;
  });

  // Settings modal visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Bookings list state with persistence
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('golden_admin_bookings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BOOKINGS;
  });

  // Calendar year and month (defaulting to October 2026 as shown in PDF reference)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 is October

  // Filtering on dashboard
  const [dashboardFilterDate, setDashboardFilterDate] = useState(null);

  // Booking modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  // Fetch from PHP API on startup if online
  useEffect(() => {
    async function syncWithBackend() {
      const res = await fetchBookingsFromApi();
      if (res.isOnline && res.data) {
        setBookings(res.data);
        setIsBackendConnected(true);
        try {
          localStorage.setItem('golden_admin_bookings', JSON.stringify(res.data));
        } catch (e) {}
      }
    }
    syncWithBackend();
  }, []);

  // Update localStorage and PHP API
  const saveBookings = async (newBookings, changedBooking = null, isDelete = false, deletedId = null) => {
    setBookings(newBookings);
    try {
      localStorage.setItem('golden_admin_bookings', JSON.stringify(newBookings));
    } catch (e) {
      console.error(e);
    }

    // Push to MySQL backend via PHP API
    if (isDelete && deletedId) {
      const res = await deleteBookingFromApi(deletedId);
      if (!res.success && res.offline) {
        console.warn("Backend offline or unreachable, booking deletion kept in local storage.");
      }
    } else if (changedBooking) {
      const res = await saveBookingToApi(changedBooking);
      if (res && res.success) {
        setIsBackendConnected(true);
      } else if (res && !res.success && res.offline) {
        console.warn("Backend API offline or unreachable:", res.error);
        alert("Notice: Saved locally in browser, but could not connect to MySQL server. Please verify your cPanel backend/config.php credentials.");
      } else if (res && !res.success && res.error) {
        alert("Database Error: " + res.error);
      }
    }
  };

  const handleMonthChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleOpenNewBooking = (prefillDate = null) => {
    setEditingBooking(null);
    setModalDate(prefillDate || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-16`);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setModalDate(booking.date);
    setIsModalOpen(true);
  };

  const handleDeleteBooking = (id) => {
    if (window.confirm("Are you sure you want to cancel and remove this booking?")) {
      const updated = bookings.filter(b => b.id !== id);
      saveBookings(updated, null, true, id);
    }
  };

  const handleSaveBooking = (bookingData) => {
    let updated;
    const existingIndex = bookings.findIndex(b => b.id === bookingData.id);
    if (existingIndex >= 0) {
      updated = [...bookings];
      updated[existingIndex] = bookingData;
    } else {
      updated = [bookingData, ...bookings];
    }
    saveBookings(updated, bookingData, false, null);
  };

  const handleSelectDateBookings = (dateStr) => {
    setDashboardFilterDate(dateStr);
    setCurrentView('dashboard');
  };

  const handleSaveEvents = (newEvents) => {
    setEventsList(newEvents);
    try {
      localStorage.setItem('golden_admin_events', JSON.stringify(newEvents));
    } catch (e) {}
  };

  const handleSaveAddons = (newAddons) => {
    setAddonsList(newAddons);
    try {
      localStorage.setItem('golden_admin_addons', JSON.stringify(newAddons));
    } catch (e) {}
  };

  const handleResetDefaults = () => {
    setEventsList(EVENTS_LIST);
    setAddonsList(STANDARD_ADDONS);
    try {
      localStorage.removeItem('golden_admin_events');
      localStorage.removeItem('golden_admin_addons');
    } catch (e) {}
  };

  // If admin is not logged in, show Password Login Screen
  if (!isAuthenticated) {
    return (
      <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
    );
  }

  const handleLogout = () => {
    sessionStorage.removeItem('golden_admin_auth');
    setIsAuthenticated(false);
  };

  return (
    <div className="app-main-layout">
      {currentView === 'calendar' ? (
        <CalendarView 
          bookings={bookings}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onChangeMonth={handleMonthChange}
          onOpenNewBooking={handleOpenNewBooking}
          onOpenDashboard={() => {
            setDashboardFilterDate(null);
            setCurrentView('dashboard');
          }}
          onSelectDateBookings={handleSelectDateBookings}
          onLogout={handleLogout}
        />
      ) : currentView === 'accounting' ? (
        <AccountingView 
          bookings={bookings}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onOpenNewBooking={handleOpenNewBooking}
        />
      ) : (
        <AdminDashboard 
          bookings={bookings}
          filterDate={dashboardFilterDate}
          eventsList={eventsList}
          addonsList={addonsList}
          onClearDateFilter={() => setDashboardFilterDate(null)}
          onOpenNewBooking={handleOpenNewBooking}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAccounting={() => setCurrentView('accounting')}
          onBackToCalendar={() => setCurrentView('calendar')}
          onDeleteBooking={handleDeleteBooking}
          onEditBooking={handleEditBooking}
        />
      )}

      {/* Admin Quick Booking Modal */}
      <BookingModal 
        isOpen={isModalOpen}
        initialDate={modalDate}
        editingBooking={editingBooking}
        existingBookings={bookings}
        eventsList={eventsList}
        addonsList={addonsList}
        onClose={() => setIsModalOpen(false)}
        onSaveBooking={handleSaveBooking}
      />

      {/* Admin Dashboard Form Configuration Modal */}
      <AdminSettingsModal 
        isOpen={isSettingsOpen}
        events={eventsList}
        addons={addonsList}
        onClose={() => setIsSettingsOpen(false)}
        onSaveEvents={handleSaveEvents}
        onSaveAddons={handleSaveAddons}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}

export default App;

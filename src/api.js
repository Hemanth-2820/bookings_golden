// API Service helper to communicate with PHP backend with localStorage fallback
// Determines current environment:
// 1. If running on localhost on port 5173 (Vite dev), connects to localhost:8000/api.php
// 2. In cPanel or any live domain, connects to the same origin '/backend/api.php' or './backend/api.php'

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '/backend/api.php';
  const { hostname, port, protocol } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5173') {
    return 'http://localhost:8000/api.php';
  }
  // In live production (cPanel domain or IP)
  return `${protocol}//${window.location.host}/backend/api.php`;
};

const API_BASE_URL = getApiBaseUrl();

export async function fetchBookingsFromApi() {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return { data: json.data, isOnline: true };
    }
  } catch (err) {
    // Backend offline / not running yet, use local fallback
  }
  return { data: null, isOnline: false };
}

export async function saveBookingToApi(booking) {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(booking)
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { success: false, offline: true, error: err.message };
  }
}

export async function deleteBookingFromApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { success: false, offline: true, error: err.message };
  }
}

export async function verifyAdminPassword(password) {
  try {
    const res = await fetch(`${API_BASE_URL}?action=login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ password })
    });
    const json = await res.json();
    return json;
  } catch (err) {
    // If backend is completely offline or not reached, check locally against default password
    if (password === 'bookinggolden2026') {
      return { success: true, offline: true };
    }
    return { success: false, error: 'Incorrect password' };
  }
}

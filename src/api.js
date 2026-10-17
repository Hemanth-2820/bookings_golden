// API Service helper to communicate with PHP backend with localStorage fallback
// In development, points to localhost:8000/api.php.
// On cPanel/production, it automatically uses the relative '/backend/api.php' or './api.php' path.

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000/api.php'
  : '/backend/api.php';

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

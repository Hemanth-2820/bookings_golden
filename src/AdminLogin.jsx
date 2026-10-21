import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { verifyAdminPassword } from './api';

export default function AdminLogin({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter the admin password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyAdminPassword(password.trim());
      if (res && res.success) {
        // Store in session storage so admin stays logged in during the session
        sessionStorage.setItem('golden_admin_auth', 'true');
        onLoginSuccess();
      } else {
        setErrorMsg(res?.error || 'Invalid password. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Unable to verify password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-box">
            <Lock size={28} />
          </div>
          <h2>ADMIN ACCESS REQUIRED</h2>
          <p>Please enter the administrative password to manage bookings and dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-input-field">
            <KeyRound size={18} className="key-icon" />
            <input 
              type="password" 
              required
              autoFocus
              placeholder="Enter Admin Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Unlock Portal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={14} />
          <span>Protected Booking Management System</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Edit2, Check, RotateCcw, 
  Settings, DollarSign, Calendar, Clock, Tag
} from 'lucide-react';

export default function AdminSettingsModal({
  isOpen,
  onClose,
  events,
  addons,
  onSaveEvents,
  onSaveAddons,
  onResetDefaults
}) {
  const [activeTab, setActiveTab] = useState('addons'); // 'addons' or 'events'

  // Local editing states
  const [localEvents, setLocalEvents] = useState(events);
  const [localAddons, setLocalAddons] = useState(addons);

  // New Event form state
  const [newEventName, setNewEventName] = useState('');

  // New Addon form state
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonType, setNewAddonType] = useState('fixed'); // 'fixed', 'per_number', 'custom'

  // Update when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalEvents(events);
      setLocalAddons(addons);
    }
  }, [isOpen, events, addons]);

  if (!isOpen) return null;

  // Add Event
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    if (localEvents.includes(newEventName.trim())) {
      alert("This event type already exists");
      return;
    }
    const updated = [...localEvents, newEventName.trim()];
    setLocalEvents(updated);
    onSaveEvents(updated);
    setNewEventName('');
  };

  // Remove Event
  const handleRemoveEvent = (eventToRemove) => {
    if (localEvents.length <= 1) {
      alert("At least one event type must remain.");
      return;
    }
    if (window.confirm(`Delete event "${eventToRemove}"?`)) {
      const updated = localEvents.filter(e => e !== eventToRemove);
      setLocalEvents(updated);
      onSaveEvents(updated);
    }
  };

  // Add Addon
  const handleAddAddon = (e) => {
    e.preventDefault();
    if (!newAddonName.trim()) return;

    const id = newAddonName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isPerNumber = newAddonType === 'per_number';
    const isFixed = newAddonType === 'fixed';
    const priceNum = isFixed || isPerNumber ? (Number(newAddonPrice) || 0) : 0;

    const newAddonItem = {
      id,
      name: newAddonName.trim(),
      price: priceNum,
      fixed: isFixed,
      isPerNumber,
      note: !isFixed && !isPerNumber ? "based on requirement" : (isPerNumber ? `₹${priceNum} per number` : undefined)
    };

    const updated = [...localAddons, newAddonItem];
    setLocalAddons(updated);
    onSaveAddons(updated);
    setNewAddonName('');
    setNewAddonPrice('');
    setNewAddonType('fixed');
  };

  // Edit Addon Price inline
  const handleUpdateAddonPrice = (id, newPrice) => {
    const updated = localAddons.map(a => {
      if (a.id === id) {
        return { ...a, price: Number(newPrice) || 0 };
      }
      return a;
    });
    setLocalAddons(updated);
    onSaveAddons(updated);
  };

  // Remove Addon
  const handleRemoveAddon = (id, name) => {
    if (window.confirm(`Remove add-on "${name}" from the form?`)) {
      const updated = localAddons.filter(a => a.id !== id);
      setLocalAddons(updated);
      onSaveAddons(updated);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge">
              <Settings size={14} />
              <span>DASHBOARD FORM CONFIGURATION</span>
            </div>
            <h2>Manage Booking Form Options & Pricing</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs-bar">
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === 'addons' ? 'active' : ''}`}
            onClick={() => setActiveTab('addons')}
          >
            <DollarSign size={16} />
            <span>Add-ons & Prices ({localAddons.length})</span>
          </button>
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={16} />
            <span>Event Types ({localEvents.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-tab-body">
          {activeTab === 'addons' ? (
            <div className="settings-section-wrap">
              <div className="settings-info-alert">
                <span>Manage the Add-on packages and their exact pricing shown in the telephonic booking modal.</span>
              </div>

              {/* Add New Addon Form */}
              <form onSubmit={handleAddAddon} className="settings-add-box">
                <h4>Add New Add-on Option:</h4>
                <div className="add-fields-row">
                  <input 
                    type="text" 
                    placeholder="Add-on Name (e.g. Laser Lights, DJ)" 
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    required
                  />
                  <select 
                    value={newAddonType} 
                    onChange={(e) => setNewAddonType(e.target.value)}
                  >
                    <option value="fixed">Fixed Price (₹)</option>
                    <option value="per_number">Price Per Number (e.g. LED)</option>
                    <option value="custom">Custom (Based on Requirement)</option>
                  </select>
                  {newAddonType !== 'custom' && (
                    <input 
                      type="number" 
                      placeholder="Price in ₹" 
                      value={newAddonPrice}
                      onChange={(e) => setNewAddonPrice(e.target.value)}
                      required
                      style={{ width: '110px' }}
                    />
                  )}
                  <button type="submit" className="btn-add-item">
                    <Plus size={16} />
                    <span>Add to Form</span>
                  </button>
                </div>
              </form>

              {/* List of Current Addons */}
              <div className="current-items-list">
                <div className="list-title">Active Add-ons in Booking Form:</div>
                <div className="items-table-wrap">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Add-on Name</th>
                        <th>Type / Behavior</th>
                        <th>Rate (₹)</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localAddons.map((addon) => (
                        <tr key={addon.id}>
                          <td className="item-name font-bold">{addon.name}</td>
                          <td className="item-type-badge">
                            {addon.fixed && <span className="type-pill fixed">Fixed</span>}
                            {addon.isPerNumber && <span className="type-pill per-number">Per Number</span>}
                            {!addon.fixed && !addon.isPerNumber && <span className="type-pill custom">Requirement-based</span>}
                          </td>
                          <td className="item-price-edit">
                            {addon.fixed || addon.isPerNumber ? (
                              <div className="price-input-wrap">
                                <span>₹</span>
                                <input 
                                  type="number" 
                                  value={addon.price}
                                  onChange={(e) => handleUpdateAddonPrice(addon.id, e.target.value)}
                                  className="inline-price-input"
                                />
                                {addon.isPerNumber && <span className="per-sub">/ number</span>}
                              </div>
                            ) : (
                              <span className="text-muted italic">Quoted on call</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              type="button" 
                              className="btn-trash-item"
                              onClick={() => handleRemoveAddon(addon.id, addon.name)}
                              title="Delete Add-on"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="settings-section-wrap">
              <div className="settings-info-alert">
                <span>Configure the list of Event categories selectable when taking phone bookings.</span>
              </div>

              {/* Add New Event Form */}
              <form onSubmit={handleAddEvent} className="settings-add-box">
                <h4>Add New Event Category:</h4>
                <div className="add-fields-row">
                  <input 
                    type="text" 
                    placeholder="Event Name (e.g. Proposal, Bachelorette, Naming Ceremony)" 
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-add-item">
                    <Plus size={16} />
                    <span>Add Event</span>
                  </button>
                </div>
              </form>

              {/* List of Current Events */}
              <div className="current-items-list">
                <div className="list-title">Active Events in Dropdown:</div>
                <div className="events-chips-grid">
                  {localEvents.map((evt) => (
                    <div key={evt} className="event-manage-chip">
                      <span className="event-chip-text">{evt}</span>
                      <button 
                        type="button" 
                        className="btn-remove-chip"
                        onClick={() => handleRemoveEvent(evt)}
                        title="Delete this event"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-actions-bar settings-footer">
          <button 
            type="button" 
            className="btn-reset-defaults"
            onClick={() => {
              if (window.confirm("Reset all Add-ons and Events back to initial defaults?")) {
                onResetDefaults();
                onClose();
              }
            }}
          >
            <RotateCcw size={15} />
            <span>Reset to Defaults</span>
          </button>

          <button type="button" className="btn-submit-booking" onClick={onClose}>
            <Check size={18} />
            <span>Done & Apply to Form</span>
          </button>
        </div>
      </div>
    </div>
  );
}

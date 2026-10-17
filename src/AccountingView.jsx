import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Search, Calendar, DollarSign, TrendingUp, TrendingDown, 
  Wallet, FileText, Trash2, Tag, Filter, CheckCircle, Clock, AlertCircle, 
  Download, Printer, Phone
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  "Cake & Bakery",
  "Flowers & Bouquets",
  "Balloons & Decorations",
  "Cleaning & Maintenance",
  "Staff & Operations",
  "Electricity & Utilities",
  "Photography & Videography",
  "Marketing & Ads",
  "Snacks & Beverages",
  "Others"
];

export const INITIAL_EXPENSES = [
  {
    id: "EXP-101",
    date: "2026-10-13",
    title: "Truffle Cake from Baker's Den",
    category: "Cake & Bakery",
    amount: 750,
    paidTo: "Baker's Den",
    paymentMode: "UPI / GPay",
    referenceBookingId: "01",
    receiptNo: "REC-8841",
    notes: "1.5kg Chocolate Truffle cake for Rahul Sharma booking"
  },
  {
    id: "EXP-102",
    date: "2026-10-13",
    title: "Fresh Red Roses & Petals wholesale",
    category: "Flowers & Bouquets",
    amount: 450,
    paidTo: "City Flower Market",
    paymentMode: "Cash",
    referenceBookingId: "02",
    receiptNo: "REC-8842",
    notes: "Bouquet and loose petals for couple surprise"
  },
  {
    id: "EXP-103",
    date: "2026-10-14",
    title: "Venue Sanitization & Fog Liquid Refill",
    category: "Cleaning & Maintenance",
    amount: 600,
    paidTo: "CleanPro Supplies",
    paymentMode: "UPI / PhonePe",
    referenceBookingId: "",
    receiptNo: "REC-8845",
    notes: "5L fog liquid and sanitizers"
  },
  {
    id: "EXP-104",
    date: "2026-10-14",
    title: "Red Velvet Anniversary Cake",
    category: "Cake & Bakery",
    amount: 650,
    paidTo: "Sweet Sensations",
    paymentMode: "UPI / GPay",
    referenceBookingId: "04",
    receiptNo: "REC-8848",
    notes: "Heart shape red velvet for Anand Verma"
  }
];

export default function AccountingView({
  bookings = [],
  onBackToDashboard,
  onOpenNewBooking
}) {
  // Expenses state with localStorage persistence
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('golden_admin_expenses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EXPENSES;
  });

  // Active view tab: 'overview', 'expenses', 'customer_bills'
  const [subTab, setSubTab] = useState('overview');

  // Filter states
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL'); // 'ALL', 'TODAY', 'THIS_MONTH', 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // New Expense modal/form toggle
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [newAmount, setNewAmount] = useState('');
  const [newPaidTo, setNewPaidTo] = useState('');
  const [newDate, setNewDate] = useState('2026-10-16');
  const [newPaymentMode, setNewPaymentMode] = useState('UPI / GPay');
  const [newRefBookingId, setNewRefBookingId] = useState('');
  const [newReceiptNo, setNewReceiptNo] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Bill preview modal
  const [selectedBillBooking, setSelectedBillBooking] = useState(null);

  // Save expenses
  const saveExpenses = (newExpenses) => {
    setExpenses(newExpenses);
    try {
      localStorage.setItem('golden_admin_expenses', JSON.stringify(newExpenses));
    } catch (e) {}
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) {
      alert("Please enter Expense Title and Amount");
      return;
    }

    const newExp = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      date: newDate,
      title: newTitle.trim(),
      category: newCategory,
      amount: Number(newAmount) || 0,
      paidTo: newPaidTo.trim(),
      paymentMode: newPaymentMode,
      referenceBookingId: newRefBookingId.trim(),
      receiptNo: newReceiptNo.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: newNotes.trim()
    };

    saveExpenses([newExp, ...expenses]);
    setIsAddExpenseOpen(false);
    // Reset fields
    setNewTitle('');
    setNewAmount('');
    setNewPaidTo('');
    setNewRefBookingId('');
    setNewReceiptNo('');
    setNewNotes('');
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm("Delete this expense record?")) {
      const updated = expenses.filter(e => e.id !== id);
      saveExpenses(updated);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Date filter
      if (dateRangeFilter === 'THIS_MONTH') {
        if (!exp.date.startsWith('2026-10')) return false;
      } else if (dateRangeFilter === 'CUSTOM') {
        if (customStartDate && exp.date < customStartDate) return false;
        if (customEndDate && exp.date > customEndDate) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;

      // Payment mode filter
      if (paymentModeFilter !== 'ALL' && exp.paymentMode !== paymentModeFilter) return false;

      // Search
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(term);
        const matchesPaidTo = exp.paidTo?.toLowerCase().includes(term);
        const matchesReceipt = exp.receiptNo?.toLowerCase().includes(term);
        const matchesBooking = exp.referenceBookingId?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesPaidTo && !matchesReceipt && !matchesBooking) return false;
      }

      return true;
    });
  }, [expenses, dateRangeFilter, customStartDate, customEndDate, categoryFilter, paymentModeFilter, searchTerm]);

  // Filtered Bookings / Customer Bills
  const filteredBills = useMemo(() => {
    return bookings.filter(b => {
      // Date filter
      if (dateRangeFilter === 'THIS_MONTH') {
        if (!b.date.startsWith('2026-10')) return false;
      } else if (dateRangeFilter === 'CUSTOM') {
        if (customStartDate && b.date < customStartDate) return false;
        if (customEndDate && b.date > customEndDate) return false;
      }

      // Search (Customer name, mobile, booking ID)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(term);
        const matchesMobile = b.mobile.includes(term);
        const matchesId = b.id.toLowerCase().includes(term);
        if (!matchesName && !matchesMobile && !matchesId) return false;
      }

      return true;
    });
  }, [bookings, dateRangeFilter, customStartDate, customEndDate, searchTerm]);

  // Overall Financial Calculations
  const totalRevenue = useMemo(() => {
    return filteredBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
  }, [filteredBills]);

  const totalCollectedAdvance = useMemo(() => {
    return filteredBills.reduce((acc, b) => acc + (Number(b.advancePaid) || 0), 0);
  }, [filteredBills]);

  const totalOutstandingDue = useMemo(() => {
    return totalRevenue - totalCollectedAdvance;
  }, [totalRevenue, totalCollectedAdvance]);

  const totalExpenseSpending = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const netProfit = totalRevenue - totalExpenseSpending;

  // Category breakdown for expenses
  const categoryTotals = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(exp => {
      map[exp.category] = (map[exp.category] || 0) + Number(exp.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  return (
    <div className="admin-dashboard-container accounting-view-wrap">
      {/* Top Header */}
      <div className="dash-top-bar">
        <div className="top-left">
          <button 
            className="btn-back-calendar"
            onClick={onBackToDashboard}
            title="Return to Bookings Table"
          >
            <ArrowLeft size={18} />
            <span>BACK TO BOOKINGS</span>
          </button>
          
          <div className="dash-heading-wrap">
            <h1 className="dash-title">Financial Accounting & Billing</h1>
            <span className="dash-subtitle">Track customer invoices, operational spending, expenses & net profits</span>
          </div>
        </div>

        <div className="top-right">
          <button 
            className="btn-create-booking"
            onClick={() => setIsAddExpenseOpen(true)}
            style={{ background: '#e11d48' }}
          >
            <Plus size={18} />
            <span>Record Expense (Spending)</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="accounting-stats-grid">
        <div className="stat-card revenue">
          <div className="stat-card-icon">
            <TrendingUp size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Total Booking Revenue</span>
            <span className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="stat-sub">From {filteredBills.length} booking orders</span>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-card-icon">
            <TrendingDown size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Total Operational Spending</span>
            <span className="stat-value">₹{totalExpenseSpending.toLocaleString('en-IN')}</span>
            <span className="stat-sub">Across {filteredExpenses.length} expense bills</span>
          </div>
        </div>

        <div className="stat-card profit">
          <div className="stat-card-icon">
            <Wallet size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Estimated Net Profit</span>
            <span className={`stat-value ${netProfit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
              ₹{netProfit.toLocaleString('en-IN')}
            </span>
            <span className="stat-sub">Revenue minus Expenses</span>
          </div>
        </div>

        <div className="stat-card due">
          <div className="stat-card-icon">
            <Clock size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-label">Pending Customer Dues</span>
            <span className="stat-value">₹{totalOutstandingDue.toLocaleString('en-IN')}</span>
            <span className="stat-sub">Collected Advance: ₹{totalCollectedAdvance.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Accounting Sub-Navigation Tabs */}
      <div className="accounting-nav-tabs">
        <button 
          className={`acc-nav-btn ${subTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSubTab('overview')}
        >
          <TrendingUp size={16} />
          <span>Accounting Overview & Breakdown</span>
        </button>

        <button 
          className={`acc-nav-btn ${subTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setSubTab('expenses')}
        >
          <TrendingDown size={16} />
          <span>Spending & Expense Ledger ({filteredExpenses.length})</span>
        </button>

        <button 
          className={`acc-nav-btn ${subTab === 'customer_bills' ? 'active' : ''}`}
          onClick={() => setSubTab('customer_bills')}
        >
          <FileText size={16} />
          <span>Customer Invoices & Previous Bills ({filteredBills.length})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="dash-filter-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={subTab === 'expenses' ? "Search expense title, recipient, receipt no..." : "Search customer name, mobile or booking ID..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {/* Date range filter */}
          <div className="select-wrapper">
            <label>Period:</label>
            <select 
              value={dateRangeFilter} 
              onChange={(e) => setDateRangeFilter(e.target.value)}
            >
              <option value="ALL">All Time</option>
              <option value="THIS_MONTH">October 2026</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {dateRangeFilter === 'CUSTOM' && (
            <div className="custom-dates-wrap">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="From Date"
              />
              <span>to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="To Date"
              />
            </div>
          )}

          {subTab === 'expenses' && (
            <>
              <div className="select-wrapper">
                <label>Category:</label>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="select-wrapper">
                <label>Payment Mode:</label>
                <select 
                  value={paymentModeFilter} 
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                >
                  <option value="ALL">All Modes</option>
                  <option value="UPI / GPay">UPI / GPay</option>
                  <option value="UPI / PhonePe">UPI / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW & SPENDING BREAKDOWN */}
      {subTab === 'overview' && (
        <div className="accounting-overview-grid">
          {/* Left: Spending by Category breakdown */}
          <div className="overview-card">
            <h3 className="overview-card-title">Spending Breakdown by Category</h3>
            <p className="overview-card-sub">Where the venue operational and event budget was spent</p>

            <div className="category-breakdown-list">
              {categoryTotals.length === 0 ? (
                <p className="text-muted">No expenses recorded for this period.</p>
              ) : (
                categoryTotals.map(([cat, amt]) => {
                  const pct = totalExpenseSpending > 0 ? Math.round((amt / totalExpenseSpending) * 100) : 0;
                  return (
                    <div key={cat} className="category-progress-item">
                      <div className="cat-progress-head">
                        <span className="cat-name">{cat}</span>
                        <div className="cat-values">
                          <span className="cat-amt">₹{amt.toLocaleString('en-IN')}</span>
                          <span className="cat-pct">({pct}%)</span>
                        </div>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Quick Recent Transactions */}
          <div className="overview-card">
            <h3 className="overview-card-title">Recent Spending Bills</h3>
            <p className="overview-card-sub">Latest operational expenses logged</p>

            <div className="recent-expenses-list">
              {filteredExpenses.slice(0, 5).map(exp => (
                <div key={exp.id} className="recent-exp-row">
                  <div className="exp-left">
                    <span className="exp-title font-bold">{exp.title}</span>
                    <span className="exp-meta">{exp.category} • {exp.date} • {exp.paymentMode}</span>
                  </div>
                  <div className="exp-right">
                    <span className="exp-amt font-bold text-danger">-₹{exp.amount.toLocaleString('en-IN')}</span>
                    <span className="exp-rec-no">{exp.receiptNo}</span>
                  </div>
                </div>
              ))}
              <button className="btn-view-all-exp" onClick={() => setSubTab('expenses')}>
                View All {filteredExpenses.length} Expense Bills →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SPENDING & EXPENSES TABLE */}
      {subTab === 'expenses' && (
        <div className="pdf-table-container">
          <table className="pdf-admin-table">
            <thead>
              <tr className="pdf-header-row" style={{ background: '#cbd5e1' }}>
                <th className="th-col" style={{ width: '90px' }}>Receipt #</th>
                <th className="th-col">Date</th>
                <th className="th-col">Expense Title / Item</th>
                <th className="th-col">Category</th>
                <th className="th-col">Paid To / Vendor</th>
                <th className="th-col">Booking Ref</th>
                <th className="th-col">Payment Mode</th>
                <th className="th-col" style={{ textAlign: 'right' }}>Amount (₹)</th>
                <th className="th-col col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-records-cell">
                    No expense records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="pdf-data-row">
                    <td className="td-col font-bold" style={{ color: '#64748b' }}>{exp.receiptNo || exp.id}</td>
                    <td className="td-col">{exp.date}</td>
                    <td className="td-col font-bold">
                      <div className="expense-title-wrap">
                        <span>{exp.title}</span>
                        {exp.notes && <span className="notes-badge" title={exp.notes}>📝 {exp.notes}</span>}
                      </div>
                    </td>
                    <td className="td-col">
                      <span className="addon-chip" style={{ background: '#f1f5f9', color: '#334155' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="td-col">{exp.paidTo || '—'}</td>
                    <td className="td-col">
                      {exp.referenceBookingId ? (
                        <span className="guest-badge">#{exp.referenceBookingId}</span>
                      ) : (
                        <span className="text-muted">General</span>
                      )}
                    </td>
                    <td className="td-col">{exp.paymentMode}</td>
                    <td className="td-col font-bold text-danger" style={{ textAlign: 'right', fontSize: '0.98rem' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="td-col col-actions">
                      <button 
                        className="btn-action-icon delete"
                        onClick={() => handleDeleteExpense(exp.id)}
                        title="Delete Expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="dash-summary-footer">
            <div>Total Expense Bills: <strong>{filteredExpenses.length}</strong></div>
            <div>
              Total Spending: <strong className="text-danger">₹{totalExpenseSpending.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CUSTOMER INVOICES & PREVIOUS BILLS */}
      {subTab === 'customer_bills' && (
        <div className="pdf-table-container">
          <table className="pdf-admin-table">
            <thead>
              <tr className="pdf-header-row">
                <th className="th-col col-idx">Invoice #</th>
                <th className="th-col col-name">Customer Name</th>
                <th className="th-col col-mobile">Mobile</th>
                <th className="th-col">Event & Date</th>
                <th className="th-col">Total Billed</th>
                <th className="th-col">Advance Paid</th>
                <th className="th-col">Balance Due</th>
                <th className="th-col">Payment Status</th>
                <th className="th-col" style={{ textAlign: 'center' }}>Invoice Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-records-cell">
                    No customer bills found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => {
                  const total = Number(b.totalAmount) || 0;
                  const adv = Number(b.advancePaid) || 0;
                  const due = total - adv;

                  return (
                    <tr key={b.id} className="pdf-data-row">
                      <td className="td-col td-idx font-bold">INV-{b.id}</td>
                      <td className="td-col font-bold">{b.name}</td>
                      <td className="td-col">{b.mobile}</td>
                      <td className="td-col">
                        <div className="event-date-cell">
                          <span className="font-bold">{b.event}</span>
                          <span className="text-muted" style={{ fontSize: '0.78rem' }}>{b.date} • {b.timeSlot}</span>
                        </div>
                      </td>
                      <td className="td-col font-bold">₹{total.toLocaleString('en-IN')}</td>
                      <td className="td-col text-success font-bold">₹{adv.toLocaleString('en-IN')}</td>
                      <td className="td-col font-bold" style={{ color: due > 0 ? '#dc2626' : '#16a34a' }}>
                        {due > 0 ? `₹${due.toLocaleString('en-IN')}` : 'PAID'}
                      </td>
                      <td className="td-col">
                        <span className={`payment-status-badge status-${b.paymentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="td-col" style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-print-bill"
                          onClick={() => setSelectedBillBooking(b)}
                        >
                          <FileText size={15} />
                          <span>View Bill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="dash-summary-footer">
            <div>Total Invoices: <strong>{filteredBills.length}</strong></div>
            <div>
              Total Collected: <strong className="text-success">₹{totalCollectedAdvance.toLocaleString('en-IN')}</strong>
              {' '}| Outstanding Due: <strong className="text-danger">₹{totalOutstandingDue.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD NEW EXPENSE */}
      {isAddExpenseOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddExpenseOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ background: '#991b1b' }}>
              <div className="modal-header-info">
                <div className="modal-badge" style={{ background: '#ef4444' }}>
                  <TrendingDown size={14} />
                  <span>RECORD SPENDING BILL</span>
                </div>
                <h2>Add Operational Expense</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsAddExpenseOpen(false)}>
                <ArrowLeft size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="modal-form-scroll">
              <div className="form-field">
                <label>Expense Title / Purpose *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 2kg Chocolate Cake for booking #05, Flowers, Electrician" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Category *</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Amount Spent (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 1200" 
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-field">
                  <label>Date of Expense *</label>
                  <input 
                    type="date" 
                    required 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Payment Mode</label>
                  <select value={newPaymentMode} onChange={(e) => setNewPaymentMode(e.target.value)}>
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="UPI / PhonePe">UPI / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Paid To / Vendor</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Local Bakery" 
                    value={newPaidTo}
                    onChange={(e) => setNewPaidTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Link to Customer Booking ID (Optional)</label>
                  <select 
                    value={newRefBookingId} 
                    onChange={(e) => setNewRefBookingId(e.target.value)}
                  >
                    <option value="">None (General Operational)</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>#{b.id} - {b.name} ({b.event})</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Bill / Receipt Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. REC-9921" 
                    value={newReceiptNo}
                    onChange={(e) => setNewReceiptNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Notes / Details</label>
                <textarea 
                  rows="2" 
                  placeholder="Items purchased, invoice remarks, etc." 
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-bar">
                <button type="button" className="btn-cancel" onClick={() => setIsAddExpenseOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-booking" style={{ background: '#e11d48' }}>
                  <Plus size={18} />
                  <span>Save Expense Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER PREVIOUS BILL / INVOICE PREVIEW */}
      {selectedBillBooking && (
        <div className="modal-backdrop" onClick={() => setSelectedBillBooking(null)}>
          <div className="modal-card printable-bill-card" onClick={(e) => e.stopPropagation()}>
            <div className="bill-header">
              <div className="bill-brand">
                <h2>GOLDEN CELEBRATIONS</h2>
                <span>Official Booking Receipt & Invoice</span>
              </div>
              <div className="bill-inv-no">
                <strong>INVOICE #{selectedBillBooking.id}</strong>
                <span>Date: {selectedBillBooking.date}</span>
              </div>
            </div>

            <div className="bill-customer-section">
              <div>
                <strong>Billed To:</strong>
                <div>{selectedBillBooking.name}</div>
                <div>Phone: {selectedBillBooking.mobile}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Event Details:</strong>
                <div>{selectedBillBooking.event}</div>
                <div>Slot: {selectedBillBooking.timeSlot}</div>
                <div>Guests: {selectedBillBooking.noOfGuests}</div>
              </div>
            </div>

            <table className="bill-items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity / Detail</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedBillBooking.addons && selectedBillBooking.addons.length > 0 ? (
                  selectedBillBooking.addons.map((a, i) => (
                    <tr key={i}>
                      <td>{a.name}</td>
                      <td>{a.detail || (a.quantity ? `Qty: ${a.quantity}` : 'Standard package')}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(a.price).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>Standard Slot Booking</td>
                    <td>1 Slot</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(selectedBillBooking.totalAmount).toLocaleString('en-IN')}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="bill-summary-wrap">
              <div className="bill-notes">
                {selectedBillBooking.notes && <div><strong>Notes:</strong> {selectedBillBooking.notes}</div>}
                <div><strong>Payment Mode:</strong> {selectedBillBooking.paymentMethod}</div>
              </div>
              <div className="bill-totals">
                <div className="tot-row">
                  <span>Grand Total:</span>
                  <strong>₹{Number(selectedBillBooking.totalAmount).toLocaleString('en-IN')}</strong>
                </div>
                <div className="tot-row">
                  <span>Advance Received:</span>
                  <strong className="text-success">- ₹{Number(selectedBillBooking.advancePaid || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="tot-row total-due-highlight">
                  <span>Balance Due:</span>
                  <strong>₹{(Number(selectedBillBooking.totalAmount) - Number(selectedBillBooking.advancePaid || 0)).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            <div className="modal-actions-bar" style={{ padding: '16px 20px', background: '#f8fafc' }}>
              <button 
                type="button" 
                className="btn-create-booking sm"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>Print Bill</span>
              </button>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setSelectedBillBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

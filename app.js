/* ==========================================================================
   Premium Expense Tracker JS - Logic & State (Vanilla JS)
   ========================================================================== */

// --- GLOBAL STATE ---
let state = {
  transactions: [],
  budgets: {},
  categories: {},
  currentTab: 'dashboard', // dashboard, office, home, personal, budgets, analytics, settings
  currentScope: null,      // office, home, personal (when on scope-expenses tab)
  currency: '₹',           // $, ₹, €, £, ¥
  theme: 'dark',
  sorting: {
    column: 'date',
    direction: 'desc'      // asc, desc
  },
  passcode: 'Open@1988$'
};

// Simulated receipt database (base64 or data URLs for custom uploads)
let receiptStorage = {};

// Chart JS Instances
let charts = {
  trend: null,
  category: null,
  payment: null,
  compare: null
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Set real time clock in header
  updateClock();
  setInterval(updateClock, 60000);
  
  // Load State from LocalStorage
  loadState();
  
  // Check authentication status before rendering
  checkAuthentication();
  
  // Setup App Settings
  applyTheme(state.theme);
  document.getElementById('settingCurrency').value = state.currency;
  
  // Bind Event Listeners
  setupEventListeners();
  
  // Render Current Tab
  renderCurrentView();
});

// Update the header clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const clockElement = document.getElementById('headerClock');
  if (clockElement) {
    clockElement.textContent = `${hours}:${minutes}`;
  }
}

// --- SECURITY & AUTHENTICATION ---
function checkAuthentication() {
  const loginBackdrop = document.getElementById('loginBackdrop');
  if (!loginBackdrop) return;

  if (sessionStorage.getItem('fintrack_authenticated') === 'true') {
    loginBackdrop.style.display = 'none';
  } else {
    loginBackdrop.style.display = 'flex';
    loginBackdrop.classList.remove('fade-out');

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputPass = document.getElementById('loginPasswordInput').value;
        const errorText = document.getElementById('loginErrorText');

        if (inputPass === state.passcode) {
          sessionStorage.setItem('fintrack_authenticated', 'true');
          loginBackdrop.classList.add('fade-out');
          if (errorText) errorText.style.display = 'none';
          
          setTimeout(() => {
            loginBackdrop.style.display = 'none';
          }, 400); // Wait for transition to complete
        } else {
          if (errorText) errorText.style.display = 'block';
          const passInput = document.getElementById('loginPasswordInput');
          if (passInput) {
            passInput.value = '';
            passInput.focus();
          }
        }
      });
    }
  }
}

// --- STATE MANAGEMENT ---
function loadState() {
  const localData = localStorage.getItem('fintrack_state');
  const localReceipts = localStorage.getItem('fintrack_receipts');
  
  if (localReceipts) {
    try {
      receiptStorage = JSON.parse(localReceipts);
    } catch (e) {
      receiptStorage = {};
    }
  }
  
  if (localData) {
    try {
      state = JSON.parse(localData);
      // Ensure default values exist if not in saved structure
      if (!state.sorting) state.sorting = { column: 'date', direction: 'desc' };
      if (!state.categories) {
        state.categories = typeof CATEGORIES !== 'undefined' ? JSON.parse(JSON.stringify(CATEGORIES)) : { office: [], home: [], personal: [] };
      }
      if (!state.passcode) {
        state.passcode = 'Open@1988$';
      }
    } catch (e) {
      loadFallbackData();
    }
  } else {
    loadFallbackData();
  }
}

function loadFallbackData() {
  state.transactions = [];
  state.budgets = { office: 0, home: 0, personal: 0 };
  state.categories = typeof CATEGORIES !== 'undefined' ? JSON.parse(JSON.stringify(CATEGORIES)) : { office: [], home: [], personal: [] };
  state.currency = '₹';
  state.theme = 'dark';
  state.currentTab = 'dashboard';
  state.currentScope = null;
  state.sorting = { column: 'date', direction: 'desc' };
  state.passcode = 'Open@1988$';
  saveState();
}

function loadMockDemoData() {
  // Load variables defined in mockData.js
  state.transactions = typeof INITIAL_TRANSACTIONS !== 'undefined' ? [...INITIAL_TRANSACTIONS] : [];
  state.budgets = typeof INITIAL_BUDGETS !== 'undefined' ? { ...INITIAL_BUDGETS } : { office: 5000, home: 3000, personal: 2000 };
  state.categories = typeof CATEGORIES !== 'undefined' ? JSON.parse(JSON.stringify(CATEGORIES)) : { office: [], home: [], personal: [] };
  state.currency = '₹';
  state.theme = 'dark';
  state.currentTab = 'dashboard';
  state.currentScope = null;
  state.sorting = { column: 'date', direction: 'desc' };
  state.passcode = 'Open@1988$';
  saveState();
}

function saveState() {
  localStorage.setItem('fintrack_state', JSON.stringify(state));
  localStorage.setItem('fintrack_receipts', JSON.stringify(receiptStorage));
}

// --- NAVIGATION & ROUTING ---
function setupEventListeners() {
  // Sidebar navigation clicks
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Quick Add Action
  document.getElementById('quickAddBtn').addEventListener('click', () => {
    openTransactionModal();
  });

  // Global Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveState();
    
    // Sync theme settings buttons if on settings page
    const themeButtons = document.querySelectorAll('.btn-toggle-theme');
    themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === nextTheme);
    });
  });

  // Settings page theme buttons
  const themeButtons = document.querySelectorAll('.btn-toggle-theme');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeVal = btn.getAttribute('data-theme');
      applyTheme(themeVal);
      themeButtons.forEach(b => b.classList.toggle('active', b === btn));
      saveState();
    });
  });

  // Settings page currency selector
  document.getElementById('settingCurrency').addEventListener('change', (e) => {
    state.currency = e.target.value;
    saveState();
    renderCurrentView();
  });

  // Settings page passcode updater
  const btnSavePasscode = document.getElementById('btnSavePasscode');
  if (btnSavePasscode) {
    btnSavePasscode.addEventListener('click', () => {
      const input = document.getElementById('settingPasscodeInput');
      const newPasscode = input ? input.value.trim() : '';
      if (newPasscode.length >= 4) {
        state.passcode = newPasscode;
        saveState();
        if (input) input.value = '';
        alert('Access passcode updated successfully!');
      } else {
        alert('Passcode must be at least 4 characters long.');
      }
    });
  }

  // Restore Seed Data
  document.getElementById('btnRestoreSeedData').addEventListener('click', () => {
    if (confirm('Are you sure you want to restore the default mock data? Any custom modifications will be overwritten.')) {
      loadMockDemoData();
      renderCurrentView();
      alert('Mock data restored successfully!');
    }
  });

  // Purge All Data
  document.getElementById('btnClearAllData').addEventListener('click', () => {
    if (confirm('WARNING: Are you sure you want to delete ALL data permanently? This action is irreversible.')) {
      loadFallbackData();
      receiptStorage = {};
      saveState();
      renderCurrentView();
      alert('All local storage databases purged.');
    }
  });

  // Modals close buttons
  document.getElementById('closeTransactionModalBtn').addEventListener('click', closeTransactionModal);
  document.getElementById('cancelTransactionModalBtn').addEventListener('click', closeTransactionModal);
  document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDeleteModalBtn').addEventListener('click', closeDeleteModal);
  
  // Confirm Delete Transaction handler
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (deletingTxId) {
        state.transactions = state.transactions.filter(t => t.id !== deletingTxId);
        delete receiptStorage[deletingTxId];
        
        saveState();
        closeDeleteModal();
        renderCurrentView();
      }
    });
  }
  
  document.getElementById('closeDetailsModalBtn').addEventListener('click', closeDetailsModal);
  document.getElementById('closeDetailsBtn').addEventListener('click', closeDetailsModal);
  
  // Print receipt click
  document.getElementById('btnPrintReceipt').addEventListener('click', () => {
    window.print();
  });

  // CRUD Save Transaction handler
  const form = document.getElementById('transactionForm');
  form.addEventListener('submit', handleTransactionFormSubmit);

  // Dynamic category update when scope is toggled in Modal
  const modalTypeRadios = document.querySelectorAll('input[name="txType"]');
  modalTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      populateModalCategories(e.target.value);
    });
  });

  // Toggle custom category input based on dropdown selection
  document.getElementById('txCategory').addEventListener('change', (e) => {
    const customGroup = document.getElementById('customCategoryInputGroup');
    const customInput = document.getElementById('txCustomCategory');
    if (e.target.value === '__custom__') {
      customGroup.style.display = 'flex';
      customInput.setAttribute('required', 'true');
      customInput.focus();
    } else {
      customGroup.style.display = 'none';
      customInput.removeAttribute('required');
      customInput.value = '';
    }
  });

  // Scope specific filters event triggers
  document.getElementById('filterSearch').addEventListener('input', applyScopeFiltersAndRender);
  document.getElementById('filterCategory').addEventListener('change', applyScopeFiltersAndRender);
  document.getElementById('filterPaymentMethod').addEventListener('change', applyScopeFiltersAndRender);
  document.getElementById('filterDateRange').addEventListener('change', applyScopeFiltersAndRender);

  // Scope page header buttons
  document.getElementById('scopeAddExpenseBtn').addEventListener('click', () => {
    openTransactionModal(null, state.currentScope);
  });
  document.getElementById('scopeExportBtn').addEventListener('click', () => {
    exportFilteredTransactionsCSV();
  });

  // Dashboard buttons
  document.getElementById('dashViewAllBtn').addEventListener('click', () => {
    if (state.currentScope) {
      switchTab(state.currentScope);
    } else {
      switchTab('office'); // Fallback default scope to view details
    }
  });
  document.getElementById('dashCategoryScopeSelect').addEventListener('change', () => {
    updateDashboardCharts();
  });

  // Analytics Export
  document.getElementById('btnExportAllCSV').addEventListener('click', () => {
    exportAllMasterCSV();
  });

  // Save budget handlers
  const saveBudgetBtns = document.querySelectorAll('.btn-save-budget');
  saveBudgetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scope = btn.getAttribute('data-scope');
      const inputVal = parseFloat(document.getElementById(`inputBudget-${scope}`).value);
      if (!isNaN(inputVal) && inputVal > 0) {
        state.budgets[scope] = inputVal;
        saveState();
        renderCurrentView();
        alert(`${scope.charAt(0).toUpperCase() + scope.slice(1)} monthly budget updated to ${formatCurrency(inputVal)}`);
      } else {
        alert('Please enter a valid budget amount.');
      }
    });
  });

  // File Upload Drag and Drop Simulation
  const dragArea = document.getElementById('receiptDragArea');
  const fileInput = document.getElementById('txReceiptFile');
  
  dragArea.addEventListener('click', () => fileInput.click());
  
  dragArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragArea.style.borderColor = 'hsla(var(--color-primary), 1)';
    dragArea.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
  });

  dragArea.addEventListener('dragleave', () => {
    dragArea.style.borderColor = '';
    dragArea.style.backgroundColor = '';
  });

  dragArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dragArea.style.borderColor = '';
    dragArea.style.backgroundColor = '';
    if (e.dataTransfer.files.length) {
      handleReceiptFileSelect(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleReceiptFileSelect(e.target.files[0]);
    }
  });

  // Remove uploaded file simulation
  document.getElementById('btnRemoveFile').addEventListener('click', (e) => {
    e.stopPropagation();
    resetUploadedFileState();
  });

  // Table header sorting setup
  const tableHeaders = document.querySelectorAll('#scopeTransactionsTable th.sortable');
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const sortColumn = th.getAttribute('data-sort');
      if (state.sorting.column === sortColumn) {
        state.sorting.direction = state.sorting.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sorting.column = sortColumn;
        state.sorting.direction = 'desc'; // Default new sort to descending
      }
      
      // Update indicator icons in DOM
      tableHeaders.forEach(header => {
        const icon = header.querySelector('i');
        if (header.getAttribute('data-sort') === sortColumn) {
          icon.setAttribute('data-lucide', state.sorting.direction === 'asc' ? 'chevron-up' : 'chevron-down');
        } else {
          icon.setAttribute('data-lucide', 'chevrons-up-down');
        }
      });
      lucide.createIcons();
      
      applyScopeFiltersAndRender();
    });
  });

  // Category manager settings listeners
  document.getElementById('manageCategoryScope').addEventListener('change', renderCategoriesSettingsList);
  document.getElementById('btnAddCategory').addEventListener('click', addNewCategoryFromSettings);
  document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addNewCategoryFromSettings();
    }
  });

  // Dismiss AI Scan Warning Banner
  document.getElementById('btnDismissScanBanner').addEventListener('click', () => {
    document.getElementById('aiScanWarningBanner').style.display = 'none';
  });

  // AI Chatbot listeners
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatWindow = document.getElementById('chatWindow');
  const btnChatSend = document.getElementById('btnChatSend');
  const chatUserInput = document.getElementById('chatUserInput');

  chatToggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
      chatUserInput.focus();
    }
  });

  chatCloseBtn.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });

  btnChatSend.addEventListener('click', handleChatbotMessageSubmit);
  chatUserInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleChatbotMessageSubmit();
    }
  });

  // Suggestions clicks
  const suggestionBtns = document.querySelectorAll('.btn-suggestion');
  suggestionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-query');
      chatUserInput.value = query;
      handleChatbotMessageSubmit();
    });
  });
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  // Force Chart redraws on theme toggle to match colors
  if (state.currentTab === 'dashboard') {
    setTimeout(updateDashboardCharts, 50);
  } else if (state.currentTab === 'analytics') {
    setTimeout(updateAnalyticsCharts, 50);
  }
}

function switchTab(tab) {
  state.currentTab = tab;
  
  // Set navbar highlights
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tab);
  });

  // Manage Scope setting
  if (tab === 'office' || tab === 'home' || tab === 'personal') {
    state.currentScope = tab;
  } else {
    // If returning to dashboard, clear currentScope filter so the sidebar doesn't conflict
    if (tab === 'dashboard') {
      // Keep state.currentScope intact but we know dashboard doesn't need single scope filters
    }
  }

  // Render correct view container
  renderCurrentView();
}

// --- RENDER ROUTING AND VIEWS ---
function renderCurrentView() {
  // Hide all view containers
  const views = document.querySelectorAll('.app-view');
  views.forEach(v => v.classList.remove('active'));

  // Update layout header info
  const pageTitle = document.getElementById('pageTitle');
  const pageDescription = document.getElementById('pageDescription');
  
  // Reset body custom theme colors if needed (for scope colors)
  document.body.className = '';

  if (state.currentTab === 'dashboard') {
    document.getElementById('view-dashboard').classList.add('active');
    pageTitle.textContent = "Dashboard Overview";
    pageDescription.textContent = "Track and analyze your business and household finances in real-time.";
    renderDashboard();
  } 
  else if (state.currentTab === 'office' || state.currentTab === 'home' || state.currentTab === 'personal') {
    document.getElementById('view-scope-expenses').classList.add('active');
    
    // Add CSS class indicator on body for scope coloring
    document.body.classList.add(`scope-view-${state.currentScope}`);
    
    const capitalizedScope = state.currentScope.charAt(0).toUpperCase() + state.currentScope.slice(1);
    pageTitle.textContent = `${capitalizedScope} Expense Ledger`;
    pageDescription.textContent = getScopeDescription(state.currentScope);
    
    renderScopeView();
  } 
  else if (state.currentTab === 'budgets') {
    document.getElementById('view-budgets').classList.add('active');
    pageTitle.textContent = "Budgets & Limits";
    pageDescription.textContent = "Configure spending targets to avoid overdrawing reserves.";
    renderBudgetsView();
  } 
  else if (state.currentTab === 'analytics') {
    document.getElementById('view-analytics').classList.add('active');
    pageTitle.textContent = "Analytics & Reports";
    pageDescription.textContent = "Visually audit spending distributions across all three database scopes.";
    renderAnalyticsView();
  } 
  else if (state.currentTab === 'settings') {
    document.getElementById('view-settings').classList.add('active');
    pageTitle.textContent = "System Settings";
    pageDescription.textContent = "Adjust localization parameters, currency formatting, and data databases.";
    renderCategoriesSettingsList();
  }

  // Re-render icons
  lucide.createIcons();
}

function getScopeDescription(scope) {
  if (scope === 'office') return "Track recurring software SaaS, office rents, client lunches, fuel, and marketing budgets.";
  if (scope === 'home') return "Track mortgage/rents, groceries, utility bills (electricity, water), and internet maintenance.";
  if (scope === 'personal') return "Track restaurant dining, shopping, personal hobbies, healthcare, and education certifications.";
  return "";
}

// --- CURRENCY FORMATTER HELPERS ---
function formatCurrency(amount) {
  return `${state.currency}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- DASHBOARD RENDERER ---
function renderDashboard() {
  // Calculate analytics
  const totals = calculateTotals();
  
  // Set top widgets
  document.getElementById('dashTotalBalance').textContent = formatCurrency(totals.remainingBudget);
  document.getElementById('dashOfficeSpent').textContent = formatCurrency(totals.officeSpent);
  document.getElementById('dashHomeSpent').textContent = formatCurrency(totals.homeSpent);
  document.getElementById('dashPersonalSpent').textContent = formatCurrency(totals.personalSpent);
  
  document.getElementById('dashOfficeBudgetInfo').textContent = `Budget: ${formatCurrency(state.budgets.office)}`;
  document.getElementById('dashHomeBudgetInfo').textContent = `Budget: ${formatCurrency(state.budgets.home)}`;
  document.getElementById('dashPersonalBudgetInfo').textContent = `Budget: ${formatCurrency(state.budgets.personal)}`;

  // Balance percent text
  const totalBudget = state.budgets.office + state.budgets.home + state.budgets.personal;
  let pct = 0;
  if (totalBudget > 0) {
    pct = Math.max(0, Math.round((totals.remainingBudget / totalBudget) * 100));
  }
  const trendEl = document.getElementById('dashBalancePercent');
  trendEl.textContent = `${pct}% remaining`;
  if (pct < 15) {
    trendEl.className = "kpi-trend negative";
  } else {
    trendEl.className = "kpi-trend positive";
  }

  // Draw dashboard tables
  const recentTableBody = document.getElementById('dashRecentTransactionsTableBody');
  recentTableBody.innerHTML = '';

  // Sort and grab latest 5 transactions
  const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  if (sortedTx.length === 0) {
    recentTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No transactions found. Add a transaction to see it here!</td></tr>`;
  } else {
    sortedTx.forEach(tx => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDateLabel(tx.date)}</td>
        <td><span class="badge-scope ${tx.type}">${tx.type}</span></td>
        <td class="bold">${tx.category}</td>
        <td class="text-secondary">${tx.description}</td>
        <td><span class="tag-badge">${tx.paymentMethod}</span></td>
        <td class="text-right bold text-accent">${formatCurrency(tx.amount)}</td>
      `;
      recentTableBody.appendChild(tr);
    });
  }

  // Draw charts
  updateDashboardCharts();
}

function calculateTotals() {
  let officeSpent = 0;
  let homeSpent = 0;
  let personalSpent = 0;
  
  state.transactions.forEach(tx => {
    const val = parseFloat(tx.amount) || 0;
    if (tx.type === 'office') officeSpent += val;
    if (tx.type === 'home') homeSpent += val;
    if (tx.type === 'personal') personalSpent += val;
  });

  const totalSpent = officeSpent + homeSpent + personalSpent;
  const totalBudget = (parseFloat(state.budgets.office) || 0) + (parseFloat(state.budgets.home) || 0) + (parseFloat(state.budgets.personal) || 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);

  return {
    officeSpent,
    homeSpent,
    personalSpent,
    totalSpent,
    remainingBudget
  };
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- CHARTS GENERATION ---

// Helper to check chart theme styles
function getChartColors() {
  const isDark = state.theme === 'dark';
  return {
    text: isDark ? '#9ca3af' : '#475569',
    grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    accent: '#8b5cf6',
    office: '#3b82f6',
    home: '#14b8a6',
    personal: '#f43f5e'
  };
}

function updateDashboardCharts() {
  const c = getChartColors();
  
  // 1. DYNAMIC CATEGORY PIE CHART
  const scopeSelect = document.getElementById('dashCategoryScopeSelect').value;
  let filteredTx = state.transactions;
  if (scopeSelect !== 'all') {
    filteredTx = state.transactions.filter(t => t.type === scopeSelect);
  }
  
  // Aggregate data by category
  const categoriesMap = {};
  filteredTx.forEach(t => {
    categoriesMap[t.category] = (categoriesMap[t.category] || 0) + parseFloat(t.amount);
  });
  
  const labels = Object.keys(categoriesMap);
  const data = Object.values(categoriesMap);
  
  // Beautiful palettes
  let chartPalette = [];
  if (scopeSelect === 'office') {
    chartPalette = labels.map((_, i) => `hsla(220, 95%, ${50 + (i * 5)}%, 0.8)`);
  } else if (scopeSelect === 'home') {
    chartPalette = labels.map((_, i) => `hsla(170, 85%, ${30 + (i * 5)}%, 0.8)`);
  } else if (scopeSelect === 'personal') {
    chartPalette = labels.map((_, i) => `hsla(340, 85%, ${50 + (i * 5)}%, 0.8)`);
  } else {
    // Mixed palettes
    chartPalette = labels.map((_, i) => `hsla(${(i * 45) % 360}, 80%, 60%, 0.8)`);
  }

  const categoryCtx = document.getElementById('categoryChart').getContext('2d');
  if (charts.category) charts.category.destroy();
  
  if (labels.length === 0) {
    // Render placeholder
    charts.category = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: [state.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  } else {
    charts.category = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: chartPalette,
          borderWidth: state.theme === 'dark' ? 2 : 1,
          borderColor: state.theme === 'dark' ? '#0f1524' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: c.text,
              font: { family: 'Outfit', size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${state.currency}${ctx.raw.toFixed(2)}`
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  // 2. MONTHLY TREND LINE CHART
  // Filter June 2026 data specifically
  const targetMonthTx = state.transactions.filter(t => t.date.startsWith('2026-06'));
  
  // Aggregate total expenses by day
  const daysMap = {};
  for (let i = 1; i <= 30; i++) {
    const dayStr = `2026-06-${String(i).padStart(2, '0')}`;
    daysMap[dayStr] = 0;
  }
  
  targetMonthTx.forEach(t => {
    if (daysMap[t.date] !== undefined) {
      daysMap[t.date] += parseFloat(t.amount);
    }
  });

  const trendLabels = Object.keys(daysMap).map(d => d.substring(8)); // Just days numbers
  
  // Compute Cumulative trend
  let cumulative = 0;
  const trendData = Object.keys(daysMap).sort().map(day => {
    cumulative += daysMap[day];
    return cumulative;
  });

  const trendCtx = document.getElementById('trendChart').getContext('2d');
  if (charts.trend) charts.trend.destroy();
  
  // Gradient fill
  const gradient = trendCtx.createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

  charts.trend = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Cumulative Expenditure',
        data: trendData,
        borderColor: c.accent,
        borderWidth: 3,
        pointBackgroundColor: c.accent,
        pointBorderColor: state.theme === 'dark' ? '#0b0f19' : '#ffffff',
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: gradient,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Cumulative: ${state.currency}${ctx.raw.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: c.text, font: { family: 'Outfit' } }
        },
        y: {
          grid: { color: c.grid },
          ticks: {
            color: c.text,
            font: { family: 'Outfit' },
            callback: (val) => `${state.currency}${val}`
          }
        }
      }
    }
  });
}

// --- SCOPE VIEW CRUD MANAGER ---
let filteredTransactions = [];

function renderScopeView() {
  // Populate filter category select options dynamically
  const filterCatSelect = document.getElementById('filterCategory');
  filterCatSelect.innerHTML = `<option value="all">All Categories</option>`;
  
  const scopeCategories = state.categories[state.currentScope] || [];
  scopeCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    opt.setAttribute('id', `opt-${cat.replace(/\s+/g, '-').toLowerCase()}`);
    filterCatSelect.appendChild(opt);
  });

  // Calculate scope values
  calculateScopeStats();

  // Reset inputs
  document.getElementById('filterSearch').value = '';
  document.getElementById('filterCategory').value = 'all';
  document.getElementById('filterPaymentMethod').value = 'all';
  document.getElementById('filterDateRange').value = 'all';

  // Apply filters and render list
  applyScopeFiltersAndRender();
}

function calculateScopeStats() {
  let spent = 0;
  state.transactions.forEach(t => {
    if (t.type === state.currentScope) {
      spent += parseFloat(t.amount) || 0;
    }
  });
  
  const budget = state.budgets[state.currentScope] || 0;
  const remaining = Math.max(0, budget - spent);
  
  document.getElementById('scopeTotalSpent').textContent = formatCurrency(spent);
  document.getElementById('scopeBudgetLimit').textContent = formatCurrency(budget);
  document.getElementById('scopeRemaining').textContent = formatCurrency(remaining);
  
  // Highlight alert colors
  const remainingWidget = document.getElementById('scopeRemaining');
  if (spent > budget) {
    remainingWidget.className = "stat-value text-danger";
    remainingWidget.textContent = `-${formatCurrency(spent - budget)}`;
  } else if (spent > budget * 0.8) {
    remainingWidget.className = "stat-value text-warning";
  } else {
    remainingWidget.className = "stat-value text-success";
  }
}

function applyScopeFiltersAndRender() {
  const searchQuery = document.getElementById('filterSearch').value.toLowerCase().trim();
  const categoryFilter = document.getElementById('filterCategory').value;
  const paymentFilter = document.getElementById('filterPaymentMethod').value;
  const dateRangeFilter = document.getElementById('filterDateRange').value;

  // 1. Filter by current scope
  let list = state.transactions.filter(tx => tx.type === state.currentScope);

  // 2. Filter by Category
  if (categoryFilter !== 'all') {
    list = list.filter(tx => tx.category === categoryFilter);
  }

  // 3. Filter by Payment Method
  if (paymentFilter !== 'all') {
    list = list.filter(tx => tx.paymentMethod === paymentFilter);
  }

  // 4. Filter by Date range
  if (dateRangeFilter !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    list = list.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);

      if (dateRangeFilter === 'today') {
        return txDate.getTime() === today.getTime();
      }
      if (dateRangeFilter === 'week') {
        const pastWeek = new Date();
        pastWeek.setDate(today.getDate() - 7);
        return txDate >= pastWeek;
      }
      if (dateRangeFilter === 'month') {
        // Current month (June 2026 for simulation)
        return tx.date.startsWith('2026-06');
      }
      return true;
    });
  }

  // 5. Filter by Search Query (description or tags)
  if (searchQuery) {
    list = list.filter(tx => {
      const descMatch = tx.description.toLowerCase().includes(searchQuery);
      const categoryMatch = tx.category.toLowerCase().includes(searchQuery);
      const tagMatch = tx.tags && tx.tags.some(tag => tag.toLowerCase().includes(searchQuery));
      return descMatch || categoryMatch || tagMatch;
    });
  }

  // 6. Apply Sorting
  const col = state.sorting.column;
  const dir = state.sorting.direction === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    let valA = a[col];
    let valB = b[col];

    if (col === 'amount') {
      return (parseFloat(valA) - parseFloat(valB)) * dir;
    }
    if (col === 'date') {
      return (new Date(valA) - new Date(valB)) * dir;
    }
    
    // String comparisons
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });

  filteredTransactions = list;

  // Render Table Rows
  const tableBody = document.getElementById('scopeTransactionsTableBody');
  tableBody.innerHTML = '';

  if (filteredTransactions.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:40px;">No transactions match your current filters. Click "Add Record" to create one.</td></tr>`;
  } else {
    filteredTransactions.forEach(tx => {
      const tr = document.createElement('tr');
      tr.setAttribute('id', `row-${tx.id}`);
      
      // Tags formatting
      let tagsHtml = '';
      if (tx.tags && tx.tags.length > 0) {
        tagsHtml = `<div class="tag-container">` + 
          tx.tags.map(t => `<span class="tag-badge">${t}</span>`).join('') + 
          `</div>`;
      }

      // Receipt icon indicator
      const hasReceipt = receiptStorage[tx.id] || tx.hasSimulatedReceipt;
      const receiptBtnHtml = hasReceipt 
        ? `<button class="btn-action edit-action" onclick="viewReceiptDetails('${tx.id}')" title="View Receipt"><i data-lucide="receipt"></i></button>`
        : `<button class="btn-action" style="opacity: 0.15;" disabled title="No receipt uploaded"><i data-lucide="receipt"></i></button>`;

      tr.innerHTML = `
        <td class="bold">${formatDateLabel(tx.date)}</td>
        <td><span class="badge-scope ${tx.type}">${tx.category}</span></td>
        <td class="text-secondary">${tx.description}</td>
        <td><span class="tag-badge">${tx.paymentMethod}</span></td>
        <td>${tagsHtml}</td>
        <td class="text-right bold text-accent">${formatCurrency(tx.amount)}</td>
        <td class="text-center">
          <div style="display:flex; justify-content:center; gap: 4px;">
            ${receiptBtnHtml}
            <button class="btn-action edit-action" onclick="editTransactionClick('${tx.id}')" title="Edit Record"><i data-lucide="edit-3"></i></button>
            <button class="btn-action delete-action" onclick="deleteTransactionClick('${tx.id}')" title="Delete Record"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Pagination and Info update
  document.getElementById('paginationInfo').textContent = `Showing ${filteredTransactions.length} of ${state.transactions.filter(t => t.type === state.currentScope).length} scope records`;
  
  // Refresh icons
  lucide.createIcons();
}

// --- CRUD MODAL CONTROLLER ---
let activeReceiptData = null; // Staged file data

function openTransactionModal(editTxId = null, preselectedScope = null) {
  const modal = document.getElementById('transactionModal');
  const form = document.getElementById('transactionForm');
  const title = document.getElementById('modalTitle');
  
  form.reset();
  resetUploadedFileState();
  document.getElementById('modalCurrencySymbol').textContent = state.currency;
  
  // Reset custom category group display
  document.getElementById('customCategoryInputGroup').style.display = 'none';
  document.getElementById('txCustomCategory').removeAttribute('required');
  document.getElementById('txCustomCategory').value = '';

  if (editTxId) {
    // Edit Mode
    title.textContent = "Edit Expense Details";
    const tx = state.transactions.find(t => t.id === editTxId);
    if (tx) {
      document.getElementById('txId').value = tx.id;
      
      // Select Radio Button
      const radios = document.querySelectorAll('input[name="txType"]');
      radios.forEach(r => {
        r.checked = r.value === tx.type;
      });

      populateModalCategories(tx.type);
      document.getElementById('txCategory').value = tx.category;
      document.getElementById('txDate').value = tx.date;
      document.getElementById('txAmount').value = tx.amount;
      document.getElementById('txPaymentMethod').value = tx.paymentMethod;
      document.getElementById('txDescription').value = tx.description;
      document.getElementById('txTags').value = tx.tags ? tx.tags.join(', ') : '';

      // If receipt database contains attachment
      if (receiptStorage[tx.id]) {
        showUploadedFileLabel(receiptStorage[tx.id].name);
        activeReceiptData = receiptStorage[tx.id];
      } else if (tx.hasSimulatedReceipt) {
        showUploadedFileLabel("attached_receipt.jpg");
        activeReceiptData = { name: "attached_receipt.jpg", data: "simulated" };
      }
    }
  } else {
    // Add Mode
    title.textContent = "Log New Expense";
    document.getElementById('txId').value = '';
    
    // Set default date to today or June 23, 2026 (simulation current local time)
    document.getElementById('txDate').value = "2026-06-23";
    
    // Match scope radio button
    const scopeToUse = preselectedScope || state.currentScope || 'office';
    const radios = document.querySelectorAll('input[name="txType"]');
    radios.forEach(r => {
      r.checked = r.value === scopeToUse;
    });

    populateModalCategories(scopeToUse);
  }

  modal.classList.add('active');
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.remove('active');
}

function populateModalCategories(scope) {
  const catSelect = document.getElementById('txCategory');
  catSelect.innerHTML = '';
  
  const scopeCats = state.categories[scope] || [];
  scopeCats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });

  // Append manual category add trigger
  const optCustom = document.createElement('option');
  optCustom.value = '__custom__';
  optCustom.textContent = '+ Add Custom Category...';
  catSelect.appendChild(optCustom);
}

function handleReceiptFileSelect(file) {
  if (file.size > 2097152) { // 2MB
    alert("File is too large! Maximum limit is 2MB.");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    activeReceiptData = {
      name: file.name,
      type: file.type,
      data: e.target.result
    };
    showUploadedFileLabel(file.name);
    // Trigger simulated AI Scan
    simulateAIScan(file);
  };
  reader.readAsDataURL(file);
}

function showUploadedFileLabel(filename) {
  const uploadArea = document.getElementById('receiptDragArea');
  const uploadedFileLabel = document.getElementById('uploadedFilename');
  const textEl = uploadedFileLabel.querySelector('.file-name-text');
  
  textEl.textContent = filename;
  uploadedFileLabel.style.display = 'flex';
  
  // Hide normal text content in drag area
  Array.from(uploadArea.children).forEach(child => {
    if (child !== uploadedFileLabel) child.style.display = 'none';
  });
}

function resetUploadedFileState() {
  activeReceiptData = null;
  document.getElementById('txReceiptFile').value = '';
  
  const uploadArea = document.getElementById('receiptDragArea');
  const uploadedFileLabel = document.getElementById('uploadedFilename');
  
  uploadedFileLabel.style.display = 'none';
  
  // Re-display normal drag text
  Array.from(uploadArea.children).forEach(child => {
    if (child !== uploadedFileLabel && child.id !== 'txReceiptFile') {
      child.style.display = '';
    }
  });
}

function handleTransactionFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('txId').value;
  const type = document.querySelector('input[name="txType"]:checked').value;
  const date = document.getElementById('txDate').value;
  const amount = parseFloat(document.getElementById('txAmount').value);
  let category = document.getElementById('txCategory').value;
  if (category === '__custom__') {
    const customInput = document.getElementById('txCustomCategory').value.trim();
    if (!customInput) {
      alert("Please enter a custom category name.");
      return;
    }
    category = customInput;
    if (!state.categories[type]) {
      state.categories[type] = [];
    }
    const exists = state.categories[type].some(c => c.toLowerCase() === customInput.toLowerCase());
    if (!exists) {
      state.categories[type].push(customInput);
    }
  }
  const paymentMethod = document.getElementById('txPaymentMethod').value;
  const description = document.getElementById('txDescription').value.trim();
  const tagsStr = document.getElementById('txTags').value;
  
  const tags = tagsStr 
    ? tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
    : [];

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount greater than zero.");
    return;
  }

  if (id) {
    // EDIT RECORD
    const idx = state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      const oldTx = state.transactions[idx];
      state.transactions[idx] = {
        ...oldTx,
        type,
        date,
        amount,
        category,
        paymentMethod,
        description,
        tags
      };

      // Save attachment
      if (activeReceiptData) {
        receiptStorage[id] = activeReceiptData;
        state.transactions[idx].hasSimulatedReceipt = true;
      } else {
        delete receiptStorage[id];
        delete state.transactions[idx].hasSimulatedReceipt;
      }
    }
  } else {
    // NEW RECORD
    const newId = `tx-${Date.now()}`;
    const newTx = {
      id: newId,
      type,
      date,
      amount,
      category,
      paymentMethod,
      description,
      tags
    };

    if (activeReceiptData) {
      receiptStorage[newId] = activeReceiptData;
      newTx.hasSimulatedReceipt = true;
    }

    state.transactions.push(newTx);
    
    // Check if new transaction exceeds the budget
    checkBudgetOverdraft(type);
  }

  saveState();
  closeTransactionModal();
  renderCurrentView();
}

function checkBudgetOverdraft(scope) {
  let spent = 0;
  state.transactions.forEach(t => {
    if (t.type === scope) spent += parseFloat(t.amount) || 0;
  });
  
  const limit = state.budgets[scope] || 0;
  if (spent > limit) {
    // Budget limit exceeded alert
    setTimeout(() => {
      alert(`⚠️ BUDGET EXCEEDED: Your spending in ${scope.toUpperCase()} scope (${formatCurrency(spent)}) has exceeded your set limit of ${formatCurrency(limit)}!`);
    }, 500);
  }
}

// --- DELETE CONTROLLER ---
let deletingTxId = null;

function deleteTransactionClick(id) {
  deletingTxId = id;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
  deletingTxId = null;
}

// Attach event confirmation is now handled in setupEventListeners()

// Exposed globally for onclick handlers in table html
window.editTransactionClick = (id) => {
  openTransactionModal(id);
};

window.deleteTransactionClick = (id) => {
  deleteTransactionClick(id);
};

// --- VIEW DETAILS / RECEIPT INVOICE MODAL ---
window.viewReceiptDetails = (id) => {
  const modal = document.getElementById('detailsModal');
  const container = document.getElementById('receiptInvoiceLayout');
  const tx = state.transactions.find(t => t.id === id);
  
  if (!tx) return;

  container.innerHTML = '';
  
  // Custom mock receipt details HTML
  const isImageReceipt = receiptStorage[id] && receiptStorage[id].data && receiptStorage[id].data.startsWith('data:image');
  let mediaHtml = '';
  
  if (isImageReceipt) {
    mediaHtml = `
      <div class="receipt-simulated-image-view">
        <img src="${receiptStorage[id].data}" alt="Uploaded Invoice" style="width:100%; height:100%; object-fit:contain;">
      </div>
    `;
  } else {
    // Generate simulated dynamic canvas receipt block! WOW effect
    mediaHtml = `
      <div class="receipt-simulated-image-view">
        <canvas id="simulatedReceiptCanvas"></canvas>
        <div class="receipt-overlay-info">Simulated Digital Transaction Ledger</div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="receipt-header-branding">
      <div class="receipt-brand-logo">
        <i data-lucide="wallet" style="vertical-align:middle; margin-right:4px;"></i>
        <span>J EXPENSE TRACK RECEIPT</span>
      </div>
      <div class="receipt-status-stamp">PAID</div>
    </div>
    
    <div class="receipt-meta-grid">
      <div class="receipt-meta-item">
        <span class="receipt-meta-label">Transaction ID</span>
        <span class="receipt-meta-value">${tx.id}</span>
      </div>
      <div class="receipt-meta-item">
        <span class="receipt-meta-label">Date</span>
        <span class="receipt-meta-value">${formatDateLabel(tx.date)}</span>
      </div>
      <div class="receipt-meta-item">
        <span class="receipt-meta-label">Payment Scope</span>
        <span class="receipt-meta-value"><span class="badge-scope ${tx.type}">${tx.type.toUpperCase()}</span></span>
      </div>
      <div class="receipt-meta-item">
        <span class="receipt-meta-label">Payment Method</span>
        <span class="receipt-meta-value">${tx.paymentMethod}</span>
      </div>
    </div>

    <div style="padding-bottom:10px;">
      <span class="receipt-meta-label">Merchant / Description</span>
      <h3 class="margin-top" style="font-weight:600; font-size:16px;">${tx.description}</h3>
      <span class="text-secondary" style="font-size:12px;">Category: ${tx.category}</span>
    </div>

    ${mediaHtml}

    <div class="receipt-amount-display">
      <span class="receipt-meta-label">Total Amount</span>
      <span class="receipt-amount-value">${formatCurrency(tx.amount)}</span>
    </div>
  `;

  modal.classList.add('active');
  lucide.createIcons();

  // Draw simulated pattern if no custom image was uploaded
  if (!isImageReceipt) {
    setTimeout(() => {
      const canvas = document.getElementById('simulatedReceiptCanvas');
      if (canvas) {
        drawSimulatedReceiptGraphic(canvas, tx);
      }
    }, 100);
  }
};

function closeDetailsModal() {
  document.getElementById('detailsModal').classList.remove('active');
}

function drawSimulatedReceiptGraphic(canvas, tx) {
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 180;
  
  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 400, 180);
  if (tx.type === 'office') {
    grad.addColorStop(0, '#101726'); grad.addColorStop(1, '#1b2a4a');
  } else if (tx.type === 'home') {
    grad.addColorStop(0, '#0c1619'); grad.addColorStop(1, '#113530');
  } else {
    grad.addColorStop(0, '#1c0f17'); grad.addColorStop(1, '#44142d');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 180);

  // Drawing simulated details pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 400; i += 20) {
    ctx.fillRect(i, 0, 2, 180);
  }

  // Draw digital lock/verified stamps
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '10px Courier New';
  ctx.fillText('J EXPENSE TRACK DIGITAL RECEIPT SYSTEM', 20, 30);
  ctx.fillText(`TRANS-HASH: ${btoa(tx.id).substring(0, 16).toUpperCase()}`, 20, 50);
  ctx.fillText(`MERCHANT: ${tx.description.substring(0, 20).toUpperCase()}`, 20, 70);
  ctx.fillText(`DATE-LOG: ${tx.date}`, 20, 90);
  ctx.fillText(`SETTLEMENT METHOD: SECURE-${tx.paymentMethod.toUpperCase()}`, 20, 110);
  
  // Security Seal circle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(320, 90, 40, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '9px Courier New';
  ctx.fillText('VERIFIED', 298, 93);
}

// --- BUDGETS VIEW RENDERER ---
function renderBudgetsView() {
  const totals = calculateTotals();
  const scopes = ['office', 'home', 'personal'];
  
  scopes.forEach(scope => {
    let spent = 0;
    if (scope === 'office') spent = totals.officeSpent;
    if (scope === 'home') spent = totals.homeSpent;
    if (scope === 'personal') spent = totals.personalSpent;

    const limit = state.budgets[scope] || 0;
    
    // Percentage
    let pct = 0;
    if (limit > 0) {
      pct = Math.round((spent / limit) * 100);
    }
    
    // Render progress numbers
    document.getElementById(`budgetPercent-${scope}`).textContent = `${pct}%`;
    document.getElementById(`budgetFraction-${scope}`).textContent = `${formatCurrency(spent)} / ${formatCurrency(limit)}`;
    
    // Render progress bar fill width
    const fillEl = document.getElementById(`budgetProgressFill-${scope}`);
    fillEl.style.width = `${Math.min(100, pct)}%`;
    
    // Budget Alert limits
    const badgeEl = document.getElementById(`budgetBadge-${scope}`);
    
    fillEl.className = `progress-bar-fill`; // Reset warning classes
    if (pct >= 100) {
      badgeEl.textContent = "CRITICAL";
      badgeEl.className = "budget-badge critical";
      fillEl.classList.add('critical');
    } else if (pct >= 80) {
      badgeEl.textContent = "WARNING";
      badgeEl.className = "budget-badge warning";
      fillEl.classList.add('warning');
    } else {
      badgeEl.textContent = "NORMAL";
      badgeEl.className = "budget-badge normal";
      
      // Add default scope coloring back
      if (scope === 'office') fillEl.style.backgroundColor = 'hsla(var(--color-office), 1)';
      if (scope === 'home') fillEl.style.backgroundColor = 'hsla(var(--color-home), 1)';
      if (scope === 'personal') fillEl.style.backgroundColor = 'hsla(var(--color-personal), 1)';
    }

    // Set configuration input fields value
    document.getElementById(`inputBudget-${scope}`).value = limit;
  });
}

// --- ANALYTICS VIEW RENDERER ---
function renderAnalyticsView() {
  const c = getChartColors();
  
  // 1. PAYMENT METHODS BREAKDOWN CHART
  const methodsMap = {};
  state.transactions.forEach(t => {
    methodsMap[t.paymentMethod] = (methodsMap[t.paymentMethod] || 0) + parseFloat(t.amount);
  });
  
  const paymentCtx = document.getElementById('paymentMethodsChart').getContext('2d');
  if (charts.payment) charts.payment.destroy();
  
  charts.payment = new Chart(paymentCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(methodsMap),
      datasets: [{
        label: 'Spent amount',
        data: Object.values(methodsMap),
        backgroundColor: [
          'rgba(99, 102, 241, 0.75)',  // Card
          'rgba(20, 184, 166, 0.75)',  // Cash
          'rgba(244, 63, 94, 0.75)',   // UPI
          'rgba(14, 165, 233, 0.75)'   // Bank Transfer
        ],
        borderWidth: 1,
        borderColor: varToHex('--border-color')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Spent: ${state.currency}${ctx.raw.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: c.text, font: { family: 'Outfit' } }
        },
        y: {
          grid: { color: c.grid },
          ticks: {
            color: c.text,
            font: { family: 'Outfit' },
            callback: (val) => `${state.currency}${val}`
          }
        }
      }
    }
  });

  // 2. SCOPE SPENT COMPARISON
  const totals = calculateTotals();
  
  const compareCtx = document.getElementById('scopeCompareChart').getContext('2d');
  if (charts.compare) charts.compare.destroy();
  
  charts.compare = new Chart(compareCtx, {
    type: 'pie',
    data: {
      labels: ['Office', 'Home', 'Personal'],
      datasets: [{
        data: [totals.officeSpent, totals.homeSpent, totals.personalSpent],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(244, 63, 94, 0.8)'
        ],
        borderWidth: state.theme === 'dark' ? 2 : 1,
        borderColor: state.theme === 'dark' ? '#0f1524' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: c.text,
            font: { family: 'Outfit' }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Spent: ${state.currency}${ctx.raw.toFixed(2)}`
          }
        }
      }
    }
  });
}

// CSS Helper to fetch Hex color values for borders
function varToHex(cssVar) {
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
}

// --- CSV DATA EXPORTERS ---

// Helper to escape CSV cell strings
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return str;
}

// Export single scope filtered records
function exportFilteredTransactionsCSV() {
  if (filteredTransactions.length === 0) {
    alert("No records found in current filters to export.");
    return;
  }

  const csvRows = [];
  // Headers
  csvRows.push(['Transaction ID', 'Scope', 'Category', 'Description', 'Payment Method', 'Tags', 'Date', `Amount (${state.currency})`].join(','));
  
  filteredTransactions.forEach(tx => {
    const row = [
      escapeCsvCell(tx.id),
      escapeCsvCell(tx.type),
      escapeCsvCell(tx.category),
      escapeCsvCell(tx.description),
      escapeCsvCell(tx.paymentMethod),
      escapeCsvCell(tx.tags ? tx.tags.join(';') : ''),
      escapeCsvCell(tx.date),
      escapeCsvCell(tx.amount)
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `J_Expense_Track_${state.currentScope}_Expenses_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export all transactions across all databases
function exportAllMasterCSV() {
  if (state.transactions.length === 0) {
    alert("No transactions records exist in local storage databases.");
    return;
  }

  const csvRows = [];
  csvRows.push(['Transaction ID', 'Scope', 'Category', 'Description', 'Payment Method', 'Tags', 'Date', `Amount (${state.currency})`].join(','));
  
  state.transactions.forEach(tx => {
    const row = [
      escapeCsvCell(tx.id),
      escapeCsvCell(tx.type),
      escapeCsvCell(tx.category),
      escapeCsvCell(tx.description),
      escapeCsvCell(tx.paymentMethod),
      escapeCsvCell(tx.tags ? tx.tags.join(';') : ''),
      escapeCsvCell(tx.date),
      escapeCsvCell(tx.amount)
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `J_Expense_Track_Master_Reports_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- CATEGORIES SETTINGS MANAGER ---
function renderCategoriesSettingsList() {
  const scope = document.getElementById('manageCategoryScope').value;
  const listEl = document.getElementById('manageCategoriesList');
  if (!listEl) return;

  listEl.innerHTML = '';
  
  const cats = state.categories[scope] || [];
  if (cats.length === 0) {
    listEl.innerHTML = `<li class="text-muted text-center" style="font-size: 12px; padding: 10px;">No categories configured.</li>`;
    return;
  }

  cats.forEach(cat => {
    const li = document.createElement('li');
    li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 13px;';
    
    li.innerHTML = `
      <span class="bold">${cat}</span>
      <button class="btn-action delete-action" onclick="deleteCategoryClick('${scope}', '${cat.replace(/'/g, "\\'")}')" title="Delete Category" style="width: 24px; height: 24px;">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;
    listEl.appendChild(li);
  });
  
  lucide.createIcons();
}

function addNewCategoryFromSettings() {
  const scope = document.getElementById('manageCategoryScope').value;
  const inputEl = document.getElementById('newCategoryInput');
  const catName = inputEl.value.trim();

  if (!catName) {
    alert('Please enter a category name.');
    return;
  }

  if (!state.categories[scope]) {
    state.categories[scope] = [];
  }

  // Check duplicates
  const exists = state.categories[scope].some(c => c.toLowerCase() === catName.toLowerCase());
  if (exists) {
    alert('This category already exists in this scope.');
    return;
  }

  state.categories[scope].push(catName);
  inputEl.value = '';
  saveState();
  renderCategoriesSettingsList();
}

window.deleteCategoryClick = (scope, category) => {
  if (confirm(`Are you sure you want to remove the category "${category}" from ${scope} scope?`)) {
    // Check if transactions are using this category
    const isUsed = state.transactions.some(tx => tx.type === scope && tx.category === category);
    if (isUsed) {
      if (!confirm('Warning: Some existing transactions are using this category. Deleting it will keep those transactions, but they won\'t have this category option selected if edited. Do you want to proceed?')) {
        return;
      }
    }
    
    state.categories[scope] = state.categories[scope].filter(c => c !== category);
    saveState();
    renderCategoriesSettingsList();
  }
};

// --- AI BILL SCANNER SIMULATOR ---
function simulateAIScan(file) {
  const overlay = document.getElementById('modalScanningOverlay');
  const banner = document.getElementById('aiScanWarningBanner');
  
  if (!overlay || !banner) return;
  
  // Show scanning overlay
  overlay.style.display = 'flex';
  banner.style.display = 'none';

  setTimeout(() => {
    // Hide scanning overlay
    overlay.style.display = 'none';
    
    // Parse heuristic data
    const filename = file.name.toLowerCase();
    let scope = 'office';
    let category = 'Miscellaneous';
    let amount = 1250.00;
    let description = 'Simulated OCR Transaction';
    let paymentMethod = 'Card';
    let tags = ['scanned'];

    // Heuristics scanning rules
    if (filename.includes('aws') || filename.includes('hosting') || filename.includes('server')) {
      scope = 'office';
      category = 'SaaS & Software';
      amount = 14500.00;
      description = 'AWS Cloud Web Hosting Bill';
      paymentMethod = 'Card';
      tags = ['infrastructure', 'cloud', 'hosting'];
    } else if (filename.includes('slack')) {
      scope = 'office';
      category = 'SaaS & Software';
      amount = 4200.00;
      description = 'Slack Technologies subscription';
      paymentMethod = 'Card';
      tags = ['communication', 'team'];
    } else if (filename.includes('google')) {
      scope = 'office';
      category = 'SaaS & Software';
      amount = 2500.00;
      description = 'Google Cloud Workspace Suite';
      paymentMethod = 'UPI';
      tags = ['software', 'utilities'];
    } else if (filename.includes('rent')) {
      scope = 'home';
      category = 'Rent/Mortgage';
      amount = 18000.00;
      description = 'Monthly Apartment Rent Payment';
      paymentMethod = 'Bank Transfer';
      tags = ['fixed', 'essential'];
    } else if (filename.includes('electricity') || filename.includes('bescom') || filename.includes('power')) {
      scope = 'home';
      category = 'Electricity & Gas';
      amount = 3200.00;
      description = 'BESCOM Power Electricity Bill';
      paymentMethod = 'Bank Transfer';
      tags = ['utility', 'fixed'];
    } else if (filename.includes('grocery') || filename.includes('groceries') || filename.includes('mart') || filename.includes('food')) {
      if (filename.includes('swiggy') || filename.includes('zomato') || filename.includes('restaurant') || filename.includes('cafe')) {
        scope = 'personal';
        category = 'Dining Out';
        amount = 850.00;
        description = 'Swiggy Food Restaurant Delivery';
        paymentMethod = 'UPI';
        tags = ['food', 'dining'];
      } else {
        scope = 'home';
        category = 'Groceries';
        amount = 4850.00;
        description = 'Household Groceries Purchase Mart';
        paymentMethod = 'Card';
        tags = ['essential', 'household'];
      }
    } else if (filename.includes('uber') || filename.includes('ola') || filename.includes('cab') || filename.includes('taxi')) {
      scope = 'personal';
      category = 'Transport';
      amount = 620.00;
      description = 'Uber City Travel Cab Ride';
      paymentMethod = 'Card';
      tags = ['travel', 'cab'];
    } else if (filename.includes('nike') || filename.includes('shoes') || filename.includes('shopping')) {
      scope = 'personal';
      category = 'Shopping';
      amount = 5500.00;
      description = 'Nike Lifestyle Shopping Bill';
      paymentMethod = 'Card';
      tags = ['shopping', 'lifestyle'];
    } else {
      // Extract first numbers from file name if any
      const matchNum = filename.match(/\d+/);
      if (matchNum) {
        amount = parseFloat(matchNum[0]);
      }
      description = file.name.split('.')[0].replace(/[-_]/g, ' ');
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }

    // Populate modal inputs
    const radios = document.querySelectorAll('input[name="txType"]');
    radios.forEach(r => {
      r.checked = r.value === scope;
    });

    populateModalCategories(scope);
    
    // Check if category is valid, if not add it dynamically
    const categoryExists = Array.from(document.getElementById('txCategory').options).some(o => o.value === category);
    if (!categoryExists) {
      if (!state.categories[scope]) state.categories[scope] = [];
      state.categories[scope].push(category);
      populateModalCategories(scope);
    }

    document.getElementById('txCategory').value = category;
    document.getElementById('txDate').value = new Date().toISOString().slice(0,10);
    document.getElementById('txAmount').value = amount;
    document.getElementById('txDescription').value = description;
    document.getElementById('txTags').value = tags.join(', ');

    // Show AI warning banner
    banner.style.display = 'flex';
  }, 1500);
}

// --- AI CHATBOT SYSTEM LOGIC ---
function handleChatbotMessageSubmit() {
  const inputEl = document.getElementById('chatUserInput');
  const query = inputEl.value.trim();
  if (!query) return;

  inputEl.value = '';
  
  // Append User message
  appendChatMessage(query, 'user');
  
  // Append Typing Indicator
  const container = document.getElementById('chatMessagesContainer');
  const indicator = document.createElement('div');
  indicator.className = 'chat-message bot';
  indicator.id = 'chatTypingIndicator';
  indicator.innerHTML = `
    <div class="chat-message-bubble typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;

  // Simulate AI Thinking Delay
  setTimeout(() => {
    // Remove Typing Indicator
    const typingIndicator = document.getElementById('chatTypingIndicator');
    if (typingIndicator) typingIndicator.remove();
    
    // Generate AI response
    const botResponse = generateAIResponse(query);
    appendChatMessage(botResponse, 'bot');
  }, 1000);
}

function appendChatMessage(text, sender) {
  const container = document.getElementById('chatMessagesContainer');
  const message = document.createElement('div');
  message.className = `chat-message ${sender}`;
  message.innerHTML = `<div class="chat-message-bubble">${text}</div>`;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function generateAIResponse(query) {
  const q = query.toLowerCase().trim();
  
  // Calculate current figures dynamically
  const totals = calculateTotals();
  
  // 1. GREETINGS
  if (q === 'hello' || q === 'hi' || q === 'hey' || q.includes('help')) {
    return `Hello! I am <strong>J Bot AI</strong>, your personal financial assistant. 🤖📈
    <br><br>
    I can answer queries about your expense records, calculate spending pools, and track budget targets in real-time. Try asking me:
    <br>• <em>"How much did I spend in office?"</em>
    <br>• <em>"Show me my monthly summary"</em>
    <br>• <em>"What is my biggest expense?"</em>
    <br>• <em>"Search for AWS"</em>`;
  }
  
  // 2. CONSOLIDATED SUMMARY
  if (q.includes('summary') || q.includes('all spent') || q.includes('total spent') || q.includes('everything') || q.includes('overall')) {
    return `📊 <strong>Expense Summary (June 2026):</strong>
    <br><br>
    • 🏢 <strong>Office:</strong> ${formatCurrency(totals.officeSpent)} spent / Budget: ${formatCurrency(state.budgets.office)}
    <br>• 🏡 <strong>Home:</strong> ${formatCurrency(totals.homeSpent)} spent / Budget: ${formatCurrency(state.budgets.home)}
    <br>• 🎒 <strong>Personal:</strong> ${formatCurrency(totals.personalSpent)} spent / Budget: ${formatCurrency(state.budgets.personal)}
    <br><br>
    • 💳 <strong>Total Consolidated Spend:</strong> ${formatCurrency(totals.totalSpent)}
    <br>• 💰 <strong>Remaining Budget Pool:</strong> ${formatCurrency(totals.remainingBudget)}`;
  }
  
  // 3. SCOPE SPECIFIC QUERIES
  if (q.includes('office')) {
    const pct = state.budgets.office > 0 ? Math.round((totals.officeSpent / state.budgets.office) * 100) : 0;
    return `🏢 <strong>Office Operations Spent:</strong>
    <br>You have spent <strong>${formatCurrency(totals.officeSpent)}</strong> out of your ${formatCurrency(state.budgets.office)} monthly budget limit.
    <br>This consumes <strong>${pct}%</strong> of your configured limit.`;
  }
  
  if (q.includes('home') || q.includes('house') || q.includes('family')) {
    const pct = state.budgets.home > 0 ? Math.round((totals.homeSpent / state.budgets.home) * 100) : 0;
    return `🏡 <strong>Home & Household Spent:</strong>
    <br>You have spent <strong>${formatCurrency(totals.homeSpent)}</strong> out of your ${formatCurrency(state.budgets.home)} monthly budget limit.
    <br>This consumes <strong>${pct}%</strong> of your configured limit.`;
  }
  
  if (q.includes('personal') || q.includes('leisure') || q.includes('my spend') || q.includes('private')) {
    const pct = state.budgets.personal > 0 ? Math.round((totals.personalSpent / state.budgets.personal) * 100) : 0;
    return `🎒 <strong>Personal & Leisure Spent:</strong>
    <br>You have spent <strong>${formatCurrency(totals.personalSpent)}</strong> out of your ${formatCurrency(state.budgets.personal)} monthly budget limit.
    <br>This consumes <strong>${pct}%</strong> of your configured limit.`;
  }
  
  // 4. BUDGET OVERDRAFT CHECKS
  if (q.includes('budget') || q.includes('over budget') || q.includes('limit') || q.includes('warning') || q.includes('alert')) {
    let response = `🎯 <strong>Budget Allocation Status:</strong><br><br>`;
    let over = [];
    
    const scopes = ['office', 'home', 'personal'];
    scopes.forEach(s => {
      let spent = s === 'office' ? totals.officeSpent : (s === 'home' ? totals.homeSpent : totals.personalSpent);
      let limit = state.budgets[s];
      let pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      
      let statusText = 'Normal';
      if (pct >= 100) {
        statusText = '🚨 CRITICAL';
        over.push(s);
      } else if (pct >= 80) {
        statusText = '⚠️ WARNING';
        over.push(s);
      }
      
      response += `• ${s.toUpperCase()}: ${pct}% consumed (${formatCurrency(spent)} / ${formatCurrency(limit)}) - <strong>${statusText}</strong><br>`;
    });
    
    if (over.length > 0) {
      response += `<br>⚠️ You have approached or exceeded budget limits in: <strong>${over.join(', ').toUpperCase()}</strong>. Recommend checking expenditures.`;
    } else {
      response += `<br>✅ All your scopes are within limits! Good job keeping within budgets.`;
    }
    return response;
  }
  
  // 5. MAX TRANSACTION
  if (q.includes('biggest') || q.includes('max') || q.includes('largest') || q.includes('highest') || q.includes('maximum')) {
    if (state.transactions.length === 0) return `You don't have any logged transactions in the database.`;
    
    const maxTx = [...state.transactions].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0];
    return `💰 <strong>Highest Expense Record:</strong>
    <br><br>
    • <strong>Amount:</strong> ${formatCurrency(maxTx.amount)}
    <br>• <strong>Merchant:</strong> ${maxTx.description}
    <br>• <strong>Scope:</strong> <span class="badge-scope ${maxTx.type}">${maxTx.type.toUpperCase()}</span>
    <br>• <strong>Category:</strong> ${maxTx.category}
    <br>• <strong>Date:</strong> ${formatDateLabel(maxTx.date)}
    <br>• <strong>Payment Method:</strong> ${maxTx.paymentMethod}`;
  }

  // 6. PAYMENT METHOD SUMMARY
  if (q.includes('payment') || q.includes('method') || q.includes('card') || q.includes('cash') || q.includes('upi') || q.includes('transfer')) {
    const methodsMap = {};
    state.transactions.forEach(t => {
      methodsMap[t.paymentMethod] = (methodsMap[t.paymentMethod] || 0) + parseFloat(t.amount);
    });
    
    let response = `💳 <strong>Payment Method Distribution:</strong><br><br>`;
    Object.keys(methodsMap).forEach(k => {
      response += `• <strong>${k}:</strong> ${formatCurrency(methodsMap[k])}<br>`;
    });
    return response;
  }

  // 7. TRANSACTION SEARCH
  if (q.includes('search') || q.includes('find') || q.includes('show') || q.split(' ').length === 1) {
    const words = q.split(' ');
    const keyword = words.includes('search') || words.includes('find') || words.includes('show')
      ? words[words.length - 1]
      : q;
      
    const matches = state.transactions.filter(tx => 
      tx.description.toLowerCase().includes(keyword) || 
      tx.category.toLowerCase().includes(keyword) ||
      (tx.tags && tx.tags.some(t => t.toLowerCase().includes(keyword)))
    );
    
    if (matches.length > 0) {
      let response = `🔍 Found <strong>${matches.length}</strong> matching transaction records for "${keyword}":<br><br>`;
      matches.slice(0, 5).forEach(m => {
        response += `• [${formatDateLabel(m.date)}] ${m.description} - <strong>${formatCurrency(m.amount)}</strong> (${m.type})<br>`;
      });
      if (matches.length > 5) {
        response += `<br><em>(Showing first 5 entries. Use the Scope Ledgers to filter details)</em>`;
      }
      return response;
    }
  }

  // 8. FALLBACK DEFAULT
  return `🤖 <strong>J Bot AI Response:</strong>
  <br><br>
  I analyzed your request: <em>"${query}"</em>. I couldn't locate specific metrics. You can ask me to:
  <br>• <strong>Calculate totals:</strong> <em>"monthly summary"</em>
  <br>• <strong>Check scopes:</strong> <em>"spent in office"</em> or <em>"home expenses"</em>
  <br>• <strong>Audit limits:</strong> <em>"am I over budget?"</em>
  <br>• <strong>Find records:</strong> <em>"biggest expense"</em> or <em>"search Swiggy"</em>`;
}

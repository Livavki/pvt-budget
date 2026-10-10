/**
 * SakuraBudget 2027 — Japan Working Holiday Visa Budget Calculator
 * Currency: Strictly EUR (€)
 * 9-Month Advance Planning: October 2026 → June 2027
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Configuration & Constants
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'sakurabudget_whv_eur_9m_v1';
  const SYNC_CONFIG_KEY = 'sakurabudget_gist_sync_config_v1';
  const GIST_FILENAME = 'sakurabudget.json';

  // The 9 consecutive months from October 2026 to June 2027 (Departure)
  const MONTH_KEYS = [
    '2026-10', '2026-11', '2026-12',
    '2027-01', '2027-02', '2027-03',
    '2027-04', '2027-05', '2027-06'
  ];

  const MONTH_NAMES = {
    '2026-10': { short: "Oct '26", full: "October 2026", num: 1 },
    '2026-11': { short: "Nov '26", full: "November 2026", num: 2 },
    '2026-12': { short: "Dec '26", full: "December 2026", num: 3 },
    '2027-01': { short: "Jan '27", full: "January 2027", num: 4 },
    '2027-02': { short: "Feb '27", full: "February 2027", num: 5 },
    '2027-03': { short: "Mar '27", full: "March 2027", num: 6 },
    '2027-04': { short: "Apr '27", full: "April 2027", num: 7 },
    '2027-05': { short: "May '27", full: "May 2027", num: 8 },
    '2027-06': { short: "Jun '27 🎯", full: "June 2027 (Departure)", num: 9, isDeparture: true }
  };


  const CATEGORY_META = {
    // Expense categories
    housing: { name: 'Housing & Rent', icon: '🏠', color: '#6366f1' },
    food: { name: 'Food & Groceries', icon: '🍙', color: '#ff6b8b' },
    shopping: { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    transport: { name: 'Transport & Commute', icon: '🚃', color: '#00f2fe' },
    utilities: { name: 'Bills, Phone & Net', icon: '📱', color: '#38bdf8' },
    health: { name: 'Health & Medical', icon: '💊', color: '#14b8a6' },
    leisure: { name: 'Leisure & Social', icon: '🍶', color: '#f59e0b' },
    flight: { name: 'Flight to Japan', icon: '✈️', color: '#0ea5e9' },
    insurance: { name: '1-Year WHV Insurance', icon: '🏥', color: '#10b981' },
    visa: { name: 'Visa & Admin', icon: '🛂', color: '#f43f5e' },
    gear: { name: 'Travel Gear & Luggage', icon: '🧳', color: '#8b5cf6' },
    other_expense: { name: 'Other Expenses', icon: '📦', color: '#94a3b8' },

    // Income categories
    salary: { name: 'Main Job / Salary', icon: '💼', color: '#10b981' },
    freelance: { name: 'Freelance & Tech', icon: '💻', color: '#06b6d4' },
    tutoring: { name: 'Tutoring & Side Hustle', icon: '☕', color: '#f59e0b' },
    gift: { name: 'Savings Gift / Bonus', icon: '🎁', color: '#ec4899' },
    other_income: { name: 'Other Income', icon: '💵', color: '#84cc16' }
  };

  const DEFAULT_EXCLUDED_CATEGORIES = ['flight', 'insurance', 'visa', 'gear', 'other_expense'];

  const DEFAULT_CATEGORY_BUDGETS = {
    housing: 850.00,
    food: 420.00,
    transport: 120.00,
    utilities: 160.00,
    leisure: 250.00,
    health: 50.00,
    shopping: 100.00,
    flight: 0,
    insurance: 0,
    visa: 0,
    gear: 0,
    other_expense: 0
  };

  // Helper to generate pre-populated items across the 9 months
  function createDefaultSchedule() {
    const items = [];

    MONTH_KEYS.forEach(m => {
      // Regular monthly recurring incomes
      items.push({ id: `inc_sal_${m}`, month: m, type: 'income', category: 'salary', title: 'Main Employment (Net Salary)', amount: 1800.00, isRecurring: true, recurringKey: 'rec_salary' });
      items.push({ id: `inc_free_${m}`, month: m, type: 'income', category: 'freelance', title: 'Freelance / Side Projects', amount: 350.00, isRecurring: true, recurringKey: 'rec_freelance' });
      items.push({ id: `inc_tut_${m}`, month: m, type: 'income', category: 'tutoring', title: 'Language Tutoring', amount: 50.00, isRecurring: true, recurringKey: 'rec_tutoring' });

      // Regular monthly expenses (Fixed recurring)
      items.push({ id: `exp_rent_${m}`, month: m, type: 'expense', category: 'housing', title: 'Rent & Charges', amount: 850.00, isRecurring: true, recurringKey: 'rec_rent' });
      items.push({ id: `exp_food_${m}`, month: m, type: 'expense', category: 'food', title: 'Groceries & Food', amount: 420.00, isRecurring: true, recurringKey: 'rec_food' });
      items.push({ id: `exp_trans_${m}`, month: m, type: 'expense', category: 'transport', title: 'Transit Pass', amount: 110.00, isRecurring: true, recurringKey: 'rec_transport' });
      items.push({ id: `exp_util_${m}`, month: m, type: 'expense', category: 'utilities', title: 'Phone, Fiber & Electricity', amount: 160.00, isRecurring: true, recurringKey: 'rec_utilities' });
      items.push({ id: `exp_leis_${m}`, month: m, type: 'expense', category: 'leisure', title: 'Dining Out, Social & Coffee', amount: 250.00, isRecurring: true, recurringKey: 'rec_leisure' });
    });

    // Advance specific expenses (One-offs):
    // December 2026: Extra holiday season expenses
    items.push({ id: 'exp_xmas_2026-12', month: '2026-12', type: 'expense', category: 'leisure', title: 'Holiday Gatherings & Gifts', amount: 180.00, isRecurring: false });

    // April 2027: Book flight to Tokyo
    items.push({ id: 'exp_flight_2027-04', month: '2027-04', type: 'expense', category: 'flight', title: 'Round-trip Flight to Tokyo', amount: 850.00, isRecurring: false });

    // May 2027: WHV Insurance
    items.push({ id: 'exp_ins_2027-05', month: '2027-05', type: 'expense', category: 'insurance', title: '1-Year WHV Health Insurance (Chapka)', amount: 450.00, isRecurring: false });

    // June 2027: Departure luggage & travel accessories
    items.push({ id: 'exp_gear_2027-06', month: '2027-06', type: 'expense', category: 'gear', title: 'Suitcase, Backpack & Power Converters', amount: 200.00, isRecurring: false });

    return items;
  }

  const DEFAULT_STATE = {
    settings: {
      savingsGoal: 6500.00, // €6,500
      initialSaved: 2800.00, // Initial saved capital on October 1, 2026
      activeMonth: '2026-10', // Default active month: October 2026
      theme: 'dark',
      excludedCategories: [...DEFAULT_EXCLUDED_CATEGORIES]
    },
    categoryBudgets: { ...DEFAULT_CATEGORY_BUDGETS },
    items: createDefaultSchedule()
  };

  // --------------------------------------------------------------------------
  // Application State
  // --------------------------------------------------------------------------
  let appState = loadState();

  // --------------------------------------------------------------------------
  // DOM References
  // --------------------------------------------------------------------------
  const DOM = {
    // Header
    countdownDisplay: document.getElementById('countdownDisplay'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    presetBtn: document.getElementById('presetBtn'),
    syncModalBtn: document.getElementById('syncModalBtn'),
    syncStatusDot: document.getElementById('syncStatusDot'),
    syncStatusLabel: document.getElementById('syncStatusLabel'),

    // Hero Stats
    displayGoalAmount: document.getElementById('displayGoalAmount'),
    displayCurrentSaved: document.getElementById('displayCurrentSaved'),
    savingsProgressPercent: document.getElementById('savingsProgressPercent'),
    savingsRemainingAmount: document.getElementById('savingsRemainingAmount'),
    displayRequiredMonthly: document.getElementById('displayRequiredMonthly'),
    displayActualMonthlyNet: document.getElementById('displayActualMonthlyNet'),
    displayTotalProjectedAtJune: document.getElementById('displayTotalProjectedAtJune'),
    paceDeltaBanner: document.getElementById('paceDeltaBanner'),
    paceDeltaIcon: document.getElementById('paceDeltaIcon'),
    paceDeltaText: document.getElementById('paceDeltaText'),
    paceStatusPill: document.getElementById('paceStatusPill'),
    goalProgressBar: document.getElementById('goalProgressBar'),

    // Quick Actions
    editGoalBtn: document.getElementById('editGoalBtn'),
    quickAddSavedBtn: document.getElementById('quickAddSavedBtn'),
    heroCategoryBudgetsBtn: document.getElementById('heroCategoryBudgetsBtn'),
    addAdvanceItemBtn: document.getElementById('addAdvanceItemBtn'),

    // Dynamic Alerts
    alertsContainer: document.getElementById('alertsContainer'),

    // 9-Month Strip Navigator
    monthsStripContainer: document.getElementById('monthsStripContainer'),
    activeMonthIndicator: document.getElementById('activeMonthIndicator'),

    // Selected Month Metrics
    lblSelectedMonthIncome: document.getElementById('lblSelectedMonthIncome'),
    metricSelectedIncome: document.getElementById('metricSelectedIncome'),
    metricIncomeCount: document.getElementById('metricIncomeCount'),
    lblSelectedMonthExpense: document.getElementById('lblSelectedMonthExpense'),
    metricSelectedExpense: document.getElementById('metricSelectedExpense'),
    metricBudgetVsSpend: document.getElementById('metricBudgetVsSpend'),
    lblSelectedMonthNet: document.getElementById('lblSelectedMonthNet'),
    metricSelectedNet: document.getElementById('metricSelectedNet'),
    metricSelectedNetStatus: document.getElementById('metricSelectedNetStatus'),
    lblCumulativeAtMonth: document.getElementById('lblCumulativeAtMonth'),
    metricCumulativeAtMonth: document.getElementById('metricCumulativeAtMonth'),
    metricCumulativeProgress: document.getElementById('metricCumulativeProgress'),

    // Charts
    trajectoryChartContainer: document.getElementById('trajectoryChartContainer'),
    chartTooltip: document.getElementById('chartTooltip'),
    chartFooterNote: document.getElementById('chartFooterNote'),
    donutScopeSelect: document.getElementById('donutScopeSelect'),
    lblDonutMonthPre: document.getElementById('lblDonutMonthPre'),
    lblDonutTitle: document.getElementById('lblDonutTitle'),
    donutSvgContainer: document.getElementById('donutSvgContainer'),
    donutLegendContainer: document.getElementById('donutLegendContainer'),

    // Tables & Tabs
    tabExpenses: document.getElementById('tabExpenses'),
    tabIncome: document.getElementById('tabIncome'),
    tabRecurring: document.getElementById('tabRecurring'),
    tabRoadmap: document.getElementById('tabRoadmap'),
    tabBudgets: document.getElementById('tabBudgets'),
    panelExpenses: document.getElementById('panelExpenses'),
    panelIncome: document.getElementById('panelIncome'),
    panelRecurring: document.getElementById('panelRecurring'),
    panelRoadmap: document.getElementById('panelRoadmap'),
    panelBudgets: document.getElementById('panelBudgets'),
    expensesCount: document.getElementById('expensesCount'),
    incomeCount: document.getElementById('incomeCount'),
    recurringCount: document.getElementById('recurringCount'),
    expensesTableBody: document.getElementById('expensesTableBody'),
    expensesTableFoot: document.getElementById('expensesTableFoot'),
    incomeTableBody: document.getElementById('incomeTableBody'),
    incomeTableFoot: document.getElementById('incomeTableFoot'),
    recurringTableBody: document.getElementById('recurringTableBody'),
    roadmapTableBody: document.getElementById('roadmapTableBody'),
    categoryBudgetsGrid: document.getElementById('categoryBudgetsGrid'),
    tableMonthFilterSelect: document.getElementById('tableMonthFilterSelect'),
    filterSearchInput: document.getElementById('filterSearchInput'),
    addTransactionBtn: document.getElementById('addTransactionBtn'),
    addFixedItemDirectBtn: document.getElementById('addFixedItemDirectBtn'),

    // Dialogs
    goalModal: document.getElementById('goalModal'),
    goalForm: document.getElementById('goalForm'),
    inputSavingsGoal: document.getElementById('inputSavingsGoal'),
    inputCurrentSaved: document.getElementById('inputCurrentSaved'),
    inputDeadlineDate: document.getElementById('inputDeadlineDate'),

    quickAddModal: document.getElementById('quickAddModal'),
    quickAddForm: document.getElementById('quickAddForm'),
    quickAddAmount: document.getElementById('quickAddAmount'),

    transactionModal: document.getElementById('transactionModal'),
    transactionForm: document.getElementById('transactionForm'),
    txModalTitle: document.getElementById('txModalTitle'),
    txId: document.getElementById('txId'),
    txRecurringKey: document.getElementById('txRecurringKey'),
    frequencyGroup: document.getElementById('frequencyGroup'),
    freqRecurring: document.getElementById('freqRecurring'),
    freqSingle: document.getElementById('freqSingle'),
    editScopeGroup: document.getElementById('editScopeGroup'),
    editScopeAll: document.getElementById('editScopeAll'),
    editScopeSingle: document.getElementById('editScopeSingle'),
    monthSelectGroup: document.getElementById('monthSelectGroup'),
    txMonth: document.getElementById('txMonth'),
    txTitle: document.getElementById('txTitle'),
    txCategory: document.getElementById('txCategory'),
    txCategoryHint: document.getElementById('txCategoryHint'),
    txAmount: document.getElementById('txAmount'),
    txAmountLabel: document.getElementById('txAmountLabel'),

    // Footer actions
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    importFileInput: document.getElementById('importFileInput'),
    resetDefaultsBtn: document.getElementById('resetDefaultsBtn'),

    // GitHub Gist Cloud Sync
    syncModal: document.getElementById('syncModal'),
    syncConfigForm: document.getElementById('syncConfigForm'),
    inputGistId: document.getElementById('inputGistId'),
    inputGithubToken: document.getElementById('inputGithubToken'),
    toggleTokenVisibilityBtn: document.getElementById('toggleTokenVisibilityBtn'),
    syncFeedbackBox: document.getElementById('syncFeedbackBox'),
    syncDetailText: document.getElementById('syncDetailText'),
    disconnectSyncBtn: document.getElementById('disconnectSyncBtn'),
    manualPullBtn: document.getElementById('manualPullBtn'),
    manualPushBtn: document.getElementById('manualPushBtn'),
    saveSyncConfigBtn: document.getElementById('saveSyncConfigBtn'),
    autoCreateGistBtn: document.getElementById('autoCreateGistBtn'),

    // Category-Level Monthly Budgets
    heroCategoryBudgetsBtn: document.getElementById('heroCategoryBudgetsBtn'),
    openCategoryBudgetsModalBtn: document.getElementById('openCategoryBudgetsModalBtn'),
    categoryBudgetsModal: document.getElementById('categoryBudgetsModal'),
    categoryBudgetsForm: document.getElementById('categoryBudgetsForm'),
    categoryBudgetsInputsContainer: document.getElementById('categoryBudgetsInputsContainer'),
    categoryBudgetsTotalDisplay: document.getElementById('categoryBudgetsTotalDisplay')
  };

  // --------------------------------------------------------------------------
  // Persistence Helpers
  // --------------------------------------------------------------------------
  function normalizeItems(items) {
    if (!Array.isArray(items)) return [];
    const titleCounts = {};
    items.forEach(i => {
      const key = `${i.type}_${(i.title || '').trim().toLowerCase()}`;
      titleCounts[key] = (titleCounts[key] || 0) + 1;
    });

    return items.map(item => {
      const groupKey = `${item.type}_${(item.title || '').trim().toLowerCase()}`;
      const isMultiMonth = titleCounts[groupKey] >= 3;
      const isKnownFixed = item.isRecurring || isMultiMonth || ['housing', 'utilities'].includes(item.category);
      const recKey = item.recurringKey || (isKnownFixed ? ('rec_' + groupKey.replace(/[^a-z0-9]/g, '_')) : undefined);
      return {
        ...item,
        isRecurring: !!(item.isRecurring || isKnownFixed),
        recurringKey: recKey
      };
    });
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const rawItems = Array.isArray(parsed.items) && parsed.items.length > 0
          ? parsed.items.filter(i => i.id !== 'exp_visa_2027-05' && i.category !== 'visa')
          : createDefaultSchedule();
        const loadedSettings = { ...DEFAULT_STATE.settings, ...parsed.settings };
        if (!Array.isArray(loadedSettings.excludedCategories)) {
          loadedSettings.excludedCategories = [...DEFAULT_EXCLUDED_CATEGORIES];
        }
        return {
          settings: loadedSettings,
          categoryBudgets: { ...DEFAULT_CATEGORY_BUDGETS, ...(parsed.categoryBudgets || {}) },
          items: normalizeItems(rawItems)
        };
      }
    } catch (e) {
      console.warn('Error reading saved state:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState(skipCloudSync = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      if (!skipCloudSync) {
        queueCloudSync();
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }

  // --------------------------------------------------------------------------
  // GitHub Gist Cloud Sync Engine
  // --------------------------------------------------------------------------
  let syncDebounceTimer = null;
  let isSyncing = false;

  function getSyncConfig() {
    try {
      const raw = localStorage.getItem(SYNC_CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveSyncConfig(cfg) {
    try {
      localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.error('Failed to save sync config:', e);
    }
  }

  function clearSyncConfig() {
    try {
      localStorage.removeItem(SYNC_CONFIG_KEY);
    } catch (e) {
      console.error('Failed to clear sync config:', e);
    }
  }

  function updateSyncUI(status, message = '') {
    if (!DOM.syncStatusDot || !DOM.syncStatusLabel) return;

    // Reset dot classes
    DOM.syncStatusDot.className = 'sync-status-dot';

    if (status === 'synced') {
      DOM.syncStatusDot.classList.add('dot-synced');
      DOM.syncStatusLabel.textContent = '☁️ Synced';
      if (DOM.syncModalBtn) DOM.syncModalBtn.title = message || 'Cloud Sync active: All changes synced to GitHub Gist';
    } else if (status === 'syncing') {
      DOM.syncStatusDot.classList.add('dot-syncing');
      DOM.syncStatusLabel.textContent = '⏳ Syncing...';
      if (DOM.syncModalBtn) DOM.syncModalBtn.title = 'Syncing data with GitHub Gist...';
    } else if (status === 'error') {
      DOM.syncStatusDot.classList.add('dot-error');
      DOM.syncStatusLabel.textContent = '⚠️ Sync Error';
      if (DOM.syncModalBtn) DOM.syncModalBtn.title = message || 'Failed to sync with GitHub Gist. Click to review.';
    } else {
      // 'off'
      DOM.syncStatusDot.classList.add('dot-off');
      DOM.syncStatusLabel.textContent = '☁️ Cloud: Off';
      if (DOM.syncModalBtn) DOM.syncModalBtn.title = 'Cloud Sync is off. Click to configure GitHub Gist.';
    }

    // Modal elements if present
    if (DOM.syncDetailText) {
      const cfg = getSyncConfig();
      if (!cfg || !cfg.gistId || !cfg.token) {
        DOM.syncDetailText.textContent = 'Not connected';
        DOM.syncDetailText.style.color = 'var(--text-muted)';
        if (DOM.disconnectSyncBtn) DOM.disconnectSyncBtn.classList.add('hidden');
        if (DOM.manualPullBtn) DOM.manualPullBtn.classList.add('hidden');
        if (DOM.manualPushBtn) DOM.manualPushBtn.classList.add('hidden');
        if (DOM.saveSyncConfigBtn) DOM.saveSyncConfigBtn.textContent = 'Connect & Sync';
      } else {
        const timeStr = cfg.lastSyncedAt ? new Date(cfg.lastSyncedAt).toLocaleTimeString() : 'Never';
        if (status === 'syncing') {
          DOM.syncDetailText.textContent = 'Syncing...';
          DOM.syncDetailText.style.color = 'var(--cli-amber)';
        } else if (status === 'error') {
          DOM.syncDetailText.textContent = 'Error: ' + (message || 'Connection failed');
          DOM.syncDetailText.style.color = 'var(--cli-red)';
        } else {
          DOM.syncDetailText.textContent = `Connected (Last sync: ${timeStr})`;
          DOM.syncDetailText.style.color = 'var(--cli-green)';
        }
        if (DOM.disconnectSyncBtn) DOM.disconnectSyncBtn.classList.remove('hidden');
        if (DOM.manualPullBtn) DOM.manualPullBtn.classList.remove('hidden');
        if (DOM.manualPushBtn) DOM.manualPushBtn.classList.remove('hidden');
        if (DOM.saveSyncConfigBtn) DOM.saveSyncConfigBtn.textContent = 'Update Config';
      }
    }
  }

  function setSyncFeedback(type, message) {
    if (!DOM.syncFeedbackBox) return;
    if (!message) {
      DOM.syncFeedbackBox.className = 'sync-feedback-box hidden';
      DOM.syncFeedbackBox.textContent = '';
      return;
    }
    DOM.syncFeedbackBox.className = `sync-feedback-box ${type}`;
    DOM.syncFeedbackBox.textContent = message;
  }

  function cleanGistId(input) {
    if (!input) return '';
    let str = input.trim();
    str = str.split('#')[0].split('?')[0].replace(/\/+$/, '');
    const parts = str.split('/');
    return parts[parts.length - 1].trim();
  }

  function cleanToken(input) {
    if (!input) return '';
    return input.trim().replace(/^(Bearer|token)\s+/i, '').trim();
  }

  async function createSecretGist(rawToken) {
    const token = cleanToken(rawToken);
    if (!token) throw new Error('Please enter a GitHub Personal Access Token first.');

    const payload = {
      description: 'SakuraBudget 2027 — Japan WHV Budget Planner Data',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(appState, null, 2)
        }
      }
    };

    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('401 Unauthorized: Invalid token or expired. Check that it is a Classic PAT with "gist" scope.');
      }
      throw new Error(`HTTP ${res.status}: Failed to create Gist on GitHub.`);
    }

    const gist = await res.json();
    return gist.id;
  }

  async function syncPull(showModalFeedback = false) {
    const cfg = getSyncConfig();
    if (!cfg) {
      updateSyncUI('off');
      return;
    }

    const gistId = cleanGistId(cfg.gistId);
    const token = cleanToken(cfg.token);
    if (!gistId || !token) {
      updateSyncUI('off');
      return;
    }

    if (isSyncing) return;
    isSyncing = true;
    updateSyncUI('syncing');
    if (showModalFeedback) setSyncFeedback('info', 'Connecting to GitHub Gist and fetching data...');

    try {
      const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        cache: 'no-cache'
      });

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        if (res.status === 401) {
          errDetail = '401 Unauthorized: Invalid or expired GitHub Token (ensure it has "gist" scope).';
        } else if (res.status === 404) {
          errDetail = '404 Not Found: GitHub could not find this Gist. Note: GitHub returns 404 if the Gist ID is wrong, OR if your token lacks the "gist" scope (GitHub hides secret gists behind 404 if unpermitted), OR if you used a Fine-Grained token (you must use a Classic PAT).';
        }
        throw new Error(errDetail);
      }

      const gist = await res.json();
      let fileData = null;

      if (gist.files && gist.files[GIST_FILENAME]) {
        fileData = gist.files[GIST_FILENAME];
      } else if (gist.files) {
        // Fallback: search for any .json file or first file in gist
        const jsonKey = Object.keys(gist.files).find(k => k.endsWith('.json')) || Object.keys(gist.files)[0];
        if (jsonKey) fileData = gist.files[jsonKey];
      }

      if (!fileData || !fileData.content) {
        // Gist exists but empty/no matching file: push local data to initialize it
        if (showModalFeedback) setSyncFeedback('info', 'Gist file not found, initializing with local data...');
        isSyncing = false;
        await syncPush(showModalFeedback);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(fileData.content);
      } catch (err) {
        throw new Error('Gist file content is not valid JSON.');
      }

      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
        throw new Error('Gist data does not match SakuraBudget structure.');
      }

      // Valid remote data: update local state safely
      parsed.items = normalizeItems(parsed.items);
      appState = parsed;
      saveState(true); // Persist locally without re-triggering an immediate push

      cfg.gistId = gistId;
      cfg.token = token;
      cfg.lastSyncedAt = new Date().toISOString();
      saveSyncConfig(cfg);

      updateSyncUI('synced', `Synced: ${new Date(cfg.lastSyncedAt).toLocaleTimeString()}`);
      renderApp();

      if (showModalFeedback) {
        setSyncFeedback('success', '✓ Successfully pulled latest data from GitHub Gist!');
      }
    } catch (err) {
      console.error('Gist Pull Error:', err);
      updateSyncUI('error', err.message);
      if (showModalFeedback) {
        setSyncFeedback('error', `Failed to pull from Gist: ${err.message}`);
      }
    } finally {
      isSyncing = false;
    }
  }

  async function syncPush(showModalFeedback = false) {
    const cfg = getSyncConfig();
    if (!cfg) {
      updateSyncUI('off');
      return;
    }

    const gistId = cleanGistId(cfg.gistId);
    const token = cleanToken(cfg.token);
    if (!gistId || !token) {
      updateSyncUI('off');
      return;
    }

    if (isSyncing) return;
    isSyncing = true;
    updateSyncUI('syncing');
    if (showModalFeedback) setSyncFeedback('info', 'Uploading local data to GitHub Gist...');

    try {
      const payload = {
        description: 'SakuraBudget 2027 — Japan WHV Budget Planner Data',
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(appState, null, 2)
          }
        }
      };

      const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        if (res.status === 401) {
          errDetail = '401 Unauthorized: Invalid or expired GitHub Token (ensure it has "gist" scope).';
        } else if (res.status === 404) {
          errDetail = '404 Not Found: GitHub could not find this Gist. Note: GitHub returns 404 if the Gist ID is wrong, OR if your token lacks the "gist" scope (GitHub hides secret gists behind 404 if unpermitted), OR if you used a Fine-Grained token (you must use a Classic PAT).';
        }
        throw new Error(errDetail);
      }

      cfg.gistId = gistId;
      cfg.token = token;
      cfg.lastSyncedAt = new Date().toISOString();
      saveSyncConfig(cfg);

      updateSyncUI('synced', `Synced: ${new Date(cfg.lastSyncedAt).toLocaleTimeString()}`);

      if (showModalFeedback) {
        setSyncFeedback('success', '✓ Successfully pushed your budget data to GitHub Gist!');
      }
    } catch (err) {
      console.error('Gist Push Error:', err);
      updateSyncUI('error', err.message);
      if (showModalFeedback) {
        setSyncFeedback('error', `Failed to push to Gist: ${err.message}`);
      }
    } finally {
      isSyncing = false;
    }
  }

  function queueCloudSync() {
    const cfg = getSyncConfig();
    if (!cfg || !cfg.gistId || !cfg.token) return;

    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      syncPush(false).catch(err => console.error('Cloud auto-sync error:', err));
    }, 1500);
  }

  // --------------------------------------------------------------------------
  // Number & Currency Formatters (Pure EUR)
  // --------------------------------------------------------------------------
  function formatEUR(amount) {
    const val = Number(amount) || 0;
    return `€${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatEURShort(amount) {
    const val = Number(amount) || 0;
    return `€${Math.round(val).toLocaleString('en-US')}`;
  }

  // --------------------------------------------------------------------------
  // 9-Month Financial Calculations Engine
  // --------------------------------------------------------------------------
  function calculate9MonthSchedule() {
    const goal = Number(appState.settings.savingsGoal) || 6500;
    const initialSaved = Number(appState.settings.initialSaved) || 2800;
    const activeMonth = appState.settings.activeMonth || '2026-10';

    const remainingToSave = Math.max(0, goal - initialSaved);
    const requiredMonthlyRate = remainingToSave / MONTH_KEYS.length; // 9 months

    let runningBalance = initialSaved;
    const monthStats = [];
    let negativeCashflowMonths = [];
    let categoryOverrunsActiveMonth = [];

    MONTH_KEYS.forEach((mKey, idx) => {
      const monthItems = appState.items.filter(i => i.month === mKey);
      const incomes = monthItems.filter(i => i.type === 'income');
      const expenses = monthItems.filter(i => i.type === 'expense');

      const incomeTotal = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const expenseTotal = expenses.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      const netSavings = incomeTotal - expenseTotal;
      runningBalance += netSavings;

      // Ideal linear milestone trajectory for this month (idx + 1)
      const idealTarget = initialSaved + (requiredMonthlyRate * (idx + 1));
      const paceGap = runningBalance - idealTarget; // positive = ahead, negative = deficit

      if (netSavings < 0) {
        negativeCashflowMonths.push({ month: mKey, name: MONTH_NAMES[mKey].full, deficit: Math.abs(netSavings) });
      }

      // Category-level monthly budgets & spending for this month
      const categoryTotals = {};
      const catBudgets = appState.categoryBudgets || DEFAULT_CATEGORY_BUDGETS;
      const excludedCats = (appState.settings && Array.isArray(appState.settings.excludedCategories))
        ? appState.settings.excludedCategories
        : DEFAULT_EXCLUDED_CATEGORIES;

      Object.keys(CATEGORY_META).forEach(cat => {
        if (!['salary', 'freelance', 'tutoring', 'gift', 'other_income'].includes(cat)) {
          const isExcluded = excludedCats.includes(cat);
          categoryTotals[cat] = {
            spent: 0,
            budget: isExcluded ? 0 : (Number(catBudgets[cat]) || 0),
            isExcluded
          };
        }
      });

      expenses.forEach(item => {
        const cat = item.category || 'other_expense';
        if (!categoryTotals[cat]) {
          const isExcluded = excludedCats.includes(cat);
          categoryTotals[cat] = {
            spent: 0,
            budget: isExcluded ? 0 : (Number(catBudgets[cat]) || 0),
            isExcluded
          };
        }
        categoryTotals[cat].spent += Number(item.amount) || 0;
      });

      const expenseBudgetTotal = Object.values(categoryTotals)
        .filter(c => !c.isExcluded)
        .reduce((sum, c) => sum + (c.budget || 0), 0);

      if (mKey === activeMonth) {
        Object.keys(categoryTotals).forEach(cat => {
          const info = categoryTotals[cat];
          if (!info.isExcluded && info.budget > 0 && info.spent > info.budget) {
            categoryOverrunsActiveMonth.push({
              category: cat,
              name: CATEGORY_META[cat]?.name || cat,
              spent: info.spent,
              budget: info.budget,
              excess: info.spent - info.budget
            });
          }
        });
      }

      monthStats.push({
        key: mKey,
        name: MONTH_NAMES[mKey],
        incomeTotal,
        expenseTotal,
        expenseBudgetTotal,
        netSavings,
        runningBalance,
        idealTarget,
        paceGap,
        categoryTotals,
        incomesCount: incomes.length,
        expensesCount: expenses.length,
        isCashflowPositive: netSavings >= 0,
        isOnTrack: paceGap >= 0
      });
    });

    const finalJuneBalance = monthStats[monthStats.length - 1].runningBalance;
    const finalGoalShortfallOrSurplus = finalJuneBalance - goal;
    const averageNetMonthly = (finalJuneBalance - initialSaved) / MONTH_KEYS.length;

    // Active Month Data
    const activeData = monthStats.find(s => s.key === activeMonth) || monthStats[0];

    return {
      goal,
      initialSaved,
      activeMonth,
      activeData,
      remainingToSave,
      requiredMonthlyRate,
      averageNetMonthly,
      finalJuneBalance,
      finalGoalShortfallOrSurplus,
      monthStats,
      negativeCashflowMonths,
      categoryOverrunsActiveMonth,
      isFinalJuneGoalMet: finalJuneBalance >= goal
    };
  }

  // --------------------------------------------------------------------------
  // Dynamic Alert & Warning Engine
  // --------------------------------------------------------------------------
  function renderAlerts(calc) {
    const alerts = [];

    // ALERT 1: FINAL GOAL SHORTFALL AT JUNE 2027
    if (calc.finalJuneBalance < calc.goal) {
      const shortfall = calc.goal - calc.finalJuneBalance;
      const extraPerMonth = shortfall / MONTH_KEYS.length;
      alerts.push({
        type: 'danger',
        icon: '⚠️',
        badge: 'JUNE 2027 SAVINGS SHORTFALL',
        title: `Projected Shortfall of ${formatEUR(shortfall)} by June 2027`,
        text: `With your current 9-month schedule, you will reach <strong>${formatEUR(calc.finalJuneBalance)}</strong> at departure in June 2027, missing your ${formatEUR(calc.goal)} target. To hit your goal, you need an extra <strong>${formatEUR(extraPerMonth)}/month</strong> across your 9-month timeline.`,
        actionHtml: `<button class="btn btn-secondary btn-sm" onclick="window.SakuraApp.switchToTab('roadmap')">Inspect 9-Month Roadmap</button>`
      });
    }

    // ALERT 2: NEGATIVE CASHFLOW IN SPECIFIC FUTURE MONTHS
    if (calc.negativeCashflowMonths.length > 0) {
      const monthsStr = calc.negativeCashflowMonths.map(m => `<strong>${m.name}</strong> (-${formatEUR(m.deficit)})`).join(', ');
      alerts.push({
        type: 'warning',
        icon: '🚨',
        badge: 'MONTHLY SPENDING OVERRUN',
        title: `Expenses Exceed Income in ${calc.negativeCashflowMonths.length} Month(s)`,
        text: `You have negative cashflow planned in: ${monthsStr}. In these months, your scheduled spending is greater than that month's planned income, causing your saved balance to dip.`,
        actionHtml: `<button class="btn btn-secondary btn-sm" onclick="window.SakuraApp.selectMonth('${calc.negativeCashflowMonths[0].month}')">Review ${calc.negativeCashflowMonths[0].name}</button>`
      });
    }

    // ALERT 3: CATEGORY BUDGET EXCEEDED IN ACTIVE MONTH
    if (calc.categoryOverrunsActiveMonth.length > 0) {
      const catList = calc.categoryOverrunsActiveMonth.map(c =>
        `<strong>${c.name}</strong> (Spent ${formatEUR(c.spent)} vs ${formatEUR(c.budget)} limit • +${formatEUR(c.excess)})`
      ).join(', ');
      alerts.push({
        type: 'danger',
        icon: '🔴',
        badge: 'BUDGET LIMIT EXCEEDED',
        title: `Category Budget Exceeded in ${MONTH_NAMES[calc.activeMonth].full}`,
        text: `You have planned expenses exceeding your budget limits in: ${catList}. Review and adjust these items to maintain savings discipline.`,
        actionHtml: `<button class="btn btn-secondary btn-sm" onclick="window.SakuraApp.switchToTab('budgets')">View Category Limits</button>`
      });
    }

    // ALERT 4: ON TRACK CONGRATULATIONS
    if (calc.finalJuneBalance >= calc.goal && calc.negativeCashflowMonths.length === 0 && calc.categoryOverrunsActiveMonth.length === 0) {
      const surplus = calc.finalJuneBalance - calc.goal;
      alerts.push({
        type: 'success',
        icon: '🌸',
        badge: 'SCHEDULE ON TRACK',
        title: `Schedule On Track! Target of ${formatEUR(calc.goal)} will be Met by June 2027`,
        text: `Your planned 9-month schedule achieves <strong>${formatEUR(calc.finalJuneBalance)}</strong> (+${formatEUR(surplus)} cushion) by June 2027. All monthly cashflows are balanced!`,
        actionHtml: ``
      });
    }

    DOM.alertsContainer.innerHTML = alerts.map(a => `
      <div class="alert-card alert-${a.type}">
        <div class="alert-icon-wrap">${a.icon}</div>
        <div class="alert-body">
          <div class="alert-title">
            <span>${a.title}</span>
            <span class="alert-badge">${a.badge}</span>
          </div>
          <div class="alert-text">${a.text}</div>
          ${a.actionHtml ? `<div class="alert-actions">${a.actionHtml}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // Render Hero Section
  // --------------------------------------------------------------------------
  function renderHero(calc) {
    DOM.displayGoalAmount.textContent = formatEUR(calc.goal);
    DOM.displayCurrentSaved.textContent = formatEUR(calc.initialSaved);

    const percentAchieved = calc.goal > 0 ? Math.min(100, Math.max(0, (calc.initialSaved / calc.goal) * 100)) : 0;
    DOM.savingsProgressPercent.textContent = `${percentAchieved.toFixed(1)}% of target saved`;
    DOM.savingsRemainingAmount.textContent = `${formatEUR(calc.remainingToSave)} remaining to save`;

    DOM.displayRequiredMonthly.innerHTML = `${formatEUR(calc.requiredMonthlyRate)}<span class="unit">/mo</span>`;
    DOM.displayActualMonthlyNet.innerHTML = `${formatEUR(calc.averageNetMonthly)}<span class="unit">/mo</span>`;
    DOM.displayTotalProjectedAtJune.textContent = `June '27 total: ${formatEURShort(calc.finalJuneBalance)}`;

    // Linear progress bar
    DOM.goalProgressBar.style.width = `${percentAchieved}%`;

    // Pace delta banner
    DOM.paceDeltaBanner.className = 'pace-delta-banner';
    DOM.paceStatusPill.className = 'pill-tag';

    if (calc.finalJuneBalance < calc.goal) {
      const shortfall = calc.goal - calc.finalJuneBalance;
      DOM.paceDeltaBanner.classList.add('pace-alert-warning');
      DOM.paceDeltaIcon.textContent = '⚠️';
      DOM.paceDeltaText.textContent = `Pace Deficit: Shortfall of ${formatEUR(shortfall)} at June 2027 departure`;
      DOM.paceStatusPill.classList.add('pill-warning');
      DOM.paceStatusPill.textContent = '⚠️ Pace Deficit';
    } else {
      const surplus = calc.finalJuneBalance - calc.goal;
      DOM.paceDeltaBanner.classList.add('pace-alert-success');
      DOM.paceDeltaIcon.textContent = '✅';
      DOM.paceDeltaText.textContent = `On Track: Scheduled to reach ${formatEUR(calc.finalJuneBalance)} by June 2027 (+${formatEUR(surplus)} surplus)`;
      DOM.paceStatusPill.classList.add('pill-success');
      DOM.paceStatusPill.textContent = '✅ On Track';
    }
  }

  // --------------------------------------------------------------------------
  // Render 9-Month Interactive Strip Navigator
  // --------------------------------------------------------------------------
  function renderMonthStrip(calc) {
    DOM.activeMonthIndicator.textContent = `Active: ${MONTH_NAMES[calc.activeMonth].full}`;

    DOM.monthsStripContainer.innerHTML = calc.monthStats.map(stat => {
      const isActive = stat.key === calc.activeMonth;
      const isDep = stat.name.isDeparture;
      const netSign = stat.netSavings >= 0 ? '+' : '';
      const dotClass = stat.netSavings < 0 ? 'dot-red' : (stat.isOnTrack ? 'dot-green' : 'dot-yellow');

      return `
        <button type="button" class="month-strip-btn ${isActive ? 'active' : ''} ${isDep ? 'is-departure' : ''}"
          role="tab" aria-selected="${isActive}"
          onclick="window.SakuraApp.selectMonth('${stat.key}')"
          title="Click to view and edit budget for ${stat.name.full}">
          <div class="month-strip-header">
            <span class="month-strip-name">${stat.name.short}</span>
            <span class="month-status-dot ${dotClass}" title="${stat.netSavings < 0 ? 'Negative cashflow' : (stat.isOnTrack ? 'On track' : 'Pace gap')}"></span>
          </div>
          <div class="month-strip-net" style="color:${stat.netSavings >= 0 ? 'var(--brand-emerald)' : 'var(--brand-rose)'}">
            ${netSign}${formatEURShort(stat.netSavings)}
          </div>
          <div class="month-strip-cumul">
            Total: <strong>${formatEURShort(stat.runningBalance)}</strong>
          </div>
        </button>
      `;
    }).join('');
  }

  // --------------------------------------------------------------------------
  // Render Active Month Metrics Grid
  // --------------------------------------------------------------------------
  function renderActiveMonthMetrics(calc) {
    const act = calc.activeData;
    const monthName = act.name.short;

    DOM.lblSelectedMonthIncome.textContent = `${monthName} Planned Income`;
    DOM.metricSelectedIncome.textContent = formatEUR(act.incomeTotal);
    DOM.metricIncomeCount.textContent = `${act.incomesCount} income items scheduled`;

    DOM.lblSelectedMonthExpense.textContent = `${monthName} Planned Expenses`;
    DOM.metricSelectedExpense.textContent = formatEUR(act.expenseTotal);
    DOM.metricBudgetVsSpend.textContent = `Budget limit: ${formatEUR(act.expenseBudgetTotal)}`;

    DOM.lblSelectedMonthNet.textContent = `${monthName} Net Savings`;
    DOM.metricSelectedNet.textContent = `${act.netSavings >= 0 ? '+' : ''}${formatEUR(act.netSavings)}`;
    DOM.metricSelectedNet.style.color = act.netSavings >= 0 ? 'var(--brand-indigo)' : 'var(--brand-rose)';
    DOM.metricSelectedNetStatus.textContent = act.netSavings >= 0 ? 'Cashflow Positive' : 'Overspending Deficit!';

    DOM.lblCumulativeAtMonth.textContent = `Cumulative Balance by ${monthName}`;
    DOM.metricCumulativeAtMonth.textContent = formatEUR(act.runningBalance);

    const progressRatio = calc.goal > 0 ? ((act.runningBalance / calc.goal) * 100).toFixed(1) : 0;
    DOM.metricCumulativeProgress.textContent = `${progressRatio}% of €6,500 goal reached`;
  }

  // --------------------------------------------------------------------------
  // Render Trajectory Projection Chart (Interactive SVG across 9 Months)
  // --------------------------------------------------------------------------
  function renderTrajectoryChart(calc) {
    const container = DOM.trajectoryChartContainer;
    const tooltip = DOM.chartTooltip;

    const width = 640;
    const height = 230;
    const padLeft = 60;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 35;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const dataPoints = calc.monthStats;
    const maxVal = Math.max(calc.goal * 1.15, ...dataPoints.map(p => p.runningBalance));

    function scaleX(index) {
      return padLeft + (index / (dataPoints.length - 1)) * chartW;
    }

    function scaleY(val) {
      return padTop + chartH - (val / maxVal) * chartH;
    }

    // Construct SVG path strings
    let targetPathD = '';
    let actualPathD = '';
    let areaPathD = '';

    dataPoints.forEach((p, idx) => {
      const x = scaleX(idx);
      const yTarget = scaleY(p.idealTarget);
      const yActual = scaleY(p.runningBalance);

      targetPathD += (idx === 0 ? `M ${x} ${yTarget}` : ` L ${x} ${yTarget}`);
      actualPathD += (idx === 0 ? `M ${x} ${yActual}` : ` L ${x} ${yActual}`);

      if (idx === 0) areaPathD += `M ${x} ${scaleY(0)} L ${x} ${yActual}`;
      else areaPathD += ` L ${x} ${yActual}`;
    });
    areaPathD += ` L ${scaleX(dataPoints.length - 1)} ${scaleY(0)} Z`;

    const goalY = scaleY(calc.goal);

    let svgHtml = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${calc.finalJuneBalance >= calc.goal ? '#10b981' : '#f43f5e'}" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="${calc.finalJuneBalance >= calc.goal ? '#10b981' : '#f43f5e'}" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line x1="${padLeft}" y1="${scaleY(0)}" x2="${width - padRight}" y2="${scaleY(0)}" stroke="var(--border-subtle)" stroke-width="1"/>
        <line x1="${padLeft}" y1="${goalY}" x2="${width - padRight}" y2="${goalY}" stroke="var(--brand-gold)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>

        <!-- Y Axis Labels -->
        <text x="${padLeft - 8}" y="${goalY + 4}" font-size="10" fill="var(--brand-gold)" text-anchor="end" font-weight="700">Goal ${formatEURShort(calc.goal)}</text>
        <text x="${padLeft - 8}" y="${scaleY(0)}" font-size="9" fill="var(--text-muted)" text-anchor="end">0</text>

        <!-- Area fill under scheduled path -->
        <path d="${areaPathD}" fill="url(#actualGradient)"/>

        <!-- Ideal Target Path Line (Dashed Gold) -->
        <path d="${targetPathD}" fill="none" stroke="var(--brand-gold)" stroke-width="2" stroke-dasharray="5 4"/>

        <!-- Scheduled Path Line (Solid Emerald or Rose) -->
        <path d="${actualPathD}" fill="none" stroke="${calc.finalJuneBalance >= calc.goal ? '#10b981' : '#f43f5e'}" stroke-width="3"/>
    `;

    dataPoints.forEach((p, idx) => {
      const x = scaleX(idx);
      const y = scaleY(p.runningBalance);
      const isSelected = p.key === calc.activeMonth;

      svgHtml += `
        <!-- X Axis Month Label -->
        <text x="${x}" y="${height - 10}" font-size="10" fill="${isSelected ? 'var(--brand-sakura)' : 'var(--text-muted)'}" text-anchor="middle" font-weight="${isSelected ? '800' : '600'}">
          ${p.name.short}
        </text>

        <!-- Interactive Dot -->
        <circle cx="${x}" cy="${y}" r="${isSelected ? 6 : 4.5}"
          fill="${p.runningBalance >= p.idealTarget ? '#10b981' : '#f43f5e'}"
          stroke="#ffffff" stroke-width="${isSelected ? 2.5 : 1.5}"
          class="chart-dot"
          data-month="${p.name.full}"
          data-net="${p.netSavings}"
          data-cumul="${p.runningBalance}"
          data-target="${p.idealTarget}"
          style="cursor: pointer;"
          onclick="window.SakuraApp.selectMonth('${p.key}')"
        />
      `;
    });

    svgHtml += `</svg>`;
    container.innerHTML = svgHtml + `<div id="chartTooltip" class="chart-tooltip hidden"></div>`;

    // Tooltip Hover Interaction
    const tooltipElem = container.querySelector('#chartTooltip');
    const dots = container.querySelectorAll('.chart-dot');

    dots.forEach(dot => {
      dot.addEventListener('mouseenter', () => {
        const month = dot.getAttribute('data-month');
        const net = Number(dot.getAttribute('data-net'));
        const cumul = Number(dot.getAttribute('data-cumul'));
        const target = Number(dot.getAttribute('data-target'));
        const gap = cumul - target;

        const gapHtml = gap >= 0
          ? `<span style="color:var(--brand-emerald)">+${formatEUR(gap)} ahead of schedule</span>`
          : `<span style="color:var(--brand-crimson)">${formatEUR(Math.abs(gap))} behind pace</span>`;

        tooltipElem.innerHTML = `
          <strong>${month}</strong><br>
          Monthly Net: <strong>${net >= 0 ? '+' : ''}${formatEUR(net)}</strong><br>
          Cumulative Saved: <strong>${formatEUR(cumul)}</strong><br>
          Target: ${formatEUR(target)} (${gapHtml})
        `;

        const rect = dot.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        tooltipElem.style.left = `${rect.left - containerRect.left + 5}px`;
        tooltipElem.style.top = `${rect.top - containerRect.top}px`;
        tooltipElem.classList.remove('hidden');
      });

      dot.addEventListener('mouseleave', () => {
        tooltipElem.classList.add('hidden');
      });
    });

    // Footer insight
    if (calc.finalJuneBalance >= calc.goal) {
      DOM.chartFooterNote.innerHTML = `<span>💡 <strong>Scheduled Trajectory:</strong> Reaches ${formatEUR(calc.finalJuneBalance)} in June 2027 (+${formatEUR(calc.finalGoalShortfallOrSurplus)} cushion).</span>`;
    } else {
      DOM.chartFooterNote.innerHTML = `<span>💡 <strong>Scheduled Trajectory:</strong> Reaches ${formatEUR(calc.finalJuneBalance)} in June 2027 (shortfall: ${formatEUR(Math.abs(calc.finalGoalShortfallOrSurplus))}).</span>`;
    }
  }

  // --------------------------------------------------------------------------
  // Render Category Donut Chart
  // --------------------------------------------------------------------------
  function renderCategoryDonut(calc) {
    const scope = DOM.donutScopeSelect.value;
    let expenses = [];

    if (scope === 'selected') {
      expenses = appState.items.filter(i => i.type === 'expense' && i.month === calc.activeMonth);
      DOM.lblDonutMonthPre.textContent = `${MONTH_NAMES[calc.activeMonth].short} EXPENSES`;
      DOM.lblDonutTitle.textContent = 'Category Breakdown';
    } else {
      expenses = appState.items.filter(i => i.type === 'expense');
      DOM.lblDonutMonthPre.textContent = 'ALL 9 MONTHS TOTAL';
      DOM.lblDonutTitle.textContent = 'Full Category Breakdown';
    }

    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    if (expenses.length === 0 || totalExpense === 0) {
      DOM.donutSvgContainer.innerHTML = `<div style="text-align:center;font-size:0.8rem;color:var(--text-muted);padding:2rem 0;">No expenses recorded</div>`;
      DOM.donutLegendContainer.innerHTML = '';
      return;
    }

    const categoryTotals = {};
    expenses.forEach(e => {
      const cat = e.category || 'other_expense';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
    });

    const categories = Object.keys(categoryTotals).map(catKey => ({
      key: catKey,
      name: CATEGORY_META[catKey]?.name || catKey,
      icon: CATEGORY_META[catKey]?.icon || '📦',
      color: CATEGORY_META[catKey]?.color || '#94a3b8',
      amount: categoryTotals[catKey],
      percent: (categoryTotals[catKey] / totalExpense) * 100
    })).sort((a, b) => b.amount - a.amount);

    const size = 160;
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;

    let svgHtml = `
      <svg viewBox="0 0 ${size} ${size}" class="donut-svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="var(--border-subtle)" stroke-width="20"/>
    `;

    categories.forEach(cat => {
      const strokeDash = (cat.percent / 100) * circumference;
      const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;

      svgHtml += `
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none"
          stroke="${cat.color}" stroke-width="20"
          stroke-dasharray="${strokeDash} ${circumference - strokeDash}"
          stroke-dashoffset="${strokeOffset}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
          style="transition: stroke-dasharray 0.5s ease;"
        />
      `;
      accumulatedPercent += cat.percent;
    });

    svgHtml += `
        <text x="${size / 2}" y="${size / 2 - 4}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-weight="700">TOTAL</text>
        <text x="${size / 2}" y="${size / 2 + 15}" text-anchor="middle" font-size="13" fill="var(--text-primary)" font-weight="800">${formatEURShort(totalExpense)}</text>
      </svg>
    `;

    DOM.donutSvgContainer.innerHTML = svgHtml;

    DOM.donutLegendContainer.innerHTML = categories.map(cat => `
      <div class="donut-legend-row">
        <div class="donut-legend-info" title="${cat.name}">
          <span class="legend-color-chip" style="background-color: ${cat.color};"></span>
          <span>${cat.icon} ${cat.name} (${cat.percent.toFixed(0)}%)</span>
        </div>
        <div class="donut-legend-amt">${formatEUR(cat.amount)}</div>
      </div>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // Render Tables (Expenses, Income, 9-Month Roadmap, Category Budgets)
  // --------------------------------------------------------------------------
  function renderTables(calc) {
    const searchTerm = (DOM.filterSearchInput.value || '').trim().toLowerCase();
    const filterScope = DOM.tableMonthFilterSelect.value; // 'selected' or 'all'

    // 1. Expenses Table
    let expenses = appState.items.filter(i => i.type === 'expense');
    if (filterScope === 'selected') {
      expenses = expenses.filter(i => i.month === calc.activeMonth);
    }
    if (searchTerm) {
      expenses = expenses.filter(i =>
        i.title.toLowerCase().includes(searchTerm) ||
        (CATEGORY_META[i.category]?.name || '').toLowerCase().includes(searchTerm) ||
        (MONTH_NAMES[i.month]?.full || '').toLowerCase().includes(searchTerm)
      );
    }

    DOM.expensesCount.textContent = expenses.length;
    DOM.expensesTableBody.innerHTML = expenses.length === 0
      ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:1.5rem;">No expense items for this view.</td></tr>`
      : expenses.map(item => {
        const catMeta = CATEGORY_META[item.category] || CATEGORY_META.other_expense;
        const spent = Number(item.amount) || 0;
        const monthLabel = MONTH_NAMES[item.month]?.short || item.month;
        const isRecurring = !!item.isRecurring;

        return `
          <tr>
            <td><span class="month-badge">${monthLabel}</span></td>
            <td>
              <span class="category-badge" style="border-left: 3px solid ${catMeta.color}">
                <span>${catMeta.icon}</span>
                <span>${catMeta.name}</span>
              </span>
            </td>
            <td>
              <strong>${escapeHtml(item.title)}</strong>
            </td>
            <td><strong>${formatEUR(spent)}</strong></td>
            <td>
              ${isRecurring
                ? '<span class="badge-recurring" title="Fixed repeating expense across all months">🔁 Fixed Monthly</span>'
                : '<span class="status-chip chip-neutral" style="color:var(--text-muted)">Single Month</span>'}
            </td>
            <td class="text-right">
              <div class="table-row-actions">
                <button class="action-btn" title="Edit" onclick="window.SakuraApp.editItem('${item.id}')">✏️</button>
                <button class="action-btn delete-btn" title="Delete" onclick="window.SakuraApp.deleteItem('${item.id}')">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    const totalExpensesAmount = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (DOM.expensesTableFoot) {
      DOM.expensesTableFoot.innerHTML = expenses.length === 0 ? '' : `
        <tr style="background: var(--bg-tertiary); font-weight: bold;">
          <td colspan="3" class="text-right" style="text-align: right; padding-right: 1rem;">Total:</td>
          <td>${formatEUR(totalExpensesAmount)}</td>
          <td colspan="2"></td>
        </tr>
      `;
    }

    // 2. Income Table
    let incomes = appState.items.filter(i => i.type === 'income');
    if (filterScope === 'selected') {
      incomes = incomes.filter(i => i.month === calc.activeMonth);
    }
    if (searchTerm) {
      incomes = incomes.filter(i =>
        i.title.toLowerCase().includes(searchTerm) ||
        (CATEGORY_META[i.category]?.name || '').toLowerCase().includes(searchTerm) ||
        (MONTH_NAMES[i.month]?.full || '').toLowerCase().includes(searchTerm)
      );
    }

    DOM.incomeCount.textContent = incomes.length;
    DOM.incomeTableBody.innerHTML = incomes.length === 0
      ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:1.5rem;">No income items for this view.</td></tr>`
      : incomes.map(item => {
        const catMeta = CATEGORY_META[item.category] || CATEGORY_META.other_income;
        const amount = Number(item.amount) || 0;
        const monthLabel = MONTH_NAMES[item.month]?.short || item.month;

        return `
          <tr>
            <td><span class="month-badge">${monthLabel}</span></td>
            <td>
              <span class="category-badge" style="border-left: 3px solid ${catMeta.color}">
                <span>${catMeta.icon}</span>
                <span>${catMeta.name}</span>
              </span>
            </td>
            <td>
              <strong>${escapeHtml(item.title)}</strong>
              ${item.isRecurring ? '<span class="badge-recurring" title="Fixed repeating income across all months">🔁 Fixed</span>' : ''}
            </td>
            <td><strong class="text-emerald">${formatEUR(amount)}</strong></td>
            <td><span class="status-chip chip-safe">Planned Income</span></td>
            <td class="text-right">
              <div class="table-row-actions">
                <button class="action-btn" title="Edit" onclick="window.SakuraApp.editItem('${item.id}')">✏️</button>
                <button class="action-btn delete-btn" title="Delete" onclick="window.SakuraApp.deleteItem('${item.id}')">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    const totalIncomeAmount = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (DOM.incomeTableFoot) {
      DOM.incomeTableFoot.innerHTML = incomes.length === 0 ? '' : `
        <tr style="background: var(--bg-tertiary); font-weight: bold;">
          <td colspan="3" class="text-right" style="text-align: right; padding-right: 1rem;">Total:</td>
          <td class="text-emerald">${formatEUR(totalIncomeAmount)}</td>
          <td colspan="2"></td>
        </tr>
      `;
    }

    // 3. Fixed / Recurring Items Table
    const recurringMap = new Map();
    appState.items.filter(i => i.isRecurring).forEach(item => {
      const key = item.recurringKey || (`${item.type}_${item.title.toLowerCase().trim()}`);
      if (!recurringMap.has(key)) {
        recurringMap.set(key, { ...item, recurringKey: key });
      }
    });
    const recurringList = Array.from(recurringMap.values());
    if (DOM.recurringCount) DOM.recurringCount.textContent = recurringList.length;

    if (DOM.recurringTableBody) {
      DOM.recurringTableBody.innerHTML = recurringList.length === 0
        ? `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:1.5rem;">No fixed recurring items defined yet. Use the "Add Fixed Recurring Item" button above to add fixed expenses like Rent or Utilities.</td></tr>`
        : recurringList.map(item => {
          const catMeta = CATEGORY_META[item.category] || (item.type === 'income' ? CATEGORY_META.other_income : CATEGORY_META.other_expense);
          const amount = Number(item.amount) || 0;
          const budget = Number(item.budgetLimit) || 0;
          const total9Months = amount * MONTH_KEYS.length;
          const isIncome = item.type === 'income';

          return `
            <tr>
              <td>
                <span class="status-chip ${isIncome ? 'chip-safe' : 'chip-warn'}">
                  ${isIncome ? '📥 Income' : '📤 Expense'}
                </span>
              </td>
              <td>
                <span class="category-badge" style="border-left: 3px solid ${catMeta.color}">
                  <span>${catMeta.icon}</span>
                  <span>${catMeta.name}</span>
                </span>
              </td>
              <td>
                <strong>${escapeHtml(item.title)}</strong>
                <span class="badge-recurring">🔁 All 9 Months</span>
              </td>
              <td><strong class="${isIncome ? 'text-emerald' : ''}">${formatEUR(amount)} / mo</strong></td>
              <td>${budget > 0 ? formatEUR(budget) : '<span style="color:var(--text-muted)">—</span>'}</td>
              <td><strong>${formatEUR(total9Months)}</strong></td>
              <td class="text-right">
                <div class="table-row-actions">
                  <button class="action-btn" title="Edit amount for ALL 9 months" onclick="window.SakuraApp.editRecurring('${item.recurringKey}')">✏️</button>
                  <button class="action-btn delete-btn" title="Delete from ALL 9 months" onclick="window.SakuraApp.deleteRecurring('${item.recurringKey}')">🗑️</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
    }

    // 3. 9-Month Full Roadmap Table
    DOM.roadmapTableBody.innerHTML = calc.monthStats.map(stat => {
      const isActive = stat.key === calc.activeMonth;
      const isDep = stat.name.isDeparture;
      const netSign = stat.netSavings >= 0 ? '+' : '';
      const rowClass = isActive ? 'active-month-row' : (isDep ? 'departure-month-row' : '');

      return `
        <tr class="${rowClass}">
          <td>
            <strong>${stat.name.full}</strong> ${isDep ? '🎯' : ''} ${isActive ? '<span class="status-chip chip-safe" style="font-size:0.65rem">Active</span>' : ''}
          </td>
          <td class="text-emerald">${formatEUR(stat.incomeTotal)}</td>
          <td class="text-rose">${formatEUR(stat.expenseTotal)}</td>
          <td><strong style="color:${stat.netSavings >= 0 ? 'var(--brand-indigo)' : 'var(--brand-rose)'}">${netSign}${formatEUR(stat.netSavings)}</strong></td>
          <td><strong>${formatEUR(stat.runningBalance)}</strong></td>
          <td>${formatEUR(stat.idealTarget)}</td>
          <td>
            ${stat.netSavings < 0
          ? `<span class="status-chip chip-danger">🚨 Overspending</span>`
          : (stat.isOnTrack
            ? `<span class="status-chip chip-safe">✅ On Track</span>`
            : `<span class="status-chip chip-warn">⚠️ Pace Deficit</span>`)}
          </td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm" onclick="window.SakuraApp.selectMonth('${stat.key}')">View / Plan</button>
          </td>
        </tr>
      `;
    }).join('');

    // 4. Category Budgets (For Active Month)
    const activeStats = calc.activeData;
    const allCatKeys = Object.keys(activeStats.categoryTotals);
    const budgetedKeys = allCatKeys.filter(k => !activeStats.categoryTotals[k].isExcluded);
    const excludedKeys = allCatKeys.filter(k => activeStats.categoryTotals[k].isExcluded);

    if (allCatKeys.length === 0) {
      DOM.categoryBudgetsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:2rem;">No category expenses recorded for ${activeStats.name.full}.</div>`;
    } else {
      const renderCard = (key, isExcluded) => {
        const meta = CATEGORY_META[key] || CATEGORY_META.other_expense;
        const data = activeStats.categoryTotals[key];
        const isExceeded = !isExcluded && data.budget > 0 && data.spent > data.budget;
        const fillPercent = !isExcluded && data.budget > 0 ? Math.min(100, (data.spent / data.budget) * 100) : (data.spent > 0 ? 100 : 0);
        const excess = data.spent - data.budget;
        const remaining = data.budget - data.spent;

        let statusChipHtml = '';
        if (isExcluded) {
          statusChipHtml = `<span class="status-chip chip-neutral" style="color:var(--text-muted)">Milestone (No ceiling)</span>`;
        } else if (isExceeded) {
          statusChipHtml = `<span class="status-chip chip-danger">⚠️ +${formatEUR(excess)} OVER</span>`;
        } else if (data.budget > 0) {
          statusChipHtml = `<span class="status-chip chip-safe">${fillPercent.toFixed(0)}% used</span>`;
        } else if (data.spent > 0) {
          statusChipHtml = `<span class="status-chip chip-warn">No Budget Set</span>`;
        } else {
          statusChipHtml = `<span class="status-chip" style="color:var(--text-muted)">Unused</span>`;
        }

        return `
          <div class="category-budget-card ${isExceeded ? 'budget-exceeded' : ''} ${isExcluded ? 'is-excluded' : ''}"
            style="cursor: pointer;" onclick="window.SakuraApp.openCategoryBudgetsModal('${key}')"
            title="Click to configure budget for ${meta.name}">
            <div class="cat-card-header">
              <div class="cat-card-title">
                <span>${meta.icon}</span>
                <span>${meta.name}</span>
              </div>
              <div>
                ${statusChipHtml}
              </div>
            </div>

            <div class="cat-progress-bar-bg">
              <div class="cat-progress-bar-fill" style="width: ${fillPercent}%; background: ${isExcluded ? 'var(--text-muted)' : (isExceeded ? 'var(--brand-crimson)' : meta.color)};"></div>
            </div>

            <div class="cat-card-numbers">
              <span>Spent: <strong>${formatEUR(data.spent)}</strong></span>
              <span>Budget: <strong>${!isExcluded && data.budget > 0 ? formatEUR(data.budget) + '/mo' : (isExcluded ? 'Excluded' : 'None')}</strong></span>
            </div>
            <div class="cat-card-numbers" style="margin-top: -0.2rem; font-size: 0.69rem;">
              <span>${isExcluded ? '<span style="color:var(--text-muted)">Milestone expense</span>' : (isExceeded ? `<span style="color:var(--cli-red)">Over by ${formatEUR(excess)}</span>` : (data.budget > 0 ? `<span style="color:var(--cli-green)">Remaining: ${formatEUR(remaining)}</span>` : '<span style="color:var(--text-muted)">No monthly limit</span>'))}</span>
              <span style="color: var(--cli-blue); text-decoration: underline;">⚙️ Configure</span>
            </div>
          </div>
        `;
      };

      let gridHtml = budgetedKeys.map(k => renderCard(k, false)).join('');

      if (excludedKeys.length > 0) {
        gridHtml += `
          <div class="category-budgets-section-divider">
            <span>✈️ Milestone &amp; Excluded Categories (No Monthly Ceiling)</span>
          </div>
        `;
        gridHtml += excludedKeys.map(k => renderCard(k, true)).join('');
      }

      DOM.categoryBudgetsGrid.innerHTML = gridHtml;
    }
  }

  // --------------------------------------------------------------------------
  // Master Render Function
  // --------------------------------------------------------------------------
  function renderApp() {
    const calc = calculate9MonthSchedule();

    // Theme sync
    document.documentElement.setAttribute('data-theme', appState.settings.theme);
    DOM.themeToggleBtn.querySelector('.theme-icon').textContent = appState.settings.theme === 'dark' ? '🌙' : '☀️';

    renderHero(calc);
    renderAlerts(calc);
    renderMonthStrip(calc);
    renderActiveMonthMetrics(calc);
    renderTrajectoryChart(calc);
    renderCategoryDonut(calc);
    renderTables(calc);
  }

  // --------------------------------------------------------------------------
  // Modals & User Actions Handlers
  // --------------------------------------------------------------------------
  function initModals() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dialogId = btn.getAttribute('data-close');
        const dialog = document.getElementById(dialogId);
        if (dialog) dialog.close();
      });
    });

    document.querySelectorAll('dialog').forEach(dialog => {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    });

    // Edit Goal Modal
    DOM.editGoalBtn.addEventListener('click', () => {
      DOM.inputSavingsGoal.value = appState.settings.savingsGoal;
      DOM.inputCurrentSaved.value = appState.settings.initialSaved;
      DOM.goalModal.showModal();
    });

    DOM.goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      appState.settings.savingsGoal = Number(DOM.inputSavingsGoal.value) || 6500;
      appState.settings.initialSaved = Number(DOM.inputCurrentSaved.value) || 2800;
      saveState();
      DOM.goalModal.close();
      renderApp();
    });

    // Adjust Initial Saved Modal
    DOM.quickAddSavedBtn.addEventListener('click', () => {
      DOM.quickAddAmount.value = appState.settings.initialSaved;
      DOM.quickAddModal.showModal();
    });

    DOM.quickAddModal.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.quickAddAmount.value = chip.getAttribute('data-set');
      });
    });

    DOM.quickAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = Number(DOM.quickAddAmount.value);
      if (!isNaN(val) && val >= 0) {
        appState.settings.initialSaved = val;
        saveState();
        DOM.quickAddModal.close();
        renderApp();
      }
    });

    // Add Item to active month
    DOM.addAdvanceItemBtn.addEventListener('click', () => {
      openTransactionModal(null, appState.settings.activeMonth);
    });

    DOM.addTransactionBtn.addEventListener('click', () => {
      openTransactionModal(null, appState.settings.activeMonth);
    });

    if (DOM.addFixedItemDirectBtn) {
      DOM.addFixedItemDirectBtn.addEventListener('click', () => {
        openTransactionModal(null, null, true);
      });
    }

    // Toggle frequency options (Recurring vs Single Month)
    if (DOM.freqRecurring && DOM.freqSingle) {
      DOM.freqRecurring.addEventListener('change', () => {
        if (DOM.monthSelectGroup) DOM.monthSelectGroup.style.display = 'none';
        if (DOM.freqHelperText) DOM.freqHelperText.textContent = 'Fixed items (like Rent or Salary) automatically repeat every month from Oct 2026 to Jun 2027.';
      });
      DOM.freqSingle.addEventListener('change', () => {
        if (DOM.monthSelectGroup) DOM.monthSelectGroup.style.display = 'flex';
        if (DOM.freqHelperText) DOM.freqHelperText.textContent = 'One-off items apply only to the selected month.';
      });
    }

    document.querySelectorAll('input[name="txType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateTxModalCategories(e.target.value);
      });
    });

    DOM.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTransactionFromModal();
    });

    // GitHub Gist Cloud Sync Modal
    function openSyncModal() {
      const cfg = getSyncConfig();
      setSyncFeedback('', '');
      if (cfg) {
        if (DOM.inputGistId) DOM.inputGistId.value = cfg.gistId || '';
        if (DOM.inputGithubToken) DOM.inputGithubToken.value = cfg.token || '';
      }
      updateSyncUI(cfg && cfg.gistId && cfg.token ? (cfg.lastSyncedAt ? 'synced' : 'off') : 'off');
      if (DOM.syncModal) {
        try {
          if (!DOM.syncModal.open) {
            DOM.syncModal.showModal();
          }
        } catch (err) {
          console.warn('showModal fallback:', err);
          DOM.syncModal.setAttribute('open', '');
        }
      }
    }

    if (DOM.syncModalBtn) {
      DOM.syncModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSyncModal();
      });
    }

    if (DOM.toggleTokenVisibilityBtn && DOM.inputGithubToken) {
      DOM.toggleTokenVisibilityBtn.addEventListener('click', () => {
        const isPassword = DOM.inputGithubToken.type === 'password';
        DOM.inputGithubToken.type = isPassword ? 'text' : 'password';
        DOM.toggleTokenVisibilityBtn.textContent = isPassword ? '🙈' : '👁️';
      });
    }

    if (DOM.syncConfigForm) {
      DOM.syncConfigForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawGistId = (DOM.inputGistId ? DOM.inputGistId.value : '').trim();
        const rawToken = (DOM.inputGithubToken ? DOM.inputGithubToken.value : '').trim();

        const gistId = cleanGistId(rawGistId);
        const token = cleanToken(rawToken);

        if (!token) {
          setSyncFeedback('error', 'Please enter your GitHub Personal Access Token.');
          if (DOM.inputGithubToken) DOM.inputGithubToken.focus();
          return;
        }

        if (!gistId) {
          // If no Gist ID entered, auto-create a Secret Gist!
          setSyncFeedback('info', 'No Gist ID entered. Automatically creating a private Secret Gist for you...');
          try {
            const newGistId = await createSecretGist(token);
            if (DOM.inputGistId) DOM.inputGistId.value = newGistId;
            const cfg = getSyncConfig() || {};
            cfg.gistId = newGistId;
            cfg.token = token;
            cfg.lastSyncedAt = new Date().toISOString();
            saveSyncConfig(cfg);
            updateSyncUI('synced', `Synced: ${new Date().toLocaleTimeString()}`);
            setSyncFeedback('success', `✓ Created new Secret Gist (ID: ${newGistId}) and uploaded your budget!`);
            return;
          } catch (err) {
            setSyncFeedback('error', `Failed to create Gist: ${err.message}`);
            return;
          }
        }

        if (DOM.inputGistId) DOM.inputGistId.value = gistId;
        if (DOM.inputGithubToken) DOM.inputGithubToken.value = token;

        const currentCfg = getSyncConfig() || {};
        currentCfg.gistId = gistId;
        currentCfg.token = token;
        saveSyncConfig(currentCfg);

        // Test connection by pulling latest from Gist or pushing
        await syncPull(true);
      });
    }

    if (DOM.autoCreateGistBtn) {
      DOM.autoCreateGistBtn.addEventListener('click', async () => {
        const rawToken = (DOM.inputGithubToken ? DOM.inputGithubToken.value : '').trim();
        const token = cleanToken(rawToken);

        if (!token) {
          setSyncFeedback('error', 'Please paste your GitHub Personal Access Token first so we can create the Gist on your account.');
          if (DOM.inputGithubToken) DOM.inputGithubToken.focus();
          return;
        }

        setSyncFeedback('info', 'Creating a private Secret Gist on your GitHub account...');
        try {
          const newGistId = await createSecretGist(token);
          if (DOM.inputGistId) DOM.inputGistId.value = newGistId;
          const cfg = getSyncConfig() || {};
          cfg.gistId = newGistId;
          cfg.token = token;
          cfg.lastSyncedAt = new Date().toISOString();
          saveSyncConfig(cfg);
          updateSyncUI('synced', `Synced: ${new Date().toLocaleTimeString()}`);
          setSyncFeedback('success', `✓ Successfully created Secret Gist (ID: ${newGistId}) and synced your budget!`);
        } catch (err) {
          setSyncFeedback('error', `Failed to create Gist: ${err.message}`);
        }
      });
    }

    if (DOM.disconnectSyncBtn) {
      DOM.disconnectSyncBtn.addEventListener('click', () => {
        if (confirm('Disconnect GitHub Gist Cloud Sync? Your local budget data will NOT be deleted, but auto-syncing will stop.')) {
          clearSyncConfig();
          if (DOM.inputGistId) DOM.inputGistId.value = '';
          if (DOM.inputGithubToken) DOM.inputGithubToken.value = '';
          setSyncFeedback('info', 'Disconnected from GitHub Gist.');
          updateSyncUI('off');
        }
      });
    }

    if (DOM.manualPullBtn) {
      DOM.manualPullBtn.addEventListener('click', () => {
        syncPull(true);
      });
    }

    if (DOM.manualPushBtn) {
      DOM.manualPushBtn.addEventListener('click', () => {
        syncPush(true);
      });
    }

    // Category-Level Monthly Budgets Modal Events
    if (DOM.categoryBudgetsForm) {
      DOM.categoryBudgetsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newBudgets = {};
        const newExcluded = [];
        if (DOM.categoryBudgetsInputsContainer) {
          DOM.categoryBudgetsInputsContainer.querySelectorAll('.category-budget-input-item').forEach(item => {
            const cb = item.querySelector('.cat-exclude-checkbox');
            const inp = item.querySelector('.category-budget-input');
            const cat = inp.name;
            const val = Number(inp.value) || 0;
            newBudgets[cat] = Math.max(0, val);
            if (cb && !cb.checked) {
              newExcluded.push(cat);
            }
          });
        }
        appState.categoryBudgets = newBudgets;
        if (!appState.settings) appState.settings = {};
        appState.settings.excludedCategories = newExcluded;
        saveState();
        if (DOM.categoryBudgetsModal) DOM.categoryBudgetsModal.close();
        renderApp();
      });
    }

    if (DOM.openCategoryBudgetsModalBtn) {
      DOM.openCategoryBudgetsModalBtn.addEventListener('click', () => {
        openCategoryBudgetsModal();
      });
    }

    if (DOM.heroCategoryBudgetsBtn) {
      DOM.heroCategoryBudgetsBtn.addEventListener('click', () => {
        openCategoryBudgetsModal();
      });
    }

    if (DOM.txCategory) {
      DOM.txCategory.addEventListener('change', () => {
        updateTxCategoryHint();
      });
    }
  }

  function updateCategoryBudgetsModalTotal() {
    if (!DOM.categoryBudgetsInputsContainer || !DOM.categoryBudgetsTotalDisplay) return;
    let sum = 0;
    DOM.categoryBudgetsInputsContainer.querySelectorAll('.category-budget-input-item').forEach(item => {
      const cb = item.querySelector('.cat-exclude-checkbox');
      const inp = item.querySelector('.category-budget-input');
      if (cb && cb.checked && inp) {
        sum += Number(inp.value) || 0;
      }
    });
    DOM.categoryBudgetsTotalDisplay.textContent = `${formatEUR(sum)} / month`;
  }

  function openCategoryBudgetsModal(focusCatKey = null) {
    if (!DOM.categoryBudgetsInputsContainer || !DOM.categoryBudgetsModal) return;

    const catBudgets = appState.categoryBudgets || DEFAULT_CATEGORY_BUDGETS;
    const excludedCats = (appState.settings && Array.isArray(appState.settings.excludedCategories))
      ? appState.settings.excludedCategories
      : DEFAULT_EXCLUDED_CATEGORIES;

    const expenseCategories = Object.keys(CATEGORY_META).filter(cat =>
      !['salary', 'freelance', 'tutoring', 'gift', 'other_income'].includes(cat)
    );

    DOM.categoryBudgetsInputsContainer.innerHTML = expenseCategories.map(catKey => {
      const meta = CATEGORY_META[catKey] || CATEGORY_META.other_expense;
      const isExcluded = excludedCats.includes(catKey);
      const currentVal = catBudgets[catKey] !== undefined ? catBudgets[catKey] : (DEFAULT_CATEGORY_BUDGETS[catKey] || 0);

      return `
        <div class="category-budget-input-item ${isExcluded ? 'is-excluded' : ''}" id="cat_budget_item_${catKey}">
          <div class="category-budget-input-header">
            <label class="category-budget-input-label" for="cat_budget_${catKey}">
              <span>${meta.icon}</span>
              <span>${meta.name}</span>
            </label>
            <label class="category-exclude-toggle" title="Toggle monthly budget ceiling for ${meta.name}">
              <input type="checkbox" class="cat-exclude-checkbox" data-cat="${catKey}" ${!isExcluded ? 'checked' : ''}>
              <span class="cat-toggle-text ${!isExcluded ? 'is-active' : 'is-excluded'}">${!isExcluded ? 'Budgeted' : 'Excluded'}</span>
            </label>
          </div>
          <div class="input-with-addon" style="${isExcluded ? 'opacity: 0.45; pointer-events: none;' : ''}">
            <input type="number" id="cat_budget_${catKey}" name="${catKey}" min="0" step="10"
              class="form-control category-budget-input" value="${currentVal}" ${isExcluded ? 'disabled' : ''}>
            <span class="input-addon">€/mo</span>
          </div>
          <div class="category-budget-subtext">
            ${isExcluded
              ? '<span style="color:var(--text-muted)">Excluded from monthly ceiling &amp; warnings</span>'
              : '<span style="color:var(--cli-green)">Active monthly pool</span>'}
          </div>
        </div>
      `;
    }).join('');

    updateCategoryBudgetsModalTotal();

    // Dynamically calculate and update total pool as inputs and toggles change
    DOM.categoryBudgetsInputsContainer.querySelectorAll('.cat-exclude-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const item = cb.closest('.category-budget-input-item');
        const inputWrap = item.querySelector('.input-with-addon');
        const input = item.querySelector('.category-budget-input');
        const badge = item.querySelector('.cat-toggle-text');
        const subtext = item.querySelector('.category-budget-subtext');

        if (cb.checked) {
          item.classList.remove('is-excluded');
          inputWrap.style.opacity = '1';
          inputWrap.style.pointerEvents = 'auto';
          input.disabled = false;
          badge.textContent = 'Budgeted';
          badge.className = 'cat-toggle-text is-active';
          subtext.innerHTML = '<span style="color:var(--cli-green)">Active monthly pool</span>';
        } else {
          item.classList.add('is-excluded');
          inputWrap.style.opacity = '0.45';
          inputWrap.style.pointerEvents = 'none';
          input.disabled = true;
          badge.textContent = 'Excluded';
          badge.className = 'cat-toggle-text is-excluded';
          subtext.innerHTML = '<span style="color:var(--text-muted)">Excluded from monthly ceiling &amp; warnings</span>';
        }
        updateCategoryBudgetsModalTotal();
      });
    });

    DOM.categoryBudgetsInputsContainer.querySelectorAll('.category-budget-input').forEach(inp => {
      inp.addEventListener('input', updateCategoryBudgetsModalTotal);
    });

    try {
      DOM.categoryBudgetsModal.showModal();
    } catch (e) {
      DOM.categoryBudgetsModal.setAttribute('open', '');
    }

    if (focusCatKey) {
      const targetInput = document.getElementById(`cat_budget_${focusCatKey}`);
      if (targetInput) {
        setTimeout(() => {
          targetInput.focus();
          targetInput.select();
        }, 50);
      }
    }
  }

  function updateTxCategoryHint() {
    if (!DOM.txCategoryHint || !DOM.txCategory) return;
    const selCat = DOM.txCategory.value;
    const typeRadio = document.querySelector('input[name="txType"]:checked');
    const type = typeRadio ? typeRadio.value : 'expense';

    if (type !== 'expense') {
      DOM.txCategoryHint.innerHTML = '';
      return;
    }

    const excludedCats = (appState.settings && Array.isArray(appState.settings.excludedCategories))
      ? appState.settings.excludedCategories
      : DEFAULT_EXCLUDED_CATEGORIES;

    if (excludedCats.includes(selCat)) {
      DOM.txCategoryHint.innerHTML = '<span style="color:var(--cli-blue)">ℹ️ Milestone category (excluded from monthly budget ceiling &amp; overrun warnings)</span>';
    } else {
      DOM.txCategoryHint.innerHTML = '<span style="color:var(--text-muted)">✓ Active living budget (draws from monthly pool)</span>';
    }
  }

  function updateTxModalCategories(type) {
    DOM.txCategory.innerHTML = '';
    const relevantKeys = Object.keys(CATEGORY_META).filter(key => {
      if (type === 'income') return key.includes('salary') || key.includes('freelance') || key.includes('tutoring') || key.includes('gift') || key === 'other_income';
      return !key.includes('salary') && !key.includes('freelance') && !key.includes('tutoring') && !key.includes('gift') && key !== 'other_income';
    });

    relevantKeys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `${CATEGORY_META[k].icon} ${CATEGORY_META[k].name}`;
      DOM.txCategory.appendChild(opt);
    });

    if (DOM.txAmountLabel) {
      DOM.txAmountLabel.textContent = type === 'expense' ? 'Planned Expense Amount (€):' : 'Planned Income Amount (€):';
    }

    updateTxCategoryHint();
  }

  function openTransactionModal(existingItem = null, defaultMonth = null, forceFixed = false) {
    const targetMonth = defaultMonth || appState.settings.activeMonth || '2026-10';

    if (existingItem) {
      DOM.txModalTitle.textContent = '✏️ Edit Budget Item';
      DOM.txId.value = existingItem.id;
      DOM.txRecurringKey.value = existingItem.recurringKey || '';
      DOM.txMonth.value = existingItem.month;
      DOM.txTitle.value = existingItem.title;
      DOM.txAmount.value = existingItem.amount;

      const radio = document.querySelector(`input[name="txType"][value="${existingItem.type}"]`);
      if (radio) radio.checked = true;

      updateTxModalCategories(existingItem.type);
      DOM.txCategory.value = existingItem.category;

      // Edit Scope: Show option to update ALL 9 months vs this single month
      if (DOM.frequencyGroup) DOM.frequencyGroup.style.display = 'none';
      if (DOM.monthSelectGroup) DOM.monthSelectGroup.style.display = 'none';
      if (DOM.editScopeGroup) {
        DOM.editScopeGroup.style.display = 'flex';
        // Default to updating ALL 9 months if it's recurring or housing/rent
        if (existingItem.isRecurring || ['housing', 'utilities'].includes(existingItem.category)) {
          if (DOM.editScopeAll) DOM.editScopeAll.checked = true;
        } else {
          if (DOM.editScopeSingle) DOM.editScopeSingle.checked = true;
        }
      }
    } else {
      DOM.txModalTitle.textContent = forceFixed ? '➕ Add Fixed Recurring Item' : '➕ Add Budget Item';
      DOM.txId.value = '';
      DOM.txRecurringKey.value = '';
      DOM.txMonth.value = targetMonth;
      DOM.txTitle.value = '';
      DOM.txAmount.value = '';

      if (DOM.editScopeGroup) DOM.editScopeGroup.style.display = 'none';
      if (DOM.frequencyGroup) DOM.frequencyGroup.style.display = 'flex';

      // Default to recurring fixed expense
      if (DOM.freqRecurring) DOM.freqRecurring.checked = true;
      if (DOM.monthSelectGroup) DOM.monthSelectGroup.style.display = 'none';

      document.getElementById('typeExpense').checked = true;
      updateTxModalCategories('expense');
    }

    DOM.transactionModal.showModal();
  }

  function saveTransactionFromModal() {
    const existingId = DOM.txId.value;
    const type = document.querySelector('input[name="txType"]:checked').value;
    const month = DOM.txMonth.value || appState.settings.activeMonth || '2026-10';
    const title = DOM.txTitle.value.trim();
    const category = DOM.txCategory.value;
    const amount = Number(DOM.txAmount.value) || 0;

    let updateAllMonths = false;
    let existingItem = null;

    if (existingId) {
      existingItem = appState.items.find(i => i.id === existingId);
      updateAllMonths = DOM.editScopeAll && DOM.editScopeAll.checked;
    } else {
      updateAllMonths = DOM.freqRecurring && DOM.freqRecurring.checked;
    }

    if (updateAllMonths) {
      // Find or generate a unique recurring key
      const recKey = (existingItem && existingItem.recurringKey)
        || DOM.txRecurringKey.value
        || ('rec_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now());

      // Update or insert for ALL 9 months
      MONTH_KEYS.forEach(mKey => {
        const existingIdx = appState.items.findIndex(i =>
          i.month === mKey && (
            (recKey && i.recurringKey === recKey) ||
            (existingItem && i.title.toLowerCase() === existingItem.title.toLowerCase() && i.type === existingItem.type) ||
            (i.title.toLowerCase() === title.toLowerCase() && i.type === type)
          )
        );

        if (existingIdx >= 0) {
          appState.items[existingIdx].title = title;
          appState.items[existingIdx].category = category;
          appState.items[existingIdx].amount = amount;
          appState.items[existingIdx].isRecurring = true;
          appState.items[existingIdx].recurringKey = recKey;
        } else {
          appState.items.push({
            id: `item_${Date.now()}_${mKey}`,
            month: mKey,
            type,
            title,
            category,
            amount,
            isRecurring: true,
            recurringKey: recKey
          });
        }
      });
    } else {
      // Update single month item
      if (existingId) {
        const index = appState.items.findIndex(i => i.id === existingId);
        if (index >= 0) {
          appState.items[index] = {
            ...appState.items[index],
            month,
            type,
            title,
            category,
            amount,
            isRecurring: false
          };
        }
      } else {
        appState.items.push({
          id: `item_${Date.now()}`,
          month,
          type,
          title,
          category,
          amount,
          isRecurring: false
        });
      }
    }

    saveState();
    DOM.transactionModal.close();
    renderApp();
  }

  // --------------------------------------------------------------------------
  // Tab Switching
  // --------------------------------------------------------------------------
  function initTabs() {
    const tabs = [DOM.tabExpenses, DOM.tabIncome, DOM.tabRecurring, DOM.tabRoadmap, DOM.tabBudgets];
    const panels = [DOM.panelExpenses, DOM.panelIncome, DOM.panelRecurring, DOM.panelRoadmap, DOM.panelBudgets];

    tabs.forEach(tab => {
      if (!tab) return;
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          if (t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          }
        });
        panels.forEach(p => {
          if (p) p.classList.remove('active');
        });

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const target = tab.getAttribute('data-tab');
        if (target === 'expenses' && DOM.panelExpenses) DOM.panelExpenses.classList.add('active');
        else if (target === 'income' && DOM.panelIncome) DOM.panelIncome.classList.add('active');
        else if (target === 'recurring' && DOM.panelRecurring) DOM.panelRecurring.classList.add('active');
        else if (target === 'roadmap' && DOM.panelRoadmap) DOM.panelRoadmap.classList.add('active');
        else if (target === 'budgets' && DOM.panelBudgets) DOM.panelBudgets.classList.add('active');
      });
    });
  }

  // --------------------------------------------------------------------------
  // Global Event Listeners
  // --------------------------------------------------------------------------
  function initEvents() {
    // Theme toggle
    DOM.themeToggleBtn.addEventListener('click', () => {
      appState.settings.theme = appState.settings.theme === 'dark' ? 'light' : 'dark';
      saveState();
      renderApp();
    });

    // Preset Example schedule
    DOM.presetBtn.addEventListener('click', () => {
      if (confirm('Load realistic 9-month Japan WHV example schedule? (This will overwrite current inputs with a fresh 9-month schedule)')) {
        appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        saveState();
        renderApp();
      }
    });

    // Donut scope toggle
    DOM.donutScopeSelect.addEventListener('change', () => {
      renderCategoryDonut(calculate9MonthSchedule());
    });

    // Table filters
    DOM.tableMonthFilterSelect.addEventListener('change', () => {
      renderTables(calculate9MonthSchedule());
    });
    DOM.filterSearchInput.addEventListener('input', () => {
      renderTables(calculate9MonthSchedule());
    });

    // Export Data
    DOM.exportDataBtn.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `SakuraBudget_EUR_9Months_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Import Data
    DOM.importDataBtn.addEventListener('click', () => {
      DOM.importFileInput.click();
    });

    DOM.importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed && parsed.settings && parsed.items) {
            appState = parsed;
            saveState();
            renderApp();
            alert('9-Month Budget schedule successfully imported!');
          } else {
            alert('Invalid JSON budget file format.');
          }
        } catch (err) {
          alert('Failed to read file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    // Reset Defaults
    DOM.resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Reset all budget data to default? This will clear customizations.')) {
        localStorage.removeItem(STORAGE_KEY);
        appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        renderApp();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }

  // --------------------------------------------------------------------------
  // Expose Actions for Global onclick Handlers
  // --------------------------------------------------------------------------
  window.SakuraApp = {
    selectMonth: function (monthKey) {
      if (MONTH_KEYS.includes(monthKey)) {
        appState.settings.activeMonth = monthKey;
        saveState();
        renderApp();
      }
    },
    editItem: function (id) {
      const item = appState.items.find(i => i.id === id);
      if (item) openTransactionModal(item);
    },
    deleteItem: function (id) {
      const item = appState.items.find(i => i.id === id);
      if (item && confirm(`Delete "${item.title}" for ${MONTH_NAMES[item.month]?.full}?`)) {
        appState.items = appState.items.filter(i => i.id !== id);
        saveState();
        renderApp();
      }
    },
    editRecurring: function (recKey) {
      const item = appState.items.find(i => i.recurringKey === recKey)
        || appState.items.find(i => (i.recurringKey || `${i.type}_${(i.title || '').toLowerCase().trim()}`) === recKey);
      if (item) {
        openTransactionModal(item);
        if (DOM.editScopeAll) DOM.editScopeAll.checked = true;
      }
    },
    deleteRecurring: function (recKey) {
      const item = appState.items.find(i => i.recurringKey === recKey)
        || appState.items.find(i => (i.recurringKey || `${i.type}_${(i.title || '').toLowerCase().trim()}`) === recKey);
      const title = item ? item.title : 'this fixed item';
      if (confirm(`Delete fixed recurring item "${title}" from ALL 9 months (Oct 2026 – Jun 2027)?`)) {
        appState.items = appState.items.filter(i => {
          if (i.recurringKey === recKey) return false;
          if (item && (i.title || '').toLowerCase().trim() === item.title.toLowerCase().trim() && i.type === item.type) return false;
          return true;
        });
        saveState();
        renderApp();
      }
    },
    switchToTab: function (tabKey) {
      if (tabKey === 'expenses' && DOM.tabExpenses) DOM.tabExpenses.click();
      else if (tabKey === 'income' && DOM.tabIncome) DOM.tabIncome.click();
      else if (tabKey === 'recurring' && DOM.tabRecurring) DOM.tabRecurring.click();
      else if (tabKey === 'roadmap' && DOM.tabRoadmap) DOM.tabRoadmap.click();
      else if (tabKey === 'budgets' && DOM.tabBudgets) DOM.tabBudgets.click();
    },
    openSyncModal: function () {
      const cfg = getSyncConfig();
      setSyncFeedback('', '');
      if (cfg) {
        if (DOM.inputGistId) DOM.inputGistId.value = cfg.gistId || '';
        if (DOM.inputGithubToken) DOM.inputGithubToken.value = cfg.token || '';
      }
      updateSyncUI(cfg && cfg.gistId && cfg.token ? (cfg.lastSyncedAt ? 'synced' : 'off') : 'off');
      if (DOM.syncModal) {
        try {
          if (!DOM.syncModal.open) DOM.syncModal.showModal();
        } catch (e) {
          DOM.syncModal.setAttribute('open', '');
        }
      }
    },
    openCategoryBudgetsModal: function (focusCatKey) {
      openCategoryBudgetsModal(focusCatKey);
    },
    syncPull: function (feedback) {
      return syncPull(feedback);
    },
    syncPush: function (feedback) {
      return syncPush(feedback);
    }
  };
  window.SakuraBudget = window.SakuraApp;

  // --------------------------------------------------------------------------
  // Initialize App
  // --------------------------------------------------------------------------
  function boot() {
    initTabs();
    initModals();
    initEvents();
    renderApp();

    // Initialize GitHub Gist Cloud Sync if configured
    const syncCfg = getSyncConfig();
    if (syncCfg && syncCfg.gistId && syncCfg.token) {
      updateSyncUI(syncCfg.lastSyncedAt ? 'synced' : 'syncing');
      syncPull(false);
    } else {
      updateSyncUI('off');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();

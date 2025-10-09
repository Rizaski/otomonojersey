(function() {
  const sampleData = [
    { id: 1, name: "Alice Johnson", role: "Admin", status: "Active" },
    { id: 2, name: "Bob Smith", role: "Editor", status: "Active" },
    { id: 3, name: "Charlie Rose", role: "Viewer", status: "Invited" },
    { id: 4, name: "Diana Prince", role: "Editor", status: "Suspended" },
    { id: 5, name: "Ethan Hunt", role: "Viewer", status: "Active" }
  ];

  function renderTableRows(rows) {
    const tbody = document.querySelector('#data-table tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(r => (
      `<tr>
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>${r.role}</td>
        <td>${r.status}</td>
      </tr>`
    )).join('');
  }

  function setYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const appFrame = document.querySelector('.app-frame');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mediaMobile = window.matchMedia('(max-width: 767.98px)');

    const openMobile = () => sidebar && sidebar.classList.add('open');
    const closeMobile = () => sidebar && sidebar.classList.remove('open');
    const toggle = () => {
      if (!sidebar) return;
      const icon = sidebarToggle ? sidebarToggle.querySelector('.material-symbols-outlined') : null;
      if (mediaMobile.matches) {
        sidebar.classList.toggle('open');
      } else {
        sidebar.classList.toggle('collapsed');
        if (appFrame) appFrame.classList.toggle('sidebar-collapsed');
      }
      if (icon) {
        icon.textContent = sidebar.classList.contains('collapsed') || sidebar.classList.contains('open') ? 'chevron_left' : 'menu_open';
      }
    };

    if (mobileMenu) mobileMenu.addEventListener('click', openMobile);
    if (sidebar) sidebar.addEventListener('click', (e) => {
      if (mediaMobile.matches && e.target === sidebar) closeMobile();
    });
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggle);
  }

  // Notifications & Profile helpers (shared across pages)
  function loadNotifications(){ try { return JSON.parse(localStorage.getItem('notifications')||'[]'); } catch { return []; } }
  function saveNotifications(list){ localStorage.setItem('notifications', JSON.stringify(list)); }
  function renderNotifications(){
    const listEl = document.getElementById('notifList');
    const dot = document.getElementById('notifDot');
    if (!listEl) return;
    const list = loadNotifications();
    listEl.innerHTML = list.length ? list.map((n, idx) => (
      `<li data-idx="${idx}" style="cursor:pointer; ${n.read?'' :'background: rgba(211,47,47,0.06);'}">
        <span class="dot ${n.type||'info'}"></span>
        <div>
          <div style="font-weight:600;">${n.title||'Notification'}</div>
          <div class="muted" style="font-size:12px;">${n.message||''}</div>
        </div>
      </li>`)).join('') : '<li class="muted" style="padding:8px 12px;">No notifications</li>';
    const unread = list.some(n => !n.read);
    if (dot) dot.style.display = unread ? 'inline-block' : 'none';

    // click to toggle read
    listEl.querySelectorAll('li[data-idx]').forEach(li => {
      li.addEventListener('click', () => {
        const i = Number(li.getAttribute('data-idx'));
        const items = loadNotifications();
        if (items[i]) { items[i].read = !items[i].read; saveNotifications(items); renderNotifications(); }
      });
    });
  }

  function setupNotifAndProfile(){
    const notifBtn = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    const notifMarkAll = document.getElementById('notifMarkAll');
    const notifClear = document.getElementById('notifClear');
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    const profileUserName = document.getElementById('profileUserName');
    const logoutLink = document.getElementById('logoutLink');

    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = notifPanel.classList.toggle('open');
        notifPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
        renderNotifications();
      });
      document.addEventListener('click', (e) => {
        if (notifPanel.classList.contains('open') && !notifPanel.contains(e.target) && e.target !== notifBtn) {
          notifPanel.classList.remove('open');
          notifPanel.setAttribute('aria-hidden', 'true');
        }
      });
      if (notifMarkAll) notifMarkAll.addEventListener('click', () => {
        const list = loadNotifications();
        list.forEach(n => n.read = true);
        saveNotifications(list);
        renderNotifications();
      });
      if (notifClear) notifClear.addEventListener('click', () => {
        saveNotifications([]);
        renderNotifications();
      });
      // helper to add a sample notification (exposed)
      window.addNotification = function(title, message, type='info'){
        const list = loadNotifications();
        list.unshift({ title, message, type, read: false, at: new Date().toISOString() });
        saveNotifications(list);
        renderNotifications();
      };
      // Ensure initial badge reflects data
      renderNotifications();
    }

    if (profileBtn && profileMenu) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = profileMenu.classList.toggle('open');
        profileBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        profileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
        
        // Load and display user name when profile menu opens
        if (open && profileUserName) {
          loadUserProfile();
        }
      });
      document.addEventListener('click', (e) => {
        if (profileMenu.classList.contains('open') && !profileMenu.contains(e.target) && e.target !== profileBtn) {
          profileMenu.classList.remove('open');
          profileBtn.setAttribute('aria-expanded', 'false');
          profileMenu.setAttribute('aria-hidden', 'true');
        }
      });
      if (logoutLink) logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('You have been logged out.');
        // Optional: clear pseudo auth state from localStorage
        localStorage.removeItem('authUser');
        profileMenu.classList.remove('open');
      });
    }
  }

  // Themed dialogs replacing window.alert/confirm
  function ensureModalRoot(){
    let root = document.getElementById('appModalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'appModalRoot';
      document.body.appendChild(root);
    }
    return root;
  }
  function themedAlert(message, title = 'Notice'){
    return new Promise((resolve)=>{
      const root = ensureModalRoot();
      root.innerHTML = `
        <div class="app-modal-backdrop open" id="appAlert">
          <div class="app-modal" role="dialog" aria-modal="true" aria-labelledby="appAlertTitle">
            <div class="app-modal-header" id="appAlertTitle">${title}</div>
            <div class="app-modal-body">${message}</div>
            <div class="app-modal-actions">
              <button class="btn-primary" id="appAlertOk">OK</button>
            </div>
          </div>
        </div>`;
      const close = () => { root.innerHTML=''; resolve(); };
      root.querySelector('#appAlertOk').addEventListener('click', close);
      root.querySelector('#appAlert').addEventListener('click', (e)=>{ if (e.target.id==='appAlert') close(); });
    });
  }
  function themedConfirm(message, title = 'Confirm'){
    return new Promise((resolve)=>{
      const root = ensureModalRoot();
      root.innerHTML = `
        <div class="app-modal-backdrop open" id="appConfirm2">
          <div class="app-modal" role="dialog" aria-modal="true" aria-labelledby="appConfirm2Title">
            <div class="app-modal-header" id="appConfirm2Title">${title}</div>
            <div class="app-modal-body">${message}</div>
            <div class="app-modal-actions">
              <button class="btn-secondary" id="appConfirm2Cancel">Cancel</button>
              <button class="btn-primary" id="appConfirm2Ok">OK</button>
            </div>
          </div>
        </div>`;
      const cleanup = (val) => { root.innerHTML=''; resolve(val); };
      root.querySelector('#appConfirm2Ok').addEventListener('click', ()=>cleanup(true));
      root.querySelector('#appConfirm2Cancel').addEventListener('click', ()=>cleanup(false));
      root.querySelector('#appConfirm2').addEventListener('click', (e)=>{ if (e.target.id==='appConfirm2') cleanup(false); });
    });
  }

  // Override globals
  window.alert = (msg) => { themedAlert(String(msg)); };
  window.confirm = (msg) => { console.warn('Use themedConfirm() for async confirm.'); return true; };
  window.themedAlert = themedAlert;
  window.themedConfirm = themedConfirm;

  document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    renderTableRows(sampleData);
    setYear();
    setupSidebarToggle();
    // Add scroll shadow to topbar per guideline
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const onScroll = () => {
        if (window.scrollY > 2) topbar.classList.add('scrolled');
        else topbar.classList.remove('scrolled');
      };
      document.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    // Setup shared Notification Center and Profile menu
    setupNotifAndProfile();

    // Search submit
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchOverlayInput = document.getElementById('searchOverlayInput');
    const searchOverlayClose = document.getElementById('searchOverlayClose');
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) {
          console.log('Search:', q);
        }
      });
    }
    if (mobileSearchBtn && searchOverlay && searchOverlayInput && searchOverlayClose) {
      const openOverlay = () => {
        searchOverlay.classList.add('open');
        searchOverlay.setAttribute('aria-hidden', 'false');
        setTimeout(() => searchOverlayInput.focus(), 0);
      };
      const closeOverlay = () => {
        searchOverlay.classList.remove('open');
        searchOverlay.setAttribute('aria-hidden', 'true');
      };
      mobileSearchBtn.addEventListener('click', openOverlay);
      searchOverlayClose.addEventListener('click', closeOverlay);
      searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) closeOverlay();
      });
    }

    // Apply settings/theme across pages and wire form if present
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      const nameEl = document.getElementById('pref_name');
      const emailEl = document.getElementById('pref_email');
      const themeEl = document.getElementById('pref_theme');

      function loadSettings(){ try { return JSON.parse(localStorage.getItem('appSettings')||'{}'); } catch { return {}; } }
      function saveSettings(s){ localStorage.setItem('appSettings', JSON.stringify(s)); }
      function loadUserProfile(){
        try {
          const settings = loadSettings();
          const userName = settings.displayName || 'Administrator';
          const profileUserName = document.getElementById('profileUserName');
          if (profileUserName) {
            profileUserName.textContent = userName;
          }
        } catch (e) {
          console.error('Error loading user profile:', e);
          const profileUserName = document.getElementById('profileUserName');
          if (profileUserName) {
            profileUserName.textContent = 'Administrator';
          }
        }
      }
      
      // Make loadUserProfile globally available
      window.loadUserProfile = loadUserProfile;
      function applyTheme(theme){
        const root = document.documentElement;
        if (theme === 'dark') {
          root.style.setProperty('--color-bg', '#121212');
          root.style.setProperty('--color-text', '#f5f5f5');
          root.style.setProperty('--color-text-secondary', '#c7c7c7');
          root.style.setProperty('--color-border', '#2a2a2a');
          root.style.setProperty('--color-hover', '#2b2323');
        } else {
          root.style.setProperty('--color-bg', '#FFFFFF');
          root.style.setProperty('--color-text', '#000000');
          root.style.setProperty('--color-text-secondary', '#444444');
          root.style.setProperty('--color-border', '#E0E0E0');
          root.style.setProperty('--color-hover', '#FFCDD2');
        }
      }

      const s = loadSettings();
      if (s.name) nameEl.value = s.name;
      if (s.email) emailEl.value = s.email;
      if (s.theme) themeEl.value = s.theme;
      applyTheme(s.theme || 'light');

      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const next = { name: nameEl.value.trim(), email: emailEl.value.trim(), theme: themeEl.value };
        saveSettings(next);
        applyTheme(next.theme);
        alert('Settings saved');
      });
    } else {
      // Non-settings pages still apply theme
      try {
        const s = JSON.parse(localStorage.getItem('appSettings')||'{}');
        const theme = s.theme || 'light';
        const root = document.documentElement;
        if (theme === 'dark') {
          root.style.setProperty('--color-bg', '#121212');
          root.style.setProperty('--color-text', '#f5f5f5');
          root.style.setProperty('--color-text-secondary', '#c7c7c7');
          root.style.setProperty('--color-border', '#2a2a2a');
          root.style.setProperty('--color-hover', '#2b2323');
        } else {
          root.style.setProperty('--color-bg', '#FFFFFF');
          root.style.setProperty('--color-text', '#000000');
          root.style.setProperty('--color-text-secondary', '#444444');
          root.style.setProperty('--color-border', '#E0E0E0');
          root.style.setProperty('--color-hover', '#FFCDD2');
        }
      } catch {}
    }
  });
})();



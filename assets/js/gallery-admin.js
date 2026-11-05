/**
 * Vadiva Creative Labs - Gallery Admin Panel Application
 * Full interactive controller supporting RBAC, Upload Manager, Media Library,
 * Albums, Categories & Tags, Featured Moments, Bulk Actions, Trash, and Settings.
 */

(function () {
  'use strict';

  // State
  const state = {
    currentTab: 'dashboard',
    libraryView: 'grid',         // 'grid' | 'table'
    libraryFilterType: 'all',
    libraryFilterStatus: 'all',
    libraryFilterAlbum: 'all',
    libraryFilterCategory: 'all',
    librarySearchQuery: '',
    librarySort: 'newest',
    selectedMediaIds: new Set(),
    activeEditingMediaId: null,
    activeEditingAlbumId: null,
    uploadQueue: []
  };

  // Cache
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    renderUserSession();
    renderTab(state.currentTab);
  }

  function cacheDom() {
    dom = {
      // Sidebar & Nav
      sidebar: document.getElementById('adminSidebar'),
      mobileToggle: document.getElementById('adminMobileToggle'),
      navItems: document.querySelectorAll('.admin-nav-item'),
      tabPanes: document.querySelectorAll('.admin-tab-pane'),
      userName: document.getElementById('adminUserName'),
      userRoleBadge: document.getElementById('adminUserRoleBadge'),
      userRoleSelect: document.getElementById('roleQuickSwitcher'),
      pageTitle: document.getElementById('adminPageTitle'),

      // Dashboard
      metricPhotos: document.getElementById('metricPhotos'),
      metricVideos: document.getElementById('metricVideos'),
      metricAlbums: document.getElementById('metricAlbums'),
      metricPublished: document.getElementById('metricPublished'),
      metricDrafts: document.getElementById('metricDrafts'),
      metricArchived: document.getElementById('metricArchived'),
      metricTrash: document.getElementById('metricTrash'),
      dashboardRecentUploads: document.getElementById('dashboardRecentUploads'),
      dashboardRecentAlbums: document.getElementById('dashboardRecentAlbums'),

      // Upload Manager
      dropzone: document.getElementById('uploadDropzone'),
      fileInput: document.getElementById('uploadFileInput'),
      uploadQueueContainer: document.getElementById('uploadQueueContainer'),
      uploadForm: document.getElementById('mediaUploadForm'),
      btnStartUpload: document.getElementById('btnStartUpload'),
      btnClearQueue: document.getElementById('btnClearQueue'),

      // Media Library
      librarySearch: document.getElementById('librarySearchInput'),
      libFilterType: document.getElementById('libFilterType'),
      libFilterStatus: document.getElementById('libFilterStatus'),
      libFilterAlbum: document.getElementById('libFilterAlbum'),
      libFilterCategory: document.getElementById('libFilterCategory'),
      libSort: document.getElementById('libSort'),
      btnViewGrid: document.getElementById('btnViewGrid'),
      btnViewTable: document.getElementById('btnViewTable'),
      mediaGridContainer: document.getElementById('adminMediaGridContainer'),
      mediaTableContainer: document.getElementById('adminMediaTableContainer'),
      mediaTableBody: document.getElementById('adminMediaTableBody'),
      selectAllCheckbox: document.getElementById('selectAllMediaCheckbox'),

      // Bulk Actions Bar
      bulkBar: document.getElementById('bulkActionBar'),
      bulkSelectedCount: document.getElementById('bulkSelectedCount'),
      btnBulkPublish: document.getElementById('btnBulkPublish'),
      btnBulkUnpublish: document.getElementById('btnBulkUnpublish'),
      btnBulkArchive: document.getElementById('btnBulkArchive'),
      btnBulkFeatured: document.getElementById('btnBulkFeatured'),
      btnBulkDelete: document.getElementById('btnBulkDelete'),
      btnBulkCancel: document.getElementById('btnBulkCancel'),
      bulkMoveAlbumSelect: document.getElementById('bulkMoveAlbumSelect'),

      // Albums
      albumsGrid: document.getElementById('adminAlbumsGrid'),
      btnCreateAlbum: document.getElementById('btnCreateAlbum'),

      // Categories & Tags
      categoriesTableBody: document.getElementById('categoriesTableBody'),
      tagsListContainer: document.getElementById('tagsListContainer'),
      btnAddCategory: document.getElementById('btnAddCategory'),
      btnAddTag: document.getElementById('btnAddTag'),
      newTagInput: document.getElementById('newTagInput'),

      // Featured Tab
      featuredItemsList: document.getElementById('featuredItemsList'),

      // Videos Tab
      videosTableBody: document.getElementById('videosTableBody'),

      // Trash Tab
      trashMediaTableBody: document.getElementById('trashMediaTableBody'),
      trashAlbumsList: document.getElementById('trashAlbumsList'),
      btnEmptyTrash: document.getElementById('btnEmptyTrash'),

      // Settings Tab
      settingsForm: document.getElementById('gallerySettingsForm'),
      btnExportDb: document.getElementById('btnExportDb'),
      btnImportDb: document.getElementById('btnImportDb'),
      btnResetDb: document.getElementById('btnResetDb'),

      // Team Tab
      teamTableBody: document.getElementById('teamTableBody'),
      btnAddTeamMember: document.getElementById('btnAddTeamMember'),

      // Modals
      mediaEditModal: document.getElementById('mediaEditModal'),
      albumEditModal: document.getElementById('albumEditModal'),
      categoryModal: document.getElementById('categoryModal'),
      teamModal: document.getElementById('teamModal'),
      previewModal: document.getElementById('previewModal')
    };
  }

  function bindEvents() {
    // Mobile sidebar toggle
    if (dom.mobileToggle) {
      dom.mobileToggle.addEventListener('click', () => {
        dom.sidebar.classList.toggle('mobile-open');
      });
    }

    // Navigation tab switching
    dom.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) switchTab(tab);
        if (dom.sidebar) dom.sidebar.classList.remove('mobile-open');
      });
    });

    // Quick Role Switcher
    if (dom.userRoleSelect) {
      dom.userRoleSelect.addEventListener('change', (e) => {
        switchRole(e.target.value);
      });
    }

    // --- Upload Dropzone ---
    if (dom.dropzone && dom.fileInput) {
      dom.dropzone.addEventListener('click', () => dom.fileInput.click());
      dom.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropzone.classList.add('dragover');
      });
      dom.dropzone.addEventListener('dragleave', () => {
        dom.dropzone.classList.remove('dragover');
      });
      dom.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropzone.classList.remove('dragover');
        handleFilesSelected(e.dataTransfer.files);
      });
      dom.fileInput.addEventListener('change', (e) => {
        handleFilesSelected(e.target.files);
      });
    }

    if (dom.btnClearQueue) {
      dom.btnClearQueue.addEventListener('click', () => {
        state.uploadQueue = [];
        renderUploadQueue();
      });
    }

    if (dom.btnStartUpload) {
      dom.btnStartUpload.addEventListener('click', handleUploadSubmit);
    }

    // --- Library View Toggle & Filters ---
    if (dom.btnViewGrid) {
      dom.btnViewGrid.addEventListener('click', () => {
        state.libraryView = 'grid';
        dom.btnViewGrid.classList.add('active');
        dom.btnViewTable.classList.remove('active');
        dom.mediaGridContainer.style.display = 'grid';
        dom.mediaTableContainer.style.display = 'none';
      });
    }
    if (dom.btnViewTable) {
      dom.btnViewTable.addEventListener('click', () => {
        state.libraryView = 'table';
        dom.btnViewTable.classList.add('active');
        dom.btnViewGrid.classList.remove('active');
        dom.mediaGridContainer.style.display = 'none';
        dom.mediaTableContainer.style.display = 'block';
      });
    }

    if (dom.librarySearch) {
      dom.librarySearch.addEventListener('input', (e) => {
        state.librarySearchQuery = e.target.value;
        renderMediaLibrary();
      });
    }
    if (dom.libFilterType) {
      dom.libFilterType.addEventListener('change', (e) => {
        state.libraryFilterType = e.target.value;
        renderMediaLibrary();
      });
    }
    if (dom.libFilterStatus) {
      dom.libFilterStatus.addEventListener('change', (e) => {
        state.libraryFilterStatus = e.target.value;
        renderMediaLibrary();
      });
    }
    if (dom.libFilterAlbum) {
      dom.libFilterAlbum.addEventListener('change', (e) => {
        state.libraryFilterAlbum = e.target.value;
        renderMediaLibrary();
      });
    }
    if (dom.libFilterCategory) {
      dom.libFilterCategory.addEventListener('change', (e) => {
        state.libraryFilterCategory = e.target.value;
        renderMediaLibrary();
      });
    }
    if (dom.libSort) {
      dom.libSort.addEventListener('change', (e) => {
        state.librarySort = e.target.value;
        renderMediaLibrary();
      });
    }

    // Select All Checkbox
    if (dom.selectAllCheckbox) {
      dom.selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const items = VadivaGalleryStore.getMedia({
          type: state.libraryFilterType,
          status: state.libraryFilterStatus,
          albumId: state.libraryFilterAlbum,
          categoryId: state.libraryFilterCategory,
          search: state.librarySearchQuery
        }, false);

        if (isChecked) {
          items.forEach(i => state.selectedMediaIds.add(i.id));
        } else {
          state.selectedMediaIds.clear();
        }
        updateBulkBar();
        renderMediaLibrary();
      });
    }

    // Bulk actions
    if (dom.btnBulkCancel) {
      dom.btnBulkCancel.addEventListener('click', () => {
        state.selectedMediaIds.clear();
        if (dom.selectAllCheckbox) dom.selectAllCheckbox.checked = false;
        updateBulkBar();
        renderMediaLibrary();
      });
    }
    if (dom.btnBulkPublish) {
      dom.btnBulkPublish.addEventListener('click', () => applyBulkAction('publish'));
    }
    if (dom.btnBulkUnpublish) {
      dom.btnBulkUnpublish.addEventListener('click', () => applyBulkAction('unpublish'));
    }
    if (dom.btnBulkArchive) {
      dom.btnBulkArchive.addEventListener('click', () => applyBulkAction('archive'));
    }
    if (dom.btnBulkFeatured) {
      dom.btnBulkFeatured.addEventListener('click', () => applyBulkAction('mark_featured'));
    }
    if (dom.btnBulkDelete) {
      dom.btnBulkDelete.addEventListener('click', () => {
        if (confirm(`Move ${state.selectedMediaIds.size} items to trash?`)) {
          applyBulkAction('delete');
        }
      });
    }
    if (dom.bulkMoveAlbumSelect) {
      dom.bulkMoveAlbumSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          applyBulkAction('move_album', { albumId: e.target.value });
          e.target.value = '';
        }
      });
    }

    // Albums & Events
    if (dom.btnCreateAlbum) {
      dom.btnCreateAlbum.addEventListener('click', () => openAlbumModal());
    }

    // Categories & Tags
    if (dom.btnAddCategory) {
      dom.btnAddCategory.addEventListener('click', () => openCategoryModal());
    }
    if (dom.btnAddTag) {
      dom.btnAddTag.addEventListener('click', handleAddTag);
    }
    if (dom.newTagInput) {
      dom.newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddTag();
        }
      });
    }

    // Trash
    if (dom.btnEmptyTrash) {
      dom.btnEmptyTrash.addEventListener('click', () => {
        if (!VadivaGalleryStore.can('empty_trash')) {
          alert('Only Super Admins can permanently empty the trash.');
          return;
        }
        if (confirm('Permanently delete all items in the Trash? This action CANNOT be undone!')) {
          VadivaGalleryStore.emptyTrash();
          renderTrashTab();
          renderDashboard();
        }
      });
    }

    // Settings
    if (dom.settingsForm) {
      dom.settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!VadivaGalleryStore.can('manage_settings')) {
          alert('Permission Denied: Your current role does not have settings modification rights.');
          return;
        }
        const fd = new FormData(dom.settingsForm);
        const newSettings = {
          heroTagline: fd.get('heroTagline'),
          heroSubtitle: fd.get('heroSubtitle'),
          galleryLayout: fd.get('galleryLayout'),
          defaultSort: fd.get('defaultSort'),
          allowDownloads: fd.get('allowDownloads') === 'on',
          allowSharing: fd.get('allowSharing') === 'on',
          showViewCounts: fd.get('showViewCounts') === 'on'
        };
        VadivaGalleryStore.updateSettings(newSettings);
        alert('Gallery settings saved successfully!');
      });
    }

    if (dom.btnExportDb) {
      dom.btnExportDb.addEventListener('click', handleExportDatabase);
    }
    if (dom.btnImportDb) {
      dom.btnImportDb.addEventListener('click', handleImportDatabase);
    }
    if (dom.btnResetDb) {
      dom.btnResetDb.addEventListener('click', () => {
        if (confirm('Reset entire gallery database to default verified Vadiva showcase data? Any newly uploaded custom entries will be restored to defaults.')) {
          VadivaGalleryStore.resetToDefaults();
          alert('Database reset to defaults.');
          location.reload();
        }
      });
    }

    // Team
    if (dom.btnAddTeamMember) {
      dom.btnAddTeamMember.addEventListener('click', () => openTeamModal());
    }

    // Modal close buttons (delegated)
    document.querySelectorAll('.admin-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-modal').forEach(m => m.classList.remove('active'));
      });
    });
  }

  // --- Tab Management ---
  function switchTab(tabId) {
    state.currentTab = tabId;

    dom.navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    dom.tabPanes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update Header Title
    const titles = {
      dashboard: 'Gallery Overview & Metrics',
      upload: 'Media Upload Manager',
      library: 'Central Media Library',
      albums: 'Album & Event Management',
      categories: 'Categories & Tag Cloud',
      featured: 'Curate Featured Moments',
      videos: 'Dedicated Video Management',
      trash: 'Trash & Item Recovery',
      settings: 'Gallery Global Settings',
      team: 'Admin Team & Role Permissions'
    };
    if (dom.pageTitle) dom.pageTitle.textContent = titles[tabId] || 'Gallery Admin';

    renderTab(tabId);
  }

  function renderTab(tabId) {
    switch (tabId) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'upload':
        renderUploadTab();
        break;
      case 'library':
        renderMediaLibrary();
        break;
      case 'albums':
        renderAlbumsTab();
        break;
      case 'categories':
        renderCategoriesTab();
        break;
      case 'featured':
        renderFeaturedTab();
        break;
      case 'videos':
        renderVideosTab();
        break;
      case 'trash':
        renderTrashTab();
        break;
      case 'settings':
        renderSettingsTab();
        break;
      case 'team':
        renderTeamTab();
        break;
    }
  }

  // --- User Session & RBAC ---
  function renderUserSession() {
    const user = VadivaGalleryStore.getCurrentUser();
    if (!user) return;

    if (dom.userName) dom.userName.textContent = user.name;
    if (dom.userRoleBadge) {
      dom.userRoleBadge.textContent = user.role;
      dom.userRoleBadge.className = 'admin-role-badge ' + getRoleClass(user.role);
    }
    if (dom.userRoleSelect) {
      dom.userRoleSelect.value = user.role;
    }

    // Role-based UI guards: hide or disable controls based on permissions
    const canManageTeam = VadivaGalleryStore.can('manage_team', user.role);
    const canManageSettings = VadivaGalleryStore.can('manage_settings', user.role);

    const teamNavItem = document.querySelector('.admin-nav-item[data-tab="team"]');
    if (teamNavItem) {
      teamNavItem.style.opacity = canManageTeam ? '1' : '0.6';
    }
    const settingsNavItem = document.querySelector('.admin-nav-item[data-tab="settings"]');
    if (settingsNavItem) {
      settingsNavItem.style.opacity = canManageSettings ? '1' : '0.6';
    }
  }

  function switchRole(newRole) {
    const users = VadivaGalleryStore.getUsers();
    const targetUser = users.find(u => u.role === newRole) || users[0];
    VadivaGalleryStore.login(targetUser.email);
    renderUserSession();
    renderTab(state.currentTab);
  }

  function getRoleClass(role) {
    switch (role) {
      case 'Super Admin': return 'role-super';
      case 'Admin': return 'role-admin';
      case 'Editor': return 'role-editor';
      case 'Viewer': return 'role-viewer';
      default: return '';
    }
  }

  // --- Dashboard Tab ---
  function renderDashboard() {
    const metrics = VadivaGalleryStore.getDashboardMetrics();

    if (dom.metricPhotos) dom.metricPhotos.textContent = metrics.totalPhotos || 0;
    if (dom.metricVideos) dom.metricVideos.textContent = metrics.totalVideos || 0;
    if (dom.metricAlbums) dom.metricAlbums.textContent = metrics.totalAlbums || 0;
    if (dom.metricPublished) dom.metricPublished.textContent = metrics.publishedMedia || 0;
    if (dom.metricDrafts) dom.metricDrafts.textContent = metrics.draftMedia || 0;
    if (dom.metricArchived) dom.metricArchived.textContent = metrics.archivedMedia || 0;
    if (dom.metricTrash) dom.metricTrash.textContent = metrics.trashCount || 0;

    // Recent Uploads Table
    if (dom.dashboardRecentUploads) {
      const recent = VadivaGalleryStore.getMedia({ sort: 'newest' }, false).slice(0, 5);
      if (recent.length === 0) {
        dom.dashboardRecentUploads.innerHTML = '<tr><td colspan="5" class="text-center p-3">No media uploaded yet.</td></tr>';
      } else {
        dom.dashboardRecentUploads.innerHTML = recent.map(item => `
          <tr>
            <td style="width: 50px;">
              <img src="${item.thumbnailUrl || item.fileUrl}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
            </td>
            <td>
              <strong>${item.title}</strong>
              <div style="font-size: 0.78rem; color: #64748b;">${item.eventName || item.albumName}</div>
            </td>
            <td><span class="admin-status-badge status-${item.status}">${item.status}</span></td>
            <td>${item.uploadDate || '2026'}</td>
            <td>
              <button type="button" class="btn-icon-sm" title="Edit" onclick="VadivaGalleryAdmin.openMediaEdit('${item.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    // Recent Albums Grid
    if (dom.dashboardRecentAlbums) {
      const albums = VadivaGalleryStore.getAlbums(false).slice(0, 4);
      dom.dashboardRecentAlbums.innerHTML = albums.map(alb => `
        <div style="display: flex; gap: 0.85rem; align-items: center; padding: 0.75rem; border: 1px solid var(--admin-border); border-radius: 8px; background: white;">
          <img src="${alb.coverImage}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
          <div>
            <strong style="font-size: 0.9rem; display: block;">${alb.name}</strong>
            <span style="font-size: 0.75rem; color: #64748b;">${alb.mediaCount} items • ${alb.eventDate || alb.year}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // --- Upload Tab ---
  function renderUploadTab() {
    populateAlbumSelectOptions('uploadAlbumSelect');
    populateCategorySelectOptions('uploadCategorySelect');
  }

  function handleFilesSelected(files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const item = {
        id: 'upload_' + Math.random().toString(36).substring(2, 9),
        file: file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: isVideo ? 'video' : 'photo',
        previewUrl: URL.createObjectURL(file),
        progress: 100
      };
      state.uploadQueue.push(item);
    });

    renderUploadQueue();
  }

  function renderUploadQueue() {
    if (!dom.uploadQueueContainer) return;
    if (state.uploadQueue.length === 0) {
      dom.uploadQueueContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No files currently in queue. Drag files into the box above.</p>';
      return;
    }

    dom.uploadQueueContainer.innerHTML = state.uploadQueue.map((item, idx) => `
      <div class="queue-item">
        ${item.type === 'video' ? `
          <div class="queue-thumb" style="display:flex;align-items:center;justify-content:center;background:#0f172a;color:white;">▶</div>
        ` : `
          <img src="${item.previewUrl}" class="queue-thumb" alt="${item.name}">
        `}
        <div class="queue-details">
          <div class="queue-name">${item.name}</div>
          <div class="queue-size">${item.type.toUpperCase()} • ${item.size}</div>
          <div class="queue-progress-bar">
            <div class="queue-progress-fill" style="width: ${item.progress}%;"></div>
          </div>
        </div>
        <button type="button" class="btn-icon-sm danger" onclick="VadivaGalleryAdmin.removeFromQueue(${idx})" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
  }

  function handleUploadSubmit() {
    if (!VadivaGalleryStore.can('upload_media')) {
      alert('Permission Denied: Your role does not have upload permissions.');
      return;
    }

    const form = dom.uploadForm;
    if (!form) return;

    const fd = new FormData(form);
    const titleBase = fd.get('title') || 'Uploaded Media';
    const description = fd.get('description') || '';
    const albumId = fd.get('albumId') || '';
    const categoryId = fd.get('categoryId') || 'cat_tech_events';
    const tags = fd.get('tags') ? fd.get('tags').split(',').map(s => s.trim()) : [];
    const status = fd.get('status') || 'published';
    const featured = fd.get('featured') === 'on';
    const customUrl = fd.get('customUrl') ? fd.get('customUrl').trim() : '';

    // If queue is empty but user provided custom URL
    if (state.uploadQueue.length === 0 && customUrl) {
      const isVideo = customUrl.endsWith('.mp4') || customUrl.includes('youtube') || customUrl.includes('vimeo');
      VadivaGalleryStore.saveMediaItem({
        type: isVideo ? 'video' : 'photo',
        title: titleBase,
        description: description,
        fileUrl: customUrl,
        thumbnailUrl: customUrl,
        albumId: albumId,
        categoryId: categoryId,
        tags: tags,
        status: status,
        featured: featured
      });
      alert('Media added to gallery successfully!');
      form.reset();
      switchTab('library');
      return;
    }

    if (state.uploadQueue.length === 0) {
      alert('Please select at least one file or enter a media URL.');
      return;
    }

    // Process queued files
    state.uploadQueue.forEach((queueItem, index) => {
      const itemTitle = state.uploadQueue.length > 1 ? `${titleBase} (${index + 1})` : titleBase;
      VadivaGalleryStore.saveMediaItem({
        type: queueItem.type,
        title: itemTitle,
        description: description,
        fileUrl: queueItem.previewUrl,
        thumbnailUrl: queueItem.previewUrl,
        albumId: albumId,
        categoryId: categoryId,
        tags: tags,
        status: status,
        featured: featured
      });
    });

    state.uploadQueue = [];
    renderUploadQueue();
    form.reset();
    alert(`Successfully processed and saved ${state.uploadQueue.length || 'selected'} items!`);
    switchTab('library');
  }

  // --- Media Library Tab ---
  function renderMediaLibrary() {
    populateAlbumSelectOptions('libFilterAlbum', true);
    populateCategorySelectOptions('libFilterCategory', true);
    populateAlbumSelectOptions('bulkMoveAlbumSelect');

    const filters = {
      type: state.libraryFilterType,
      status: state.libraryFilterStatus,
      albumId: state.libraryFilterAlbum,
      categoryId: state.libraryFilterCategory,
      search: state.librarySearchQuery,
      sort: state.librarySort
    };

    // Admins see all items (published, draft, archived)
    const items = VadivaGalleryStore.getMedia(filters, false);

    // Render Grid View
    if (dom.mediaGridContainer) {
      if (items.length === 0) {
        dom.mediaGridContainer.innerHTML = '<p class="text-center p-4" style="grid-column: 1 / -1; color: #94a3b8;">No media found matching current filters.</p>';
      } else {
        dom.mediaGridContainer.innerHTML = items.map(item => {
          const isSelected = state.selectedMediaIds.has(item.id);
          return `
            <div class="admin-media-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
              <div class="admin-check-overlay">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="VadivaGalleryAdmin.toggleSelect('${item.id}', this.checked)">
              </div>
              <span class="admin-status-badge status-${item.status}">${item.status}</span>
              <img src="${item.thumbnailUrl || item.fileUrl}" class="admin-media-thumb" alt="${item.title}" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
              <div class="admin-card-inner">
                <h4 class="admin-card-inner-title">${item.title}</h4>
                <div class="admin-card-inner-meta">
                  ${item.type.toUpperCase()} • ${item.categoryName || 'General'} • ${item.uploadDate || '2026'}
                </div>
                <div class="admin-card-actions">
                  <div style="display:flex;gap:4px;">
                    <button type="button" class="btn-icon-sm" title="Preview" onclick="VadivaGalleryAdmin.openPreview('${item.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button type="button" class="btn-icon-sm" title="Edit Metadata" onclick="VadivaGalleryAdmin.openMediaEdit('${item.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" class="btn-icon-sm ${item.featured ? 'active' : ''}" title="${item.featured ? 'Unmark Featured' : 'Mark Featured'}" onclick="VadivaGalleryAdmin.toggleFeatured('${item.id}')" style="${item.featured ? 'color:#f59e0b;border-color:#f59e0b;' : ''}">
                      ★
                    </button>
                  </div>
                  <button type="button" class="btn-icon-sm danger" title="Move to Trash" onclick="VadivaGalleryAdmin.deleteMedia('${item.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Table View
    if (dom.mediaTableBody) {
      if (items.length === 0) {
        dom.mediaTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No media found.</td></tr>';
      } else {
        dom.mediaTableBody.innerHTML = items.map(item => {
          const isSelected = state.selectedMediaIds.has(item.id);
          return `
            <tr>
              <td>
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="VadivaGalleryAdmin.toggleSelect('${item.id}', this.checked)">
              </td>
              <td style="width: 50px;">
                <img src="${item.thumbnailUrl || item.fileUrl}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
              </td>
              <td>
                <strong>${item.title}</strong>
                <div style="font-size: 0.78rem; color: #64748b;">${item.eventName || item.albumName}</div>
              </td>
              <td>${item.type.toUpperCase()}</td>
              <td><span class="admin-status-badge status-${item.status}">${item.status}</span></td>
              <td>${item.featured ? '<span style="color:#f59e0b;font-weight:700;">★ Featured</span>' : 'Standard'}</td>
              <td>
                <div style="display:flex;gap:4px;">
                  <button type="button" class="btn-icon-sm" title="Edit" onclick="VadivaGalleryAdmin.openMediaEdit('${item.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button type="button" class="btn-icon-sm danger" title="Trash" onclick="VadivaGalleryAdmin.deleteMedia('${item.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  function toggleSelect(id, checked) {
    if (checked) state.selectedMediaIds.add(id);
    else state.selectedMediaIds.delete(id);
    updateBulkBar();
  }

  function updateBulkBar() {
    if (!dom.bulkBar) return;
    const count = state.selectedMediaIds.size;
    if (count > 0) {
      dom.bulkBar.classList.add('active');
      if (dom.bulkSelectedCount) dom.bulkSelectedCount.textContent = `${count} ${count === 1 ? 'item' : 'items'} selected`;
    } else {
      dom.bulkBar.classList.remove('active');
    }
  }

  function applyBulkAction(action, payload = {}) {
    if (!VadivaGalleryStore.can('bulk_actions')) {
      alert('Permission Denied: Your role does not allow bulk actions.');
      return;
    }
    const ids = Array.from(state.selectedMediaIds);
    if (ids.length === 0) return;

    VadivaGalleryStore.bulkAction(action, ids, payload);
    state.selectedMediaIds.clear();
    if (dom.selectAllCheckbox) dom.selectAllCheckbox.checked = false;
    updateBulkBar();
    renderMediaLibrary();
    renderDashboard();
  }

  // --- Albums Tab ---
  function renderAlbumsTab() {
    if (!dom.albumsGrid) return;
    const albums = VadivaGalleryStore.getAlbums(false);

    dom.albumsGrid.innerHTML = albums.map(alb => `
      <div class="admin-card" style="padding: 1.25rem; display: flex; flex-direction: column;">
        <img src="${alb.coverImage}" style="width: 100%; aspect-ratio: 16/10; object-fit: cover; border-radius: 8px; margin-bottom: 0.85rem;" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.35rem;">
          <h4 style="margin: 0; font-size: 1.1rem;">${alb.name}</h4>
          <span class="admin-status-badge status-${alb.status}">${alb.status}</span>
        </div>
        <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">
          ${alb.eventDate || alb.year} • <strong>${alb.mediaCount} items</strong>
        </div>
        <p style="font-size: 0.85rem; color: #475569; line-height: 1.4; margin-bottom: 1rem; flex-grow: 1;">
          ${alb.description || 'No description provided.'}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
          <button type="button" class="btn btn-sm btn-secondary" onclick="VadivaGalleryAdmin.openAlbumEdit('${alb.id}')">
            Edit Album
          </button>
          <button type="button" class="btn-icon-sm danger" title="Delete Album" onclick="VadivaGalleryAdmin.deleteAlbum('${alb.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // --- Categories & Tags Tab ---
  function renderCategoriesTab() {
    if (dom.categoriesTableBody) {
      const cats = VadivaGalleryStore.getCategories();
      dom.categoriesTableBody.innerHTML = cats.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.description}</td>
          <td><span class="admin-role-badge role-admin">${c.mediaCount} items</span></td>
          <td>
            <button type="button" class="btn-icon-sm danger" title="Delete" onclick="VadivaGalleryAdmin.deleteCategory('${c.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }

    if (dom.tagsListContainer) {
      const tags = VadivaGalleryStore.getTags();
      dom.tagsListContainer.innerHTML = tags.map(t => `
        <span class="media-tag-pill" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.35rem 0.75rem; font-size: 0.85rem;">
          #${t}
          <button type="button" onclick="VadivaGalleryAdmin.deleteTag('${t}')" style="border:none;background:none;color:#ef4444;cursor:pointer;font-weight:700;">&times;</button>
        </span>
      `).join('');
    }
  }

  function handleAddTag() {
    if (!dom.newTagInput) return;
    const val = dom.newTagInput.value.trim().replace(/^#/, '');
    if (!val) return;
    VadivaGalleryStore.saveTag(val);
    dom.newTagInput.value = '';
    renderCategoriesTab();
  }

  // --- Featured Tab ---
  function renderFeaturedTab() {
    if (!dom.featuredItemsList) return;
    const featured = VadivaGalleryStore.getFeaturedMedia(false);

    if (featured.length === 0) {
      dom.featuredItemsList.innerHTML = '<p class="text-center p-4" style="color: #94a3b8;">No items currently featured. Go to Media Library to mark moments as featured.</p>';
      return;
    }

    dom.featuredItemsList.innerHTML = featured.map((item, idx) => `
      <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border: 1px solid var(--admin-border); border-radius: 8px; margin-bottom: 0.75rem;">
        <span style="font-size: 1.25rem; font-weight: 800; color: #94a3b8; width: 24px;">${idx + 1}</span>
        <img src="${item.thumbnailUrl || item.fileUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
        <div style="flex-grow: 1;">
          <strong>${item.title}</strong>
          <div style="font-size: 0.78rem; color: #64748b;">${item.eventName || item.albumName} • ${item.categoryName}</div>
          ${item.isHero ? '<span style="font-size: 0.72rem; background: #fef0e9; color: #d66432; padding: 2px 6px; border-radius: 4px; font-weight: 700;">PRIMARY HERO SHOWCASE</span>' : ''}
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-sm" style="border: 1px solid var(--admin-border);" onclick="VadivaGalleryAdmin.setAsHero('${item.id}')">
            ${item.isHero ? 'Active Hero' : 'Set as Hero'}
          </button>
          <button type="button" class="btn-icon-sm danger" title="Remove from Featured" onclick="VadivaGalleryAdmin.toggleFeatured('${item.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // --- Videos Tab ---
  function renderVideosTab() {
    if (!dom.videosTableBody) return;
    const videos = VadivaGalleryStore.getMedia({ type: 'video' }, false);

    if (videos.length === 0) {
      dom.videosTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No video assets found.</td></tr>';
      return;
    }

    dom.videosTableBody.innerHTML = videos.map(vid => `
      <tr>
        <td style="width: 50px;">
          <img src="${vid.thumbnailUrl || vid.fileUrl}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/techfest/national level.jpeg'">
        </td>
        <td>
          <strong>${vid.title}</strong>
          <div style="font-size: 0.78rem; color: #64748b;">${vid.description || ''}</div>
        </td>
        <td>${vid.videoDuration || '02:30'}</td>
        <td>${vid.albumName || 'General'}</td>
        <td><span class="admin-status-badge status-${vid.status}">${vid.status}</span></td>
        <td>
          <div style="display:flex;gap:4px;">
            <button type="button" class="btn-icon-sm" title="Preview Video" onclick="VadivaGalleryAdmin.openPreview('${vid.id}')">
              ▶
            </button>
            <button type="button" class="btn-icon-sm" title="Edit" onclick="VadivaGalleryAdmin.openMediaEdit('${vid.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // --- Trash Tab ---
  function renderTrashTab() {
    const trash = VadivaGalleryStore.getTrash();
    const mediaTrash = trash.filter(t => t.type === 'media');
    const albumTrash = trash.filter(t => t.type === 'album');

    if (dom.trashMediaTableBody) {
      if (mediaTrash.length === 0) {
        dom.trashMediaTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Trash is empty.</td></tr>';
      } else {
        dom.trashMediaTableBody.innerHTML = mediaTrash.map(entry => {
          const item = entry.item;
          return `
            <tr>
              <td style="width: 50px;">
                <img src="${item.thumbnailUrl || item.fileUrl}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
              </td>
              <td><strong>${item.title}</strong></td>
              <td>${item.type.toUpperCase()}</td>
              <td>${item.trashedAt ? item.trashedAt.split('T')[0] : 'Recently'}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="VadivaGalleryAdmin.restoreMedia('${item.id}')">Restore</button>
                  <button type="button" class="btn btn-sm btn-danger" style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;" onclick="VadivaGalleryAdmin.permanentDeleteMedia('${item.id}')">Delete Forever</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    if (dom.trashAlbumsList) {
      if (albumTrash.length === 0) {
        dom.trashAlbumsList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No trashed albums.</p>';
      } else {
        dom.trashAlbumsList.innerHTML = albumTrash.map(entry => {
          const alb = entry.item;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--admin-border); border-radius: 8px; margin-bottom: 0.5rem; background: white;">
              <div>
                <strong>${alb.name}</strong>
                <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.5rem;">${alb.eventDate || alb.year}</span>
              </div>
              <div style="display:flex;gap:6px;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="VadivaGalleryAdmin.restoreAlbum('${alb.id}')">Restore</button>
                <button type="button" class="btn btn-sm" style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;" onclick="VadivaGalleryAdmin.permanentDeleteAlbum('${alb.id}')">Delete Forever</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // --- Settings Tab ---
  function renderSettingsTab() {
    const s = VadivaGalleryStore.getSettings();
    const form = dom.settingsForm;
    if (!form) return;

    if (form.elements['heroTagline']) form.elements['heroTagline'].value = s.heroTagline || '';
    if (form.elements['heroSubtitle']) form.elements['heroSubtitle'].value = s.heroSubtitle || '';
    if (form.elements['galleryLayout']) form.elements['galleryLayout'].value = s.galleryLayout || 'masonry';
    if (form.elements['defaultSort']) form.elements['defaultSort'].value = s.defaultSort || 'newest';
    if (form.elements['allowDownloads']) form.elements['allowDownloads'].checked = s.allowDownloads !== false;
    if (form.elements['allowSharing']) form.elements['allowSharing'].checked = s.allowSharing !== false;
    if (form.elements['showViewCounts']) form.elements['showViewCounts'].checked = s.showViewCounts !== false;
  }

  function handleExportDatabase() {
    const json = VadivaGalleryStore.exportDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vadiva-gallery-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportDatabase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = VadivaGalleryStore.importDatabase(event.target.result);
        if (res.success) {
          alert('Database restored successfully from backup!');
          location.reload();
        } else {
          alert('Failed to import: ' + res.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // --- Team Tab ---
  function renderTeamTab() {
    if (!dom.teamTableBody) return;
    const users = VadivaGalleryStore.getUsers();

    dom.teamTableBody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div class="admin-user-avatar" style="width:32px;height:32px;font-size:0.8rem;">${u.name[0]}</div>
            <strong>${u.name}</strong>
          </div>
        </td>
        <td>${u.email}</td>
        <td><span class="admin-role-badge ${getRoleClass(u.role)}">${u.role}</span></td>
        <td><span style="color:#10b981;font-weight:600;">● ${u.status}</span></td>
        <td>${u.addedDate}</td>
        <td>
          <button type="button" class="btn-icon-sm" title="Edit Role" onclick="VadivaGalleryAdmin.openTeamEdit('${u.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // --- Populating Select Dropdowns ---
  function populateAlbumSelectOptions(elementId, includeAllOption = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const albums = VadivaGalleryStore.getAlbums(false);
    el.innerHTML = `
      ${includeAllOption ? '<option value="all">All Albums</option>' : '<option value="">Select Album (Optional)</option>'}
      ${albums.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
    `;
  }

  function populateCategorySelectOptions(elementId, includeAllOption = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const cats = VadivaGalleryStore.getCategories();
    el.innerHTML = `
      ${includeAllOption ? '<option value="all">All Categories</option>' : ''}
      ${cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
    `;
  }

  // --- Public Methods Exposed to Global Scope for Inline Handlers ---
  window.VadivaGalleryAdmin = {
    removeFromQueue: function (idx) {
      state.uploadQueue.splice(idx, 1);
      renderUploadQueue();
    },

    toggleSelect: function (id, checked) {
      toggleSelect(id, checked);
      renderMediaLibrary();
    },

    openMediaEdit: function (id) {
      state.activeEditingMediaId = id;
      const item = VadivaGalleryStore.getMediaById(id);
      if (!item) return;

      populateAlbumSelectOptions('editMediaAlbum');
      populateCategorySelectOptions('editMediaCategory');

      const modal = dom.mediaEditModal;
      document.getElementById('editMediaTitle').value = item.title || '';
      document.getElementById('editMediaDesc').value = item.description || '';
      document.getElementById('editMediaAlbum').value = item.albumId || '';
      document.getElementById('editMediaCategory').value = item.categoryId || 'cat_tech_events';
      document.getElementById('editMediaTags').value = Array.isArray(item.tags) ? item.tags.join(', ') : '';
      document.getElementById('editMediaStatus').value = item.status || 'published';
      document.getElementById('editMediaFeatured').checked = !!item.featured;
      document.getElementById('editMediaPreviewImg').src = item.thumbnailUrl || item.fileUrl;

      modal.classList.add('active');
    },

    saveMediaEdit: function () {
      if (!state.activeEditingMediaId) return;
      const item = VadivaGalleryStore.getMediaById(state.activeEditingMediaId);
      if (!item) return;

      item.title = document.getElementById('editMediaTitle').value;
      item.description = document.getElementById('editMediaDesc').value;
      item.albumId = document.getElementById('editMediaAlbum').value;
      item.categoryId = document.getElementById('editMediaCategory').value;
      item.tags = document.getElementById('editMediaTags').value.split(',').map(s => s.trim()).filter(Boolean);
      item.status = document.getElementById('editMediaStatus').value;
      item.featured = document.getElementById('editMediaFeatured').checked;

      VadivaGalleryStore.saveMediaItem(item);
      dom.mediaEditModal.classList.remove('active');
      renderMediaLibrary();
      renderDashboard();
    },

    deleteMedia: function (id) {
      if (!VadivaGalleryStore.can('delete_media')) {
        alert('Permission Denied: Your role does not have delete privileges.');
        return;
      }
      if (confirm('Move this item to trash? It can be restored anytime from the Trash tab.')) {
        VadivaGalleryStore.deleteMediaItem(id, false);
        renderMediaLibrary();
        renderDashboard();
      }
    },

    restoreMedia: function (id) {
      VadivaGalleryStore.restoreMediaItem(id);
      renderTrashTab();
      renderDashboard();
      alert('Item restored to Draft status.');
    },

    permanentDeleteMedia: function (id) {
      if (!VadivaGalleryStore.can('permanent_delete')) {
        alert('Permission Denied: Only Super Admins can permanently delete media.');
        return;
      }
      if (confirm('PERMANENT DELETION WARNING:\nThis cannot be undone. Are you sure you want to permanently delete this file?')) {
        VadivaGalleryStore.permanentlyDeleteFromTrash(id, 'media');
        renderTrashTab();
        renderDashboard();
      }
    },

    toggleFeatured: function (id) {
      const item = VadivaGalleryStore.getMediaById(id);
      if (item) {
        item.featured = !item.featured;
        VadivaGalleryStore.saveMediaItem(item);
        renderMediaLibrary();
        renderFeaturedTab();
      }
    },

    setAsHero: function (id) {
      const item = VadivaGalleryStore.getMediaById(id);
      if (item) {
        item.isHero = true;
        VadivaGalleryStore.saveMediaItem(item);
        renderFeaturedTab();
        alert(`"${item.title}" is now set as the primary hero showcase image on the public gallery!`);
      }
    },

    openPreview: function (id) {
      const item = VadivaGalleryStore.getMediaById(id);
      if (!item) return;

      const modal = dom.previewModal;
      const container = document.getElementById('previewModalContainer');
      document.getElementById('previewModalTitle').textContent = item.title;

      if (item.type === 'video') {
        container.innerHTML = `
          <video src="${item.fileUrl}" controls autoplay style="width:100%;max-height:60vh;border-radius:8px;background:black;">
            Video preview not supported.
          </video>
        `;
      } else {
        container.innerHTML = `
          <img src="${item.fileUrl}" style="max-width:100%;max-height:60vh;object-fit:contain;border-radius:8px;" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
        `;
      }
      modal.classList.add('active');
    },

    // Album CRUD
    openAlbumEdit: function (id = null) {
      state.activeEditingAlbumId = id;
      populateCategorySelectOptions('albumModalCategory');

      const modal = dom.albumEditModal;
      if (id) {
        const alb = VadivaGalleryStore.getAlbumById(id, false);
        document.getElementById('albumModalTitle').textContent = 'Edit Album';
        document.getElementById('albumName').value = alb.name || '';
        document.getElementById('albumEventName').value = alb.eventName || '';
        document.getElementById('albumCover').value = alb.coverImage || '';
        document.getElementById('albumDesc').value = alb.description || '';
        document.getElementById('albumDate').value = alb.eventDate || '';
        document.getElementById('albumModalCategory').value = alb.categoryId || 'cat_tech_events';
        document.getElementById('albumStatus').value = alb.status || 'published';
      } else {
        document.getElementById('albumModalTitle').textContent = 'Create New Album';
        document.getElementById('albumName').value = '';
        document.getElementById('albumEventName').value = '';
        document.getElementById('albumCover').value = 'assets/techfest/Vadiva Tech&Design Fest.jpeg';
        document.getElementById('albumDesc').value = '';
        document.getElementById('albumDate').value = '2026';
        document.getElementById('albumModalCategory').value = 'cat_tech_events';
        document.getElementById('albumStatus').value = 'published';
      }
      modal.classList.add('active');
    },

    saveAlbumModal: function () {
      const albumData = {
        id: state.activeEditingAlbumId || null,
        name: document.getElementById('albumName').value,
        eventName: document.getElementById('albumEventName').value,
        coverImage: document.getElementById('albumCover').value,
        description: document.getElementById('albumDesc').value,
        eventDate: document.getElementById('albumDate').value,
        categoryId: document.getElementById('albumModalCategory').value,
        status: document.getElementById('albumStatus').value
      };

      if (!albumData.name) {
        alert('Album name is required.');
        return;
      }

      VadivaGalleryStore.saveAlbum(albumData);
      dom.albumEditModal.classList.remove('active');
      renderAlbumsTab();
      renderDashboard();
    },

    deleteAlbum: function (id) {
      if (!VadivaGalleryStore.can('delete_album')) {
        alert('Permission Denied: Your role does not allow album deletion.');
        return;
      }
      if (confirm('Are you sure you want to delete this album? Media inside this album will remain in your library as unassigned.')) {
        VadivaGalleryStore.deleteAlbum(id, null, false);
        renderAlbumsTab();
        renderDashboard();
      }
    },

    restoreAlbum: function (id) {
      VadivaGalleryStore.restoreAlbum(id);
      renderTrashTab();
      renderAlbumsTab();
      renderDashboard();
    },

    permanentDeleteAlbum: function (id) {
      if (!VadivaGalleryStore.can('permanent_delete')) {
        alert('Permission Denied: Only Super Admins can permanently delete albums.');
        return;
      }
      if (confirm('Permanently delete this album forever?')) {
        VadivaGalleryStore.permanentlyDeleteFromTrash(id, 'album');
        renderTrashTab();
      }
    },

    // Category CRUD
    deleteCategory: function (id) {
      if (!VadivaGalleryStore.can('manage_categories')) {
        alert('Permission Denied: You cannot delete categories.');
        return;
      }
      if (confirm('Delete this category?')) {
        VadivaGalleryStore.deleteCategory(id);
        renderCategoriesTab();
      }
    },

    deleteTag: function (tag) {
      if (!VadivaGalleryStore.can('manage_tags')) {
        alert('Permission Denied.');
        return;
      }
      VadivaGalleryStore.deleteTag(tag);
      renderCategoriesTab();
    },

    // Team CRUD
    openTeamEdit: function (id) {
      const users = VadivaGalleryStore.getUsers();
      const user = users.find(u => u.id === id);
      if (!user) return;
      const newRole = prompt(`Update role for ${user.name}:\n(Super Admin / Admin / Editor / Viewer)`, user.role);
      if (newRole && ['Super Admin', 'Admin', 'Editor', 'Viewer'].includes(newRole)) {
        user.role = newRole;
        VadivaGalleryStore.saveUser(user);
        renderTeamTab();
      }
    }
  };

  // Helper modals
  function openAlbumModal() {
    window.VadivaGalleryAdmin.openAlbumEdit(null);
  }

  function openCategoryModal() {
    const name = prompt('Enter new Category Name:');
    if (!name) return;
    const desc = prompt('Enter brief category description:') || '';
    VadivaGalleryStore.saveCategory({ name, description: desc });
    renderCategoriesTab();
  }

  function openTeamModal() {
    const name = prompt('Enter Team Member Name:');
    if (!name) return;
    const email = prompt('Enter Email Address:');
    if (!email) return;
    const role = prompt('Enter Role (Super Admin / Admin / Editor / Viewer):', 'Editor');
    if (!role) return;

    VadivaGalleryStore.saveUser({
      name,
      email,
      role: role.trim()
    });
    renderTeamTab();
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

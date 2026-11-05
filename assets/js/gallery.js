/**
 * Vadiva Creative Labs - Public Gallery Page Application
 * Connects directly to VadivaGalleryStore for live published media,
 * album navigation, responsive filtering, and fullscreen lightbox viewer.
 */

(function () {
  'use strict';

  // DOM Elements cache
  let dom = {};

  // Component State
  const state = {
    activeType: 'all',          // 'all' | 'photo' | 'video'
    activeCategory: 'all',      // 'all' | cat_id
    activeAlbumId: 'all',       // 'all' | alb_id
    activeYear: 'all',          // 'all' | '2026' | '2025'
    searchQuery: '',
    sortBy: 'newest',
    currentMediaList: [],
    lightboxIndex: 0,
    lightboxOpen: false
  };

  function init() {
    cacheDom();
    bindEvents();
    parseUrlParameters();
    renderAll();
  }

  function cacheDom() {
    dom = {
      heroTagline: document.getElementById('galleryHeroTagline'),
      heroSubtitle: document.getElementById('galleryHeroSubtitle'),
      statPhotos: document.getElementById('statPhotosCount'),
      statVideos: document.getElementById('statVideosCount'),
      statAlbums: document.getElementById('statAlbumsCount'),
      statHighlights: document.getElementById('statHighlightsCount'),
      featuredContainer: document.getElementById('featuredMomentsContainer'),
      albumsContainer: document.getElementById('albumsGridContainer'),
      activeAlbumBanner: document.getElementById('activeAlbumBanner'),
      activeAlbumTitle: document.getElementById('activeAlbumTitle'),
      activeAlbumDesc: document.getElementById('activeAlbumDesc'),
      btnExitAlbum: document.getElementById('btnExitAlbum'),
      mediaGrid: document.getElementById('galleryMediaGrid'),
      emptyState: document.getElementById('galleryEmptyState'),
      searchInput: document.getElementById('gallerySearchInput'),
      typeButtons: document.querySelectorAll('.type-tab-btn'),
      categoryPillsWrap: document.getElementById('categoryPillsContainer'),
      albumSelect: document.getElementById('filterAlbumSelect'),
      yearSelect: document.getElementById('filterYearSelect'),
      sortSelect: document.getElementById('filterSortSelect'),
      resultsCount: document.getElementById('filterResultsCount'),
      btnResetFilters: document.getElementById('btnResetFilters'),
      lightbox: document.getElementById('galleryLightbox'),
      lightboxMedia: document.getElementById('lightboxMediaContainer'),
      lightboxCounter: document.getElementById('lightboxCounter'),
      lightboxTitle: document.getElementById('lightboxTitle'),
      lightboxDesc: document.getElementById('lightboxDesc'),
      lightboxMeta: document.getElementById('lightboxMeta'),
      lightboxPrev: document.getElementById('lightboxPrevBtn'),
      lightboxNext: document.getElementById('lightboxNextBtn'),
      lightboxClose: document.getElementById('lightboxCloseBtn'),
      lightboxDownload: document.getElementById('lightboxDownloadBtn'),
      lightboxShare: document.getElementById('lightboxShareBtn'),
      toast: document.getElementById('galleryToast')
    };
  }

  function bindEvents() {
    // Search input
    if (dom.searchInput) {
      let debounceTimer = null;
      dom.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.searchQuery = e.target.value.trim();
          renderMedia();
        }, 200);
      });
    }

    // Media Type tabs (All / Photos / Videos)
    if (dom.typeButtons) {
      dom.typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          dom.typeButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.activeType = btn.getAttribute('data-type') || 'all';
          renderMedia();
        });
      });
    }

    // Dropdown selects
    if (dom.albumSelect) {
      dom.albumSelect.addEventListener('change', (e) => {
        setAlbumFilter(e.target.value);
      });
    }
    if (dom.yearSelect) {
      dom.yearSelect.addEventListener('change', (e) => {
        state.activeYear = e.target.value;
        renderMedia();
      });
    }
    if (dom.sortSelect) {
      dom.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderMedia();
      });
    }

    // Reset filters
    if (dom.btnResetFilters) {
      dom.btnResetFilters.addEventListener('click', resetAllFilters);
    }
    if (dom.btnExitAlbum) {
      dom.btnExitAlbum.addEventListener('click', () => {
        setAlbumFilter('all');
      });
    }

    // Lightbox Controls
    if (dom.lightboxClose) {
      dom.lightboxClose.addEventListener('click', closeLightbox);
    }
    if (dom.lightboxPrev) {
      dom.lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    }
    if (dom.lightboxNext) {
      dom.lightboxNext.addEventListener('click', () => navigateLightbox(1));
    }
    if (dom.lightboxShare) {
      dom.lightboxShare.addEventListener('click', shareCurrentItem);
    }
    if (dom.lightboxDownload) {
      dom.lightboxDownload.addEventListener('click', downloadCurrentItem);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!state.lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Close lightbox on backdrop click
    if (dom.lightbox) {
      dom.lightbox.addEventListener('click', (e) => {
        if (e.target === dom.lightbox || e.target.classList.contains('lightbox-stage')) {
          closeLightbox();
        }
      });
    }

    // Listen for live updates from admin panel in other tabs or same window
    window.addEventListener('vadiva:gallery:updated', () => {
      renderAll();
    });
  }

  function parseUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('album')) {
      state.activeAlbumId = params.get('album');
    }
    if (params.has('category')) {
      state.activeCategory = params.get('category');
    }
    if (params.has('type')) {
      state.activeType = params.get('type');
    }
  }

  function renderAll() {
    renderHeroStats();
    renderFeaturedMoments();
    renderAlbums();
    renderCategoryPills();
    renderDropdownOptions();
    renderMedia();
  }

  // --- Hero Section Stats ---
  function renderHeroStats() {
    const metrics = VadivaGalleryStore.getDashboardMetrics();
    const settings = VadivaGalleryStore.getSettings();

    if (dom.heroTagline && settings.heroTagline) {
      dom.heroTagline.textContent = settings.heroTagline;
    }
    if (dom.heroSubtitle && settings.heroSubtitle) {
      dom.heroSubtitle.textContent = settings.heroSubtitle;
    }

    if (dom.statPhotos) dom.statPhotos.textContent = metrics.totalPhotos || 0;
    if (dom.statVideos) dom.statVideos.textContent = metrics.totalVideos || 0;
    if (dom.statAlbums) dom.statAlbums.textContent = metrics.totalAlbums || 0;
    if (dom.statHighlights) dom.statHighlights.textContent = metrics.publishedMedia || 0;
  }

  // --- Featured Moments Showcase ---
  function renderFeaturedMoments() {
    if (!dom.featuredContainer) return;
    const featuredItems = VadivaGalleryStore.getFeaturedMedia(true);

    if (featuredItems.length === 0) {
      dom.featuredContainer.style.display = 'none';
      return;
    }
    dom.featuredContainer.style.display = 'grid';

    const hero = VadivaGalleryStore.getHeroItem(true) || featuredItems[0];
    const subItems = featuredItems.filter(m => m.id !== hero.id).slice(0, 2);

    let html = `
      <!-- Hero Primary Feature -->
      <div class="featured-hero-card" data-media-id="${hero.id}">
        <img src="${hero.fileUrl}" alt="${hero.title}" class="featured-hero-img" loading="eager" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
        <div class="featured-hero-overlay"></div>
        <div class="featured-hero-content">
          <div class="featured-badge-row">
            <span class="badge-featured">★ Featured Highlight</span>
            <span class="badge-category">${hero.categoryName || 'Flagship Event'}</span>
          </div>
          <h3 class="featured-hero-title">${hero.title}</h3>
          <p class="featured-hero-desc">${hero.description || ''}</p>
          <div class="featured-hero-meta">
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${hero.eventName || hero.albumName}
            </span>
            <span>•</span>
            <span>${hero.uploadDate || '2026'}</span>
          </div>
        </div>
      </div>
    `;

    if (subItems.length > 0) {
      html += `
        <div class="featured-sub-grid">
          ${subItems.map(item => `
            <div class="featured-sub-card" data-media-id="${item.id}">
              <img src="${item.thumbnailUrl || item.fileUrl}" alt="${item.title}" class="featured-sub-img" loading="lazy" onerror="this.src='assets/protospark/Vadiva tech&design Fest 2.jpeg'">
              <div class="featured-sub-overlay"></div>
              <div class="featured-sub-content">
                <div class="featured-badge-row" style="margin-bottom: 0.35rem;">
                  <span class="badge-category" style="font-size: 0.68rem; padding: 0.2rem 0.55rem;">${item.categoryName || 'Moment'}</span>
                  ${item.type === 'video' ? '<span class="badge-featured" style="background: rgba(15, 23, 42, 0.85); font-size: 0.68rem;">▶ Video</span>' : ''}
                </div>
                <h4 class="featured-sub-title">${item.title}</h4>
                <div class="featured-sub-meta">
                  <span>${item.eventName || item.albumName}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    dom.featuredContainer.innerHTML = html;

    // Attach click listeners to featured cards
    dom.featuredContainer.querySelectorAll('[data-media-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-media-id');
        openLightboxById(id);
      });
    });
  }

  // --- Albums Grid Showcase ---
  function renderAlbums() {
    if (!dom.albumsContainer) return;
    const albums = VadivaGalleryStore.getAlbums(true);

    if (albums.length === 0) {
      dom.albumsContainer.innerHTML = '<p class="text-muted">No published albums available yet.</p>';
      return;
    }

    dom.albumsContainer.innerHTML = albums.map(album => {
      const isActive = state.activeAlbumId === album.id;
      return `
        <div class="album-card ${isActive ? 'active-album' : ''}" data-album-id="${album.id}">
          <div class="album-cover-wrap">
            <img src="${album.coverImage}" alt="${album.name}" class="album-cover-img" loading="lazy" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
            <div class="album-count-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              ${album.mediaCount} ${album.mediaCount === 1 ? 'item' : 'items'}
            </div>
          </div>
          <div class="album-body">
            <span class="album-date">${album.eventDate || album.year}</span>
            <h3 class="album-name">${album.name}</h3>
            <p class="album-desc">${album.description || ''}</p>
            <div class="album-footer">
              <span>${album.eventName}</span>
              <span class="album-open-link">
                View Album
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to albums
    dom.albumsContainer.querySelectorAll('.album-card').forEach(card => {
      card.addEventListener('click', () => {
        const albId = card.getAttribute('data-album-id');
        setAlbumFilter(albId);
      });
    });

    // Update active banner
    if (dom.activeAlbumBanner) {
      if (state.activeAlbumId !== 'all') {
        const currentAlb = VadivaGalleryStore.getAlbumById(state.activeAlbumId, true);
        if (currentAlb) {
          dom.activeAlbumTitle.textContent = currentAlb.name;
          dom.activeAlbumDesc.textContent = `${currentAlb.eventDate || currentAlb.year} — ${currentAlb.description || ''}`;
          dom.activeAlbumBanner.style.display = 'flex';
        } else {
          dom.activeAlbumBanner.style.display = 'none';
        }
      } else {
        dom.activeAlbumBanner.style.display = 'none';
      }
    }
  }

  // --- Category Filter Pills ---
  function renderCategoryPills() {
    if (!dom.categoryPillsWrap) return;
    const categories = VadivaGalleryStore.getCategories();

    let html = `
      <button type="button" class="category-pill-btn ${state.activeCategory === 'all' ? 'active' : ''}" data-cat="all">
        All Categories
      </button>
    `;

    categories.forEach(cat => {
      const isActive = state.activeCategory === cat.id;
      html += `
        <button type="button" class="category-pill-btn ${isActive ? 'active' : ''}" data-cat="${cat.id}">
          ${cat.name} (${cat.mediaCount})
        </button>
      `;
    });

    dom.categoryPillsWrap.innerHTML = html;

    dom.categoryPillsWrap.querySelectorAll('.category-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.categoryPillsWrap.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.getAttribute('data-cat') || 'all';
        renderMedia();
      });
    });
  }

  // --- Dropdown Select Options ---
  function renderDropdownOptions() {
    if (dom.albumSelect) {
      const albums = VadivaGalleryStore.getAlbums(true);
      dom.albumSelect.innerHTML = `
        <option value="all">All Albums (${albums.length})</option>
        ${albums.map(a => `<option value="${a.id}" ${state.activeAlbumId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
      `;
    }
  }

  // --- Media Grid Rendering & Filtering ---
  function renderMedia() {
    if (!dom.mediaGrid) return;

    const filters = {
      type: state.activeType,
      categoryId: state.activeCategory,
      albumId: state.activeAlbumId,
      year: state.activeYear,
      search: state.searchQuery,
      sort: state.sortBy
    };

    // Strictly fetch published media for the public gallery!
    const items = VadivaGalleryStore.getMedia(filters, true);
    state.currentMediaList = items;

    // Update result count text
    if (dom.resultsCount) {
      dom.resultsCount.textContent = `Showing ${items.length} ${items.length === 1 ? 'moment' : 'moments'}`;
    }

    if (items.length === 0) {
      dom.mediaGrid.style.display = 'none';
      if (dom.emptyState) dom.emptyState.style.display = 'block';
      return;
    }

    dom.mediaGrid.style.display = 'grid';
    if (dom.emptyState) dom.emptyState.style.display = 'none';

    dom.mediaGrid.innerHTML = items.map((item, index) => {
      const isVideo = item.type === 'video';
      return `
        <article class="media-item-card" data-index="${index}" data-id="${item.id}">
          <div class="media-thumb-wrapper">
            <img src="${item.thumbnailUrl || item.fileUrl}" alt="${item.title}" class="media-thumb-img" loading="lazy" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
            <span class="media-type-badge">
              ${isVideo ? `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg> Video
              ` : `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg> Photo
              `}
            </span>
            ${isVideo ? `
              <div class="video-play-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 2px;">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              ${item.videoDuration ? `<span class="video-duration-pill">${item.videoDuration}</span>` : ''}
            ` : ''}
          </div>
          <div class="media-card-body">
            <div class="media-category-row">
              <span class="media-category-tag">${item.categoryName || 'Vadiva Event'}</span>
              <span class="media-date">${item.uploadDate || item.year}</span>
            </div>
            <h4 class="media-card-title">${item.title}</h4>
            <p class="media-card-desc">${item.description || ''}</p>
            ${Array.isArray(item.tags) && item.tags.length > 0 ? `
              <div class="media-card-tags">
                ${item.tags.slice(0, 3).map(t => `<span class="media-tag-pill">#${t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    // Attach click listeners to grid items
    dom.mediaGrid.querySelectorAll('.media-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-index'), 10);
        openLightboxByIndex(idx);
      });
    });
  }

  function setAlbumFilter(albumId) {
    state.activeAlbumId = albumId;
    if (dom.albumSelect) dom.albumSelect.value = albumId;
    renderAlbums();
    renderMedia();

    // Smooth scroll down to filter area if selected an album
    if (albumId !== 'all') {
      const controls = document.getElementById('galleryControlsAnchor');
      if (controls) controls.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function resetAllFilters() {
    state.activeType = 'all';
    state.activeCategory = 'all';
    state.activeAlbumId = 'all';
    state.activeYear = 'all';
    state.searchQuery = '';
    state.sortBy = 'newest';

    if (dom.searchInput) dom.searchInput.value = '';
    if (dom.albumSelect) dom.albumSelect.value = 'all';
    if (dom.yearSelect) dom.yearSelect.value = 'all';
    if (dom.sortSelect) dom.sortSelect.value = 'newest';

    if (dom.typeButtons) {
      dom.typeButtons.forEach(b => b.classList.remove('active'));
      const allBtn = document.querySelector('.type-tab-btn[data-type="all"]');
      if (allBtn) allBtn.classList.add('active');
    }

    renderCategoryPills();
    renderAlbums();
    renderMedia();
  }

  // --- Lightbox / Fullscreen Viewer ---
  function openLightboxByIndex(index) {
    if (!state.currentMediaList || state.currentMediaList.length === 0) return;
    if (index < 0) index = state.currentMediaList.length - 1;
    if (index >= state.currentMediaList.length) index = 0;

    state.lightboxIndex = index;
    state.lightboxOpen = true;

    const item = state.currentMediaList[index];
    VadivaGalleryStore.incrementViews(item.id);

    // Build stage media
    if (item.type === 'video') {
      dom.lightboxMedia.innerHTML = `
        <video src="${item.fileUrl}" controls autoplay playsinline class="lightbox-video-player" poster="${item.thumbnailUrl || ''}">
          Your browser does not support HTML5 video playback.
        </video>
      `;
    } else {
      dom.lightboxMedia.innerHTML = `
        <img src="${item.fileUrl}" alt="${item.title}" class="lightbox-img" onerror="this.src='assets/techfest/Vadiva Tech&Design Fest.jpeg'">
      `;
    }

    // Update Counter & Metadata
    dom.lightboxCounter.textContent = `${index + 1} of ${state.currentMediaList.length}`;
    dom.lightboxTitle.textContent = item.title;
    dom.lightboxDesc.textContent = item.description || '';

    dom.lightboxMeta.innerHTML = `
      <span><strong>Event:</strong> ${item.eventName || item.albumName}</span>
      <span>•</span>
      <span><strong>Category:</strong> ${item.categoryName}</span>
      <span>•</span>
      <span><strong>Date:</strong> ${item.uploadDate || item.year}</span>
    `;

    // Check Settings for Download
    const settings = VadivaGalleryStore.getSettings();
    if (dom.lightboxDownload) {
      dom.lightboxDownload.style.display = settings.allowDownloads !== false ? 'flex' : 'none';
    }
    if (dom.lightboxShare) {
      dom.lightboxShare.style.display = settings.allowSharing !== false ? 'flex' : 'none';
    }

    dom.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function openLightboxById(mediaId) {
    const list = VadivaGalleryStore.getMedia({}, true);
    const idx = list.findIndex(m => m.id === mediaId);
    if (idx !== -1) {
      state.currentMediaList = list;
      openLightboxByIndex(idx);
    }
  }

  function navigateLightbox(dir) {
    openLightboxByIndex(state.lightboxIndex + dir);
  }

  function closeLightbox() {
    state.lightboxOpen = false;
    dom.lightbox.classList.remove('active');
    document.body.style.overflow = '';

    // Stop video playback if active
    const video = dom.lightboxMedia.querySelector('video');
    if (video) video.pause();
    dom.lightboxMedia.innerHTML = '';
  }

  function shareCurrentItem() {
    const item = state.currentMediaList[state.lightboxIndex];
    if (!item) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?highlight=${item.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {
        fallbackShare(shareUrl);
      });
    } else {
      fallbackShare(shareUrl);
    }
  }

  function fallbackShare(url) {
    prompt('Copy gallery share link:', url);
  }

  function downloadCurrentItem() {
    const item = state.currentMediaList[state.lightboxIndex];
    if (!item) return;

    const a = document.createElement('a');
    a.href = item.fileUrl;
    a.download = (item.title || 'vadiva-moment').replace(/[^a-zA-Z0-9_-]/g, '_') + (item.type === 'video' ? '.mp4' : '.jpg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started');
  }

  function showToast(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.add('active');
    setTimeout(() => {
      dom.toast.classList.remove('active');
    }, 2800);
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

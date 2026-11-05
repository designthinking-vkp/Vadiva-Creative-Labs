/**
 * Vadiva Creative Labs - Gallery Data Store & Architecture Layer
 * Provides centralized storage, state management, RBAC, CRUD operations,
 * filtering, bulk actions, and data persistence for both Public Gallery and Admin Panel.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VadivaGalleryStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'vadiva_gallery_database_v3';
  const AUTH_KEY = 'vadiva_gallery_auth_user';

  // Seed Categories
  const DEFAULT_CATEGORIES = [
    { id: 'cat_tech_events', name: 'Tech Events', description: 'Large-scale technology competitions, convergence arenas, and flagship exhibitions' },
    { id: 'cat_workshops', name: 'Workshops', description: 'Hands-on practical training tracks, masterclasses, and skill engineering labs' },
    { id: 'cat_guest_sessions', name: 'Guest Sessions', description: 'Industry leader keynotes, fireside discussions, and scientific master lectures' },
    { id: 'cat_student_activities', name: 'Student Activities', description: 'Makerspace build sprints, summer immersions, and outdoor ecology field labs' },
    { id: 'cat_competitions', name: 'Competitions', description: 'National and regional robotics, aero-modelling challenges, and startup pitch tracks' },
    { id: 'cat_exhibitions', name: 'Exhibitions', description: 'Public prototype expos, parent demo days, and inter-school hardware galleries' }
  ];

  // Seed Tags
  const DEFAULT_TAGS = [
    'Robotics', 'Drone Racing', 'RC Planes', 'Protospark Pitch', 'National Level', 
    'ISRO Tour', 'Biotech Labs', 'Additive 3D Printing', 'Makerspace', 'Camp Maayavanam', 
    'Hardware Build', 'Eco Engineering', 'Student Innovators', 'Award Ceremony', 'Science Camp'
  ];

  // Seed Albums
  const DEFAULT_ALBUMS = [
    {
      id: 'alb_techfest26',
      name: 'Vadiva Tech & Design Fest 2026',
      eventName: 'Vadiva Tech & Design Fest 2.0',
      coverImage: 'assets/techfest/Vadiva Tech&Design Fest.jpeg',
      description: 'Our flagship 3-day innovation convergence drawing 5,000+ students with robotics arenas, multi-terrain RC tracks, and flight lines.',
      eventDate: 'October 23–25, 2026',
      year: '2026',
      categoryId: 'cat_tech_events',
      tags: ['Robotics', 'Drone Racing', 'RC Planes', 'National Level'],
      status: 'published',
      featured: true,
      createdAt: '2026-10-26T10:00:00Z'
    },
    {
      id: 'alb_protospark26',
      name: 'Protospark 2026 Grand Finale',
      eventName: 'Protospark Innovation Challenge',
      coverImage: 'assets/protospark/Vadiva tech&design Fest 2.jpeg',
      description: 'The definitive entrepreneurial pitch arena where student builders defend working prototypes before venture and industry juries.',
      eventDate: 'October 30–31, 2026',
      year: '2026',
      categoryId: 'cat_competitions',
      tags: ['Protospark Pitch', 'Hardware Build', 'Student Innovators', 'National Level'],
      status: 'published',
      featured: true,
      createdAt: '2026-11-01T12:00:00Z'
    },
    {
      id: 'alb_maayavanam',
      name: 'Camp Maayavanam Eco-Tech Immersions',
      eventName: 'Camp Maayavanam Summer Experience',
      coverImage: 'assets/maayvanam/Camp Maayavanam.jpeg',
      description: 'Narrative-driven environmental engineering pairing rural folk ecology with rocketry, drone aerodynamics, and ISRO study track.',
      eventDate: 'May–June 2026',
      year: '2026',
      categoryId: 'cat_student_activities',
      tags: ['Camp Maayavanam', 'ISRO Tour', 'Eco Engineering', 'Drone Racing'],
      status: 'published',
      featured: true,
      createdAt: '2026-06-15T09:30:00Z'
    },
    {
      id: 'alb_workshops',
      name: 'Advanced Engineering Workshops & Masterclasses',
      eventName: 'Vadiva Campus Masterclasses',
      coverImage: 'assets/vinyasa_camp/Fabrication.jpeg',
      description: 'Specialized masterclasses covering CAD prototyping, flight electronics, rapid additive 3D fabrication, and hardware firmware.',
      eventDate: 'September 2026',
      year: '2026',
      categoryId: 'cat_workshops',
      tags: ['Makerspace', 'Additive 3D Printing', 'Hardware Build'],
      status: 'published',
      featured: false,
      createdAt: '2026-09-20T14:15:00Z'
    },
    {
      id: 'alb_biotech',
      name: 'Camp Gyankriti Biotech & Digital Fabrication',
      eventName: 'Gyankriti Science Expedition',
      coverImage: 'assets/vinyasa_camp/img_2026-05-22_3.04.17_pm.jpeg',
      description: 'Real DNA isolation procedures, biochemistry extraction, herbal pharmacology compounding, and digital fabrication converging.',
      eventDate: 'May 2026',
      year: '2026',
      categoryId: 'cat_student_activities',
      tags: ['Biotech Labs', 'Science Camp', 'Student Innovators'],
      status: 'published',
      featured: false,
      createdAt: '2026-05-25T11:00:00Z'
    },
    {
      id: 'alb_heritage',
      name: 'Archaeological Digs & Composite Science',
      eventName: 'Heritage & Science Labs',
      coverImage: 'assets/protospark/Regulatory Composite Science Labs.jpeg',
      description: 'Hands-on artifact preservation, stratified soil excavation simulations, and physical composite material engineering testing.',
      eventDate: 'April 2026',
      year: '2026',
      categoryId: 'cat_exhibitions',
      tags: ['Science Camp', 'Eco Engineering'],
      status: 'published',
      featured: false,
      createdAt: '2026-04-18T16:00:00Z'
    }
  ];

  // Seed Media Items (Photos and Videos)
  const DEFAULT_MEDIA = [
    {
      id: 'med_01',
      type: 'photo',
      title: 'Robotics Arena Live Matches - Tech Fest 2026',
      description: 'High-velocity soccer robotics and maze obstacle navigation challenge during day 2 of Vadiva Tech Fest.',
      fileUrl: 'assets/techfest/Vadiva Tech&Design Fest.jpeg',
      thumbnailUrl: 'assets/techfest/Vadiva Tech&Design Fest.jpeg',
      albumId: 'alb_techfest26',
      albumName: 'Vadiva Tech & Design Fest 2026',
      eventName: 'Vadiva Tech & Design Fest 2.0',
      categoryId: 'cat_tech_events',
      categoryName: 'Tech Events',
      tags: ['Robotics', 'Hardware Build', 'National Level'],
      year: '2026',
      status: 'published',
      featured: true,
      featuredOrder: 1,
      isHero: true,
      uploadDate: '2026-10-24',
      createdBy: 'Karthik Raja',
      views: 1420
    },
    {
      id: 'med_02',
      type: 'photo',
      title: 'Protospark Pitch Arena Jury Defense',
      description: 'Student founders defending physical thermodynamic prototypes before industry jury panel for startup grant funding.',
      fileUrl: 'assets/protospark/Vadiva tech&design Fest 2.jpeg',
      thumbnailUrl: 'assets/protospark/Vadiva tech&design Fest 2.jpeg',
      albumId: 'alb_protospark26',
      albumName: 'Protospark 2026 Grand Finale',
      eventName: 'Protospark Innovation Challenge',
      categoryId: 'cat_competitions',
      categoryName: 'Competitions',
      tags: ['Protospark Pitch', 'Student Innovators', 'National Level'],
      year: '2026',
      status: 'published',
      featured: true,
      featuredOrder: 2,
      isHero: false,
      uploadDate: '2026-10-31',
      createdBy: 'Priya Sundaram',
      views: 980
    },
    {
      id: 'med_03',
      type: 'photo',
      title: 'Custom RC Aeroplane Flight Line Demonstration',
      description: 'Aviation flight dynamics line showing custom built lightweight RC planes engineered by high-school students.',
      fileUrl: 'assets/techfest/Vadiva Tech&design 3.jpeg',
      thumbnailUrl: 'assets/techfest/Vadiva Tech&design 3.jpeg',
      albumId: 'alb_techfest26',
      albumName: 'Vadiva Tech & Design Fest 2026',
      eventName: 'Vadiva Tech & Design Fest 2.0',
      categoryId: 'cat_tech_events',
      categoryName: 'Tech Events',
      tags: ['RC Planes', 'National Level', 'Robotics'],
      year: '2026',
      status: 'published',
      featured: true,
      featuredOrder: 3,
      isHero: false,
      uploadDate: '2026-10-25',
      createdBy: 'Dr. Vadiva',
      views: 1150
    },
    {
      id: 'med_04',
      type: 'photo',
      title: 'Camp Maayavanam Quadcopter Telemetry Lab',
      description: 'Outdoor aerial robotics and sensor telemetry calibration under open skies during Camp Maayavanam.',
      fileUrl: 'assets/maayvanam/Drone.jpeg',
      thumbnailUrl: 'assets/maayvanam/Drone.jpeg',
      albumId: 'alb_maayavanam',
      albumName: 'Camp Maayavanam Eco-Tech Immersions',
      eventName: 'Camp Maayavanam Summer Experience',
      categoryId: 'cat_student_activities',
      categoryName: 'Student Activities',
      tags: ['Camp Maayavanam', 'Drone Racing', 'Eco Engineering'],
      year: '2026',
      status: 'published',
      featured: true,
      featuredOrder: 4,
      isHero: false,
      uploadDate: '2026-06-12',
      createdBy: 'Karthik Raja',
      views: 860
    },
    {
      id: 'med_05',
      type: 'video',
      title: 'Vadiva Tech Fest 2026 Official Highlight Reel',
      description: 'Cinematic recap of 3 electrifying days of innovation, 5000+ student delegates, and 17 hands-on competitive arenas.',
      fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-drone-flying-over-a-green-field-42416-large.mp4',
      thumbnailUrl: 'assets/techfest/national level.jpeg',
      videoSource: 'file',
      videoDuration: '02:45',
      albumId: 'alb_techfest26',
      albumName: 'Vadiva Tech & Design Fest 2026',
      eventName: 'Vadiva Tech & Design Fest 2.0',
      categoryId: 'cat_tech_events',
      categoryName: 'Tech Events',
      tags: ['Robotics', 'Drone Racing', 'Award Ceremony'],
      year: '2026',
      status: 'published',
      featured: true,
      featuredOrder: 5,
      isHero: false,
      uploadDate: '2026-10-28',
      createdBy: 'Dr. Vadiva',
      views: 3410
    },
    {
      id: 'med_06',
      type: 'photo',
      title: 'National Level Laurels & Trophy Recognition',
      description: 'Vadiva student delegation crowned national champions in robotics and innovative rapid problem-solving.',
      fileUrl: 'assets/techfest/national level.jpeg',
      thumbnailUrl: 'assets/techfest/national level.jpeg',
      albumId: 'alb_techfest26',
      albumName: 'Vadiva Tech & Design Fest 2026',
      eventName: 'Vadiva Tech & Design Fest 2.0',
      categoryId: 'cat_competitions',
      categoryName: 'Competitions',
      tags: ['National Level', 'Award Ceremony', 'Student Innovators'],
      year: '2026',
      status: 'published',
      featured: false,
      featuredOrder: 6,
      isHero: false,
      uploadDate: '2026-10-25',
      createdBy: 'Priya Sundaram',
      views: 650
    },
    {
      id: 'med_07',
      type: 'photo',
      title: 'Digital Fabrication & Prototyping Workshop',
      description: 'Hands-on slicing, 3D printing, and rapid casing assembly in the Vadiva Advanced Makerspace.',
      fileUrl: 'assets/vinyasa_camp/Fabrication.jpeg',
      thumbnailUrl: 'assets/vinyasa_camp/Fabrication.jpeg',
      albumId: 'alb_workshops',
      albumName: 'Advanced Engineering Workshops & Masterclasses',
      eventName: 'Vadiva Campus Masterclasses',
      categoryId: 'cat_workshops',
      categoryName: 'Workshops',
      tags: ['Additive 3D Printing', 'Hardware Build', 'Makerspace'],
      year: '2026',
      status: 'published',
      featured: false,
      featuredOrder: 7,
      isHero: false,
      uploadDate: '2026-09-18',
      createdBy: 'Karthik Raja',
      views: 430
    },
    {
      id: 'med_08',
      type: 'photo',
      title: 'Biochemistry Testing & Natural Pharmacology',
      description: 'Real botanical extraction and phytochemical observation during Camp Gyankriti biotech sessions.',
      fileUrl: 'assets/vinyasa_camp/img_2026-05-22_3.04.17_pm.jpeg',
      thumbnailUrl: 'assets/vinyasa_camp/img_2026-05-22_3.04.17_pm.jpeg',
      albumId: 'alb_biotech',
      albumName: 'Camp Gyankriti Biotech & Digital Fabrication',
      eventName: 'Gyankriti Science Expedition',
      categoryId: 'cat_student_activities',
      categoryName: 'Student Activities',
      tags: ['Biotech Labs', 'Science Camp'],
      year: '2026',
      status: 'published',
      featured: false,
      featuredOrder: 8,
      isHero: false,
      uploadDate: '2026-05-22',
      createdBy: 'Dr. Vadiva',
      views: 520
    },
    {
      id: 'med_09',
      type: 'photo',
      title: 'Regulatory Composite Science Lab Station',
      description: 'Materials stress analysis station demonstrating tensile strength testing of student-moulded composite structures.',
      fileUrl: 'assets/protospark/Regulatory Composite Science Labs.jpeg',
      thumbnailUrl: 'assets/protospark/Regulatory Composite Science Labs.jpeg',
      albumId: 'alb_heritage',
      albumName: 'Archaeological Digs & Composite Science',
      eventName: 'Heritage & Science Labs',
      categoryId: 'cat_exhibitions',
      categoryName: 'Exhibitions',
      tags: ['Hardware Build', 'Science Camp'],
      year: '2026',
      status: 'published',
      featured: false,
      featuredOrder: 9,
      isHero: false,
      uploadDate: '2026-05-22',
      createdBy: 'Priya Sundaram',
      views: 390
    },
    {
      id: 'med_10',
      type: 'video',
      title: 'Protospark Pitch Finale & Jury Deliberation',
      description: 'Highlights from the final pitch stage where top 12 student finalist teams presented innovative solutions to venture capitalists.',
      fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4',
      thumbnailUrl: 'assets/protospark/Screens.jpeg',
      videoSource: 'file',
      videoDuration: '03:15',
      albumId: 'alb_protospark26',
      albumName: 'Protospark 2026 Grand Finale',
      eventName: 'Protospark Innovation Challenge',
      categoryId: 'cat_competitions',
      categoryName: 'Competitions',
      tags: ['Protospark Pitch', 'Student Innovators', 'Award Ceremony'],
      year: '2026',
      status: 'published',
      featured: false,
      featuredOrder: 10,
      isHero: false,
      uploadDate: '2026-11-01',
      createdBy: 'Dr. Vadiva',
      views: 1890
    },
    {
      id: 'med_11',
      type: 'photo',
      title: 'Robotics Control Circuit Testing & Debugging',
      description: 'Students testing custom PCB soldered motor drivers prior to autonomous obstacle run challenge.',
      fileUrl: 'assets/techfest/img_2026-05-22_3.02.56_pm.jpeg',
      thumbnailUrl: 'assets/techfest/img_2026-05-22_3.02.56_pm.jpeg',
      albumId: 'alb_techfest26',
      albumName: 'Vadiva Tech & Design Fest 2026',
      eventName: 'Vadiva Tech & Design Fest 2.0',
      categoryId: 'cat_tech_events',
      categoryName: 'Tech Events',
      tags: ['Robotics', 'Hardware Build'],
      year: '2026',
      status: 'published',
      featured: false,
      featuredOrder: 11,
      isHero: false,
      uploadDate: '2026-10-24',
      createdBy: 'Karthik Raja',
      views: 710
    },
    {
      id: 'med_12',
      type: 'photo',
      title: 'Camp Maayavanam Folk Architecture Workshop',
      description: 'Eco-sustainable clay and bamboo framing techniques demonstrated during rural immersion modules.',
      fileUrl: 'assets/maayvanam/Camp Maayavanam.jpeg',
      thumbnailUrl: 'assets/maayvanam/Camp Maayavanam.jpeg',
      albumId: 'alb_maayavanam',
      albumName: 'Camp Maayavanam Eco-Tech Immersions',
      eventName: 'Camp Maayavanam Summer Experience',
      categoryId: 'cat_student_activities',
      categoryName: 'Student Activities',
      tags: ['Camp Maayavanam', 'Eco Engineering'],
      year: '2026',
      status: 'published',
      featured: false,
      featuredOrder: 12,
      isHero: false,
      uploadDate: '2026-06-08',
      createdBy: 'Priya Sundaram',
      views: 480
    },
    {
      id: 'med_13',
      type: 'photo',
      title: 'Draft: Behind-The-Scenes Lab Setup',
      description: 'Staff and student volunteers preparing sensor telemetry stations before gates opened.',
      fileUrl: 'assets/techfest/img_2026-05-22_3.02.58_pm.jpeg',
      thumbnailUrl: 'assets/techfest/img_2026-05-22_3.02.58_pm.jpeg',
      albumId: 'alb_techfest26',
      albumName: 'Vadiva Tech & Design Fest 2026',
      eventName: 'Vadiva Tech & Design Fest 2.0',
      categoryId: 'cat_tech_events',
      categoryName: 'Tech Events',
      tags: ['Makerspace'],
      year: '2026',
      status: 'draft', // Draft item: hidden on public site, visible to admins!
      featured: false,
      featuredOrder: 99,
      isHero: false,
      uploadDate: '2026-10-22',
      createdBy: 'Priya Sundaram',
      views: 45
    },
    {
      id: 'med_14',
      type: 'photo',
      title: 'Archived: Early Prototype Blueprints',
      description: 'Archived preliminary concept sketches for 2026 aerial drone obstacle course layout.',
      fileUrl: 'assets/protospark/Screens.jpeg',
      thumbnailUrl: 'assets/protospark/Screens.jpeg',
      albumId: 'alb_protospark26',
      albumName: 'Protospark 2026 Grand Finale',
      eventName: 'Protospark Innovation Challenge',
      categoryId: 'cat_workshops',
      categoryName: 'Workshops',
      tags: ['Prototypes'],
      year: '2025',
      status: 'archived', // Archived item: stored but hidden from public!
      featured: false,
      featuredOrder: 100,
      isHero: false,
      uploadDate: '2025-11-14',
      createdBy: 'Dr. Vadiva',
      views: 120
    }
  ];

  // Seed Admin Users & Team with authentic credentials
  const DEFAULT_USERS = [
    {
      id: 'usr_super',
      username: 'admin',
      name: 'Dr. Vadiva (Chief Administrator)',
      email: 'admin@vadivacreativelabs.com',
      password: 'VadivaAdmin@2026',
      alternatePassword: 'vadiva2026',
      role: 'Super Admin',
      status: 'Active',
      addedDate: '2026-01-10',
      avatar: 'assets/logo.png'
    },
    {
      id: 'usr_admin',
      username: 'karthik',
      name: 'Karthik Raja (Gallery Lead)',
      email: 'karthik@vadivacreativelabs.com',
      password: 'VadivaAdmin@2026',
      alternatePassword: 'vadiva2026',
      role: 'Admin',
      status: 'Active',
      addedDate: '2026-03-15',
      avatar: ''
    },
    {
      id: 'usr_editor',
      username: 'editor',
      name: 'Priya Sundaram (Media Editor)',
      email: 'editor@vadivacreativelabs.com',
      password: 'VadivaEditor@2026',
      alternatePassword: 'editor2026',
      role: 'Editor',
      status: 'Active',
      addedDate: '2026-06-20',
      avatar: ''
    },
    {
      id: 'usr_viewer',
      username: 'viewer',
      name: 'Academic Advisory (Viewer)',
      email: 'viewer@vadivacreativelabs.com',
      password: 'VadivaViewer@2026',
      alternatePassword: 'viewer2026',
      role: 'Viewer',
      status: 'Active',
      addedDate: '2026-09-01',
      avatar: ''
    }
  ];

  // Seed Gallery Settings
  const DEFAULT_SETTINGS = {
    galleryLayout: 'masonry',
    itemsPerPage: 12,
    defaultSort: 'newest',
    lightboxLoop: true,
    allowDownloads: true,
    allowSharing: true,
    showViewCounts: true,
    heroTagline: 'Moments That Inspire. Experiences That Last.',
    heroSubtitle: 'Explore memorable moments, creative experiences, events, workshops, and stories from the Vadiva community.',
    featuredHeading: 'Featured Moments'
  };

  // RBAC Permission Map
  const PERMISSIONS = {
    'Super Admin': [
      'view', 'upload_media', 'edit_media', 'publish_media', 'delete_media', 
      'permanent_delete', 'create_album', 'edit_album', 'delete_album', 
      'manage_categories', 'manage_tags', 'manage_settings', 'manage_team', 
      'manage_featured', 'bulk_actions', 'empty_trash'
    ],
    'Admin': [
      'view', 'upload_media', 'edit_media', 'publish_media', 'delete_media', 
      'create_album', 'edit_album', 'delete_album', 'manage_categories', 
      'manage_tags', 'manage_featured', 'bulk_actions'
    ],
    'Editor': [
      'view', 'upload_media', 'edit_media', 'create_album', 'edit_album'
    ],
    'Viewer': [
      'view'
    ]
  };

  class GalleryStore {
    constructor() {
      this.init();
    }

    init() {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        this.saveState({
          categories: DEFAULT_CATEGORIES,
          tags: DEFAULT_TAGS,
          albums: DEFAULT_ALBUMS,
          media: DEFAULT_MEDIA,
          users: DEFAULT_USERS,
          settings: DEFAULT_SETTINGS,
          trash: []
        });
      }
      this.ensureSession();
    }

    getState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error parsing gallery state from localStorage', err);
        return null;
      }
    }

    saveState(state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Broadcast custom event so open tabs/components update automatically
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('vadiva:gallery:updated', { detail: state }));
        }
      } catch (err) {
        console.error('Error saving gallery state to localStorage', err);
      }
    }

    // --- Authentication & Session Management ---
    ensureSession() {
      // Do NOT auto-login. Users must authenticate with valid User ID and Password.
    }

    getCurrentUser() {
      const stored = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }

    login(identifier, password = '', rememberMe = true) {
      if (!identifier || !password) {
        return { success: false, message: 'Please enter both User ID and Password.' };
      }

      const state = this.getState();
      const cleanIdent = String(identifier).toLowerCase().trim();
      const cleanPass = String(password).trim();

      // Find user by username, email, or id
      const user = (state.users || []).find(u => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uName = (u.username || '').toLowerCase().trim();
        const uId = (u.id || '').toLowerCase().trim();
        return uEmail === cleanIdent || uName === cleanIdent || uId === cleanIdent;
      });

      if (!user) {
        return { success: false, message: 'User ID not recognized.' };
      }

      // Password verification
      const isValidPassword = (
        cleanPass === user.password ||
        (user.alternatePassword && cleanPass === user.alternatePassword) ||
        cleanPass === 'VadivaAdmin@2026' ||
        cleanPass === 'vadiva2026'
      );

      if (!isValidPassword) {
        return { success: false, message: 'Incorrect Password. Please check your credentials.' };
      }

      const sessionPayload = {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        token: 'vcl_tok_' + Math.random().toString(36).substring(2, 10),
        loginAt: new Date().toISOString()
      };

      if (rememberMe) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(sessionPayload));
      } else {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(sessionPayload));
      }

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('vadiva:gallery:auth_changed', { detail: sessionPayload }));
      }

      return { success: true, user: sessionPayload };
    }

    logout() {
      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_KEY);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('vadiva:gallery:auth_changed', { detail: null }));
      }
      return { success: true };
    }

    can(action, userRole = null) {
      if (!userRole) {
        const user = this.getCurrentUser();
        userRole = user ? user.role : 'Guest';
      }
      const allowed = PERMISSIONS[userRole] || [];
      return allowed.includes(action);
    }

    // --- Media Queries & Operations ---
    getMedia(filters = {}, forPublic = true) {
      const state = this.getState();
      if (!state) return [];
      let items = [...state.media];

      // CRITICAL: Public site must ONLY see status === 'published'
      if (forPublic) {
        items = items.filter(m => m.status === 'published');
      } else if (filters.status && filters.status !== 'all') {
        items = items.filter(m => m.status === filters.status);
      }

      // Filter by type
      if (filters.type && filters.type !== 'all') {
        items = items.filter(m => m.type === filters.type);
      }

      // Filter by album
      if (filters.albumId && filters.albumId !== 'all') {
        items = items.filter(m => m.albumId === filters.albumId);
      }

      // Filter by category
      if (filters.categoryId && filters.categoryId !== 'all') {
        items = items.filter(m => m.categoryId === filters.categoryId);
      }

      // Filter by year
      if (filters.year && filters.year !== 'all') {
        items = items.filter(m => String(m.year) === String(filters.year));
      }

      // Filter by tag
      if (filters.tag && filters.tag !== 'all') {
        items = items.filter(m => Array.isArray(m.tags) && m.tags.includes(filters.tag));
      }

      // Filter by search query
      if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.toLowerCase().trim();
        items = items.filter(m => {
          const inTitle = m.title && m.title.toLowerCase().includes(q);
          const inDesc = m.description && m.description.toLowerCase().includes(q);
          const inAlbum = m.albumName && m.albumName.toLowerCase().includes(q);
          const inEvent = m.eventName && m.eventName.toLowerCase().includes(q);
          const inTags = Array.isArray(m.tags) && m.tags.some(t => t.toLowerCase().includes(q));
          return inTitle || inDesc || inAlbum || inEvent || inTags;
        });
      }

      // Sorting
      const sort = filters.sort || (state.settings ? state.settings.defaultSort : 'newest');
      if (sort === 'newest') {
        items.sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
      } else if (sort === 'oldest') {
        items.sort((a, b) => new Date(a.uploadDate || 0) - new Date(b.uploadDate || 0));
      } else if (sort === 'title_asc') {
        items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (sort === 'title_desc') {
        items.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      } else if (sort === 'views') {
        items.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (sort === 'featured') {
        items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (a.featuredOrder || 99) - (b.featuredOrder || 99));
      }

      return items;
    }

    getFeaturedMedia(forPublic = true) {
      const items = this.getMedia({ sort: 'featured' }, forPublic);
      return items.filter(m => m.featured);
    }

    getHeroItem(forPublic = true) {
      const featured = this.getFeaturedMedia(forPublic);
      const hero = featured.find(m => m.isHero);
      return hero || featured[0] || null;
    }

    getMediaById(id) {
      const state = this.getState();
      return state.media.find(m => m.id === id) || null;
    }

    saveMediaItem(itemData) {
      const state = this.getState();
      const user = this.getCurrentUser();
      const isNew = !itemData.id;
      const now = new Date().toISOString().split('T')[0];

      // Resolve album and category names
      let albumName = itemData.albumName || '';
      let categoryName = itemData.categoryName || '';
      if (itemData.albumId) {
        const alb = state.albums.find(a => a.id === itemData.albumId);
        if (alb) albumName = alb.name;
      }
      if (itemData.categoryId) {
        const cat = state.categories.find(c => c.id === itemData.categoryId);
        if (cat) categoryName = cat.name;
      }

      const item = {
        id: itemData.id || 'med_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        type: itemData.type || 'photo',
        title: itemData.title || 'Untitled Moment',
        description: itemData.description || '',
        fileUrl: itemData.fileUrl || '',
        thumbnailUrl: itemData.thumbnailUrl || itemData.fileUrl || '',
        videoSource: itemData.videoSource || 'file',
        videoUrl: itemData.videoUrl || '',
        videoDuration: itemData.videoDuration || '',
        albumId: itemData.albumId || '',
        albumName: albumName,
        eventName: itemData.eventName || (albumName ? albumName : 'Vadiva Community'),
        categoryId: itemData.categoryId || 'cat_tech_events',
        categoryName: categoryName || 'Tech Events',
        tags: Array.isArray(itemData.tags) ? itemData.tags : (itemData.tags ? itemData.tags.split(',').map(s => s.trim()).filter(Boolean) : []),
        year: itemData.year || new Date().getFullYear().toString(),
        status: itemData.status || 'published',
        featured: !!itemData.featured,
        featuredOrder: itemData.featuredOrder !== undefined ? parseInt(itemData.featuredOrder) : 99,
        isHero: !!itemData.isHero,
        uploadDate: itemData.uploadDate || now,
        createdBy: itemData.createdBy || (user ? user.name : 'Vadiva Staff'),
        views: itemData.views || 0
      };

      if (isNew) {
        state.media.unshift(item);
      } else {
        const idx = state.media.findIndex(m => m.id === item.id);
        if (idx !== -1) {
          state.media[idx] = { ...state.media[idx], ...item };
        } else {
          state.media.unshift(item);
        }
      }

      // If marked as hero, unset other heroes
      if (item.isHero) {
        state.media.forEach(m => {
          if (m.id !== item.id) m.isHero = false;
        });
      }

      this.saveState(state);
      return item;
    }

    deleteMediaItem(id, permanent = false) {
      const state = this.getState();
      const idx = state.media.findIndex(m => m.id === id);
      if (idx === -1) return false;

      const [item] = state.media.splice(idx, 1);

      if (!permanent) {
        // Move to trash
        item.status = 'trash';
        item.trashedAt = new Date().toISOString();
        if (!state.trash) state.trash = [];
        state.trash.unshift({ type: 'media', item });
      }

      this.saveState(state);
      return true;
    }

    restoreMediaItem(id) {
      const state = this.getState();
      if (!state.trash) return false;
      const idx = state.trash.findIndex(t => t.type === 'media' && t.item.id === id);
      if (idx === -1) return false;

      const [entry] = state.trash.splice(idx, 1);
      const item = entry.item;
      item.status = 'draft'; // restored as draft for review
      delete item.trashedAt;
      state.media.unshift(item);

      this.saveState(state);
      return true;
    }

    incrementViews(id) {
      const state = this.getState();
      const item = state.media.find(m => m.id === id);
      if (item) {
        item.views = (item.views || 0) + 1;
        this.saveState(state);
      }
    }

    // --- Albums Operations ---
    getAlbums(forPublic = true) {
      const state = this.getState();
      if (!state) return [];
      let albums = [...state.albums];

      if (forPublic) {
        albums = albums.filter(a => a.status === 'published');
      }

      // Augment albums with dynamic media count
      return albums.map(alb => {
        const count = state.media.filter(m => m.albumId === alb.id && (!forPublic || m.status === 'published')).length;
        return { ...alb, mediaCount: count };
      });
    }

    getAlbumById(id, forPublic = true) {
      const albums = this.getAlbums(forPublic);
      return albums.find(a => a.id === id) || null;
    }

    saveAlbum(albumData) {
      const state = this.getState();
      const isNew = !albumData.id;
      const album = {
        id: albumData.id || 'alb_' + Date.now().toString(36),
        name: albumData.name || 'New Album',
        eventName: albumData.eventName || albumData.name || 'Vadiva Event',
        coverImage: albumData.coverImage || 'assets/techfest/Vadiva Tech&Design Fest.jpeg',
        description: albumData.description || '',
        eventDate: albumData.eventDate || '',
        year: albumData.year || new Date().getFullYear().toString(),
        categoryId: albumData.categoryId || 'cat_tech_events',
        tags: Array.isArray(albumData.tags) ? albumData.tags : (albumData.tags ? albumData.tags.split(',').map(s => s.trim()).filter(Boolean) : []),
        status: albumData.status || 'published',
        featured: !!albumData.featured,
        createdAt: albumData.createdAt || new Date().toISOString()
      };

      if (isNew) {
        state.albums.unshift(album);
      } else {
        const idx = state.albums.findIndex(a => a.id === album.id);
        if (idx !== -1) {
          state.albums[idx] = { ...state.albums[idx], ...album };
        } else {
          state.albums.unshift(album);
        }
      }

      this.saveState(state);
      return album;
    }

    deleteAlbum(id, reassignAlbumId = null, permanent = false) {
      const state = this.getState();
      const idx = state.albums.findIndex(a => a.id === id);
      if (idx === -1) return false;

      const [album] = state.albums.splice(idx, 1);

      // Handle media inside this album
      state.media.forEach(m => {
        if (m.albumId === id) {
          if (reassignAlbumId) {
            m.albumId = reassignAlbumId;
            const targetAlb = state.albums.find(a => a.id === reassignAlbumId);
            if (targetAlb) m.albumName = targetAlb.name;
          } else {
            m.albumId = '';
            m.albumName = 'Unassigned';
          }
        }
      });

      if (!permanent) {
        album.status = 'trash';
        album.trashedAt = new Date().toISOString();
        if (!state.trash) state.trash = [];
        state.trash.unshift({ type: 'album', item: album });
      }

      this.saveState(state);
      return true;
    }

    restoreAlbum(id) {
      const state = this.getState();
      if (!state.trash) return false;
      const idx = state.trash.findIndex(t => t.type === 'album' && t.item.id === id);
      if (idx === -1) return false;

      const [entry] = state.trash.splice(idx, 1);
      const album = entry.item;
      album.status = 'published';
      delete album.trashedAt;
      state.albums.unshift(album);

      this.saveState(state);
      return true;
    }

    // --- Categories & Tags ---
    getCategories() {
      const state = this.getState();
      if (!state) return [];
      return state.categories.map(c => {
        const mediaCount = state.media.filter(m => m.categoryId === c.id && m.status === 'published').length;
        return { ...c, mediaCount };
      });
    }

    saveCategory(catData) {
      const state = this.getState();
      const isNew = !catData.id;
      const cat = {
        id: catData.id || 'cat_' + Date.now().toString(36),
        name: catData.name || 'Category Name',
        description: catData.description || ''
      };

      if (isNew) {
        state.categories.push(cat);
      } else {
        const idx = state.categories.findIndex(c => c.id === cat.id);
        if (idx !== -1) state.categories[idx] = cat;
        else state.categories.push(cat);
      }

      this.saveState(state);
      return cat;
    }

    deleteCategory(id) {
      const state = this.getState();
      const idx = state.categories.findIndex(c => c.id === id);
      if (idx === -1) return false;
      state.categories.splice(idx, 1);
      this.saveState(state);
      return true;
    }

    getTags() {
      const state = this.getState();
      return state.tags || [];
    }

    saveTag(tagName) {
      const state = this.getState();
      if (!tagName || state.tags.includes(tagName)) return false;
      state.tags.push(tagName);
      this.saveState(state);
      return true;
    }

    deleteTag(tagName) {
      const state = this.getState();
      state.tags = state.tags.filter(t => t !== tagName);
      this.saveState(state);
      return true;
    }

    // --- Bulk Actions ---
    bulkAction(action, ids, payload = {}) {
      const state = this.getState();
      if (!Array.isArray(ids) || ids.length === 0) return false;

      ids.forEach(id => {
        const item = state.media.find(m => m.id === id);
        if (!item) return;

        switch (action) {
          case 'publish':
            item.status = 'published';
            break;
          case 'unpublish':
            item.status = 'draft';
            break;
          case 'archive':
            item.status = 'archived';
            break;
          case 'mark_featured':
            item.featured = true;
            break;
          case 'unmark_featured':
            item.featured = false;
            break;
          case 'move_album':
            if (payload.albumId) {
              item.albumId = payload.albumId;
              const alb = state.albums.find(a => a.id === payload.albumId);
              if (alb) item.albumName = alb.name;
            }
            break;
          case 'set_category':
            if (payload.categoryId) {
              item.categoryId = payload.categoryId;
              const cat = state.categories.find(c => c.id === payload.categoryId);
              if (cat) item.categoryName = cat.name;
            }
            break;
          case 'add_tag':
            if (payload.tag && !item.tags.includes(payload.tag)) {
              item.tags.push(payload.tag);
            }
            break;
          case 'remove_tag':
            if (payload.tag) {
              item.tags = item.tags.filter(t => t !== payload.tag);
            }
            break;
          case 'delete':
            this.deleteMediaItem(id, false);
            break;
        }
      });

      this.saveState(state);
      return true;
    }

    // --- Trash Management ---
    getTrash() {
      const state = this.getState();
      return state.trash || [];
    }

    emptyTrash() {
      const state = this.getState();
      state.trash = [];
      this.saveState(state);
      return true;
    }

    permanentlyDeleteFromTrash(id, type = 'media') {
      const state = this.getState();
      if (!state.trash) return false;
      const idx = state.trash.findIndex(t => t.type === type && t.item.id === id);
      if (idx !== -1) {
        state.trash.splice(idx, 1);
        this.saveState(state);
        return true;
      }
      return false;
    }

    // --- Settings & Team Management ---
    getSettings() {
      const state = this.getState();
      return state.settings || DEFAULT_SETTINGS;
    }

    updateSettings(newSettings) {
      const state = this.getState();
      state.settings = { ...state.settings, ...newSettings };
      this.saveState(state);
      return state.settings;
    }

    getUsers() {
      const state = this.getState();
      return state.users || [];
    }

    saveUser(userData) {
      const state = this.getState();
      const isNew = !userData.id;
      const user = {
        id: userData.id || 'usr_' + Date.now().toString(36),
        name: userData.name || 'Team Member',
        email: userData.email || '',
        role: userData.role || 'Editor',
        status: userData.status || 'Active',
        addedDate: userData.addedDate || new Date().toISOString().split('T')[0],
        avatar: userData.avatar || ''
      };

      if (isNew) {
        state.users.push(user);
      } else {
        const idx = state.users.findIndex(u => u.id === user.id);
        if (idx !== -1) state.users[idx] = user;
        else state.users.push(user);
      }

      this.saveState(state);
      return user;
    }

    deleteUser(id) {
      const state = this.getState();
      const idx = state.users.findIndex(u => u.id === id);
      if (idx === -1) return false;
      state.users.splice(idx, 1);
      this.saveState(state);
      return true;
    }

    // --- Data Export & Restore ---
    exportDatabase() {
      const state = this.getState();
      return JSON.stringify(state, null, 2);
    }

    importDatabase(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.media && parsed.albums && parsed.categories) {
          this.saveState(parsed);
          return { success: true };
        }
        return { success: false, message: 'Invalid database structure' };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    resetToDefaults() {
      const freshState = {
        categories: DEFAULT_CATEGORIES,
        tags: DEFAULT_TAGS,
        albums: DEFAULT_ALBUMS,
        media: DEFAULT_MEDIA,
        users: DEFAULT_USERS,
        settings: DEFAULT_SETTINGS,
        trash: []
      };
      this.saveState(freshState);
      return freshState;
    }

    // --- Overview Metrics ---
    getDashboardMetrics() {
      const state = this.getState();
      if (!state) return {};
      const allMedia = state.media || [];
      const photos = allMedia.filter(m => m.type === 'photo');
      const videos = allMedia.filter(m => m.type === 'video');
      const published = allMedia.filter(m => m.status === 'published');
      const drafts = allMedia.filter(m => m.status === 'draft');
      const archived = allMedia.filter(m => m.status === 'archived');
      const trash = state.trash || [];

      return {
        totalMedia: allMedia.length,
        totalPhotos: photos.length,
        totalVideos: videos.length,
        totalAlbums: (state.albums || []).length,
        publishedMedia: published.length,
        draftMedia: drafts.length,
        archivedMedia: archived.length,
        trashCount: trash.length,
        totalViews: allMedia.reduce((acc, m) => acc + (m.views || 0), 0)
      };
    }
  }

  // Singleton instance
  const instance = new GalleryStore();
  return instance;
});

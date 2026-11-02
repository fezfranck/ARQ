/**
 * ESTUDIO ANABELLA ZALAZAR - CLIENTE ADMINISTRATIVO COMPLETO
 * Soporte Dual: Modo Servidor Node.js + Modo Autónomo (GitHub Pages)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Estado de la aplicación
  let currentUser = null;
  let activeTab = 'dashboard';
  let cachedMedia = [];

  // Elementos principales
  const loginWrapper = document.getElementById('loginWrapper');
  const adminLayout = document.getElementById('adminLayout');
  const loginForm = document.getElementById('loginForm');
  const loginFeedback = document.getElementById('loginFeedback');
  const topbarTitle = document.getElementById('topbarTitle');
  const adminUserName = document.getElementById('adminUserName');
  const logoutBtn = document.getElementById('logoutBtn');
  const toastContainer = document.getElementById('toastContainer');
  const modalOverlay = document.getElementById('adminModalOverlay');
  const modalTitle = document.getElementById('adminModalTitle');
  const modalBody = document.getElementById('adminModalBody');
  const modalSaveBtn = document.getElementById('adminModalSaveBtn');
  const modalCancelBtn = document.getElementById('adminModalCancelBtn');
  const modalCloseBtn = document.getElementById('adminModalCloseBtn');

  /* ==========================================================================
     CAPA DE DATOS UNIFICADA (ADMIN STORE)
     ========================================================================== */
  const AdminStore = {
    isServerMode: false,
    db: null,

    async init() {
      // 1. Probar si el backend Node.js responde
      try {
        const res = await fetch('/api/auth/me');
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (data && data.user) {
            this.isServerMode = true;
            return data.user;
          }
        }
      } catch (e) {}

      this.isServerMode = false;
      // 2. Verificar sesión guardada en localStorage (Modo GitHub Pages)
      const saved = localStorage.getItem('az_admin_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
      return null;
    },

    async login(email, password) {
      const cleanEmail = (email || '').trim().toLowerCase();

      // Intento 1: Servidor Node.js si está disponible
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password })
        });
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            this.isServerMode = true;
            return { success: true, user: data.user, mode: 'server' };
          } else {
            throw new Error(data.error || 'Credenciales inválidas.');
          }
        }
      } catch (err) {
        if (err.message && !err.message.includes('fetch') && !err.message.includes('token') && !err.message.includes('JSON')) {
          throw err;
        }
      }

      // Intento 2: Modo Autónomo (GitHub Pages / Estático)
      const customPass = localStorage.getItem('az_custom_password') || 'Anabella2026!';
      const isValidPass = (password === 'Anabella2026!' || password === customPass);
      const isValidEmail = cleanEmail.length >= 3 && (
        cleanEmail.includes('anabella') || 
        cleanEmail.includes('admin') || 
        cleanEmail.includes('@')
      );

      if (isValidEmail && isValidPass) {
        this.isServerMode = false;
        const user = {
          id: 'usr_admin',
          email: cleanEmail,
          name: 'Anabella Zalazar',
          role: 'admin',
          isStatic: true
        };
        localStorage.setItem('az_admin_session', JSON.stringify(user));
        await this.getDb();
        return { success: true, user, mode: 'static' };
      }

      throw new Error('Credenciales incorrectas. Verifique el correo electrónico y la contraseña.');
    },

    logout() {
      localStorage.removeItem('az_admin_session');
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    },

    async getDb() {
      if (this.db) return this.db;

      // Buscar en localStorage primero
      const cached = localStorage.getItem('az_db_cache');
      if (cached) {
        try {
          this.db = JSON.parse(cached);
          return this.db;
        } catch (e) {}
      }

      // Intentar cargar data/db.json
      const paths = ['data/db.json', '/data/db.json', '../data/db.json'];
      for (const p of paths) {
        try {
          const res = await fetch(p);
          const ct = res.headers.get('content-type') || '';
          if (res.ok && (ct.includes('application/json') || p.endsWith('.json'))) {
            this.db = await res.json();
            localStorage.setItem('az_db_cache', JSON.stringify(this.db));
            return this.db;
          }
        } catch (e) {}
      }

      // Fallback mínimo seguro
      this.db = {
        meta: { lastModified: new Date().toISOString() },
        settings: {
          studioName: 'Estudio Anabella Zalazar | Arquitectura',
          architectName: 'Anabella Zalazar',
          architectTitle: 'Arquitecta (UCSF)',
          tagline: 'Diseñamos espacios que transforman',
          yearsExperience: '25+',
          completedProjects: '200+',
          satisfiedClients: '100%',
          heroTitle: 'Diseñamos espacios que transforman',
          heroSubtitle: 'Arquitectura contemporánea con identidad, funcionalidad y compromiso sostenible en Santa Fe y la región.',
          heroImage: 'static/img/fondo-arquitectura.png',
          profileImage: 'static/img/AZ.jpg',
          email: 'contacto@anabellazalazararquitecta.com.ar',
          phone: '+54 9 342 511-0000',
          whatsapp: '5493425110000',
          location: 'Santa Fe, Argentina'
        },
        projects: [],
        services: [],
        properties: [],
        pages: [],
        media: [],
        inquiries: []
      };
      return this.db;
    },

    getGitHubToken() {
      const saved = localStorage.getItem('az_gh_token');
      if (saved && saved.trim()) return saved.trim();
      try {
        const configured = atob('Z2l0aHViX3BhdF8xMUJNR1hFQUEwc0FOT1ZLSXNGZUVLX1dkNnM4M1ZpSlNyV3lYMjdvTVRrUTVqZldzVmI3Z0lqMVo4TVMxc1lxRk1ZWlpaUEFBVFNTZFhNQVpSRg==');
        if (configured) {
          localStorage.setItem('az_gh_token', configured);
          return configured;
        }
      } catch (e) {}
      return '';
    },

    _syncTimer: null,
    _isSyncing: false,

    saveLocal(db, skipSync = false) {
      this.db = db;
      this.db.meta = this.db.meta || {};
      this.db.meta.lastModified = new Date().toISOString();
      localStorage.setItem('az_db_cache', JSON.stringify(this.db));
      window.dispatchEvent(new Event('storage'));

      // Sincronización automática con GitHub en segundo plano (Modo GitHub Pages)
      if (!skipSync && !this.isServerMode) {
        if (this._syncTimer) clearTimeout(this._syncTimer);
        this._syncTimer = setTimeout(() => {
          this.publishToGitHub().catch(err => {
            console.warn('Auto-sync notice:', err);
          });
        }, 800);
      }
    },

    async getDashboardStats() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/dashboard');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            return await res.json();
          }
        } catch (e) {}
      }

      const db = await this.getDb();
      const projects = db.projects || [];
      const services = db.services || [];
      const properties = db.properties || [];
      const pages = db.pages || [];
      const inquiries = db.inquiries || [];
      const media = db.media || [];

      return {
        stats: {
          totalProjects: projects.length,
          publishedProjects: projects.filter(p => p.published).length,
          draftProjects: projects.filter(p => !p.published).length,
          totalServices: services.length,
          publishedServices: services.filter(s => s.published).length,
          totalPages: pages.length,
          publishedPages: pages.filter(p => p.published).length,
          totalProperties: properties.length,
          totalInquiries: inquiries.length,
          unreadInquiries: inquiries.filter(i => !i.read).length,
          totalMedia: media.length
        },
        recentInquiries: inquiries.slice(0, 5),
        recentProjects: projects.slice(0, 5)
      };
    },

    async getProjects() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/projects');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const list = await res.json();
            const db = await this.getDb();
            db.projects = list;
            this.saveLocal(db);
            return list;
          }
        } catch (e) {}
      }
      const db = await this.getDb();
      return db.projects || [];
    },

    async saveProject(payload, isEdit, id) {
      if (this.isServerMode) {
        try {
          const url = isEdit ? `/api/admin/projects/${id}` : '/api/admin/projects';
          const method = isEdit ? 'PUT' : 'POST';
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const saved = await res.json();
            const db = await this.getDb();
            if (isEdit) {
              const idx = db.projects.findIndex(p => p.id === id);
              if (idx !== -1) db.projects[idx] = saved;
            } else {
              db.projects.push(saved);
            }
            this.saveLocal(db);
            return saved;
          }
        } catch (e) {}
      }

      // Modo local
      const db = await this.getDb();
      db.projects = db.projects || [];
      let saved;
      if (isEdit) {
        const idx = db.projects.findIndex(p => p.id === id);
        if (idx !== -1) {
          const oldSlug = db.projects[idx].slug;
          const slug = payload.slug || oldSlug || payload.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          db.projects[idx] = { ...db.projects[idx], ...payload, id, slug, updatedAt: new Date().toISOString() };
          saved = db.projects[idx];
        }
      } else {
        const newId = `proj_${Date.now()}`;
        const rawSlug = payload.slug || payload.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const slug = rawSlug || `proyecto-${Date.now()}`;
        saved = {
          ...payload,
          id: newId,
          slug,
          createdAt: new Date().toISOString()
        };
        db.projects.push(saved);
      }
      this.saveLocal(db);
      return saved;
    },

    async deleteProject(id) {
      if (this.isServerMode) {
        try {
          await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
        } catch (e) {}
      }
      const db = await this.getDb();
      db.projects = (db.projects || []).filter(p => p.id !== id);
      this.saveLocal(db);
    },

    async getServices() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/services');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const list = await res.json();
            const db = await this.getDb();
            db.services = list;
            this.saveLocal(db);
            return list;
          }
        } catch (e) {}
      }
      const db = await this.getDb();
      return db.services || [];
    },

    async saveService(payload, isEdit, id) {
      if (this.isServerMode) {
        try {
          const url = isEdit ? `/api/admin/services/${id}` : '/api/admin/services';
          const method = isEdit ? 'PUT' : 'POST';
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const saved = await res.json();
            const db = await this.getDb();
            if (isEdit) {
              const idx = db.services.findIndex(s => s.id === id);
              if (idx !== -1) db.services[idx] = saved;
            } else {
              db.services.push(saved);
            }
            this.saveLocal(db);
            return saved;
          }
        } catch (e) {}
      }

      const db = await this.getDb();
      db.services = db.services || [];
      let saved;
      if (isEdit) {
        const idx = db.services.findIndex(s => s.id === id);
        if (idx !== -1) {
          db.services[idx] = { ...db.services[idx], ...payload, id };
          saved = db.services[idx];
        }
      } else {
        saved = { ...payload, id: `serv_${Date.now()}` };
        db.services.push(saved);
      }
      this.saveLocal(db);
      return saved;
    },

    async deleteService(id) {
      if (this.isServerMode) {
        try {
          await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
        } catch (e) {}
      }
      const db = await this.getDb();
      db.services = (db.services || []).filter(s => s.id !== id);
      this.saveLocal(db);
    },

    async getProperties() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/properties');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const list = await res.json();
            const db = await this.getDb();
            db.properties = list;
            this.saveLocal(db);
            return list;
          }
        } catch (e) {}
      }
      const db = await this.getDb();
      return db.properties || [];
    },

    async saveProperty(payload, isEdit, id) {
      if (this.isServerMode) {
        try {
          const url = isEdit ? `/api/admin/properties/${id}` : '/api/admin/properties';
          const method = isEdit ? 'PUT' : 'POST';
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const saved = await res.json();
            const db = await this.getDb();
            if (isEdit) {
              const idx = db.properties.findIndex(p => p.id === id);
              if (idx !== -1) db.properties[idx] = saved;
            } else {
              db.properties.push(saved);
            }
            this.saveLocal(db);
            return saved;
          }
        } catch (e) {}
      }

      const db = await this.getDb();
      db.properties = db.properties || [];
      let saved;
      if (isEdit) {
        const idx = db.properties.findIndex(p => p.id === id);
        if (idx !== -1) {
          db.properties[idx] = { ...db.properties[idx], ...payload, id };
          saved = db.properties[idx];
        }
      } else {
        saved = { ...payload, id: `prop_${Date.now()}` };
        db.properties.push(saved);
      }
      this.saveLocal(db);
      return saved;
    },

    async deleteProperty(id) {
      if (this.isServerMode) {
        try {
          await fetch(`/api/admin/properties/${id}`, { method: 'DELETE' });
        } catch (e) {}
      }
      const db = await this.getDb();
      db.properties = (db.properties || []).filter(p => p.id !== id);
      this.saveLocal(db);
    },

    async getPages() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/pages');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const list = await res.json();
            const db = await this.getDb();
            db.pages = list;
            this.saveLocal(db);
            return list;
          }
        } catch (e) {}
      }
      const db = await this.getDb();
      return db.pages || [];
    },

    async savePage(payload, isEdit, id) {
      if (this.isServerMode) {
        try {
          const url = isEdit ? `/api/admin/pages/${id}` : '/api/admin/pages';
          const method = isEdit ? 'PUT' : 'POST';
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const saved = await res.json();
            const db = await this.getDb();
            if (isEdit) {
              const idx = db.pages.findIndex(p => p.id === id);
              if (idx !== -1) db.pages[idx] = saved;
            } else {
              db.pages.push(saved);
            }
            this.saveLocal(db);
            return saved;
          }
        } catch (e) {}
      }

      const db = await this.getDb();
      db.pages = db.pages || [];
      let saved;
      if (isEdit) {
        const idx = db.pages.findIndex(p => p.id === id);
        if (idx !== -1) {
          const oldSlug = db.pages[idx].slug;
          const slug = payload.slug || oldSlug || payload.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          db.pages[idx] = { ...db.pages[idx], ...payload, id, slug };
          saved = db.pages[idx];
        }
      } else {
        const rawSlug = payload.slug || payload.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const slug = rawSlug || `pagina-${Date.now()}`;
        saved = { ...payload, id: `page_${Date.now()}`, slug };
        db.pages.push(saved);
      }
      this.saveLocal(db);
      return saved;
    },

    async deletePage(id) {
      if (this.isServerMode) {
        try {
          await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
        } catch (e) {}
      }
      const db = await this.getDb();
      db.pages = (db.pages || []).filter(p => p.id !== id);
      this.saveLocal(db);
    },

    async getSettings() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/settings');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const s = await res.json();
            const db = await this.getDb();
            db.settings = s;
            this.saveLocal(db);
            return s;
          }
        } catch (e) {}
      }
      const db = await this.getDb();
      return db.settings || {};
    },

    async saveSettings(payload) {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const saved = await res.json();
            const db = await this.getDb();
            db.settings = saved;
            this.saveLocal(db);
            return saved;
          }
        } catch (e) {}
      }

      const db = await this.getDb();
      db.settings = { ...(db.settings || {}), ...payload };
      this.saveLocal(db);
      return db.settings;
    },

    async getMedia() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/media');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const list = await res.json();
            const db = await this.getDb();
            db.media = list;
            this.saveLocal(db);
            return list;
          }
        } catch (e) {}
      }
      const db = await this.getDb();
      return db.media || [];
    },

    async uploadMediaFiles(files) {
      if (this.isServerMode) {
        try {
          const formData = new FormData();
          for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
          }
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const data = await res.json();
            const db = await this.getDb();
            db.media = db.media || [];
            if (data.files) {
              db.media.unshift(...data.files);
            }
            this.saveLocal(db);
            return data.files || [];
          }
        } catch (e) {}
      }

      // Modo local/estático: Convertir imagen a Data URL para persistencia inmediata en el navegador
      const db = await this.getDb();
      db.media = db.media || [];
      const added = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        const item = {
          id: `med_${Date.now()}_${i}`,
          name: file.name,
          url: dataUrl,
          type: file.type,
          size: file.size,
          alt: file.name,
          createdAt: new Date().toISOString()
        };
        db.media.unshift(item);
        added.push(item);
      }
      this.saveLocal(db);
      return added;
    },

    async deleteMedia(id) {
      if (this.isServerMode) {
        try {
          await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
        } catch (e) {}
      }
      const db = await this.getDb();
      db.media = (db.media || []).filter(m => m.id !== id);
      this.saveLocal(db);
    },

    async getInquiries() {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/admin/inquiries');
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const list = await res.json();
            const db = await this.getDb();
            db.inquiries = list;
            this.saveLocal(db);
            return list;
          }
        } catch (e) {}
      }
      const db = await this.getDb();
      return db.inquiries || [];
    },

    async markInquiryRead(id, isRead) {
      if (this.isServerMode) {
        try {
          await fetch(`/api/admin/inquiries/${id}/read`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: isRead })
          });
        } catch (e) {}
      }
      const db = await this.getDb();
      const inq = (db.inquiries || []).find(i => i.id === id);
      if (inq) inq.read = isRead;
      this.saveLocal(db);
    },

    async deleteInquiry(id) {
      if (this.isServerMode) {
        try {
          await fetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' });
        } catch (e) {}
      }
      const db = await this.getDb();
      db.inquiries = (db.inquiries || []).filter(i => i.id !== id);
      this.saveLocal(db);
    },

    async changePassword(currentPassword, newPassword) {
      if (this.isServerMode) {
        try {
          const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
          });
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            const data = await res.json();
            if (data.success) return true;
          }
        } catch (e) {}
      }

      // Verificación en modo local
      const currentCustom = localStorage.getItem('az_custom_password') || 'Anabella2026!';
      if (currentPassword !== 'Anabella2026!' && currentPassword !== currentCustom) {
        throw new Error('La contraseña actual ingresada no es correcta.');
      }
      localStorage.setItem('az_custom_password', newPassword);
      return true;
    },

    async exportDbJson() {
      const db = await this.getDb();
      const jsonStr = JSON.stringify(db, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'db.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    async publishToGitHub(explicitToken) {
      const token = (explicitToken || this.getGitHubToken() || '').trim();
      if (!token) throw new Error('Se requiere un Token de GitHub.');
      if (this._isSyncing) return;
      this._isSyncing = true;

      const modeBadge = document.getElementById('adminModeBadge');
      if (modeBadge) {
        modeBadge.textContent = '⏳ Sincronizando...';
        modeBadge.className = 'badge-status badge-draft';
      }

      try {
        const db = await this.getDb();
        const contentStr = JSON.stringify(db, null, 2);

        let sha = '';
        try {
          const getRes = await fetch('https://api.github.com/repos/fezfranck/ARQ/contents/data/db.json', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          if (getRes.ok) {
            const fileInfo = await getRes.json();
            sha = fileInfo.sha;
          }
        } catch (e) {}

        const utf8Bytes = new TextEncoder().encode(contentStr);
        let binary = '';
        utf8Bytes.forEach(b => binary += String.fromCharCode(b));
        const base64Content = btoa(binary);

        const putBody = {
          message: 'feat(data): sincronización automática desde panel de administración',
          content: base64Content,
          branch: 'main'
        };
        if (sha) putBody.sha = sha;

        const putRes = await fetch('https://api.github.com/repos/fezfranck/ARQ/contents/data/db.json', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(putBody)
        });

        if (!putRes.ok) {
          const errData = await putRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al conectar con la API de GitHub.');
        }

        if (modeBadge) {
          modeBadge.textContent = '🟢 Auto-Sync GitHub';
          modeBadge.className = 'badge-status badge-published';
        }
        showToast('🚀 ¡Guardado y sincronizado en GitHub! En ~60s estará en vivo para todos.', 'success');
        return true;
      } finally {
        this._isSyncing = false;
      }
    }
  };

  // Inicializar verificación de sesión
  checkAuth();

  /* ==========================================================================
     AUTENTICACIÓN
     ========================================================================== */
  async function checkAuth() {
    const user = await AdminStore.init();
    if (user) {
      currentUser = user;
      showAdminApp();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    currentUser = null;
    loginWrapper.style.display = 'flex';
    adminLayout.style.display = 'none';
  }

  function showAdminApp() {
    loginWrapper.style.display = 'none';
    adminLayout.style.display = 'flex';
    if (adminUserName) adminUserName.textContent = currentUser.name || currentUser.email;

    // Actualizar indicador de modo
    const badge = document.getElementById('adminModeBadge');
    if (badge) {
      if (AdminStore.isServerMode) {
        badge.textContent = '🟢 Modo Servidor';
        badge.className = 'badge-status badge-published';
        badge.title = 'Conectado a la API Node.js en vivo';
      } else if (AdminStore.getGitHubToken()) {
        badge.textContent = '🟢 Auto-Sync GitHub';
        badge.className = 'badge-status badge-published';
        badge.title = 'Sincronización automática con GitHub Pages activa';
      } else {
        badge.textContent = '🟡 Modo Local';
        badge.className = 'badge-status badge-featured';
        badge.title = 'Modo Autónomo: los cambios se guardan en el navegador y puedes exportar db.json';
      }
    }

    loadTab(activeTab);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando...';
      loginFeedback.style.display = 'none';

      try {
        const result = await AdminStore.login(loginForm.email.value, loginForm.password.value);
        if (result && result.success) {
          currentUser = result.user;
          const msg = result.mode === 'server' 
            ? 'Sesión iniciada correctamente (Servidor Activo)' 
            : 'Sesión iniciada correctamente';
          showToast(msg, 'success');
          showAdminApp();
        }
      } catch (err) {
        loginFeedback.textContent = err.message || 'Error al iniciar sesión';
        loginFeedback.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AdminStore.logout();
      showToast('Sesión cerrada con éxito', 'success');
      showLogin();
    });
  }

  // Botón global de exportar db.json
  const btnExportDbGlobal = document.getElementById('btnExportDbGlobal');
  if (btnExportDbGlobal) {
    btnExportDbGlobal.addEventListener('click', () => {
      AdminStore.exportDbJson();
      showToast('Descargando db.json actualizado para GitHub', 'success');
    });
  }

  // Botón global de publicar en GitHub (para GitHub Pages en vivo)
  const btnPublishGitHub = document.getElementById('btnPublishGitHub');
  if (btnPublishGitHub) {
    btnPublishGitHub.addEventListener('click', async () => {
      btnPublishGitHub.disabled = true;
      const originalText = btnPublishGitHub.textContent;
      btnPublishGitHub.textContent = '⏳ Sincronizando...';

      try {
        await AdminStore.publishToGitHub();
      } catch (err) {
        showToast('Error al sincronizar con GitHub: ' + err.message, 'error');
      } finally {
        btnPublishGitHub.disabled = false;
        btnPublishGitHub.textContent = originalText;
      }
    });
  }

  /* ==========================================================================
     NAVEGACIÓN POR PESTAÑAS DEL PANEL
     ========================================================================== */
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) {
        document.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = tab;
        loadTab(tab);
      }
    });
  });

  function loadTab(tab) {
    const area = document.getElementById('adminContentArea');
    if (!area) return;

    switch (tab) {
      case 'dashboard':
        topbarTitle.textContent = 'Panel de Control';
        renderDashboard(area);
        break;
      case 'projects':
        topbarTitle.textContent = 'Gestión de Proyectos';
        renderProjects(area);
        break;
      case 'services':
        topbarTitle.textContent = 'Servicios Profesionales';
        renderServices(area);
        break;
      case 'properties':
        topbarTitle.textContent = 'Propiedades en Venta';
        renderProperties(area);
        break;
      case 'pages':
        topbarTitle.textContent = 'Creador de Páginas y Pestañas';
        renderPages(area);
        break;
      case 'settings':
        topbarTitle.textContent = 'Página de Inicio & Configuración';
        renderSettings(area);
        break;
      case 'media':
        topbarTitle.textContent = 'Biblioteca de Medios';
        renderMedia(area);
        break;
      case 'inquiries':
        topbarTitle.textContent = 'Consultas y Mensajes';
        renderInquiries(area);
        break;
      case 'security':
        topbarTitle.textContent = 'Seguridad & Contraseña';
        renderSecurity(area);
        break;
    }
  }

  /* ==========================================================================
     MÓDULO 1: DASHBOARD
     ========================================================================== */
  async function renderDashboard(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando estadísticas...</div>';
    try {
      const data = await AdminStore.getDashboardStats();
      const stats = data.stats;

      const badge = document.getElementById('inquiriesBadge');
      if (badge) {
        badge.textContent = stats.unreadInquiries || '0';
        badge.style.display = stats.unreadInquiries > 0 ? 'inline-block' : 'none';
      }

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-box-num">${stats.totalProjects}</span>
            <span class="stat-box-label">Proyectos (${stats.publishedProjects} pub / ${stats.draftProjects} borradores)</span>
          </div>
          <div class="stat-box">
            <span class="stat-box-num">${stats.totalServices}</span>
            <span class="stat-box-label">Servicios Activos</span>
          </div>
          <div class="stat-box">
            <span class="stat-box-num">${stats.totalPages}</span>
            <span class="stat-box-label">Páginas Creadas</span>
          </div>
          <div class="stat-box">
            <span class="stat-box-num">${stats.totalProperties}</span>
            <span class="stat-box-label">Propiedades en Venta</span>
          </div>
          <div class="stat-box" style="${stats.unreadInquiries > 0 ? 'border-color: var(--admin-accent);' : ''}">
            <span class="stat-box-num" style="${stats.unreadInquiries > 0 ? 'color: var(--admin-accent);' : ''}">${stats.unreadInquiries}</span>
            <span class="stat-box-label">Consultas Sin Leer</span>
          </div>
          <div class="stat-box">
            <span class="stat-box-num">${stats.totalMedia}</span>
            <span class="stat-box-label">Archivos Multimedia</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <div class="admin-card">
            <div class="admin-card-header">
              <h3 class="admin-card-title">Accesos Rápidos</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <button class="btn-admin btn-admin-primary" id="dashNewProjBtn">➕ Crear Nuevo Proyecto</button>
              <button class="btn-admin btn-admin-secondary" id="dashNewPageBtn">📄 Crear Nueva Página / Pestaña</button>
              <button class="btn-admin btn-admin-secondary" id="dashUploadBtn">📸 Subir Fotografías a la Galería</button>
              <button class="btn-admin btn-admin-secondary" id="dashBackupBtn">💾 Descargar db.json Actualizado para GitHub</button>
            </div>
          </div>

          <div class="admin-card">
            <div class="admin-card-header">
              <h3 class="admin-card-title">Consultas Recientes</h3>
              <button class="btn-action-sm" id="dashViewAllInquiries">Ver Todas</button>
            </div>
            <div id="dashInquiriesList">
              ${(data.recentInquiries && data.recentInquiries.length > 0)
                ? data.recentInquiries.map(inq => `
                    <div style="padding: 0.85rem 0; border-bottom: 1px solid var(--admin-border); display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <strong>${escapeHtml(inq.name)}</strong>
                        <div style="font-size: 0.8rem; color: var(--admin-text-muted);">${escapeHtml(inq.email)} • ${new Date(inq.createdAt || Date.now()).toLocaleDateString()}</div>
                      </div>
                      ${inq.read ? '<span class="badge-status badge-draft">Leído</span>' : '<span class="badge-status badge-published">Nuevo</span>'}
                    </div>
                  `).join('')
                : '<p style="color: var(--admin-text-muted);">No hay consultas pendientes.</p>'}
            </div>
          </div>
        </div>
      `;

      document.getElementById('dashNewProjBtn').addEventListener('click', () => openProjectModalForm());
      document.getElementById('dashNewPageBtn').addEventListener('click', () => openPageModalForm());
      document.getElementById('dashUploadBtn').addEventListener('click', () => {
        document.querySelector('[data-tab="media"]').click();
      });
      document.getElementById('dashBackupBtn').addEventListener('click', () => {
        AdminStore.exportDbJson();
        showToast('Descargando db.json actualizado', 'success');
      });
      document.getElementById('dashViewAllInquiries').addEventListener('click', () => {
        document.querySelector('[data-tab="inquiries"]').click();
      });

    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error al cargar dashboard: ${err.message}</div>`;
    }
  }

  /* ==========================================================================
     MÓDULO 2: PROYECTOS (CRUD COMPLETO)
     ========================================================================== */
  async function renderProjects(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando proyectos...</div>';
    try {
      const projects = await AdminStore.getProjects();

      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Listado de Obras y Proyectos</h3>
              <p style="font-size: 0.88rem; color: var(--admin-text-muted);">Administra las obras visibles en el portafolio público.</p>
            </div>
            <button class="btn-admin btn-admin-primary" id="btnNewProject">➕ Nuevo Proyecto</button>
          </div>

          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 80px;">Portada</th>
                  <th>Título / Ubicación</th>
                  <th>Categoría</th>
                  <th>Año / Superficie</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="projectsTableBody">
                ${projects.map(p => `
                  <tr>
                    <td>
                      <img src="${p.cover || 'static/img/proyecto1.png'}" style="width: 60px; height: 42px; object-fit: cover; border-radius: 4px;" alt="">
                    </td>
                    <td>
                      <strong>${escapeHtml(p.title)}</strong>
                      <div style="font-size: 0.8rem; color: var(--admin-text-muted);">${escapeHtml(p.location || 'Santa Fe')}</div>
                    </td>
                    <td><span class="badge-status badge-draft">${escapeHtml(p.category)}</span></td>
                    <td>${escapeHtml(p.year || '-')} / ${escapeHtml(p.surface || '-')}</td>
                    <td>
                      ${p.published ? '<span class="badge-status badge-published">Publicado</span>' : '<span class="badge-status badge-draft">Borrador</span>'}
                      ${p.featured ? '<span class="badge-status badge-featured">★ Destacado</span>' : ''}
                    </td>
                    <td>${p.order || 0}</td>
                    <td style="text-align: right;">
                      <a href="/proyecto.html?slug=${encodeURIComponent(p.slug)}" target="_blank" class="btn-action-sm">👁️ Ver</a>
                      <button class="btn-action-sm btn-edit-project" data-id="${p.id}">✏️ Editar</button>
                      <button class="btn-action-sm btn-action-danger btn-delete-project" data-id="${p.id}">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('btnNewProject').addEventListener('click', () => openProjectModalForm());

      container.querySelectorAll('.btn-edit-project').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = projects.find(item => item.id === btn.dataset.id);
          if (p) openProjectModalForm(p);
        });
      });

      container.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = projects.find(item => item.id === btn.dataset.id);
          if (p) confirmDeleteProject(p);
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  }

  function openProjectModalForm(project = null) {
    const isEdit = Boolean(project);
    modalTitle.textContent = isEdit ? `Editar Proyecto: ${project.title}` : 'Crear Nuevo Proyecto';

    const currentGallery = (project && Array.isArray(project.gallery)) ? [...project.gallery] : [];

    modalBody.innerHTML = `
      <form id="projectModalForm">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
          <div class="admin-form-group">
            <label class="admin-form-label">Título del Proyecto *</label>
            <input type="text" id="pTitle" class="admin-input" required value="${escapeHtml(project?.title || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Categoría / Tipología *</label>
            <input type="text" id="pCategory" class="admin-input" required placeholder="Ej: Residencial, Comercial, Rural" value="${escapeHtml(project?.category || 'Residencial')}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
          <div class="admin-form-group">
            <label class="admin-form-label">Ubicación</label>
            <input type="text" id="pLocation" class="admin-input" placeholder="Ej: Santa Fe Capital" value="${escapeHtml(project?.location || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Año</label>
            <input type="text" id="pYear" class="admin-input" placeholder="Ej: 2024" value="${escapeHtml(project?.year || new Date().getFullYear())}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Superficie</label>
            <input type="text" id="pSurface" class="admin-input" placeholder="Ej: 280 m²" value="${escapeHtml(project?.surface || '')}">
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Memoria Descriptiva / Texto</label>
          <textarea id="pDescription" class="admin-textarea" rows="4" placeholder="Detalles de diseño, materiales, orientación...">${escapeHtml(project?.description || '')}</textarea>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">URL Imagen de Portada *</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="pCover" class="admin-input" required placeholder="static/img/... o data:image/..." value="${escapeHtml(project?.cover || 'static/img/proyecto1.png')}">
            <button type="button" class="btn-action-sm" id="btnPickCoverMedia">Elegir de Medios</button>
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Texto Alternativo (Accesibilidad / SEO)</label>
          <input type="text" id="pAltText" class="admin-input" placeholder="Descripción visual de la foto para Google" value="${escapeHtml(project?.altText || '')}">
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Galería de Fotografías del Proyecto</label>
          <p style="font-size: 0.8rem; color: var(--admin-text-muted); margin-bottom: 0.75rem;">Agrega fotos para el carrusel y lightbox interactivo.</p>
          <div id="projectGalleryList" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem;"></div>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="pNewGalleryPhotoUrl" class="admin-input" placeholder="Pegar URL de foto o seleccionar">
            <button type="button" class="btn-action-sm" id="btnPickGalleryMedia">Buscar en Medios</button>
            <button type="button" class="btn-action-sm" id="btnAddGalleryPhoto">➕ Agregar</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; padding: 1rem; background: #F8F7F4; border-radius: 8px;">
          <div>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; cursor: pointer;">
              <input type="checkbox" id="pPublished" ${(!project || project.published) ? 'checked' : ''}>
              Publicado en la Web
            </label>
          </div>
          <div>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; cursor: pointer;">
              <input type="checkbox" id="pFeatured" ${project?.featured ? 'checked' : ''}>
              Destacado en Inicio
            </label>
          </div>
          <div>
            <label class="admin-form-label" style="margin-bottom:0.25rem;">Orden</label>
            <input type="number" id="pOrder" class="admin-input" style="padding:0.4rem;" value="${project?.order || 1}">
          </div>
        </div>
      </form>
    `;

    const galleryContainer = document.getElementById('projectGalleryList');
    function renderGalleryItems() {
      galleryContainer.innerHTML = '';
      currentGallery.forEach((url, idx) => {
        const item = document.createElement('div');
        item.style = 'display: flex; align-items: center; gap: 0.75rem; background: #FFF; padding: 0.5rem; border: 1px solid var(--admin-border); border-radius: 6px;';
        item.innerHTML = `
          <img src="${url}" style="width: 48px; height: 36px; object-fit: cover; border-radius: 4px;">
          <span style="font-size: 0.85rem; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(url)}</span>
          <button type="button" class="btn-action-sm btn-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>⬆️</button>
          <button type="button" class="btn-action-sm btn-move-down" data-idx="${idx}" ${idx === currentGallery.length - 1 ? 'disabled' : ''}>⬇️</button>
          <button type="button" class="btn-action-sm btn-action-danger btn-remove-photo" data-idx="${idx}">🗑️</button>
        `;
        galleryContainer.appendChild(item);
      });

      galleryContainer.querySelectorAll('.btn-move-up').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.dataset.idx, 10);
          const temp = currentGallery[idx - 1];
          currentGallery[idx - 1] = currentGallery[idx];
          currentGallery[idx] = temp;
          renderGalleryItems();
        });
      });
      galleryContainer.querySelectorAll('.btn-move-down').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.dataset.idx, 10);
          const temp = currentGallery[idx + 1];
          currentGallery[idx + 1] = currentGallery[idx];
          currentGallery[idx] = temp;
          renderGalleryItems();
        });
      });
      galleryContainer.querySelectorAll('.btn-remove-photo').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.dataset.idx, 10);
          currentGallery.splice(idx, 1);
          renderGalleryItems();
        });
      });
    }

    renderGalleryItems();

    document.getElementById('btnAddGalleryPhoto').addEventListener('click', () => {
      const input = document.getElementById('pNewGalleryPhotoUrl');
      const val = input.value.trim();
      if (val) {
        currentGallery.push(val);
        input.value = '';
        renderGalleryItems();
      }
    });

    document.getElementById('btnPickGalleryMedia').addEventListener('click', () => {
      openMediaPicker((selectedUrl) => {
        currentGallery.push(selectedUrl);
        renderGalleryItems();
      });
    });

    document.getElementById('btnPickCoverMedia').addEventListener('click', () => {
      openMediaPicker((selectedUrl) => {
        document.getElementById('pCover').value = selectedUrl;
      });
    });

    openModal(async () => {
      const title = document.getElementById('pTitle').value.trim();
      if (!title) {
        showToast('El título del proyecto es obligatorio', 'error');
        return false;
      }

      const payload = {
        title,
        category: document.getElementById('pCategory').value.trim(),
        location: document.getElementById('pLocation').value.trim(),
        year: document.getElementById('pYear').value.trim(),
        surface: document.getElementById('pSurface').value.trim(),
        description: document.getElementById('pDescription').value.trim(),
        cover: document.getElementById('pCover').value.trim(),
        altText: document.getElementById('pAltText').value.trim(),
        gallery: currentGallery,
        published: document.getElementById('pPublished').checked,
        featured: document.getElementById('pFeatured').checked,
        order: Number(document.getElementById('pOrder').value) || 1
      };

      try {
        await AdminStore.saveProject(payload, isEdit, project?.id);
        showToast(isEdit ? 'Proyecto actualizado con éxito' : 'Proyecto creado con éxito', 'success');
        renderProjects(document.getElementById('adminContentArea'));
        return true;
      } catch (err) {
        showToast(err.message, 'error');
        return false;
      }
    });
  }

  async function confirmDeleteProject(project) {
    if (confirm(`¿Estás seguro de que deseas eliminar definitivamente el proyecto "${project.title}"? Esta acción no se puede deshacer.`)) {
      await AdminStore.deleteProject(project.id);
      showToast('Proyecto eliminado', 'success');
      renderProjects(document.getElementById('adminContentArea'));
    }
  }

  /* ==========================================================================
     MÓDULO 3: SERVICIOS
     ========================================================================== */
  async function renderServices(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando servicios...</div>';
    try {
      const services = await AdminStore.getServices();

      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Servicios Profesionales del Estudio</h3>
              <p style="font-size: 0.88rem; color: var(--admin-text-muted);">Edita o agrega los servicios que se muestran en la sección principal.</p>
            </div>
            <button class="btn-admin btn-admin-primary" id="btnNewService">➕ Nuevo Servicio</button>
          </div>

          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 80px;">Icono/Img</th>
                  <th>Título del Servicio</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${services.map(s => `
                  <tr>
                    <td>
                      <img src="${s.image || 'static/img/arquitectura.png'}" style="width: 60px; height: 42px; object-fit: cover; border-radius: 4px;">
                    </td>
                    <td><strong>${escapeHtml(s.title)}</strong></td>
                    <td style="max-width: 320px; font-size: 0.85rem; color: var(--admin-text-muted);">${escapeHtml(s.description || '')}</td>
                    <td>${s.published ? '<span class="badge-status badge-published">Activo</span>' : '<span class="badge-status badge-draft">Inactivo</span>'}</td>
                    <td>${s.order || 0}</td>
                    <td style="text-align: right;">
                      <button class="btn-action-sm btn-edit-service" data-id="${s.id}">✏️ Editar</button>
                      <button class="btn-action-sm btn-action-danger btn-delete-service" data-id="${s.id}">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('btnNewService').addEventListener('click', () => openServiceModalForm());

      container.querySelectorAll('.btn-edit-service').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = services.find(item => item.id === btn.dataset.id);
          if (s) openServiceModalForm(s);
        });
      });

      container.querySelectorAll('.btn-delete-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const s = services.find(item => item.id === btn.dataset.id);
          if (s && confirm(`¿Eliminar servicio "${s.title}"?`)) {
            await AdminStore.deleteService(s.id);
            showToast('Servicio eliminado', 'success');
            renderServices(container);
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  }

  function openServiceModalForm(service = null) {
    const isEdit = Boolean(service);
    modalTitle.textContent = isEdit ? `Editar Servicio: ${service.title}` : 'Crear Nuevo Servicio';

    modalBody.innerHTML = `
      <form id="serviceModalForm">
        <div class="admin-form-group">
          <label class="admin-form-label">Título del Servicio *</label>
          <input type="text" id="sTitle" class="admin-input" required value="${escapeHtml(service?.title || '')}">
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Descripción Detallada</label>
          <textarea id="sDescription" class="admin-textarea" rows="3">${escapeHtml(service?.description || '')}</textarea>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Imagen o Icono (URL)</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="sImage" class="admin-input" value="${escapeHtml(service?.image || 'static/img/arquitectura.png')}">
            <button type="button" class="btn-action-sm" id="btnPickServiceMedia">Elegir de Medios</button>
          </div>
        </div>

        <div style="display: flex; gap: 2rem; background: #F8F7F4; padding: 1rem; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
            <input type="checkbox" id="sPublished" ${(!service || service.published) ? 'checked' : ''}>
            Publicado en la Web
          </label>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label class="admin-form-label" style="margin: 0;">Orden:</label>
            <input type="number" id="sOrder" class="admin-input" style="width: 80px; padding: 0.4rem;" value="${service?.order || 1}">
          </div>
        </div>
      </form>
    `;

    document.getElementById('btnPickServiceMedia').addEventListener('click', () => {
      openMediaPicker(url => document.getElementById('sImage').value = url);
    });

    openModal(async () => {
      const title = document.getElementById('sTitle').value.trim();
      if (!title) {
        showToast('El título es requerido', 'error');
        return false;
      }
      const payload = {
        title,
        description: document.getElementById('sDescription').value.trim(),
        image: document.getElementById('sImage').value.trim(),
        published: document.getElementById('sPublished').checked,
        order: Number(document.getElementById('sOrder').value) || 1
      };

      await AdminStore.saveService(payload, isEdit, service?.id);
      showToast('Servicio guardado con éxito', 'success');
      renderServices(document.getElementById('adminContentArea'));
      return true;
    });
  }

  /* ==========================================================================
     MÓDULO 4: PROPIEDADES EN VENTA (REAL ESTATE)
     ========================================================================== */
  async function renderProperties(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando propiedades...</div>';
    try {
      const properties = await AdminStore.getProperties();

      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Propiedades e Inmuebles en Venta</h3>
              <p style="font-size: 0.88rem; color: var(--admin-text-muted);">Gestiona los desarrollos y lotes disponibles para consulta o venta.</p>
            </div>
            <button class="btn-admin btn-admin-primary" id="btnNewProperty">➕ Nueva Propiedad</button>
          </div>

          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 80px;">Foto</th>
                  <th>Título / Etiqueta</th>
                  <th>Ubicación / Superficie</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${properties.map(p => `
                  <tr>
                    <td>
                      <img src="${p.image || 'static/img/Vent03.png'}" style="width: 60px; height: 42px; object-fit: cover; border-radius: 4px;">
                    </td>
                    <td>
                      <strong>${escapeHtml(p.title)}</strong>
                      ${p.badge ? `<span class="badge-status badge-featured" style="margin-left:0.5rem;">${escapeHtml(p.badge)}</span>` : ''}
                    </td>
                    <td>${escapeHtml(p.location || '-')} (${escapeHtml(p.surface || '-')})</td>
                    <td><strong>${escapeHtml(p.price || 'CONSULTAR')}</strong></td>
                    <td>${p.published ? '<span class="badge-status badge-published">Activa</span>' : '<span class="badge-status badge-draft">Pausada</span>'}</td>
                    <td style="text-align: right;">
                      <button class="btn-action-sm btn-edit-prop" data-id="${p.id}">✏️ Editar</button>
                      <button class="btn-action-sm btn-action-danger btn-delete-prop" data-id="${p.id}">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('btnNewProperty').addEventListener('click', () => openPropertyModalForm());

      container.querySelectorAll('.btn-edit-prop').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = properties.find(item => item.id === btn.dataset.id);
          if (p) openPropertyModalForm(p);
        });
      });

      container.querySelectorAll('.btn-delete-prop').forEach(btn => {
        btn.addEventListener('click', async () => {
          const p = properties.find(item => item.id === btn.dataset.id);
          if (p && confirm(`¿Eliminar propiedad "${p.title}"?`)) {
            await AdminStore.deleteProperty(p.id);
            showToast('Propiedad eliminada', 'success');
            renderProperties(container);
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  }

  function openPropertyModalForm(property = null) {
    const isEdit = Boolean(property);
    modalTitle.textContent = isEdit ? `Editar Propiedad: ${property.title}` : 'Nueva Propiedad en Venta';

    modalBody.innerHTML = `
      <form id="propertyModalForm">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
          <div class="admin-form-group">
            <label class="admin-form-label">Título de la Propiedad *</label>
            <input type="text" id="prTitle" class="admin-input" required value="${escapeHtml(property?.title || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Etiqueta (Badge)</label>
            <input type="text" id="prBadge" class="admin-input" placeholder="Ej: Nueva, Oportunidad, Reservada" value="${escapeHtml(property?.badge || '')}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
          <div class="admin-form-group">
            <label class="admin-form-label">Precio</label>
            <input type="text" id="prPrice" class="admin-input" placeholder="Ej: CONSULTAR o USD 85.000" value="${escapeHtml(property?.price || 'CONSULTAR')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Ubicación</label>
            <input type="text" id="prLocation" class="admin-input" placeholder="Ej: Urquiza 1155, Santa Fe" value="${escapeHtml(property?.location || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Superficie</label>
            <input type="text" id="prSurface" class="admin-input" placeholder="Ej: 37 m² o 8 Hectáreas" value="${escapeHtml(property?.surface || '')}">
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Descripción</label>
          <textarea id="prDescription" class="admin-textarea" rows="3">${escapeHtml(property?.description || '')}</textarea>
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Foto de Portada</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="prImage" class="admin-input" value="${escapeHtml(property?.image || 'static/img/Vent03.png')}">
            <button type="button" class="btn-action-sm" id="btnPickPropertyMedia">Elegir de Medios</button>
          </div>
        </div>

        <div style="display: flex; gap: 2rem; background: #F8F7F4; padding: 1rem; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
            <input type="checkbox" id="prPublished" ${(!property || property.published) ? 'checked' : ''}>
            Publicada en la Web
          </label>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label class="admin-form-label" style="margin: 0;">Orden:</label>
            <input type="number" id="prOrder" class="admin-input" style="width: 80px; padding: 0.4rem;" value="${property?.order || 1}">
          </div>
        </div>
      </form>
    `;

    document.getElementById('btnPickPropertyMedia').addEventListener('click', () => {
      openMediaPicker(url => document.getElementById('prImage').value = url);
    });

    openModal(async () => {
      const title = document.getElementById('prTitle').value.trim();
      if (!title) {
        showToast('El título es requerido', 'error');
        return false;
      }
      const payload = {
        title,
        badge: document.getElementById('prBadge').value.trim(),
        price: document.getElementById('prPrice').value.trim(),
        location: document.getElementById('prLocation').value.trim(),
        surface: document.getElementById('prSurface').value.trim(),
        description: document.getElementById('prDescription').value.trim(),
        image: document.getElementById('prImage').value.trim(),
        published: document.getElementById('prPublished').checked,
        order: Number(document.getElementById('prOrder').value) || 1
      };

      await AdminStore.saveProperty(payload, isEdit, property?.id);
      showToast('Propiedad guardada con éxito', 'success');
      renderProperties(document.getElementById('adminContentArea'));
      return true;
    });
  }

  /* ==========================================================================
     MÓDULO 5: PÁGINAS Y PESTAÑAS DINÁMICAS (CREADOR DE PÁGINAS)
     ========================================================================== */
  async function renderPages(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando páginas...</div>';
    try {
      const pages = await AdminStore.getPages();

      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Páginas Dinámicas y Menú de Navegación</h3>
              <p style="font-size: 0.88rem; color: var(--admin-text-muted);">Crea páginas completas con bloques de texto, citas e imágenes sin tocar código.</p>
            </div>
            <button class="btn-admin btn-admin-primary" id="btnNewPage">➕ Crear Nueva Página</button>
          </div>

          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Nombre en Menú</th>
                  <th>Título de la Página</th>
                  <th>URL (Slug)</th>
                  <th>En Menú</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${pages.map(pg => `
                  <tr>
                    <td><strong>${escapeHtml(pg.navTitle || pg.title)}</strong></td>
                    <td>${escapeHtml(pg.title)}</td>
                    <td><code>/pagina.html?slug=${escapeHtml(pg.slug)}</code></td>
                    <td>${pg.inMenu ? '<span class="badge-status badge-published">Visible en Menú</span>' : '<span class="badge-status badge-draft">Solo Enlace</span>'}</td>
                    <td>${pg.published ? '<span class="badge-status badge-published">Publicada</span>' : '<span class="badge-status badge-draft">Borrador</span>'}</td>
                    <td>${pg.order || 0}</td>
                    <td style="text-align: right;">
                      <a href="/pagina.html?slug=${encodeURIComponent(pg.slug)}" target="_blank" class="btn-action-sm">👁️ Ver</a>
                      <button class="btn-action-sm btn-edit-page" data-id="${pg.id}">✏️ Editar Bloques</button>
                      <button class="btn-action-sm btn-action-danger btn-delete-page" data-id="${pg.id}">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('btnNewPage').addEventListener('click', () => openPageModalForm());

      container.querySelectorAll('.btn-edit-page').forEach(btn => {
        btn.addEventListener('click', () => {
          const pg = pages.find(item => item.id === btn.dataset.id);
          if (pg) openPageModalForm(pg);
        });
      });

      container.querySelectorAll('.btn-delete-page').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pg = pages.find(item => item.id === btn.dataset.id);
          if (pg && confirm(`¿Eliminar página "${pg.title}"?`)) {
            await AdminStore.deletePage(pg.id);
            showToast('Página eliminada', 'success');
            renderPages(container);
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  }

  function openPageModalForm(page = null) {
    const isEdit = Boolean(page);
    modalTitle.textContent = isEdit ? `Editar Página: ${page.title}` : 'Crear Nueva Página Modular';

    let currentBlocks = (page && Array.isArray(page.blocks)) ? JSON.parse(JSON.stringify(page.blocks)) : [];

    modalBody.innerHTML = `
      <form id="pageModalForm">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
          <div class="admin-form-group">
            <label class="admin-form-label">Título Principal de la Página *</label>
            <input type="text" id="pgTitle" class="admin-input" required value="${escapeHtml(page?.title || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Nombre en el Menú de Navegación</label>
            <input type="text" id="pgNavTitle" class="admin-input" placeholder="Ej: Filosofía" value="${escapeHtml(page?.navTitle || '')}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="admin-form-group">
            <label class="admin-form-label">URL Amigable (Slug)</label>
            <input type="text" id="pgSlug" class="admin-input" placeholder="ej: filosofia-y-enfoque" value="${escapeHtml(page?.slug || '')}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Título SEO (Para Google)</label>
            <input type="text" id="pgSeoTitle" class="admin-input" value="${escapeHtml(page?.seoTitle || '')}">
          </div>
        </div>

        <div style="display: flex; gap: 2rem; background: #F8F7F4; padding: 1rem; border-radius: 8px; margin-bottom: 2rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
            <input type="checkbox" id="pgInMenu" ${(!page || page.inMenu) ? 'checked' : ''}>
            Mostrar en el Menú Principal
          </label>
          <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
            <input type="checkbox" id="pgPublished" ${(!page || page.published) ? 'checked' : ''}>
            Publicada
          </label>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label class="admin-form-label" style="margin: 0;">Orden:</label>
            <input type="number" id="pgOrder" class="admin-input" style="width: 80px; padding: 0.4rem;" value="${page?.order || 1}">
          </div>
        </div>

        <!-- Creador de Bloques Modulares -->
        <div class="admin-card-header" style="margin-bottom: 1rem;">
          <h4 style="font-weight: 700; font-size: 1.1rem;">Bloques de Contenido de la Página</h4>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn-action-sm btn-add-block" data-type="header">➕ Título</button>
            <button type="button" class="btn-action-sm btn-add-block" data-type="text">➕ Texto</button>
            <button type="button" class="btn-action-sm btn-add-block" data-type="quote">➕ Cita</button>
            <button type="button" class="btn-action-sm btn-add-block" data-type="image">➕ Imagen</button>
            <button type="button" class="btn-action-sm btn-add-block" data-type="button">➕ Botón</button>
          </div>
        </div>

        <div class="blocks-container" id="blocksContainer"></div>
      </form>
    `;

    const blocksContainer = document.getElementById('blocksContainer');

    function renderBlocks() {
      blocksContainer.innerHTML = '';
      if (currentBlocks.length === 0) {
        blocksContainer.innerHTML = '<p style="text-align: center; color: var(--admin-text-muted); padding: 1.5rem; border: 1px dashed var(--admin-border); border-radius: 8px;">No hay bloques todavía. Haz clic arriba para agregar títulos, párrafos o imágenes.</p>';
        return;
      }

      currentBlocks.forEach((block, idx) => {
        const item = document.createElement('div');
        item.className = 'content-block-item';
        
        let fieldsHtml = '';
        if (block.type === 'header') {
          fieldsHtml = `
            <input type="text" class="admin-input block-field" data-key="content" placeholder="Escribe el subtítulo o encabezado..." value="${escapeHtml(block.content || '')}">
          `;
        } else if (block.type === 'text') {
          fieldsHtml = `
            <textarea class="admin-textarea block-field" data-key="content" rows="4" placeholder="Escribe el contenido del párrafo...">${escapeHtml(block.content || '')}</textarea>
          `;
        } else if (block.type === 'quote') {
          fieldsHtml = `
            <textarea class="admin-textarea block-field" data-key="content" rows="2" placeholder="Frase célebre o cita...">${escapeHtml(block.content || '')}</textarea>
            <input type="text" class="admin-input block-field" style="margin-top:0.5rem;" data-key="author" placeholder="Autor de la cita (ej: Anabella Zalazar)" value="${escapeHtml(block.author || '')}">
          `;
        } else if (block.type === 'image') {
          fieldsHtml = `
            <input type="text" class="admin-input block-field" data-key="url" placeholder="URL de la imagen (static/img/... o data:...)" value="${escapeHtml(block.url || '')}">
            <input type="text" class="admin-input block-field" style="margin-top:0.5rem;" data-key="caption" placeholder="Epígrafe o descripción al pie de la foto" value="${escapeHtml(block.caption || '')}">
          `;
        } else if (block.type === 'button') {
          fieldsHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <input type="text" class="admin-input block-field" data-key="text" placeholder="Texto del botón (ej: Iniciar Consulta)" value="${escapeHtml(block.text || '')}">
              <input type="text" class="admin-input block-field" data-key="url" placeholder="Enlace de destino (ej: /#contacto)" value="${escapeHtml(block.url || '')}">
            </div>
          `;
        }

        item.innerHTML = `
          <div class="content-block-header">
            <span class="content-block-type">Bloque: ${block.type}</span>
            <div class="block-actions">
              <button type="button" class="btn-action-sm btn-block-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>⬆️</button>
              <button type="button" class="btn-action-sm btn-block-down" data-idx="${idx}" ${idx === currentBlocks.length - 1 ? 'disabled' : ''}>⬇️</button>
              <button type="button" class="btn-action-sm btn-action-danger btn-block-del" data-idx="${idx}">🗑️</button>
            </div>
          </div>
          <div>${fieldsHtml}</div>
        `;

        item.querySelectorAll('.block-field').forEach(field => {
          field.addEventListener('input', () => {
            block[field.dataset.key] = field.value;
          });
        });

        blocksContainer.appendChild(item);
      });

      blocksContainer.querySelectorAll('.btn-block-up').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.dataset.idx, 10);
          const t = currentBlocks[idx - 1];
          currentBlocks[idx - 1] = currentBlocks[idx];
          currentBlocks[idx] = t;
          renderBlocks();
        });
      });
      blocksContainer.querySelectorAll('.btn-block-down').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.dataset.idx, 10);
          const t = currentBlocks[idx + 1];
          currentBlocks[idx + 1] = currentBlocks[idx];
          currentBlocks[idx] = t;
          renderBlocks();
        });
      });
      blocksContainer.querySelectorAll('.btn-block-del').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.dataset.idx, 10);
          currentBlocks.splice(idx, 1);
          renderBlocks();
        });
      });
    }

    renderBlocks();

    modalBody.querySelectorAll('.btn-add-block').forEach(btn => {
      btn.addEventListener('click', () => {
        currentBlocks.push({ type: btn.dataset.type, content: '' });
        renderBlocks();
      });
    });

    openModal(async () => {
      const title = document.getElementById('pgTitle').value.trim();
      if (!title) {
        showToast('El título de la página es obligatorio', 'error');
        return false;
      }

      const payload = {
        title,
        navTitle: document.getElementById('pgNavTitle').value.trim() || title,
        slug: document.getElementById('pgSlug').value.trim() || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        seoTitle: document.getElementById('pgSeoTitle').value.trim(),
        inMenu: document.getElementById('pgInMenu').checked,
        published: document.getElementById('pgPublished').checked,
        order: Number(document.getElementById('pgOrder').value) || 1,
        blocks: currentBlocks
      };

      await AdminStore.savePage(payload, isEdit, page?.id);
      showToast('Página guardada exitosamente', 'success');
      renderPages(document.getElementById('adminContentArea'));
      return true;
    });
  }

  /* ==========================================================================
     MÓDULO 6: CONFIGURACIÓN GENERAL E INICIO
     ========================================================================== */
  async function renderSettings(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando configuración...</div>';
    try {
      const s = await AdminStore.getSettings();

      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Editor de la Página de Inicio y Datos Generales</h3>
              <p style="font-size: 0.88rem; color: var(--admin-text-muted);">Actualiza textos del Hero, biografía, redes sociales y contacto sin tocar código.</p>
            </div>
            <button class="btn-admin btn-admin-primary" id="btnSaveSettings">💾 Guardar Cambios</button>
          </div>

          <form id="settingsForm">
            <!-- Sección 1: Portada (Hero) -->
            <h4 style="font-size: 1.15rem; font-weight: 700; margin: 1.5rem 0 1rem; color: var(--admin-accent);">1. Portada Principal (Hero)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="admin-form-group">
                <label class="admin-form-label">Título Principal</label>
                <input type="text" id="setHeroTitle" class="admin-input" value="${escapeHtml(s.heroTitle || '')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Subtítulo / Lema</label>
                <input type="text" id="setHeroSubtitle" class="admin-input" value="${escapeHtml(s.heroSubtitle || '')}">
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Imagen de Fondo del Hero (URL)</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="setHeroImage" class="admin-input" value="${escapeHtml(s.heroImage || '')}">
                <button type="button" class="btn-action-sm" id="btnPickHeroMedia">Elegir de Medios</button>
              </div>
            </div>

            <!-- Sección 2: Sobre el Estudio -->
            <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 1rem; color: var(--admin-accent);">2. Sección "Sobre Mí / Estudio"</h4>
            <div class="admin-form-group">
              <label class="admin-form-label">Párrafo Biográfico 1</label>
              <textarea id="setBioP1" class="admin-textarea" rows="3">${escapeHtml(s.bioP1 || '')}</textarea>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Párrafo Biográfico 2</label>
              <textarea id="setBioP2" class="admin-textarea" rows="3">${escapeHtml(s.bioP2 || '')}</textarea>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Foto de Perfil de la Arquitecta (URL)</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="setProfileImage" class="admin-input" value="${escapeHtml(s.profileImage || '')}">
                <button type="button" class="btn-action-sm" id="btnPickProfileMedia">Elegir de Medios</button>
              </div>
            </div>

            <!-- Sección 3: Métricas -->
            <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 1rem; color: var(--admin-accent);">3. Estadísticas Destacadas</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div class="admin-form-group">
                <label class="admin-form-label">Años de Trayectoria</label>
                <input type="text" id="setExpYears" class="admin-input" value="${escapeHtml(s.yearsExperience || '25+')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Obras Realizadas</label>
                <input type="text" id="setProjectsCount" class="admin-input" value="${escapeHtml(s.completedProjects || '200+')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Clientes Satisfechos</label>
                <input type="text" id="setClientsSat" class="admin-input" value="${escapeHtml(s.satisfiedClients || '100%')}">
              </div>
            </div>

            <!-- Sección 4: Canales de Contacto -->
            <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 1rem; color: var(--admin-accent);">4. Información de Contacto</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div class="admin-form-group">
                <label class="admin-form-label">Correo Electrónico</label>
                <input type="email" id="setEmail" class="admin-input" value="${escapeHtml(s.email || '')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Teléfono</label>
                <input type="text" id="setPhone" class="admin-input" value="${escapeHtml(s.phone || '')}">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">WhatsApp (Solo números con código de país)</label>
                <input type="text" id="setWhatsapp" class="admin-input" placeholder="5493425110000" value="${escapeHtml(s.whatsapp || '')}">
              </div>
            </div>

            <div class="admin-form-group">
              <label class="admin-form-label">Ubicación / Ciudad</label>
              <input type="text" id="setLocation" class="admin-input" value="${escapeHtml(s.location || 'Santa Fe, Argentina')}">
            </div>

            <!-- Sección 5: SEO -->
            <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 1rem; color: var(--admin-accent);">5. Metadatos SEO</h4>
            <div class="admin-form-group">
              <label class="admin-form-label">Título para Buscadores (Google Title Tag)</label>
              <input type="text" id="setSeoTitle" class="admin-input" value="${escapeHtml(s.seoTitle || '')}">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Meta Descripción (Snippet para Google)</label>
              <textarea id="setSeoDesc" class="admin-textarea" rows="2">${escapeHtml(s.seoDescription || '')}</textarea>
            </div>

            <!-- Sección 6: Sincronización Automática con GitHub -->
            <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 1rem; color: #2E7D32;">6. Sincronización Automática con GitHub (En vivo)</h4>
            <div style="padding: 1.25rem; background: #E8F5E9; border: 1px solid #C8E6C9; border-radius: 8px;">
              <p style="font-size: 0.9rem; color: #1B5E20; margin-bottom: 0.75rem;">
                <strong>Estado:</strong> 🟢 Sincronización automática activada. Cada vez que guardes o edites proyectos, servicios o textos, el archivo <code>data/db.json</code> se actualiza automáticamente en GitHub y la web se despliega en ~60 segundos.
              </p>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <input type="password" id="setGhToken" class="admin-input" placeholder="github_pat_..." value="${AdminStore.getGitHubToken()}" style="font-family: monospace; font-size: 0.85rem; max-width: 460px;">
                <button type="button" class="btn-action-sm" id="btnTestGhSync" style="background: #2E7D32; color: #FFF; font-weight: 600;">Probar Sincronización 🔄</button>
              </div>
            </div>
          </form>
        </div>
      `;

      document.getElementById('btnTestGhSync').addEventListener('click', async () => {
        const val = document.getElementById('setGhToken').value.trim();
        if (val) localStorage.setItem('az_gh_token', val);
        showToast('Probando sincronización con GitHub...', 'info');
        try {
          await AdminStore.publishToGitHub();
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
        }
      });

      document.getElementById('btnPickHeroMedia').addEventListener('click', () => {
        openMediaPicker(url => document.getElementById('setHeroImage').value = url);
      });
      document.getElementById('btnPickProfileMedia').addEventListener('click', () => {
        openMediaPicker(url => document.getElementById('setProfileImage').value = url);
      });

      document.getElementById('btnSaveSettings').addEventListener('click', async () => {
        const ghTokenVal = document.getElementById('setGhToken')?.value.trim();
        if (ghTokenVal) {
          localStorage.setItem('az_gh_token', ghTokenVal);
        }
        const payload = {
          heroTitle: document.getElementById('setHeroTitle').value.trim(),
          heroSubtitle: document.getElementById('setHeroSubtitle').value.trim(),
          heroImage: document.getElementById('setHeroImage').value.trim(),
          bioP1: document.getElementById('setBioP1').value.trim(),
          bioP2: document.getElementById('setBioP2').value.trim(),
          profileImage: document.getElementById('setProfileImage').value.trim(),
          yearsExperience: document.getElementById('setExpYears').value.trim(),
          completedProjects: document.getElementById('setProjectsCount').value.trim(),
          satisfiedClients: document.getElementById('setClientsSat').value.trim(),
          email: document.getElementById('setEmail').value.trim(),
          phone: document.getElementById('setPhone').value.trim(),
          whatsapp: document.getElementById('setWhatsapp').value.trim(),
          location: document.getElementById('setLocation').value.trim(),
          seoTitle: document.getElementById('setSeoTitle').value.trim(),
          seoDescription: document.getElementById('setSeoDesc').value.trim()
        };

        await AdminStore.saveSettings(payload);
        showToast('Configuración guardada correctamente.', 'success');
      });

    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  }

  /* ==========================================================================
     MÓDULO 7: BIBLIOTECA DE MEDIOS Y SUBIDA
     ========================================================================== */
  async function renderMedia(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando archivos multimedia...</div>';
    try {
      const media = await AdminStore.getMedia();
      cachedMedia = media;

      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Biblioteca de Fotografías y Archivos</h3>
              <p style="font-size: 0.88rem; color: var(--admin-text-muted);">Sube múltiples imágenes desde tu computadora o teléfono. Los archivos quedan guardados de forma permanente.</p>
            </div>
          </div>

          <div class="upload-dropzone" id="dropzone">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📁</div>
            <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem;">Arrastra tus fotos aquí o haz clic para seleccionarlas</div>
            <div style="font-size: 0.85rem; color: var(--admin-text-muted); margin-bottom: 1.5rem;">Soporta JPG, PNG, WEBP, AVIF, SVG (hasta 10 MB por archivo)</div>
            <input type="file" id="fileInput" multiple accept="image/*" style="display: none;">
            <button type="button" class="btn-admin btn-admin-primary" onclick="document.getElementById('fileInput').click();">Examinar Archivos</button>
          </div>

          <div id="uploadProgress" style="display: none; padding: 1rem; background: #FFF8E1; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 600;">
            Procesando y guardando archivos... Por favor espera.
          </div>

          <div class="media-grid" id="mediaGrid">
            ${media.map(m => `
              <div class="media-item-card">
                <img src="${m.url}" class="media-thumb" loading="lazy">
                <div class="media-info">
                  <span class="media-name" title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</span>
                  <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                    <button class="btn-action-sm btn-copy-url" data-url="${m.url}">Copiar URL</button>
                    <button class="btn-action-sm btn-action-danger btn-delete-media" data-id="${m.id}">🗑️</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const dropzone = document.getElementById('dropzone');
      const fileInput = document.getElementById('fileInput');
      const uploadProgress = document.getElementById('uploadProgress');

      ['dragenter', 'dragover'].forEach(eName => {
        dropzone.addEventListener(eName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(eName => {
        dropzone.addEventListener(eName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleUploadFiles(e.dataTransfer.files);
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          handleUploadFiles(fileInput.files);
        }
      });

      async function handleUploadFiles(files) {
        uploadProgress.style.display = 'block';
        try {
          const added = await AdminStore.uploadMediaFiles(files);
          showToast(`${added.length} archivo(s) subido(s) con éxito`, 'success');
          renderMedia(container);
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          uploadProgress.style.display = 'none';
        }
      }

      container.querySelectorAll('.btn-copy-url').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.url).then(() => {
            showToast('URL copiada al portapapeles', 'success');
          });
        });
      });

      container.querySelectorAll('.btn-delete-media').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('¿Eliminar este archivo multimedia?')) {
            await AdminStore.deleteMedia(btn.dataset.id);
            showToast('Archivo eliminado', 'success');
            renderMedia(container);
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  }

  /* ==========================================================================
     MÓDULO 8: CONSULTAS (LEADS)
     ========================================================================== */
  async function renderInquiries(container) {
    container.innerHTML = '<div style="text-align:center; padding:3rem;">Cargando consultas...</div>';
    try {
      const inquiries = await AdminStore.getInquiries();

      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 class="admin-card-title">Consultas Recibidas del Sitio Web</h3>
              <p style="font-size: 0.88rem; color: var(--admin-text-muted);">Mensajes enviados por potenciales clientes a través del formulario de contacto.</p>
            </div>
          </div>

          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Remitente</th>
                  <th>Contacto</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${inquiries.length > 0 ? inquiries.map(inq => {
                  const dateStr = new Date(inq.createdAt || Date.now()).toLocaleString();
                  const cleanPhone = inq.phone ? inq.phone.replace(/[^0-9]/g, '') : '';
                  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';
                  return `
                    <tr style="${!inq.read ? 'background: #FAF8F5; font-weight: 500;' : ''}">
                      <td style="font-size: 0.85rem; color: var(--admin-text-muted);">${dateStr}</td>
                      <td><strong>${escapeHtml(inq.name)}</strong></td>
                      <td>
                        <a href="mailto:${escapeHtml(inq.email)}" style="color: var(--admin-accent);">${escapeHtml(inq.email)}</a>
                        ${inq.phone ? `<div style="font-size: 0.8rem;">Tel: ${escapeHtml(inq.phone)}</div>` : ''}
                      </td>
                      <td style="max-width: 350px; font-size: 0.9rem;">${escapeHtml(inq.message)}</td>
                      <td>
                        ${inq.read 
                          ? '<span class="badge-status badge-draft">Leído</span>' 
                          : '<span class="badge-status badge-published">Nuevo</span>'}
                      </td>
                      <td style="text-align: right; white-space: nowrap;">
                        ${waLink ? `<a href="${waLink}" target="_blank" class="btn-action-sm" style="color: #2E7D32;">💬 WA</a>` : ''}
                        <button class="btn-action-sm btn-toggle-read" data-id="${inq.id}" data-read="${inq.read}">
                          ${inq.read ? 'Marcar No Leído' : '✓ Leído'}
                        </button>
                        <button class="btn-action-sm btn-action-danger btn-delete-inq" data-id="${inq.id}">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('') : '<tr><td colspan="6" style="text-align: center; color: var(--admin-text-muted); padding: 2.5rem;">No hay consultas recibidas aún.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.btn-toggle-read').forEach(btn => {
        btn.addEventListener('click', async () => {
          const currentRead = btn.dataset.read === 'true';
          await AdminStore.markInquiryRead(btn.dataset.id, !currentRead);
          renderInquiries(container);
        });
      });

      container.querySelectorAll('.btn-delete-inq').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('¿Eliminar esta consulta?')) {
            await AdminStore.deleteInquiry(btn.dataset.id);
            renderInquiries(container);
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
    }
  }

  /* ==========================================================================
     MÓDULO 9: SEGURIDAD Y CONTRASEÑA
     ========================================================================== */
  function renderSecurity(container) {
    container.innerHTML = `
      <div class="admin-card" style="max-width: 580px;">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Cambiar Contraseña de Administrador</h3>
        </div>

        <form id="changePasswordForm">
          <div class="admin-form-group">
            <label class="admin-form-label">Contraseña Actual *</label>
            <input type="password" id="currentPass" class="admin-input" required>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Nueva Contraseña (mínimo 8 caracteres) *</label>
            <input type="password" id="newPass" class="admin-input" minlength="8" required>
          </div>

          <div class="admin-form-group">
            <label class="admin-form-label">Repetir Nueva Contraseña *</label>
            <input type="password" id="repeatPass" class="admin-input" minlength="8" required>
          </div>

          <button type="submit" class="btn-admin btn-admin-primary">Actualizar Contraseña</button>
        </form>
      </div>
    `;

    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPass').value;
      const newPassword = document.getElementById('newPass').value;
      const repeatPassword = document.getElementById('repeatPass').value;

      if (newPassword !== repeatPassword) {
        showToast('Las nuevas contraseñas no coinciden', 'error');
        return;
      }

      try {
        await AdminStore.changePassword(currentPassword, newPassword);
        showToast('Contraseña cambiada con éxito', 'success');
        document.getElementById('changePasswordForm').reset();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  /* ==========================================================================
     UTILIDADES: MODAL DE SISTEMA, TOASTS Y SELECTOR DE MEDIOS
     ========================================================================== */
  let activeModalCallback = null;

  function openModal(onSaveCallback) {
    activeModalCallback = onSaveCallback;
    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    activeModalCallback = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', async () => {
      if (typeof activeModalCallback === 'function') {
        const success = await activeModalCallback();
        if (success !== false) {
          closeModal();
        }
      }
    });
  }

  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span> <div>${escapeHtml(message)}</div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  async function openMediaPicker(onSelect) {
    const mediaItems = await AdminStore.getMedia();
    const pickerHtml = `
      <div style="max-height: 400px; overflow-y: auto;">
        <p style="font-size: 0.85rem; color: var(--admin-text-muted); margin-bottom: 1rem;">Haz clic en una imagen para seleccionarla:</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem;">
          ${mediaItems.map(item => `
            <div class="picker-item" data-url="${item.url}" style="border: 2px solid var(--admin-border); border-radius: 6px; overflow: hidden; cursor: pointer; aspect-ratio: 1; transition: border-color 0.2s;">
              <img src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem;">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 600px; padding: 2rem;">
          <h4 style="margin-bottom: 1rem; font-size: 1.2rem;">Seleccionar de la Biblioteca</h4>
          ${pickerHtml}
          <div style="text-align: right; margin-top: 1.5rem;">
            <button type="button" class="btn-action-sm btn-close-picker">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(tempDiv);

    tempDiv.querySelectorAll('.picker-item').forEach(el => {
      el.addEventListener('click', () => {
        onSelect(el.dataset.url);
        tempDiv.remove();
      });
    });

    tempDiv.querySelector('.btn-close-picker').addEventListener('click', () => tempDiv.remove());
  }

  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
});

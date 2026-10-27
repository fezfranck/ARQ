/**
 * Estudio Anabella Zalazar - Frontend Core
 */

document.addEventListener('DOMContentLoaded', () => {
  let initialData = null;
  let activeModalProject = null;
  let activeGalleryIndex = 0;

  // Elementos de la interfaz
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const dynamicNavContainer = document.getElementById('dynamicNavItems');
  
  const projectsGrid = document.getElementById('projectsGrid');
  const filterContainer = document.getElementById('projectFilters');
  const servicesGrid = document.getElementById('servicesGrid');
  const propertiesGrid = document.getElementById('propertiesGrid');
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  // Modal
  const projectModal = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalPrevBtn = document.getElementById('modalPrevBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalLocation = document.getElementById('modalLocation');
  const modalYear = document.getElementById('modalYear');
  const modalSurface = document.getElementById('modalSurface');
  const modalDescription = document.getElementById('modalDescription');
  const modalFullPageLink = document.getElementById('modalFullPageLink');

  // WhatsApp Flotante
  const whatsappFloat = document.getElementById('whatsappFloat');

  // Inicializar carga de datos
  loadSiteData();

  async function loadSiteData() {
    try {
      const res = await fetch('/api/public/initial-data');
      if (!res.ok) throw new Error('Error al cargar datos del sitio');
      initialData = await res.json();
      
      hydrateSettings(initialData.settings);
      hydrateNavigation(initialData.navPages);
      hydrateProjects(initialData.projects, initialData.categories);
      hydrateServices(initialData.services);
      hydrateProperties(initialData.properties);
    } catch (err) {
      console.warn('Cargando con contenido estático predeterminado:', err);
    }
  }

  function hydrateSettings(settings) {
    if (!settings) return;

    // Actualizar Hero
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroBg = document.getElementById('heroBg');
    const heroExpNumber = document.getElementById('heroExpNumber');
    const heroProjectsNumber = document.getElementById('heroProjectsNumber');
    const heroClientsNumber = document.getElementById('heroClientsNumber');

    if (heroTitle && settings.heroTitle) heroTitle.textContent = settings.heroTitle;
    if (heroSubtitle && settings.heroSubtitle) heroSubtitle.textContent = settings.heroSubtitle;
    if (heroBg && settings.heroImage) heroBg.src = settings.heroImage;
    if (heroExpNumber && settings.yearsExperience) heroExpNumber.textContent = settings.yearsExperience;
    if (heroProjectsNumber && settings.completedProjects) heroProjectsNumber.textContent = settings.completedProjects;
    if (heroClientsNumber && settings.satisfiedClients) heroClientsNumber.textContent = settings.satisfiedClients;

    // Actualizar Sobre Mí
    const aboutP1 = document.getElementById('aboutP1');
    const aboutP2 = document.getElementById('aboutP2');
    const aboutProfileImg = document.getElementById('aboutProfileImg');
    const aboutExpYears = document.getElementById('aboutExpYears');

    if (aboutP1 && settings.bioP1) aboutP1.textContent = settings.bioP1;
    if (aboutP2 && settings.bioP2) aboutP2.textContent = settings.bioP2;
    if (aboutProfileImg && settings.profileImage) aboutProfileImg.src = settings.profileImage;
    if (aboutExpYears && settings.yearsExperience) aboutExpYears.textContent = settings.yearsExperience;

    // Actualizar Contacto
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    const contactLocation = document.getElementById('contactLocation');

    if (contactEmail && settings.email) {
      contactEmail.textContent = settings.email;
      contactEmail.href = `mailto:${settings.email}`;
    }
    if (contactPhone && settings.phone) {
      contactPhone.textContent = settings.phone;
      contactPhone.href = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;
    }
    if (contactLocation && settings.location) {
      contactLocation.textContent = settings.location;
    }

    // Configurar WhatsApp
    if (whatsappFloat && settings.whatsapp) {
      const cleanWa = settings.whatsapp.replace(/[^0-9]/g, '');
      const waMsg = encodeURIComponent('Hola Arq. Anabella Zalazar, estuve viendo su sitio web y quisiera realizar una consulta profesional.');
      whatsappFloat.href = `https://wa.me/${cleanWa}?text=${waMsg}`;
    }
  }

  function hydrateNavigation(navPages) {
    if (!dynamicNavContainer || !Array.isArray(navPages)) return;
    dynamicNavContainer.innerHTML = '';

    navPages.forEach(page => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="/p/${escapeHtml(page.slug)}" class="nav-link">${escapeHtml(page.title)}</a>`;
      dynamicNavContainer.appendChild(li);
    });
  }

  function hydrateProjects(projects, categories) {
    if (!projectsGrid) return;

    // Renderizar Filtros
    if (filterContainer && Array.isArray(categories)) {
      filterContainer.innerHTML = '<button class="filter-btn active" data-category="all">Todos</button>';
      categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = cat.toLowerCase();
        btn.textContent = cat;
        btn.addEventListener('click', () => filterProjects(cat.toLowerCase()));
        filterContainer.appendChild(btn);
      });

      // Evento para botón 'Todos'
      filterContainer.querySelector('[data-category="all"]').addEventListener('click', () => filterProjects('all'));
    }

    renderProjectsList(projects);
  }

  function renderProjectsList(projects) {
    projectsGrid.innerHTML = '';
    
    if (!projects || projects.length === 0) {
      projectsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No hay proyectos disponibles en esta categoría.</p>';
      return;
    }

    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.dataset.category = (p.category || '').toLowerCase();
      
      const cover = p.cover || '/static/img/proyecto1.png';
      const year = p.year ? `<span>📅 ${escapeHtml(p.year)}</span>` : '';
      const surface = p.surface ? `<span>📐 ${escapeHtml(p.surface)}</span>` : '';
      const location = p.location ? `<span>📍 ${escapeHtml(p.location)}</span>` : '';

      card.innerHTML = `
        <div class="project-card-image">
          <img src="${escapeHtml(cover)}" alt="${escapeHtml(p.altText || p.title)}" loading="lazy">
          <span class="project-badge-cat">${escapeHtml(p.category || 'Arquitectura')}</span>
        </div>
        <div class="project-card-info">
          <div class="project-meta">
            ${location}
            ${year}
            ${surface}
          </div>
          <h3 class="project-title">${escapeHtml(p.title)}</h3>
          <p class="project-desc-excerpt">${escapeHtml(p.description || '')}</p>
          <div class="project-cta-link">Ver Detalles y Planos <span>→</span></div>
        </div>
      `;

      card.addEventListener('click', () => openProjectModal(p));
      projectsGrid.appendChild(card);
    });
  }

  function filterProjects(cat) {
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(b => b.classList.toggle('active', b.dataset.category === cat));

    const cards = projectsGrid.querySelectorAll('.project-card');
    cards.forEach(card => {
      if (cat === 'all' || card.dataset.category === cat) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function hydrateServices(services) {
    if (!servicesGrid || !Array.isArray(services)) return;
    servicesGrid.innerHTML = '';

    services.forEach(s => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        <div class="service-image-box">
          <img src="${escapeHtml(s.image || '/static/img/arquitectura.png')}" alt="${escapeHtml(s.title)}" loading="lazy">
        </div>
        <div class="service-body">
          <h3 class="service-title">${escapeHtml(s.title)}</h3>
          <p class="service-desc">${escapeHtml(s.description || '')}</p>
          <a href="#contacto" class="service-cta">Consultar este servicio <span>→</span></a>
        </div>
      `;
      servicesGrid.appendChild(card);
    });
  }

  function hydrateProperties(properties) {
    if (!propertiesGrid || !Array.isArray(properties)) return;
    propertiesGrid.innerHTML = '';

    properties.forEach(prop => {
      const card = document.createElement('div');
      card.className = 'property-card';
      
      const badge = prop.badge ? `<div class="property-badge">${escapeHtml(prop.badge)}</div>` : '';
      const location = prop.location ? `<div>📍 ${escapeHtml(prop.location)}</div>` : '';
      const surface = prop.surface ? `<div>📐 ${escapeHtml(prop.surface)}</div>` : '';

      card.innerHTML = `
        ${badge}
        <div class="property-image">
          <img src="${escapeHtml(prop.image || '/static/img/Vent03.png')}" alt="${escapeHtml(prop.title)}" loading="lazy">
        </div>
        <div class="property-info">
          <div class="property-price">${escapeHtml(prop.price || 'CONSULTAR')}</div>
          <h3 class="property-title">${escapeHtml(prop.title)}</h3>
          <div class="property-details">
            ${location}
            ${surface}
          </div>
          <p class="property-desc">${escapeHtml(prop.description || '')}</p>
          <a href="#contacto" class="btn-property-inquire">Solicitar Información</a>
        </div>
      `;
      propertiesGrid.appendChild(card);
    });
  }

  // ==========================================
  // MODAL / LIGHTBOX DE PROYECTO
  // ==========================================
  function openProjectModal(project) {
    activeModalProject = project;
    activeGalleryIndex = 0;

    const gallery = (project.gallery && project.gallery.length > 0) 
      ? project.gallery 
      : [project.cover || '/static/img/proyecto1.png'];

    updateModalImage(gallery);

    if (modalCategory) modalCategory.textContent = project.category || 'Arquitectura';
    if (modalTitle) modalTitle.textContent = project.title;
    if (modalLocation) modalLocation.textContent = project.location || 'Santa Fe';
    if (modalYear) modalYear.textContent = project.year || 'Reciente';
    if (modalSurface) modalSurface.textContent = project.surface || '-';
    if (modalDescription) modalDescription.textContent = project.description || '';
    if (modalFullPageLink) modalFullPageLink.href = `/proyecto/${project.slug}`;

    // Mostrar u ocultar flechas según cantidad de fotos
    if (modalPrevBtn && modalNextBtn) {
      const showArrows = gallery.length > 1;
      modalPrevBtn.style.display = showArrows ? 'flex' : 'none';
      modalNextBtn.style.display = showArrows ? 'flex' : 'none';
    }

    projectModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateModalImage(gallery) {
    if (!modalImg) return;
    modalImg.src = gallery[activeGalleryIndex];
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('active');
    document.body.style.overflow = '';
    activeModalProject = null;
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) closeProjectModal();
    });
  }

  if (modalPrevBtn) {
    modalPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeModalProject) return;
      const gallery = activeModalProject.gallery || [activeModalProject.cover];
      activeGalleryIndex = (activeGalleryIndex - 1 + gallery.length) % gallery.length;
      updateModalImage(gallery);
    });
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeModalProject) return;
      const gallery = activeModalProject.gallery || [activeModalProject.cover];
      activeGalleryIndex = (activeGalleryIndex + 1) % gallery.length;
      updateModalImage(gallery);
    });
  }

  // Teclado para modal
  document.addEventListener('keydown', (e) => {
    if (!projectModal || !projectModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeProjectModal();
    if (e.key === 'ArrowLeft' && modalPrevBtn) modalPrevBtn.click();
    if (e.key === 'ArrowRight' && modalNextBtn) modalNextBtn.click();
  });

  // ==========================================
  // FORMULARIO DE CONTACTO
  // ==========================================
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Enviando consulta...';
      formFeedback.style.display = 'none';

      const formData = {
        name: contactForm.nombre.value,
        email: contactForm.email.value,
        phone: contactForm.telefono.value,
        message: contactForm.mensaje.value,
        _honeypot: contactForm._hp ? contactForm._hp.value : ''
      };

      try {
        const response = await fetch('/api/public/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          formFeedback.className = 'form-feedback success';
          formFeedback.textContent = result.message || '¡Mensaje enviado con éxito!';
          formFeedback.style.display = 'block';
          contactForm.reset();
        } else {
          throw new Error(result.error || 'No se pudo enviar el mensaje.');
        }
      } catch (err) {
        formFeedback.className = 'form-feedback error';
        formFeedback.textContent = err.message || 'Error al enviar. Intente nuevamente o comuníquese por WhatsApp.';
        formFeedback.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // ==========================================
  // NAVEGACIÓN Y MENÚ MÓVIL
  // ==========================================
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // Header scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Utilidad para sanitizar texto
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});

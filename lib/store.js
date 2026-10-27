import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const dbFilePath = path.join(dataDir, 'db.json');
const backupsDir = path.join(dataDir, 'backups');

// Asegurar directorios
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Datos iniciales auténticos del estudio
function getInitialData() {
  const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Anabella2026!';
  const initialAdminEmail = process.env.ADMIN_EMAIL || 'admin@anabellazalazararquitecta.com.ar';

  return {
    meta: {
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    },
    settings: {
      studioName: 'Estudio Anabella Zalazar | Arquitectura',
      architectName: 'Anabella Zalazar',
      architectTitle: 'Arquitecta (UCSF)',
      tagline: 'Diseñamos espacios que transforman',
      bioP1: 'En nuestro estudio de arquitectura fusionamos creatividad y funcionalidad para dar vida a espacios únicos que reflejan la esencia de cada cliente. Dirigido por Anabella Zalazar, arquitecta egresada de la Universidad Católica de Santa Fe, trabajamos en proyectos residenciales y comerciales hace más de 25 años.',
      bioP2: 'Nos apasiona crear diseños innovadores que integran estética contemporánea, máxima funcionalidad y compromiso sostenible. Cada proyecto es una oportunidad para transformar ideas en espacios excepcionales que perduran en el tiempo.',
      yearsExperience: '25+',
      completedProjects: '200+',
      satisfiedClients: '100%',
      heroTitle: 'Diseñamos espacios que transforman',
      heroSubtitle: 'Arquitectura contemporánea con identidad, funcionalidad y compromiso sostenible en Santa Fe y la región.',
      heroImage: '/static/img/fondo-arquitectura.png',
      profileImage: '/static/img/AZ.jpg',
      logoImage: '/static/img/logop.png',
      email: 'contacto@anabellazalazararquitecta.com.ar',
      phone: '+54 9 342 511-0000',
      whatsapp: '5493425110000',
      location: 'Santa Fe, Argentina',
      address: 'Santa Fe Capital, República Argentina',
      instagram: 'https://www.instagram.com/',
      facebook: 'https://www.facebook.com/',
      seoTitle: 'Estudio Anabella Zalazar | Arquitectura Contemporánea en Santa Fe',
      seoDescription: 'Estudio de arquitectura en Santa Fe dirigido por Anabella Zalazar. Más de 25 años proyectando residencias modernas, diseño de interiores, reformas y dirección de obras.'
    },
    projects: [
      {
        id: 'proj_1',
        slug: 'residencia-moderna',
        title: 'Residencia Moderna',
        category: 'Residencial',
        year: '2023',
        location: 'Santa Fe',
        surface: '280 m²',
        description: 'Diseño contemporáneo que fusiona elegancia y funcionalidad en cada detalle. Grandes paños vidriados conectan el área social con galerías y jardines, optimizando la luz natural y la ventilación cruzada.',
        cover: '/static/img/proyecto1.png',
        gallery: [
          '/static/img/proyecto1.png',
          '/static/img/fondo-arquitectura.png'
        ],
        altText: 'Fachada contemporánea de Residencia Moderna en Santa Fe',
        featured: true,
        published: true,
        order: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj_2',
        slug: 'residencias-con-materiales-de-vanguardia',
        title: 'Residencias con Materiales de Vanguardia',
        category: 'Residencial',
        year: '2024',
        location: 'Santa Fe',
        surface: '320 m²',
        description: 'Vivienda unifamiliar resuelta con tecnología constructiva de vanguardia, aislaciones térmicas eficientes y nobleza de materiales. Integración de hormigón a la vista, madera y carpinterías de alto rendimiento.',
        cover: '/static/img/proyecto2.jpeg',
        gallery: [
          '/static/img/proyecto2.jpeg'
        ],
        altText: 'Arquitectura residencial contemporánea con materiales nobles',
        featured: true,
        published: true,
        order: 2,
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj_3',
        slug: 'complejo-residencial-comercial',
        title: 'Complejo Residencial & Comercial',
        category: 'Comercial',
        year: '2023',
        location: 'Santa Fe Capital',
        surface: '650 m²',
        description: 'Desarrollo en altura con basamento comercial y unidades residenciales pensadas para el confort contemporáneo. Rigor estructural y estética sobria y perdurable.',
        cover: '/static/img/proyecto01.png',
        gallery: [
          '/static/img/proyecto01.png'
        ],
        altText: 'Complejo comercial y residencial contemporáneo',
        featured: true,
        published: true,
        order: 3,
        createdAt: new Date().toISOString()
      }
    ],
    services: [
      {
        id: 'serv_1',
        slug: 'diseno-arquitectonico',
        title: 'Diseño Arquitectónico',
        description: 'Diseño arquitectónico integral de edificios residenciales, comerciales, corporativos y rurales, adaptados a la normativa y las necesidades particulares de cada comitente.',
        image: '/static/img/arquitectura.png',
        published: true,
        order: 1
      },
      {
        id: 'serv_2',
        slug: 'diseno-de-interiores',
        title: 'Diseño de Interiores',
        description: 'Planificación de espacios, ergonomía, selección de materiales, texturas, paletas cromáticas e integración lumínica para ambientes con carácter.',
        image: '/static/img/interiores.png',
        published: true,
        order: 2
      },
      {
        id: 'serv_3',
        slug: 'tasaciones',
        title: 'Tasaciones de Obras',
        description: 'Tasaciones rigurosas de inmuebles, certificaciones de avance de obra y peritajes técnicos con más de dos décadas de aval profesional.',
        image: '/static/img/tasaciones.png',
        published: true,
        order: 3
      },
      {
        id: 'serv_4',
        slug: 'paisajismo-y-exteriores',
        title: 'Paisajismo y Exteriores',
        description: 'Diseño armónico de jardines, terrazas, galerías y entornos verdes en estrecha sintonía con la volumetría de la edificación.',
        image: '/static/img/paisajismo.png',
        published: true,
        order: 4
      },
      {
        id: 'serv_5',
        slug: 'reformas-y-ampliaciones',
        title: 'Reformas y Ampliaciones',
        description: 'Puesta en valor de construcciones existentes, intervenciones estratégicas, modernización y ampliaciones que multiplican el valor patrimonial.',
        image: '/static/img/reformas.png',
        published: true,
        order: 5
      },
      {
        id: 'serv_6',
        slug: 'asesoria-arquitectonica',
        title: 'Asesoría Arquitectónica',
        description: 'Consultoría especializada previa a la compra de terrenos o propiedades, estudios de factibilidad constructiva y análisis de inversión.',
        image: '/static/img/asesoria.png',
        published: true,
        order: 6
      },
      {
        id: 'serv_7',
        slug: 'expedientes-urbanisticos',
        title: 'Expedientes Urbanísticos',
        description: 'Regularización de planos, trámites municipales, gestiones catastrales y permisos de edificación ante organismos oficiales.',
        image: '/static/img/expedientes.png',
        published: true,
        order: 7
      },
      {
        id: 'serv_8',
        slug: 'direccion-de-obra',
        title: 'Dirección de Obra',
        description: 'Supervisión técnica rigurosa, control de calidad en cada etapa constructiva, coordinación de gremios y cumplimiento de plazos y costos.',
        image: '/static/img/direccion-obra.png',
        published: true,
        order: 8
      }
    ],
    properties: [
      {
        id: 'prop_1',
        slug: 'eco-urquiza',
        title: 'ECO Urquiza',
        badge: 'Nueva',
        price: 'CONSULTAR',
        location: 'Urquiza 1155, Santa Fe',
        surface: '37 m²',
        description: 'Edificio ECO URQUIZA. Modernos departamentos con diseño premium y excelente ubicación céntrica en la ciudad de Santa Fe.',
        image: '/static/img/Vent03.png',
        published: true,
        order: 1
      },
      {
        id: 'prop_2',
        slug: 'finca-de-campo-8-hectareas',
        title: 'Finca de Campo y 8 Hectáreas',
        badge: 'Oportunidad',
        price: 'CONSULTAR',
        location: 'Arroyo Aguiar, Santa Fe',
        surface: '8 Hectáreas',
        description: 'Campo de 8.5 hectáreas subdividido en 3 lotes: fracción de 7.5 has, lote con Casa-Galpón (¾ ha) y fracción residencial con Casa de campo (½ ha). Cuenta con cerco perimetral, luz eléctrica y agua.',
        image: '/static/img/Vent04.jpg',
        published: true,
        order: 2
      }
    ],
    pages: [
      {
        id: 'page_1',
        slug: 'filosofia-y-enfoque',
        title: 'Filosofía y Enfoque',
        navTitle: 'Filosofía',
        inMenu: true,
        published: true,
        order: 1,
        seoTitle: 'Filosofía y Enfoque de Diseño | Estudio Anabella Zalazar',
        seoDescription: 'Conocé nuestra filosofía de diseño arquitectónico: integración espacial, compromiso bioclimático y materiales auténticos.',
        blocks: [
          {
            type: 'header',
            content: 'Nuestra Filosofía de Diseño'
          },
          {
            type: 'text',
            content: 'Creemos que la arquitectura auténtica surge de un diálogo sensible entre el entorno, las necesidades de quienes habitan el espacio y la honestidad de los materiales. Cada proyecto es un desafío único donde la luz natural, la orientación bioclimática y la pureza formal guían nuestras decisiones.'
          },
          {
            type: 'quote',
            content: 'La arquitectura no es solo construir volúmenes, sino esculpir el vacío donde transcurre la vida.',
            author: 'Anabella Zalazar, Arquitecta'
          },
          {
            type: 'image',
            url: '/static/img/fondo-arquitectura.png',
            caption: 'Espacios concebidos para perdurar e inspirar'
          },
          {
            type: 'text',
            content: 'Acompañamos a nuestros clientes en cada etapa: desde el primer croquis conceptual y la viabilidad urbanística hasta la última terminación de obra, garantizando transparencia, optimización de recursos y un resultado que trasciende el paso del tiempo.'
          },
          {
            type: 'button',
            text: 'Conversar con el Estudio',
            url: '/#contacto'
          }
        ]
      }
    ],
    media: [
      { id: 'm1', name: 'fondo-arquitectura.png', url: '/static/img/fondo-arquitectura.png', type: 'image/png' },
      { id: 'm2', name: 'AZ.jpg', url: '/static/img/AZ.jpg', type: 'image/jpeg' },
      { id: 'm3', name: 'proyecto1.png', url: '/static/img/proyecto1.png', type: 'image/png' },
      { id: 'm4', name: 'proyecto2.jpeg', url: '/static/img/proyecto2.jpeg', type: 'image/jpeg' },
      { id: 'm5', name: 'proyecto01.png', url: '/static/img/proyecto01.png', type: 'image/png' },
      { id: 'm6', name: 'Vent03.png', url: '/static/img/Vent03.png', type: 'image/png' },
      { id: 'm7', name: 'Vent04.jpg', url: '/static/img/Vent04.jpg', type: 'image/jpeg' }
    ],
    inquiries: [],
    users: [
      {
        id: 'usr_admin',
        email: initialAdminEmail.toLowerCase(),
        passwordHash: hashPassword(initialAdminPassword),
        name: 'Anabella Zalazar',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ]
  };
}

class Store {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (fs.existsSync(dbFilePath)) {
      try {
        const raw = fs.readFileSync(dbFilePath, 'utf-8');
        this.data = JSON.parse(raw);
        // Verificar integridad de colecciones
        const defaults = getInitialData();
        for (const key of Object.keys(defaults)) {
          if (!this.data[key]) {
            this.data[key] = defaults[key];
          }
        }
      } catch (err) {
        console.error('Error al leer db.json. Restaurando datos iniciales:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    this.data.meta.lastModified = new Date().toISOString();
    const tempFile = `${dbFilePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, dbFilePath);
  }

  backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupsDir, `backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(this.data, null, 2), 'utf-8');
    return backupFile;
  }

  // Colección: settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  // Colección: projects
  getProjects(includeDrafts = false) {
    let list = this.data.projects;
    if (!includeDrafts) {
      list = list.filter(p => p.published);
    }
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getProjectById(id) {
    return this.data.projects.find(p => p.id === id) || null;
  }

  getProjectBySlug(slug) {
    return this.data.projects.find(p => p.slug === slug) || null;
  }

  createProject(projectData) {
    const id = `proj_${crypto.randomBytes(6).toString('hex')}`;
    const slug = projectData.slug || this.slugify(projectData.title || 'proyecto');
    const newProject = {
      id,
      slug,
      title: projectData.title || 'Sin título',
      category: projectData.category || 'General',
      year: projectData.year || new Date().getFullYear().toString(),
      location: projectData.location || '',
      surface: projectData.surface || '',
      description: projectData.description || '',
      cover: projectData.cover || '',
      gallery: Array.isArray(projectData.gallery) ? projectData.gallery : [],
      altText: projectData.altText || projectData.title || '',
      featured: Boolean(projectData.featured),
      published: Boolean(projectData.published),
      order: Number(projectData.order) || (this.data.projects.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.projects.push(newProject);
    this.save();
    return newProject;
  }

  updateProject(id, updateData) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    
    if (updateData.title && !updateData.slug) {
      updateData.slug = this.slugify(updateData.title);
    }

    this.data.projects[idx] = {
      ...this.data.projects[idx],
      ...updateData,
      id, // asegurar inmutabilidad del ID
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.projects[idx];
  }

  deleteProject(id) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.projects.splice(idx, 1);
    this.save();
    return true;
  }

  // Colección: services
  getServices(includeDrafts = false) {
    let list = this.data.services;
    if (!includeDrafts) {
      list = list.filter(s => s.published);
    }
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getServiceById(id) {
    return this.data.services.find(s => s.id === id) || null;
  }

  createService(serviceData) {
    const id = `serv_${crypto.randomBytes(6).toString('hex')}`;
    const newService = {
      id,
      slug: serviceData.slug || this.slugify(serviceData.title || 'servicio'),
      title: serviceData.title || 'Nuevo Servicio',
      description: serviceData.description || '',
      image: serviceData.image || '',
      published: serviceData.published !== false,
      order: Number(serviceData.order) || (this.data.services.length + 1)
    };
    this.data.services.push(newService);
    this.save();
    return newService;
  }

  updateService(id, updateData) {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.services[idx] = {
      ...this.data.services[idx],
      ...updateData,
      id
    };
    this.save();
    return this.data.services[idx];
  }

  deleteService(id) {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.services.splice(idx, 1);
    this.save();
    return true;
  }

  // Colección: properties (Ventas)
  getProperties(includeDrafts = false) {
    let list = this.data.properties;
    if (!includeDrafts) {
      list = list.filter(p => p.published);
    }
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getPropertyById(id) {
    return this.data.properties.find(p => p.id === id) || null;
  }

  createProperty(propData) {
    const id = `prop_${crypto.randomBytes(6).toString('hex')}`;
    const newProp = {
      id,
      slug: propData.slug || this.slugify(propData.title || 'propiedad'),
      title: propData.title || 'Nueva Propiedad',
      badge: propData.badge || '',
      price: propData.price || 'CONSULTAR',
      location: propData.location || '',
      surface: propData.surface || '',
      description: propData.description || '',
      image: propData.image || '',
      published: propData.published !== false,
      order: Number(propData.order) || (this.data.properties.length + 1)
    };
    this.data.properties.push(newProp);
    this.save();
    return newProp;
  }

  updateProperty(id, updateData) {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.properties[idx] = {
      ...this.data.properties[idx],
      ...updateData,
      id
    };
    this.save();
    return this.data.properties[idx];
  }

  deleteProperty(id) {
    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.properties.splice(idx, 1);
    this.save();
    return true;
  }

  // Colección: pages (Páginas y Pestañas dinámicas)
  getPages(includeDrafts = false) {
    let list = this.data.pages;
    if (!includeDrafts) {
      list = list.filter(p => p.published);
    }
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getPageById(id) {
    return this.data.pages.find(p => p.id === id) || null;
  }

  getPageBySlug(slug) {
    return this.data.pages.find(p => p.slug === slug) || null;
  }

  createPage(pageData) {
    const id = `page_${crypto.randomBytes(6).toString('hex')}`;
    const slug = pageData.slug ? this.slugify(pageData.slug) : this.slugify(pageData.title || 'pagina');
    
    // Validar slugs reservados para evitar romper la aplicación
    const reservedSlugs = new Set(['admin', 'api', 'static', 'uploads', 'p', 'proyecto', 'contacto', 'login', 'logout']);
    if (reservedSlugs.has(slug)) {
      throw new Error(`El identificador de URL "${slug}" está reservado por el sistema.`);
    }

    const newPage = {
      id,
      slug,
      title: pageData.title || 'Nueva Página',
      navTitle: pageData.navTitle || pageData.title || 'Página',
      inMenu: Boolean(pageData.inMenu),
      published: Boolean(pageData.published),
      order: Number(pageData.order) || (this.data.pages.length + 1),
      seoTitle: pageData.seoTitle || pageData.title || '',
      seoDescription: pageData.seoDescription || '',
      blocks: Array.isArray(pageData.blocks) ? pageData.blocks : [],
      createdAt: new Date().toISOString()
    };
    this.data.pages.push(newPage);
    this.save();
    return newPage;
  }

  updatePage(id, updateData) {
    const idx = this.data.pages.findIndex(p => p.id === id);
    if (idx === -1) return null;
    
    if (updateData.slug) {
      updateData.slug = this.slugify(updateData.slug);
      const reservedSlugs = new Set(['admin', 'api', 'static', 'uploads', 'p', 'proyecto', 'contacto', 'login', 'logout']);
      if (reservedSlugs.has(updateData.slug)) {
        throw new Error(`El identificador de URL "${updateData.slug}" está reservado por el sistema.`);
      }
    }

    this.data.pages[idx] = {
      ...this.data.pages[idx],
      ...updateData,
      id
    };
    this.save();
    return this.data.pages[idx];
  }

  deletePage(id) {
    const idx = this.data.pages.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.pages.splice(idx, 1);
    this.save();
    return true;
  }

  // Colección: inquiries (Consultas recibidas del formulario)
  getInquiries() {
    return [...this.data.inquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addInquiry(inquiryData) {
    const id = `inq_${crypto.randomBytes(6).toString('hex')}`;
    const newInquiry = {
      id,
      name: inquiryData.name || '',
      email: inquiryData.email || '',
      phone: inquiryData.phone || '',
      message: inquiryData.message || '',
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.inquiries.push(newInquiry);
    this.save();
    return newInquiry;
  }

  markInquiryRead(id, isRead = true) {
    const inq = this.data.inquiries.find(i => i.id === id);
    if (!inq) return null;
    inq.read = Boolean(isRead);
    this.save();
    return inq;
  }

  deleteInquiry(id) {
    const idx = this.data.inquiries.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.data.inquiries.splice(idx, 1);
    this.save();
    return true;
  }

  // Colección: media (Biblioteca de medios)
  getMedia() {
    return [...this.data.media].sort((a, b) => (b.id > a.id ? 1 : -1));
  }

  addMediaItem(mediaItem) {
    const id = `med_${Date.now()}`;
    const item = {
      id,
      name: mediaItem.name,
      url: mediaItem.url,
      type: mediaItem.type || 'image',
      size: mediaItem.size || 0,
      alt: mediaItem.alt || '',
      createdAt: new Date().toISOString()
    };
    this.data.media.unshift(item);
    this.save();
    return item;
  }

  deleteMediaItem(id) {
    const idx = this.data.media.findIndex(m => m.id === id);
    if (idx === -1) return null;
    const item = this.data.media[idx];
    this.data.media.splice(idx, 1);
    this.save();
    return item;
  }

  // Colección: users
  getUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  updateUserPassword(id, newHash) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return false;
    user.passwordHash = newHash;
    this.save();
    return true;
  }

  // Dashboard Metrics
  getDashboardStats() {
    const projects = this.data.projects;
    const services = this.data.services;
    const pages = this.data.pages;
    const inquiries = this.data.inquiries;
    const media = this.data.media;
    const properties = this.data.properties;

    return {
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
      totalMedia: media.length,
      lastModified: this.data.meta.lastModified
    };
  }

  // Utilidad para crear URLs amigables (slugs)
  slugify(text) {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

export const store = new Store();

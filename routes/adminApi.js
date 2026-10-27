import express from 'express';
import { requireAuth } from '../lib/auth.js';
import { store } from '../lib/store.js';
import { upload, removeUploadedFile } from '../lib/storage.js';

const router = express.Router();

// Todas las rutas bajo /api/admin requieren autenticación obligatoria
router.use(requireAuth);

/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', (req, res) => {
  const stats = store.getDashboardStats();
  const recentInquiries = store.getInquiries().slice(0, 5);
  const recentProjects = store.getProjects(true).slice(0, 5);
  res.json({ stats, recentInquiries, recentProjects });
});

/* ==========================================================================
   PROYECTOS (CRUD COMPLETO)
   ========================================================================== */
router.get('/projects', (req, res) => {
  res.json(store.getProjects(true));
});

router.get('/projects/:id', (req, res) => {
  const project = store.getProjectById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado.' });
  res.json(project);
});

router.post('/projects', (req, res) => {
  try {
    const { title, category, year, location, surface, description, cover, gallery, altText, featured, published, order, slug } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título del proyecto es obligatorio.' });
    }
    const newProject = store.createProject({
      title: title.trim(),
      slug: slug ? slug.trim() : undefined,
      category: (category || 'General').trim(),
      year: (year || new Date().getFullYear()).toString().trim(),
      location: (location || '').trim(),
      surface: (surface || '').trim(),
      description: (description || '').trim(),
      cover: (cover || '').trim(),
      gallery: Array.isArray(gallery) ? gallery : [],
      altText: (altText || title).trim(),
      featured: Boolean(featured),
      published: published !== false,
      order: Number(order) || undefined
    });
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear proyecto: ' + err.message });
  }
});

router.put('/projects/:id', (req, res) => {
  try {
    const updated = store.updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Proyecto no encontrado.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar proyecto: ' + err.message });
  }
});

router.delete('/projects/:id', (req, res) => {
  const success = store.deleteProject(req.params.id);
  if (!success) return res.status(404).json({ error: 'Proyecto no encontrado.' });
  res.json({ success: true, message: 'Proyecto eliminado correctamente.' });
});

/* ==========================================================================
   SERVICIOS (CRUD COMPLETO)
   ========================================================================== */
router.get('/services', (req, res) => {
  res.json(store.getServices(true));
});

router.post('/services', (req, res) => {
  const { title, description, image, published, order } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'El título del servicio es obligatorio.' });
  }
  const newService = store.createService({
    title: title.trim(),
    description: (description || '').trim(),
    image: (image || '').trim(),
    published: published !== false,
    order: Number(order) || undefined
  });
  res.status(201).json(newService);
});

router.put('/services/:id', (req, res) => {
  const updated = store.updateService(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Servicio no encontrado.' });
  res.json(updated);
});

router.delete('/services/:id', (req, res) => {
  const success = store.deleteService(req.params.id);
  if (!success) return res.status(404).json({ error: 'Servicio no encontrado.' });
  res.json({ success: true, message: 'Servicio eliminado correctamente.' });
});

/* ==========================================================================
   PROPIEDADES / VENTAS (CRUD COMPLETO)
   ========================================================================== */
router.get('/properties', (req, res) => {
  res.json(store.getProperties(true));
});

router.post('/properties', (req, res) => {
  const { title, badge, price, location, surface, description, image, published, order } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'El título de la propiedad es obligatorio.' });
  }
  const newProp = store.createProperty({
    title: title.trim(),
    badge: (badge || '').trim(),
    price: (price || 'CONSULTAR').trim(),
    location: (location || '').trim(),
    surface: (surface || '').trim(),
    description: (description || '').trim(),
    image: (image || '').trim(),
    published: published !== false,
    order: Number(order) || undefined
  });
  res.status(201).json(newProp);
});

router.put('/properties/:id', (req, res) => {
  const updated = store.updateProperty(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Propiedad no encontrada.' });
  res.json(updated);
});

router.delete('/properties/:id', (req, res) => {
  const success = store.deleteProperty(req.params.id);
  if (!success) return res.status(404).json({ error: 'Propiedad no encontrada.' });
  res.json({ success: true, message: 'Propiedad eliminada correctamente.' });
});

/* ==========================================================================
   PÁGINAS Y PESTAÑAS DINÁMICAS (CREADOR DE PÁGINAS)
   ========================================================================== */
router.get('/pages', (req, res) => {
  res.json(store.getPages(true));
});

router.get('/pages/:id', (req, res) => {
  const page = store.getPageById(req.params.id);
  if (!page) return res.status(404).json({ error: 'Página no encontrada.' });
  res.json(page);
});

router.post('/pages', (req, res) => {
  try {
    const { title, navTitle, slug, inMenu, published, order, seoTitle, seoDescription, blocks } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título de la página es obligatorio.' });
    }
    const newPage = store.createPage({
      title: title.trim(),
      navTitle: (navTitle || title).trim(),
      slug: slug ? slug.trim() : undefined,
      inMenu: Boolean(inMenu),
      published: published !== false,
      order: Number(order) || undefined,
      seoTitle: (seoTitle || title).trim(),
      seoDescription: (seoDescription || '').trim(),
      blocks: Array.isArray(blocks) ? blocks : []
    });
    res.status(201).json(newPage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/pages/:id', (req, res) => {
  try {
    const updated = store.updatePage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Página no encontrada.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/pages/:id', (req, res) => {
  const success = store.deletePage(req.params.id);
  if (!success) return res.status(404).json({ error: 'Página no encontrada.' });
  res.json({ success: true, message: 'Página eliminada correctamente.' });
});

/* ==========================================================================
   CONFIGURACIÓN GENERAL E INICIO
   ========================================================================== */
router.get('/settings', (req, res) => {
  res.json(store.getSettings());
});

router.put('/settings', (req, res) => {
  const updated = store.updateSettings(req.body);
  res.json(updated);
});

/* ==========================================================================
   BIBLIOTECA DE MEDIOS Y SUBIDA DE ARCHIVOS
   ========================================================================== */
router.get('/media', (req, res) => {
  res.json(store.getMedia());
});

router.post('/upload', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron archivos para subir.' });
  }

  const uploadedItems = req.files.map(file => {
    const publicUrl = `/uploads/${file.filename}`;
    return store.addMediaItem({
      name: file.originalname,
      url: publicUrl,
      type: file.mimetype,
      size: file.size,
      alt: file.originalname
    });
  });

  res.status(201).json({
    success: true,
    message: `${uploadedItems.length} archivo(s) subido(s) con éxito.`,
    files: uploadedItems
  });
});

router.delete('/media/:id', (req, res) => {
  const deletedItem = store.deleteMediaItem(req.params.id);
  if (!deletedItem) {
    return res.status(404).json({ error: 'Elemento multimedia no encontrado.' });
  }
  
  // Si está en uploads, remover archivo físico
  if (deletedItem.url && deletedItem.url.startsWith('/uploads/')) {
    removeUploadedFile(deletedItem.url);
  }

  res.json({ success: true, message: 'Archivo eliminado de la biblioteca.' });
});

/* ==========================================================================
   CONSULTAS DE CONTACTO (LEADS)
   ========================================================================== */
router.get('/inquiries', (req, res) => {
  res.json(store.getInquiries());
});

router.patch('/inquiries/:id/read', (req, res) => {
  const { read } = req.body;
  const inq = store.markInquiryRead(req.params.id, read);
  if (!inq) return res.status(404).json({ error: 'Consulta no encontrada.' });
  res.json(inq);
});

router.delete('/inquiries/:id', (req, res) => {
  const success = store.deleteInquiry(req.params.id);
  if (!success) return res.status(404).json({ error: 'Consulta no encontrada.' });
  res.json({ success: true, message: 'Consulta eliminada.' });
});

/* ==========================================================================
   RESPALDO / BACKUP
   ========================================================================== */
router.get('/backup', (req, res) => {
  try {
    const backupPath = store.backup();
    res.download(backupPath);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar backup: ' + err.message });
  }
});

export default router;

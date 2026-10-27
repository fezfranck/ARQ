import express from 'express';
import { store } from '../lib/store.js';

const router = express.Router();

/**
 * GET /api/public/initial-data
 * Retorna de forma consolidada todos los datos necesarios para renderizar el sitio público
 */
router.get('/initial-data', (req, res) => {
  const settings = store.getSettings();
  const projects = store.getProjects(false);
  const services = store.getServices(false);
  const properties = store.getProperties(false);
  const pages = store.getPages(false);

  // Extraer categorías únicas de proyectos para los filtros de la galería
  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));

  res.json({
    settings,
    projects,
    categories,
    services,
    properties,
    navPages: pages.filter(p => p.inMenu).map(p => ({
      slug: p.slug,
      title: p.navTitle || p.title,
      order: p.order
    }))
  });
});

/**
 * GET /api/public/projects
 */
router.get('/projects', (req, res) => {
  const { category } = req.query;
  let projects = store.getProjects(false);
  
  if (category && category !== 'all') {
    projects = projects.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  res.json(projects);
});

/**
 * GET /api/public/projects/:slug
 */
router.get('/projects/:slug', (req, res) => {
  const { slug } = req.params;
  const project = store.getProjectBySlug(slug);

  if (!project || !project.published) {
    return res.status(404).json({ error: 'Proyecto no encontrado o no disponible.' });
  }

  // Proyectos relacionados de la misma categoría o recientes
  const allPublished = store.getProjects(false);
  const related = allPublished
    .filter(p => p.id !== project.id)
    .slice(0, 3);

  res.json({ project, related });
});

/**
 * GET /api/public/services
 */
router.get('/services', (req, res) => {
  res.json(store.getServices(false));
});

/**
 * GET /api/public/properties
 */
router.get('/properties', (req, res) => {
  res.json(store.getProperties(false));
});

/**
 * GET /api/public/pages/:slug
 */
router.get('/pages/:slug', (req, res) => {
  const { slug } = req.params;
  const page = store.getPageBySlug(slug);

  if (!page || !page.published) {
    return res.status(404).json({ error: 'Página no encontrada o no disponible.' });
  }

  res.json(page);
});

/**
 * POST /api/public/inquiry
 * Recepción del formulario de contacto con validación y honeypot antispam
 */
router.post('/inquiry', (req, res) => {
  const { name, email, phone, message, _honeypot } = req.body;

  // Si el campo oculto honeypot viene lleno, descartar silenciosamente (bot)
  if (_honeypot) {
    return res.json({ success: true, message: 'Mensaje recibido.' });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Por favor complete todos los campos requeridos (nombre, email y mensaje).' });
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Por favor ingrese un correo electrónico válido.' });
  }

  const savedInquiry = store.addInquiry({
    name: name.trim().slice(0, 100),
    email: email.trim().slice(0, 120),
    phone: (phone || '').trim().slice(0, 50),
    message: message.trim().slice(0, 3000)
  });

  res.json({
    success: true,
    message: '¡Muchas gracias! Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto a la brevedad.',
    id: savedInquiry.id
  });
});

export default router;

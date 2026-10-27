import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import authRoutes from './routes/authRoutes.js';
import publicApi from './routes/publicApi.js';
import adminApi from './routes/adminApi.js';
import { store } from './lib/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// Configuración de Cabeceras de Seguridad HTTP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Archivos estáticos: uploads persistentes y assets originales
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true
}));

app.use('/static', express.static(path.join(__dirname, 'static'), {
  maxAge: '7d'
}));

// Frontend público
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h'
}));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/public', publicApi);
app.use('/api/admin', adminApi);

// Panel de Administración (SPA)
app.use('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Detalle de Proyecto Individual
app.get('/proyecto/:slug', (req, res) => {
  const { slug } = req.params;
  const project = store.getProjectBySlug(slug);
  if (!project || !project.published) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'proyecto.html'));
});

// Páginas Dinámicas Creadas en el CMS
app.get('/p/:slug', (req, res) => {
  const { slug } = req.params;
  const page = store.getPageBySlug(slug);
  if (!page || !page.published) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'pagina.html'));
});

// Sitemap XML dinámico para indexación SEO
app.get('/sitemap.xml', (req, res) => {
  const projects = store.getProjects(false);
  const pages = store.getPages(false);
  const now = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // URL Principal
  xml += `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Proyectos publicados
  projects.forEach(p => {
    const mod = (p.updatedAt || p.createdAt || now).split('T')[0];
    xml += `  <url>\n    <loc>${SITE_URL}/proyecto/${p.slug}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  // Páginas personalizadas publicadas
  pages.forEach(p => {
    xml += `  <url>\n    <loc>${SITE_URL}/p/${p.slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  xml += '</urlset>';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

// Manejador de 404
app.use((req, res) => {
  if (req.accepts('html')) {
    const errorPage = path.join(__dirname, 'public', '404.html');
    if (fs.existsSync(errorPage)) {
      return res.status(404).sendFile(errorPage);
    }
  }
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Ocurrió un error en el servidor.' 
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` Estudio Anabella Zalazar - Servidor Activo`);
  console.log(` Web Pública:    http://localhost:${PORT}`);
  console.log(` Panel Admin:    http://localhost:${PORT}/admin`);
  console.log(` Entorno:        ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================\n`);
});

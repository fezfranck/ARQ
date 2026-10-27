# Estudio Anabella Zalazar — Arquitectura Contemporánea

Sitio web oficial y panel de administración privado (CMS) para el **Estudio de Arquitectura Anabella Zalazar** (Santa Fe, Argentina).

🌐 **Sitio Web Público:** [anabellazalazararquitecta.com.ar](https://anabellazalazararquitecta.com.ar/)  
🔐 **Panel de Administración:** `/admin`

---

## 🌟 Características Principales

### 🏛️ Frontend Público (Diseño Editorial & Arquitectónico)
- **Estética Contemporánea:** Inspirada en publicaciones editoriales de arquitectura (materiales nobles, terracota arquitectónica `#B84A28`, hormigón, arena y grafito).
- **Portafolio Interactivo:** Galería con filtros por categoría (*Residencial*, *Comercial*, *Interiores*), lightbox de alta resolución y páginas individuales con ficha técnica y memoria descriptiva (`/proyecto/:slug`).
- **Propiedades en Venta:** Catálogo de inmuebles y desarrollos con insignias (*Nueva*, *Oportunidad*), precios y solicitud de información.
- **Canales de Conversión:** Formulario de contacto con feedback inmediato, validación, protección honeypot y botón flotante de WhatsApp directo.
- **SEO & Datos Estructurados:** Schema.org JSON-LD (`ArchitecturalStudio`), Open Graph para redes sociales, `sitemap.xml` dinámico y `robots.txt`.
- **100% Responsive:** Experiencia optimizada para smartphones, tablets y pantallas de escritorio.

### 🔐 Panel de Administración Privado (`/admin`)
- **Autenticación Criptográfica:** Hashing seguro con `scrypt` y sal única aleatoria, sesiones persistentes firmadas con HMAC-SHA256 en cookies `HttpOnly` y protección contra fuerza bruta.
- **Gestión de Proyectos (CRUD):** Creación, edición, galería reordenable (⬆️ / ⬇️), selector de portada, estado (*Publicado* / *Borrador*) y destacados.
- **Biblioteca de Medios:** Subida múltiple de fotografías con almacenamiento persistente en `uploads/`, vista previa y copiado de URLs.
- **Creador de Páginas y Pestañas:** Editor modular de bloques (títulos, párrafos, citas, imágenes y botones) para crear nuevas páginas (ej: `/p/filosofia`) e incorporarlas automáticamente a la barra de navegación.
- **Personalización del Inicio:** Edición directa del Hero, textos biográficos, estadísticas (25+ años, 200+ obras), teléfonos y redes sin tocar código.
- **Bandeja de Consultas:** Registro de mensajes de clientes con botón para responder directamente por WhatsApp.
- **Copias de Seguridad:** Descarga de backup de la base de datos en formato JSON en un clic.

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js (ES Modules), Express 5
- **Persistencia:** Almacén transaccional ACID con escrituras atómicas (`data/db.json`)
- **Seguridad:** Criptografía nativa (`crypto.scrypt`), Rate Limiter, Helmet Security Headers
- **Carga de Archivos:** Multer con validación de tipos MIME y límite de 10 MB
- **Frontend:** Vanilla JS modular, CSS Variables, Glassmorphism, Google Fonts (`Plus Jakarta Sans`, `Syne`)

---

## 🚀 Instalación y Puesta en Marcha Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/fezfranck/ARQ.git
cd ARQ
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```
*(En Windows PowerShell: `Copy-Item .env.example .env`)*

### 4. Configurar el primer administrador
Ejecutar el asistente interactivo para definir el correo y la contraseña de acceso:
```bash
npm run setup-admin
```

### 5. Iniciar la aplicación
```bash
npm start
```

Abrir en el navegador:
- **Página pública:** [http://localhost:3000](http://localhost:3000)
- **Panel de control:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📁 Estructura del Repositorio

```
ARQ/
├── server.js               # Servidor Express y enrutamiento
├── package.json            # Dependencias y scripts
├── .env.example            # Plantilla de configuración
├── CNAME                   # Mapeo a anabellazalazararquitecta.com.ar
├── backup-original/        # Resguardo del sitio estático original
├── data/                   # Base de datos JSON y backups
├── uploads/                # Fotografías subidas desde el panel
├── static/                 # Activos originales del estudio
├── lib/                    # Lógica de autenticación, almacén y subida
├── routes/                 # APIs públicas, administrativas y de auth
├── scripts/                # Script para setup de administradores
├── public/                 # Archivos servidos por Express
│   ├── css/main.css        # Sistema de diseño arquitectónico
│   ├── js/app.js           # Lógica frontend reactiva
│   ├── proyecto.html       # Ficha de obra detallada
│   ├── pagina.html         # Renderizador de páginas dinámicas
│   └── admin/              # Panel de administración SPA
├── index.html              # Portada compatible con GitHub Pages y Node
├── css/ & js/              # Activos públicos sincronizados
└── admin/                  # Acceso administrativo
```

---

## 📄 Licencia y Derechos

© 2026 Estudio de Arquitectura Anabella Zalazar. Todos los derechos reservados.

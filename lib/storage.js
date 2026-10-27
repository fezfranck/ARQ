import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');

// Asegurar existencia del directorio de uploads
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Extensiones y tipos MIME permitidos para arquitectura
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml'
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']);

// Configuración de almacenamiento persistente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase || 'archivo'}_${uniqueSuffix}${ext}`);
  }
});

// Filtro de validación estricta de archivos
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Extensión no permitida: ${ext}. Solo se permiten imágenes (JPG, PNG, WEBP, AVIF, SVG)`), false);
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`Tipo MIME no permitido: ${file.mimetype}`), false);
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes por imagen
    files: 10 // Máximo 10 archivos simultáneos
  },
  fileFilter
});

/**
 * Elimina un archivo de uploads de forma segura
 */
export function removeUploadedFile(fileUrlOrPath) {
  if (!fileUrlOrPath) return false;
  
  // Extraer el nombre base del archivo
  const filename = path.basename(fileUrlOrPath);
  const targetPath = path.join(uploadsDir, filename);
  
  // Prevenir Directory Traversal
  if (!targetPath.startsWith(uploadsDir)) {
    return false;
  }
  
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
      return true;
    } catch (err) {
      console.error(`Error al eliminar archivo ${targetPath}:`, err);
      return false;
    }
  }
  return false;
}

export { uploadsDir };

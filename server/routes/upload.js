import express from 'express';
import multer from 'multer';
import { uploadFacturas } from '../controllers/uploadController.js';

const router = express.Router();

// Configurar multer para almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
        files: 20 // Máximo 20 archivos a la vez
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

// Endpoint para subir facturas (múltiples archivos)
router.post('/facturas', upload.array('files', 20), uploadFacturas);

export default router;

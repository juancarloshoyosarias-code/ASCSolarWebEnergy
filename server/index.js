import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import plantRoutes from './routes/plants.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API Solar v1.0 running on Postgres' });
});

app.use('/api/plants', plantRoutes);

// Servir archivos estáticos del frontend (producción)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback - cualquier ruta no-API sirve el index.html
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

app.listen(port, () => {
    console.log(`🚀 Servidor ASC Solar corriendo en http://localhost:${port}`);
    console.log(`🔗 Base de Datos conectada: ${process.env.DB_HOST}`);
    console.log(`📁 Frontend servido desde: ${distPath}`);
});

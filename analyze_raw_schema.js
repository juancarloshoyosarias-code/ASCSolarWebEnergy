
import { query } from './server/config/db.js';

async function analyzeRawTables() {
    try {
        console.log('--- ANÁLISIS DEL ESQUEMA RAW (DATOS CRUDOS) ---\n');

        // 1. Listar tablas en esquema 'raw' para confirmar nombres exactos
        console.log('1. TABLAS DISPONIBLES EN ESQUEMA "raw":');
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'raw'
        `);
        console.table(tables.rows);

        // 2. Muestreo de 'raw.fs_realtime_plants' (si existe)
        // Corregimos nombres basados en tu imagen: fs_realtime_plants
        console.log('\n2. DATOS RECIENTES CABAÑITA (raw.fs_realtime_plants)');
        const realtimeData = await query(`
            SELECT * FROM raw.fs_realtime_plants 
            WHERE plant_code = 'NE=33876570' 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.table(realtimeData.rows);

        // 3. Muestreo de 'raw.fs_energy_daily_snapshot' (si existe)
        console.log('\n3. DATOS DIARIOS CABAÑITA (raw.fs_energy_daily_snapshot)');
        const dailyData = await query(`
            SELECT * FROM raw.fs_energy_daily_snapshot 
            WHERE plant_code = 'NE=33876570' 
            ORDER BY created_at DESC -- O date_capture según estructura
            LIMIT 5
        `);
        console.table(dailyData.rows);

    } catch (err) {
        console.error('Error durante el análisis:', err.message);
        if (err.position) console.error(`Posición error SQL: ${err.position}`);
    } finally {
        process.exit();
    }
}

analyzeRawTables();

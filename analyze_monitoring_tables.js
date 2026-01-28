
import { query } from './server/config/db.js';

async function analyzeTablesStructure() {
    try {
        console.log('--- ANÁLISIS ESTRUCTURAL DE TABLAS DE MONITOREO ---\n');

        // 1. fs_realtime_plants
        console.log('1. TABLA: fs.fs_realtime_plants (Monitoreo Tiempo Real)');
        const realtimeCols = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'fs' AND table_name = 'fs_realtime_plants'
        `);
        console.table(realtimeCols.rows);

        console.log('\n--> Muestra de datos (fs.fs_realtime_plants) Cabañita (NE=33876570):');
        const realtimeData = await query(`
            SELECT * FROM fs.fs_realtime_plants 
            WHERE plant_code = 'NE=33876570' 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        console.table(realtimeData.rows);


        // 2. fs_energy_daily_snapshot
        console.log('\n2. TABLA: fs.fs_energy_daily_snapshot (Acumulado Diario)');
        const dailyCols = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'fs' AND table_name = 'fs_energy_daily_snapshot'
        `);
        console.table(dailyCols.rows);

        console.log('\n--> Muestra de datos (fs.fs_energy_daily_snapshot) Cabañita (NE=33876570):');
        const dailyData = await query(`
            SELECT * FROM fs.fs_energy_daily_snapshot 
            WHERE plant_code = 'NE=33876570' 
            ORDER BY date_capture DESC 
            LIMIT 3
        `);
        console.table(dailyData.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

analyzeTablesStructure();

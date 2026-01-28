
import { query } from './server/config/db.js';

async function inspectFull() {
    try {
        console.log('--- TABLES ---');
        const tables = await query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name;
        `);
        console.table(tables.rows);

        console.log('\n--- DAILY METRICS COLUMNS ---');
        const metrics = await query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'fs' AND table_name = 'plant_daily_metrics';
        `);
        console.table(metrics.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectFull();

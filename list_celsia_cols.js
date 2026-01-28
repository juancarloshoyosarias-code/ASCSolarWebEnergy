
import { query } from './server/config/db.js';

async function listColumns() {
    try {
        console.log('--- COLUMNS IN fs.FacCelsia ---');
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'fs' AND table_name = 'FacCelsia'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listColumns();

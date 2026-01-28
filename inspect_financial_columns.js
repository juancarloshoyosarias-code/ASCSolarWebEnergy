import { query } from './server/config/db.js';

async function inspect() {
    try {
        console.log('Inspecting dim.fs_plants columns...');
        const res = await query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'dim' AND table_name = 'fs_plants'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspect();

import { query } from './server/config/db.js';

async function inspectContent() {
    try {
        console.log('Inspecting dim.fs_plants content...');
        const res = await query(`SELECT * FROM dim.fs_plants`);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectContent();

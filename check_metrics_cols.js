import { query } from './server/config/db.js';

async function run() {
    try {
        const res = await query("SELECT * FROM fs.plant_daily_metrics LIMIT 1");
        console.log("Cols:", Object.keys(res.rows[0]));
    } catch (e) { console.error(e); }
    process.exit();
}
run();

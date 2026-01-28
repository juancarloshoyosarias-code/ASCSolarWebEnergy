import { query } from './server/config/db.js';

async function checkColumns() {
    try {
        const t1 = await query("SELECT * FROM raw.fs_energy_daily_snapshot LIMIT 1");
        console.log('fs_energy_daily_snapshot cols:', Object.keys(t1.rows[0] || {}));

        const t2 = await query("SELECT * FROM dim.fs_plants LIMIT 1");
        console.log('dim.fs_plants cols:', Object.keys(t2.rows[0] || {}));

        // Check for meter table if exists
        try {
            const t3 = await query("SELECT * FROM raw.fs_meter_energy_daily LIMIT 1");
            console.log('fs_meter_energy_daily cols:', Object.keys(t3.rows[0] || {}));
        } catch (e) { console.log('fs_meter_energy_daily not found'); }

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkColumns();

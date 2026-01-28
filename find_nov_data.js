import { query } from './server/config/db.js';

async function run() {
    try {
        console.log("Searching for Nov 2025 Data (2025-11-01 to 2025-11-30)...");

        // 1. plant_daily_metrics
        console.log("--- fs.plant_daily_metrics ---");
        try {
            const q1 = `
                SELECT 
                    SUM(fv_yield_kwh) as gen, 
                    SUM(consumption_kwh) as cons,
                    SUM(export_energy_kwh) as exp,
                    SUM(import_energy_kwh) as imp,
                    SUM(self_consumption_kwh) as self
                FROM fs.plant_daily_metrics
                WHERE date_local BETWEEN '2025-11-01' AND '2025-11-30'
            `;
            const r1 = await query(q1);
            console.log(r1.rows[0]);
        } catch (e) { console.log("Error table 1:", e.message); }

        // 2. raw.fs_plants_daily_last (if valid)
        // Check columns first? Assuming standard names or check snapshot

        // 3. Re-check raw.fs_energy_daily_snapshot with wider range?
        console.log("--- raw.fs_energy_daily_snapshot (All 2025) ---");
        const q3 = `
            SELECT to_char(date(ts_utc AT TIME ZONE 'America/Bogota'), 'YYYY-MM') as month,
                   SUM(day_self_use_kwh) as self_use
            FROM (
                SELECT DISTINCT ON (plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'))
                    day_self_use_kwh, ts_utc
                FROM raw.fs_energy_daily_snapshot
                ORDER BY plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'), ts_utc DESC
            ) sub
            WHERE date(ts_utc AT TIME ZONE 'America/Bogota') BETWEEN '2025-01-01' AND '2025-12-31'
            GROUP BY 1 ORDER BY 1
        `;
        const r3 = await query(q3);
        console.table(r3.rows);

    } catch (e) { console.error(e); }
    process.exit();
}
run();

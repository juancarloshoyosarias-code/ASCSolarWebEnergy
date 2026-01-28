import { query } from './server/config/db.js';

async function run() {
    try {
        console.log("Checking total rows...");
        const count = await query("SELECT count(*) FROM raw.fs_energy_daily_snapshot");
        console.log("Total Rows:", count.rows[0].count);

        console.log("Checking Sum without filter...");
        const q1 = `
            WITH DailyStats AS (
                SELECT DISTINCT ON (plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'))
                    day_self_use_kwh
                FROM raw.fs_energy_daily_snapshot
                ORDER BY plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'), ts_utc DESC
            )
            SELECT SUM(day_self_use_kwh) as val FROM DailyStats
        `;
        const r1 = await query(q1);
        console.log("Sum All Historical (No Filter):", r1.rows[0].val);

        console.log("Checking Sum WITH filter (>12:00)...");
        const q2 = `
            WITH DailyStats AS (
                SELECT DISTINCT ON (plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'))
                    day_self_use_kwh
                FROM raw.fs_energy_daily_snapshot
                WHERE (ts_utc AT TIME ZONE 'America/Bogota')::time > '12:00:00'
                ORDER BY plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'), ts_utc DESC
            )
            SELECT SUM(day_self_use_kwh) as val FROM DailyStats
        `;
        const r2 = await query(q2);
        console.log("Sum All Historical (Filtered):", r2.rows[0].val);

        console.log("Checking Nov 2025 specifically...");
        const q3 = `
            WITH DailyStats AS (
                SELECT DISTINCT ON (plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'))
                    day_self_use_kwh, date(ts_utc AT TIME ZONE 'America/Bogota') as d
                FROM raw.fs_energy_daily_snapshot
                ORDER BY plant_code, date(ts_utc AT TIME ZONE 'America/Bogota'), ts_utc DESC
            )
            SELECT SUM(day_self_use_kwh) as val FROM DailyStats
            WHERE d BETWEEN '2025-11-01' AND '2025-11-30'
        `;
        const r3 = await query(q3);
        console.log("Sum Nov 2025:", r3.rows[0].val);

    } catch (e) { console.error(e); }
    process.exit();
}
run();

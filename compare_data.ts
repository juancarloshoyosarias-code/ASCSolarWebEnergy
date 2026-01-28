
import { query } from './server/config/db.js';
import { mockPlants } from './src/data/mockData.ts';

async function compareData() {
    try {
        console.log('--- FETCHING DB TOTALS ---');
        // Get total generation (historical) per plant
        const dbRes = await query(`
            SELECT 
                p.plant_name,
                SUM(m.fv_yield_kwh) as total_generation_kwh,
                MIN(m.date) as first_record,
                MAX(m.date) as last_record,
                COUNT(DISTINCT m.date) as days_recorded
            FROM dim.fs_plants p
            LEFT JOIN fs.plant_daily_metrics m ON p.plant_code = m.plant_code
            GROUP BY p.plant_name
            ORDER BY p.plant_name;
        `);

        const dbData = dbRes.rows;

        console.log('\n--- COMPARISON (DB vs MOCK) ---');
        console.log('Plant Name | DB Total Gen (kWh) | Mock Inv ($) | Mock Savings ($)');
        console.log('--- | --- | --- | ---');

        dbData.forEach(row => {
            const mock = mockPlants.find(p => p.name === row.plant_name);
            const dbGen = parseFloat(row.total_generation_kwh || 0).toFixed(0);
            const mockInv = mock ? (mock.investment / 1000000).toFixed(1) + 'M' : 'N/A';
            const mockSave = mock ? (mock.savingsTotal / 1000000).toFixed(1) + 'M' : 'N/A';

            console.log(`${row.plant_name.padEnd(12)} | ${dbGen.padStart(15)} | ${mockInv.padStart(10)} | ${mockSave.padStart(10)}`);
        });

        console.log('\n--- DB RECORD RANGE ---');
        dbData.forEach(row => {
            console.log(`${row.plant_name}: ${row.first_record ? row.first_record.toISOString().split('T')[0] : 'N/A'} to ${row.last_record ? row.last_record.toISOString().split('T')[0] : 'N/A'} (${row.days_recorded} days)`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

compareData();

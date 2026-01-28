
import { query } from './server/config/db.js';

async function inspectCelsiaTables() {
    try {
        console.log('--- INSPECTING fs.FacCelsia ---');
        try {
            const facCelsiaCols = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'fs' AND table_name = 'faccelsia';
            `);
            console.table(facCelsiaCols.rows);

            const facCelsiaSample = await query(`SELECT * FROM fs."FacCelsia" LIMIT 3`);
            console.log('Sample Data (fs.FacCelsia):', facCelsiaSample.rows);
        } catch (e) { console.log('Error reading fs.FacCelsia:', e.message); }

        console.log('\n--- INSPECTING operator.celsia ---');
        try {
            const opCelsiaCols = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'operator' AND table_name = 'celsia';
            `);
            console.table(opCelsiaCols.rows);

            const opCelsiaSample = await query(`SELECT * FROM operator.celsia LIMIT 3`);
            console.log('Sample Data (operator.celsia):', opCelsiaSample.rows);
        } catch (e) {
            // Try fetching typical columns if inspecting schema fails or table name differs slightly
            console.log('Error reading operator.celsia, checking variations...');
        }

        console.log('\n--- INSPECTING analisis_solar_mensual (Reference) ---');
        try {
            const analysisSample = await query(`SELECT * FROM fs.analisis_solar_mensual LIMIT 3`);
            console.log('Sample Data (analisis_solar_mensual):', analysisSample.rows);
        } catch (e) { console.log('Error reading fs.analisis_solar_mensual:', e.message); }


    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectCelsiaTables();

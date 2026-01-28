
import { query } from './server/config/db.js';

async function verifyInvoiceDates() {
    try {
        console.log('--- INSPECTING START DATES IN fs.FacCelsia (Corrected Type) ---');

        // Removed TO_DATE as "Fecha inicial" might already be DATE type or handled differently.
        // If it's text 'DD/MM/YYYY', standard postges to_date should work, but error implies type mismatch.
        // Let's just inspect the raw string first and MIN/MAX Year which is integer.

        const simpleQuery = `
            SELECT 
                "Planta",
                MIN("Año") as min_year,
                MAX("Año") as max_year,
                MIN("Fecha inicial") as min_date_str, 
                MAX("Fecha final") as max_date_str,
                COUNT(*) as invoice_count
            FROM fs."FacCelsia"
            GROUP BY "Planta"
            ORDER BY min_year ASC;
        `;

        const res = await query(simpleQuery);
        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

verifyInvoiceDates();

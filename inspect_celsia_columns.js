
import { query } from './server/config/db.js';

async function inspectColumns() {
    try {
        console.log('--- INSPECTING NUMERIC COLUMNS IN fs.FacCelsia ---');

        // Get one row to see active columns and their values
        const res = await query(`SELECT * FROM fs."FacCelsia" LIMIT 1`);
        if (res.rows.length > 0) {
            const row = res.rows[0];
            Object.keys(row).forEach(key => {
                if (typeof row[key] === 'number' || !isNaN(parseFloat(row[key]))) {
                    console.log(`${key}: ${row[key]} (Type: ${typeof row[key]})`);
                }
            });
        } else {
            console.log("No rows found.");
        }

        console.log('--- CHECKING SPECIFIC SUMS ---');
        const sums = await query(`
            SELECT 
                SUM("Credito de energia Subtotal COP") as sum_creditos_raw,
                SUM("Creditos de energia Subtotal COP") as sum_creditos_clean,
                SUM("Valor total excedentes") as sum_excedentes_alt,
                SUM("Saldo acumulado ($)") as sum_saldo
            FROM fs."FacCelsia"
        `);
        console.table(sums.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectColumns();

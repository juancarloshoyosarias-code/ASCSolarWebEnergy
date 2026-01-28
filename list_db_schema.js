import { query } from './server/config/db.js';
import fs from 'fs';

async function run() {
    try {
        let output = "# Reporte de Base de Datos\n\n";

        // 1. Obtener lista de tablas
        const tablesQuery = `
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name;
        `;
        const tablesRes = await query(tablesQuery);
        const tables = tablesRes.rows;

        output += `Encontradas ${tables.length} tablas.\n\n`;

        for (const table of tables) {
            const schema = table.table_schema;
            const name = table.table_name;
            const fullName = `"${schema}"."${name}"`;

            // 2. Obtener Columnas
            const colsQuery = `
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position
            `;
            const colsRes = await query(colsQuery, [schema, name]);
            const columns = colsRes.rows.map(c => `\`${c.column_name}\` (*${c.data_type}*)`).join(', ');

            // 3. Obtener Conteo (Count)
            let count = 'N/A';
            try {
                const countRes = await query(`SELECT COUNT(*) as c FROM ${fullName}`);
                count = countRes.rows[0].c;
            } catch (err) {
                count = 'Error counting';
            }

            // Output formateado
            output += `### ${fullName}\n`;
            output += `- **Registros:** ${count}\n`;
            output += `- **Columnas:** ${columns}\n\n`;
        }

        fs.writeFileSync('db_report.md', output);
        console.log("Reporte guardado en db_report.md");

    } catch (e) {
        console.error("Error general:", e);
    }
    process.exit();
}

run();

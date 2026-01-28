
import { query } from './server/config/db.js';

async function auditDatabase() {
    try {
        console.log('--- AUDITORÍA COMPLETA DE BASE DE DATOS ---\n');

        // 1. LISTAR TODOS LOS ESQUEMAS
        console.log('1. ESQUEMAS EXISTENTES:');
        const schemas = await query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `);
        console.table(schemas.rows);

        // 2. LISTAR TODAS LAS TABLAS POR ESQUEMA (con conteo aproximado de filas)
        console.log('\n2. INVENTARIO DE TABLAS POR ESQUEMA:');
        const tables = await query(`
            SELECT 
                table_schema, 
                table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name
        `);

        for (const t of tables.rows) {
            // Intentar contar filas (rápido) y ver fecha min/max si hay columnas de fecha
            try {
                // Check if table has a date-like column
                const cols = await query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = $1 AND table_name = $2 
                    AND (column_name ILIKE '%date%' OR column_name ILIKE '%time%' OR column_name ILIKE '%ts_utc%')
                    LIMIT 1
                `, [t.table_schema, t.table_name]);

                const dateCol = cols.rows.length > 0 ? cols.rows[0].column_name : null;

                let stats = '';
                if (dateCol) {
                    const range = await query(`
                        SELECT MIN(${dateCol}) as min_date, MAX(${dateCol}) as max_date, COUNT(*) as count 
                        FROM ${t.table_schema}.${t.table_name}
                    `);
                    const r = range.rows[0];
                    stats = `Filas: ${r.count} | Rango: ${r.min_date} -> ${r.max_date}`;
                } else {
                    const count = await query(`SELECT COUNT(*) as count FROM ${t.table_schema}.${t.table_name}`);
                    stats = `Filas: ${count.rows[0].count} (Sin columna fecha obvia)`;
                }

                console.log(`[${t.table_schema}.${t.table_name}] -> ${stats}`);

            } catch (e) {
                console.log(`[${t.table_schema}.${t.table_name}] -> Error acceso: ${e.message}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

auditDatabase();

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: '100.85.194.111',
    database: 'postgres',
    password: 'MoR5IJtf6JguaEzJZtn1OX5OaFStlEgSnXjy7ljzpMDLXdIi7Ca1QNodGDdmxqGb',
    port: 32768,
});

async function inspect() {
    try {
        const tables = ['plant_daily_metrics', 'fs_plants', 'FacCelsia'];

        for (const table of tables) {
            // Buscar en informacion schema sin importar el esquema especifico por ahora
            const cols = await pool.query(`
            SELECT table_schema, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
            ORDER BY ordinal_position;
        `);
            console.log(`\n📋 COLUMN AS DE '${table}':`);
            cols.rows.forEach(c => console.log(`   - [${c.table_schema}] . ${c.column_name} (${c.data_type})`));
        }
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

inspect();

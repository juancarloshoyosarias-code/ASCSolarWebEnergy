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
        console.log('🔌 Buscando Bases de Datos y Esquemas...');

        // 1. Listar Nombres de Bases de Datos
        const dbs = await pool.query(`
      SELECT datname FROM pg_database WHERE datistemplate = false;
    `);
        console.log('\n🗄️  BASES DE DATOS DISPONIBLES:');
        dbs.rows.forEach(r => console.log(`   - ${r.datname}`));

        // 2. Listar Esquemas dentro de 'postgres'
        const schemas = await pool.query(`
      SELECT schema_name FROM information_schema.schemata;
    `);
        console.log('\n📂 ESQUEMAS EN LA DB ACTUAL (postgres):');
        schemas.rows.forEach(r => console.log(`   - ${r.schema_name}`));

        // 3. Listar tablas en TODOS los esquemas
        const allTables = await pool.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name;
    `);
        console.log('\n📊 TODAS LAS TABLAS ENCONTRADAS:');
        allTables.rows.forEach(r => console.log(`   - [${r.table_schema}] . [${r.table_name}]`));

        pool.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        pool.end();
    }
}

inspect();

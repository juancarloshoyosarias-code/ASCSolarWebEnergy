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
        console.log('🔌 Conectando a Base de Datos ASC...');

        // 1. Listar Tablas
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

        console.log('\n📊 TABLAS ENCONTRADAS:');
        if (res.rows.length === 0) {
            console.log("⚠️ No se encontraron tablas publicas.");
        } else {
            res.rows.forEach(r => console.log(` - ${r.table_name}`));

            // 2. Si encontramos tablas interesantes, inspeccionar columnas de una (ej. alguna parecida a 'plant' o 'generacion')
            // Voy a inspeccionar las primeras 5 para darte visibilidad rapida
            for (const row of res.rows.slice(0, 5)) {
                const tableName = row.table_name;
                const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${tableName}';
            `);
                console.log(`\n📋 Columnas de '${tableName}':`);
                cols.rows.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));
            }
        }

        pool.end();
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
        pool.end();
    }
}

inspect();

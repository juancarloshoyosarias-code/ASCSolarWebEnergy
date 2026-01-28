
import { query } from './server/config/db.js';

async function analyzeCabanita() {
    try {
        const plantCode = 'NE=33876570'; // Cabañita
        const plantName = 'Cabañita';

        console.log(`--- ANALIZANDO PLANTA: ${plantName} (${plantCode}) ---\n`);

        // 1. GENERACIÓN DIARIA (Últimos 7 días)
        console.log(`1. DATOS DE GENERACIÓN (fs.plant_daily_metrics)`);
        const dailyRes = await query(`
            SELECT date, fv_yield_kwh, co2_avoided_t 
            FROM fs.plant_daily_metrics 
            WHERE plant_code = $1 
            ORDER BY date DESC 
            LIMIT 7
        `, [plantCode]);
        console.table(dailyRes.rows);

        // 2. GENERACIÓN MENSUAL (Mes Actual y Anterior)
        console.log(`\n2. ACUMULADO MENSUAL (fs.plant_daily_metrics)`);
        const monthlyRes = await query(`
            SELECT 
                EXTRACT(YEAR FROM date) as year,
                EXTRACT(MONTH FROM date) as month,
                SUM(fv_yield_kwh) as total_gen,
                MAX(date) as last_data_date
            FROM fs.plant_daily_metrics 
            WHERE plant_code = $1 
            GROUP BY 1, 2 
            ORDER BY 1 DESC, 2 DESC 
            LIMIT 3
        `, [plantCode]);
        console.table(monthlyRes.rows);

        // 3. FACTURACIÓN Y FINANCIERO (fs.FacCelsia)
        console.log(`\n3. DATOS FINANCIEROS (fs.FacCelsia)`);
        // Intentamos buscar por nombre ya que no tenemos certeza del link por código en esta tabla
        const invoiceRes = await query(`
            SELECT 
                "Año", "Mes", 
                "Tu consumo mes (kwh)" as consumo_solar_o_total,
                "Consumo importando Energia (kWh)" as importado,
                "Creditos de energia Subtotal COP" as creditos_cop,
                "Valoracion horaria Subtotal COP" as valoracion_cop,
                "TOTAL A PAGAR ($)" as pago_total,
                "TOTAL CELSIA (COP)" as pago_energia
            FROM fs."FacCelsia" 
            WHERE "Planta" ILIKE $1
            ORDER BY "Año" DESC, 
                CASE 
                    WHEN "Mes" = 'Diciembre' THEN 12
                    WHEN "Mes" = 'Noviembre' THEN 11
                    WHEN "Mes" = 'Octubre' THEN 10
                    WHEN "Mes" = 'Septiembre' THEN 9
                    WHEN "Mes" = 'Agosto' THEN 8
                    WHEN "Mes" = 'Julio' THEN 7
                    WHEN "Mes" = 'Junio' THEN 6
                    WHEN "Mes" = 'Mayo' THEN 5
                    WHEN "Mes" = 'Abril' THEN 4
                    WHEN "Mes" = 'Marzo' THEN 3
                    WHEN "Mes" = 'Febrero' THEN 2
                    WHEN "Mes" = 'Enero' THEN 1
                END DESC
            LIMIT 5
        `, [`%${plantName}%`]);
        console.table(invoiceRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

analyzeCabanita();

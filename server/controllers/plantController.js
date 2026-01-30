import { query as dbQuery } from '../config/db.js';

// Helper para meses
function getMonthName(monthIndex) {
    const months = ['N/A', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[monthIndex] || 'Desconocido';
}

// Obtener resumen de todas las plantas para el Dashboard
// Fuente: raw.fs_energy_daily_snapshot (datos reales de FusionSolar API)
export const getPlantsSummary = async (req, res) => {
    try {
        const query = `
            WITH ultimo_dia AS (
                -- Usar el último día con datos en el snapshot raw
                SELECT MAX(ts_utc::date) as max_date FROM raw.fs_energy_daily_snapshot
            ),
            params AS (
                SELECT
                    ud.max_date AS d_hoy,
                    date_trunc('month', ud.max_date)::date AS d_ini_mes,
                    date_trunc('year', ud.max_date)::date AS d_ini_year
                FROM ultimo_dia ud
            ),
            specs AS (
                SELECT
                    fp.plant_name,
                    fp.plant_code,
                    fp.capacity_kw AS kwp,
                    COALESCE(fp.pr_target, 0.9) AS pr_obj,
                    COALESCE(fp.hps_reference, 4.0) AS hps_obj
                FROM dim.fs_plants fp
            ),
            -- Datos diarios agregados desde raw.fs_energy_daily_snapshot
            -- Usamos MAX() por día en zona horaria Colombia (igual que reporte n8n)
            daily_data AS (
                SELECT
                    plant_code,
                    DATE(ts_utc AT TIME ZONE 'America/Bogota') as fecha,
                    MAX(day_gen_kwh) as day_gen_kwh,
                    MAX(day_use_kwh) as day_use_kwh,        -- Consumo total dispositivos
                    MAX(day_self_use_kwh) as day_self_use_kwh,   -- Autoconsumo (solar consumido directamente)
                    MAX(day_export_kwh) as day_export_kwh,     -- Exportación a red
                    MAX(day_import_kwh) as day_import_kwh      -- Importación de red
                FROM raw.fs_energy_daily_snapshot
                GROUP BY plant_code, DATE(ts_utc AT TIME ZONE 'America/Bogota')
            ),
            -- Métricas del DÍA
            gen_dia AS (
                SELECT
                    s.plant_code,
                    COALESCE(d.day_gen_kwh, 0) AS gen_kwh_hoy,
                    COALESCE(d.day_use_kwh, 0) AS consumo_kwh_hoy,
                    COALESCE(d.day_self_use_kwh, 0) AS autoconsumo_kwh_hoy,
                    COALESCE(d.day_export_kwh, 0) AS export_kwh_hoy,
                    COALESCE(d.day_import_kwh, 0) AS import_kwh_hoy
                FROM specs s
                CROSS JOIN params pr
                LEFT JOIN daily_data d
                    ON d.plant_code = s.plant_code AND d.fecha = pr.d_hoy
            ),
            -- Métricas del MES (MTD)
            gen_mtd AS (
                SELECT
                    s.plant_code,
                    COALESCE(SUM(d.day_gen_kwh), 0) AS gen_kwh_mes,
                    COALESCE(SUM(d.day_use_kwh), 0) AS consumo_kwh_mes,
                    COALESCE(SUM(d.day_self_use_kwh), 0) AS autoconsumo_kwh_mes,
                    COALESCE(SUM(d.day_export_kwh), 0) AS export_kwh_mes,
                    COALESCE(SUM(d.day_import_kwh), 0) AS import_kwh_mes
                FROM specs s
                CROSS JOIN params pr
                LEFT JOIN daily_data d
                    ON d.plant_code = s.plant_code
                    AND d.fecha >= pr.d_ini_mes AND d.fecha <= pr.d_hoy
                GROUP BY s.plant_code
            ),
            -- Métricas del AÑO (YTD)
            gen_ytd AS (
                SELECT
                    s.plant_code,
                    COALESCE(SUM(d.day_gen_kwh), 0) AS gen_kwh_ytd,
                    COALESCE(SUM(d.day_use_kwh), 0) AS consumo_kwh_ytd,
                    COALESCE(SUM(d.day_self_use_kwh), 0) AS autoconsumo_kwh_ytd,
                    COALESCE(SUM(d.day_export_kwh), 0) AS export_kwh_ytd,
                    COALESCE(SUM(d.day_import_kwh), 0) AS import_kwh_ytd
                FROM specs s
                CROSS JOIN params pr
                LEFT JOIN daily_data d
                    ON d.plant_code = s.plant_code
                    AND d.fecha >= pr.d_ini_year AND d.fecha <= pr.d_hoy
                GROUP BY s.plant_code
            ),
            -- Total histórico desde snapshot raw
            gen_total AS (
                SELECT
                    plant_code,
                    MIN(fecha) as start_date,
                    SUM(day_gen_kwh) as gen_total,
                    SUM(day_self_use_kwh) as autoconsumo_total,
                    SUM(day_export_kwh) as export_total
                FROM daily_data
                GROUP BY plant_code
            ),
            -- Estado en tiempo real (incluye generación del día actual)
            realtime AS (
                SELECT DISTINCT ON (plant_code)
                    plant_code,
                    ts_utc as last_seen,
                    power_kw as current_power,
                    day_power_kwh as gen_hoy_realtime,
                    month_power_kwh as gen_mes_realtime,
                    total_power_kwh as gen_total_realtime
                FROM raw.fs_realtime_plants
                ORDER BY plant_code, ts_utc DESC
            )
            SELECT
                s.plant_code as id,
                s.plant_name as name,
                s.kwp as capacity,
                s.hps_obj,
                s.pr_obj,

                -- Fecha inicio y días operando
                gt.start_date,
                (CURRENT_DATE - gt.start_date::date) as days_in_operation,
                CURRENT_DATE as fecha_datos,

                -- DÍA (TIEMPO REAL desde fs_realtime_plants para generación, snapshot para resto)
                ROUND(COALESCE(rt.gen_hoy_realtime, gd.gen_kwh_hoy, 0)::numeric, 1) as gen_today,
                ROUND((s.kwp * s.hps_obj * s.pr_obj)::numeric, 1) as obj_today,
                ROUND(gd.consumo_kwh_hoy::numeric, 1) as consumo_today,
                ROUND(gd.autoconsumo_kwh_hoy::numeric, 1) as autoconsumo_today,
                ROUND(gd.export_kwh_hoy::numeric, 1) as export_today,
                ROUND(gd.import_kwh_hoy::numeric, 1) as import_today,

                -- MES (TIEMPO REAL + histórico del mes)
                ROUND(COALESCE(rt.gen_mes_realtime, gm.gen_kwh_mes, 0)::numeric, 1) as gen_month,
                ROUND((s.kwp * s.hps_obj * s.pr_obj * EXTRACT(DAY FROM CURRENT_DATE))::numeric, 1) as obj_month,
                ROUND(gm.consumo_kwh_mes::numeric, 1) as consumo_month,
                ROUND(gm.autoconsumo_kwh_mes::numeric, 1) as autoconsumo_month,
                ROUND(gm.export_kwh_mes::numeric, 1) as export_month,
                ROUND(gm.import_kwh_mes::numeric, 1) as import_month,

                -- AÑO (histórico + mes actual en tiempo real)
                ROUND((gy.gen_kwh_ytd + COALESCE(rt.gen_hoy_realtime, 0) - COALESCE(gd.gen_kwh_hoy, 0))::numeric, 1) as gen_year,
                ROUND((s.kwp * s.hps_obj * s.pr_obj * 365)::numeric, 1) as obj_year,
                ROUND(gy.consumo_kwh_ytd::numeric, 1) as consumo_year,
                ROUND(gy.autoconsumo_kwh_ytd::numeric, 1) as autoconsumo_year,
                ROUND(gy.export_kwh_ytd::numeric, 1) as export_year,
                ROUND(gy.import_kwh_ytd::numeric, 1) as import_year,

                -- TOTAL HISTÓRICO (desde realtime que ya incluye todo para generación)
                ROUND(COALESCE(rt.gen_total_realtime, gt.gen_total, 0)::numeric, 1) as gen_total,
                ROUND(gt.autoconsumo_total::numeric, 1) as autoconsumo_total,
                ROUND(gt.export_total::numeric, 1) as export_total,

                -- Porcentajes acumulados
                CASE WHEN gt.gen_total > 0
                    THEN ROUND((gt.autoconsumo_total / gt.gen_total * 100)::numeric, 1)
                    ELSE 0 END as pct_autoconsumo,
                CASE WHEN gt.gen_total > 0
                    THEN ROUND((gt.export_total / gt.gen_total * 100)::numeric, 1)
                    ELSE 0 END as pct_exportacion,

                -- Estado
                CASE
                    WHEN rt.last_seen >= (NOW() - INTERVAL '30 minutes') THEN 'active'
                    WHEN rt.last_seen >= (NOW() - INTERVAL '24 hours') THEN 'warning'
                    ELSE 'inactive'
                END as status,
                rt.current_power,

                'Valle del Cauca' as location

            FROM specs s
            CROSS JOIN params pr
            LEFT JOIN gen_dia gd ON s.plant_code = gd.plant_code
            LEFT JOIN gen_mtd gm ON s.plant_code = gm.plant_code
            LEFT JOIN gen_ytd gy ON s.plant_code = gy.plant_code
            LEFT JOIN gen_total gt ON s.plant_code = gt.plant_code
            LEFT JOIN realtime rt ON s.plant_code = rt.plant_code
            ORDER BY s.plant_name;
        `;

        const result = await dbQuery(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching plants summary:', err);
        res.status(500).json({ error: 'Error interno obteniendo resumen de plantas' });
    }
};

// Obtener detalle de una planta específica
// Fuente: raw.fs_energy_daily_snapshot (datos reales de FusionSolar API)
export const getPlantDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const plantQuery = `SELECT * FROM dim.fs_plants WHERE plant_code = $1`;
        const plantRes = await dbQuery(plantQuery, [id]);

        if (plantRes.rows.length === 0) {
            return res.status(404).json({ error: 'Planta no encontrada' });
        }
        const plant = plantRes.rows[0];

        // Métricas usando raw.fs_energy_daily_snapshot (fuente real FusionSolar)
        const statsQuery = `
            WITH daily_data AS (
                -- MAX() por día en zona horaria Colombia (igual que reporte n8n)
                SELECT
                    DATE(ts_utc AT TIME ZONE 'America/Bogota') as fecha,
                    MAX(day_gen_kwh) as day_gen_kwh,
                    MAX(day_use_kwh) as day_use_kwh,        -- Consumo total
                    MAX(day_self_use_kwh) as day_self_use_kwh,   -- Autoconsumo
                    MAX(day_export_kwh) as day_export_kwh,     -- Exportación
                    MAX(day_import_kwh) as day_import_kwh      -- Importación
                FROM raw.fs_energy_daily_snapshot
                WHERE plant_code = $1
                GROUP BY DATE(ts_utc AT TIME ZONE 'America/Bogota')
            ),
            ultimo_dia AS (
                SELECT MAX(fecha) as max_date FROM daily_data
            ),
            params AS (
                SELECT
                    ud.max_date AS d_hoy,
                    date_trunc('month', ud.max_date)::date AS d_ini_mes,
                    date_trunc('year', ud.max_date)::date AS d_ini_year
                FROM ultimo_dia ud
            ),
            dia AS (
                SELECT * FROM daily_data, ultimo_dia
                WHERE fecha = ultimo_dia.max_date
            ),
            mtd AS (
                SELECT
                    SUM(day_gen_kwh) as gen_mes,
                    SUM(day_use_kwh) as consumo_mes,
                    SUM(day_self_use_kwh) as autoconsumo_mes,
                    SUM(day_export_kwh) as export_mes,
                    SUM(day_import_kwh) as import_mes
                FROM daily_data, params
                WHERE fecha >= d_ini_mes AND fecha <= d_hoy
            ),
            ytd AS (
                SELECT
                    SUM(day_gen_kwh) as gen_ytd,
                    SUM(day_use_kwh) as consumo_ytd,
                    SUM(day_self_use_kwh) as autoconsumo_ytd,
                    SUM(day_export_kwh) as export_ytd,
                    SUM(day_import_kwh) as import_ytd
                FROM daily_data, params
                WHERE fecha >= d_ini_year AND fecha <= d_hoy
            ),
            total AS (
                SELECT
                    SUM(day_gen_kwh) as gen_total,
                    SUM(day_self_use_kwh) as autoconsumo_total,
                    SUM(day_export_kwh) as export_total,
                    MIN(fecha) as start_date
                FROM daily_data
            ),
            realtime AS (
                SELECT power_kw, ts_utc
                FROM raw.fs_realtime_plants
                WHERE plant_code = $1
                ORDER BY ts_utc DESC LIMIT 1
            )
            SELECT
                -- Día
                COALESCE(d.day_gen_kwh, 0) as gen_today,
                COALESCE(d.day_use_kwh, 0) as consumo_today,
                COALESCE(d.day_self_use_kwh, 0) as autoconsumo_today,
                COALESCE(d.day_export_kwh, 0) as export_today,
                COALESCE(d.day_import_kwh, 0) as import_today,
                -- Mes
                COALESCE(m.gen_mes, 0) as gen_month,
                COALESCE(m.consumo_mes, 0) as consumo_month,
                COALESCE(m.autoconsumo_mes, 0) as autoconsumo_month,
                COALESCE(m.export_mes, 0) as export_month,
                COALESCE(m.import_mes, 0) as import_month,
                -- Año
                COALESCE(y.gen_ytd, 0) as gen_year,
                COALESCE(y.consumo_ytd, 0) as consumo_year,
                COALESCE(y.autoconsumo_ytd, 0) as autoconsumo_year,
                COALESCE(y.export_ytd, 0) as export_year,
                COALESCE(y.import_ytd, 0) as import_year,
                -- Total
                COALESCE(t.gen_total, 0) as gen_total,
                COALESCE(t.autoconsumo_total, 0) as autoconsumo_total,
                COALESCE(t.export_total, 0) as export_total,
                t.start_date,
                -- Realtime
                r.power_kw as current_power,
                r.ts_utc as last_seen
            FROM (SELECT 1) x
            LEFT JOIN dia d ON true
            LEFT JOIN mtd m ON true
            LEFT JOIN ytd y ON true
            LEFT JOIN total t ON true
            LEFT JOIN realtime r ON true
        `;

        const statsRes = await dbQuery(statsQuery, [id]);
        const stats = statsRes.rows[0] || {};

        // Datos de Inversión de la planta
        const invRes = await dbQuery(`
            SELECT
                inversion_cop,
                deduccion_50_cop,
                ahorro_impuestos_cop,
                inversion_neta_cop,
                depreciacion_anual_cop,
                ahorro_depreciacion_anual_cop,
                vida_util_acelerada
            FROM fs.inversiones_solar
            WHERE planta = $1
        `, [plant.plant_name]);
        const invData = invRes.rows[0] || {};

        // Saldo acumulado de Celsia para esta planta (último registro)
        const saldoCelsiaRes = await dbQuery(`
            SELECT "Saldo Acumulado (COP)" as saldo_celsia
            FROM fs."FacCelsia"
            WHERE "Planta" = $1
            ORDER BY "Año" DESC,
                CASE "Mes"
                    WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
                    WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
                    WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
                    WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
                END DESC
            LIMIT 1
        `, [plant.plant_name]);
        const saldoCelsia = parseFloat(saldoCelsiaRes.rows[0]?.saldo_celsia || 0);

        // Calcular ahorro acumulado (autoconsumo * tarifa + exportación * tarifa_export)
        const TARIFA_AUTOCONSUMO = 750; // $/kWh
        const TARIFA_EXPORTACION = 400; // $/kWh
        const autoconsumoTotal = parseFloat(stats.autoconsumo_total || 0);
        const exportTotal = parseFloat(stats.export_total || 0);
        const ahorroAutoconsumo = autoconsumoTotal * TARIFA_AUTOCONSUMO;
        const ingresoExportacion = exportTotal * TARIFA_EXPORTACION;
        const savingsTotal = ahorroAutoconsumo + ingresoExportacion;

        // Historial Mensual para Gráficas (desde fs.plant_daily_metrics)
        const historyRes = await dbQuery(`
            SELECT
                EXTRACT(YEAR FROM date) as year,
                EXTRACT(MONTH FROM date) as month,
                SUM(fv_yield_kwh) as generation,
                SUM(self_consumption_kwh) as autoconsumo,
                SUM(exported_energy_kwh) as exportacion,
                SUM(imported_energy_kwh) as importacion
            FROM fs.plant_daily_metrics
            WHERE plant_code = $1
            GROUP BY 1, 2
        `, [id]);

        // Procesar historial
        const historyMap = {};
        historyRes.rows.forEach(r => {
            const y = parseInt(r.year);
            if (!historyMap[y]) {
                historyMap[y] = {
                    year: y,
                    generation: 0,
                    autoconsumo: 0,
                    exportacion: 0,
                    importacion: 0,
                    months: Array(12).fill(null).map((_, i) => ({
                        month: i + 1,
                        name: getMonthName(i + 1),
                        generation: 0,
                        autoconsumo: 0,
                        exportacion: 0,
                        importacion: 0
                    }))
                };
            }
            historyMap[y].generation += parseFloat(r.generation || 0);
            historyMap[y].autoconsumo += parseFloat(r.autoconsumo || 0);
            historyMap[y].exportacion += parseFloat(r.exportacion || 0);
            historyMap[y].importacion += parseFloat(r.importacion || 0);

            const m = parseInt(r.month);
            if (m >= 1 && m <= 12) {
                historyMap[y].months[m - 1].generation = parseFloat(r.generation || 0);
                historyMap[y].months[m - 1].autoconsumo = parseFloat(r.autoconsumo || 0);
                historyMap[y].months[m - 1].exportacion = parseFloat(r.exportacion || 0);
                historyMap[y].months[m - 1].importacion = parseFloat(r.importacion || 0);
            }
        });

        res.json({
            info: {
                ...plant,
                start_date: stats.start_date,
                status: (new Date(stats.last_seen) > new Date(Date.now() - 60 * 60000)) ? 'Online' : 'Offline'
            },
            stats: {
                total_capacity: plant.capacity_kw,
                // Día
                generation_today: parseFloat(stats.gen_today || 0),
                consumo_today: parseFloat(stats.consumo_today || 0),
                autoconsumo_today: parseFloat(stats.autoconsumo_today || 0),
                export_today: parseFloat(stats.export_today || 0),
                import_today: parseFloat(stats.import_today || 0),
                // Mes
                generation_month: parseFloat(stats.gen_month || 0),
                consumo_month: parseFloat(stats.consumo_month || 0),
                autoconsumo_month: parseFloat(stats.autoconsumo_month || 0),
                export_month: parseFloat(stats.export_month || 0),
                import_month: parseFloat(stats.import_month || 0),
                // Año
                generation_year: parseFloat(stats.gen_year || 0),
                consumo_year: parseFloat(stats.consumo_year || 0),
                autoconsumo_year: parseFloat(stats.autoconsumo_year || 0),
                export_year: parseFloat(stats.export_year || 0),
                import_year: parseFloat(stats.import_year || 0),
                // Total
                generation_total: parseFloat(stats.gen_total || 0),
                autoconsumo_total: parseFloat(stats.autoconsumo_total || 0),
                export_total: parseFloat(stats.export_total || 0),
                // Realtime
                current_power: parseFloat(stats.current_power || 0)
            },
            history: Object.values(historyMap).sort((a, b) => b.year - a.year),
            financials: {
                investment: parseFloat(invData.inversion_cop || 0),
                deduccion_renta: parseFloat(invData.deduccion_50_cop || 0),
                ahorro_impuestos: parseFloat(invData.ahorro_impuestos_cop || 0),
                inversion_neta: parseFloat(invData.inversion_neta_cop || 0),
                depreciacion_anual: parseFloat(invData.depreciacion_anual_cop || 0),
                ahorro_depreciacion_anual: parseFloat(invData.ahorro_depreciacion_anual_cop || 0),
                vida_util: parseInt(invData.vida_util_acelerada || 5),
                savingsTotal: savingsTotal,
                ahorroAutoconsumo: ahorroAutoconsumo,
                ingresoExportacion: ingresoExportacion,
                saldoCelsia: saldoCelsia
            }
        });

    } catch (err) {
        console.error('Error fetching plant details:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener resumen de inversiones y métricas financieras consolidadas
export const getInvestmentSummary = async (req, res) => {
    try {
        // 1. Datos de Inversión
        const invQuery = `
            SELECT
                SUM(inversion_cop) as inversion_total,
                SUM(deduccion_50_cop) as deduccion_renta_total,
                SUM(ahorro_impuestos_cop) as ahorro_impuestos_total,
                SUM(inversion_neta_cop) as inversion_neta_total,
                SUM(depreciacion_anual_cop) as depreciacion_anual_total,
                SUM(ahorro_depreciacion_anual_cop) as ahorro_depreciacion_total,
                AVG(vida_util_acelerada) as vida_util_anos
            FROM fs.inversiones_solar
        `;
        const invRes = await dbQuery(invQuery);
        const inv = invRes.rows[0];

        // 2. Ahorro por Autoconsumo - Cruce mes a mes con tarifa real de Celsia
        // Suma autoconsumo mensual de raw.fs_energy_daily_snapshot × tarifa mensual de FacCelsia
        const autoQuery = `
            WITH daily_data AS (
                SELECT
                    plant_code,
                    DATE(ts_utc AT TIME ZONE 'America/Bogota') as fecha,
                    MAX(day_self_use_kwh) as day_self_use_kwh
                FROM raw.fs_energy_daily_snapshot
                GROUP BY plant_code, DATE(ts_utc AT TIME ZONE 'America/Bogota')
            ),
            autoconsumo_mensual AS (
                SELECT
                    EXTRACT(YEAR FROM fecha) as anio,
                    EXTRACT(MONTH FROM fecha) as mes_num,
                    SUM(day_self_use_kwh) as autoconsumo_kwh
                FROM daily_data
                GROUP BY EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha)
            ),
            tarifa_mensual AS (
                SELECT
                    "Año" as anio,
                    CASE "Mes"
                        WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
                        WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
                        WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
                        WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
                    END as mes_num,
                    AVG(
                        COALESCE("Generacion ($/kWh)", 0) +
                        COALESCE("Comercializacion ($/kWh)", 0) +
                        COALESCE("Transmision ($/kWh)", 0) +
                        COALESCE("Restricciones ($/kWh)", 0) +
                        COALESCE("Distribucion ($/kWh)", 0) +
                        COALESCE("Perdidas ($/kWh)", 0)
                    ) as tarifa
                FROM fs."FacCelsia"
                GROUP BY "Año", "Mes"
            )
            SELECT
                SUM(a.autoconsumo_kwh) as total_autoconsumo_kwh,
                SUM(a.autoconsumo_kwh * COALESCE(t.tarifa, 750)) as total_ahorro_autoconsumo
            FROM autoconsumo_mensual a
            LEFT JOIN tarifa_mensual t ON a.anio = t.anio AND a.mes_num = t.mes_num
        `;
        const autoRes = await dbQuery(autoQuery);
        const totalAutoconsumoKwh = parseFloat(autoRes.rows[0].total_autoconsumo_kwh || 0);
        const ahorroAutoconsumo = parseFloat(autoRes.rows[0].total_ahorro_autoconsumo || 0);

        // 3. Excedentes Facturados = Pagos históricos + Saldo pendiente actual
        // Detectamos pagos cuando el saldo cae >50% respecto al mes anterior
        const excedentesQuery = `
            WITH datos AS (
                SELECT "Planta", "Año", "Mes", "Saldo Acumulado (COP)" as saldo,
                       CASE "Mes" WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3 WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6 WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9 WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12 END as mes_num
                FROM fs."FacCelsia"
                WHERE "Saldo Acumulado (COP)" IS NOT NULL
            ),
            con_lag AS (
                SELECT *, LAG(saldo) OVER (PARTITION BY "Planta" ORDER BY "Año", mes_num) as saldo_anterior
                FROM datos
            ),
            pagos AS (
                SELECT SUM(saldo_anterior) as total_pagado
                FROM con_lag
                WHERE saldo < saldo_anterior * 0.5
            ),
            saldo_actual AS (
                SELECT SUM(saldo) as total_pendiente FROM (
                    SELECT DISTINCT ON ("Planta") saldo
                    FROM datos
                    ORDER BY "Planta", "Año" DESC, mes_num DESC
                ) sub
            ),
            ultimo_mes AS (
                SELECT "Año" as ultimo_anio, "Mes" as ultimo_mes
                FROM datos
                ORDER BY "Año" DESC, mes_num DESC
                LIMIT 1
            )
            SELECT
                COALESCE((SELECT total_pagado FROM pagos), 0) + COALESCE((SELECT total_pendiente FROM saldo_actual), 0) as total_excedentes,
                COALESCE((SELECT total_pendiente FROM saldo_actual), 0) as saldo_pendiente,
                (SELECT ultimo_mes FROM ultimo_mes) as ultimo_mes,
                (SELECT ultimo_anio FROM ultimo_mes) as ultimo_anio
        `;
        const excRes = await dbQuery(excedentesQuery);
        const totalExcedentes = parseFloat(excRes.rows[0].total_excedentes || 0);
        const saldoPendienteCelsia = parseFloat(excRes.rows[0].saldo_pendiente || 0);
        const ultimoMesCelsia = excRes.rows[0].ultimo_mes || '';
        const ultimoAnioCelsia = excRes.rows[0].ultimo_anio || '';

        // 4. Saldo y Pagos (Informativo)
        const pagosQuery = `SELECT SUM("TOTAL A PAGAR ($)") as total_pagado FROM fs."FacCelsia"`;
        const pagosRes = await dbQuery(pagosQuery);
        const totalPagado = parseFloat(pagosRes.rows[0].total_pagado || 0);

        // Saldo Actual: Último saldo reportado
        const saldoQuery = `
            SELECT SUM(saldo) as saldo_actual FROM (
                SELECT DISTINCT ON ("Planta") "Saldo Acumulado (COP)" as saldo
                FROM fs."FacCelsia"
                ORDER BY "Planta", "Año" DESC,
                    CASE "Mes"
                        WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
                        WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
                        WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
                        WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
                    END DESC
            ) sub
        `;
        const saldoRes = await dbQuery(saldoQuery);
        const saldoActual = parseFloat(saldoRes.rows[0].saldo_actual || 0);

        // 5. Cálculos Finales
        const inversionTotal = parseFloat(inv.inversion_total || 0);

        // Beneficios Tributarios (Ley 1715/2014)
        const FACTOR_RENTA = 0.175;  // 50% inv * 35% tarifa
        const FACTOR_DEPREC = 0.0835; // Escudo fiscal VP depreciación acelerada
        const beneficioRenta = inversionTotal * FACTOR_RENTA;
        const beneficioDeprec = inversionTotal * FACTOR_DEPREC;
        const beneficioTributarioTotal = beneficioRenta + beneficioDeprec;

        // Ingresos Totales = Ahorro Autoconsumo + Excedentes
        const ingresosOperativos = ahorroAutoconsumo + totalExcedentes;

        // Inversión Neta
        const inversionNetaConBeneficios = inversionTotal - beneficioTributarioTotal;
        const saldoNeto = inversionNetaConBeneficios - ingresosOperativos;

        // Meses de operación real
        const mesesQuery = `SELECT count(DISTINCT to_char(ts_utc AT TIME ZONE 'America/Bogota', 'YYYY-MM')) as meses FROM raw.fs_energy_daily_snapshot`;
        const mesesRes = await dbQuery(mesesQuery);
        const mesesOperacion = parseInt(mesesRes.rows[0].meses || 30);

        // ========== INDICADORES REALES (basados en operación histórica) ==========
        const ahorroPromedioMensualReal = mesesOperacion > 0 ? ingresosOperativos / mesesOperacion : 0;
        const ahorroAnualReal = ahorroPromedioMensualReal * 12;

        const paybackSinBenefReal = ahorroAnualReal > 0 ? inversionTotal / ahorroAnualReal : 0;
        const paybackConBenefReal = ahorroAnualReal > 0 ? inversionNetaConBeneficios / ahorroAnualReal : 0;
        const roiReal = inversionTotal > 0 ? ((ingresosOperativos + beneficioTributarioTotal) / inversionTotal) * 100 : 0;

        // ========== INDICADORES PROYECTADOS (Metodología Reporte Certificado) ==========
        // Capacidad total instalada
        const capQuery = `SELECT SUM(capacity_kw) as cap_total FROM dim.fs_plants`;
        const capRes = await dbQuery(capQuery);
        const capacidadTotalKw = parseFloat(capRes.rows[0].cap_total || 0);

        // === CONSTANTES MODELO CERTIFICADO ===
        const HORAS_SOL_ANUAL = 1500;       // Conservador (estándar Colombia)
        const TARIFA_AUTOCONSUMO = 750;     // $/kWh - tarifa completa evitada
        const TARIFA_EXCEDENTES = 400;      // $/kWh - valoración horaria promedio
        const PCT_AUTOCONSUMO = 0.60;       // 60% autoconsumo esperado
        const PCT_EXPORTACION = 0.40;       // 40% exportación

        // 1. Generación anual proyectada
        const generacionAnualProyectada = capacidadTotalKw * HORAS_SOL_ANUAL;

        // 2. Distribución de energía
        const autoconsumoAnualKwh = generacionAnualProyectada * PCT_AUTOCONSUMO;
        const exportacionAnualKwh = generacionAnualProyectada * PCT_EXPORTACION;

        // 3. Ahorro anual (valoración diferenciada)
        const ahorroAutoconsumoProyectado = autoconsumoAnualKwh * TARIFA_AUTOCONSUMO;
        const ingresoExportacionProyectado = exportacionAnualKwh * TARIFA_EXCEDENTES;
        const ahorroAnualProyectado = ahorroAutoconsumoProyectado + ingresoExportacionProyectado;

        // 4. Payback Proyectado
        const paybackSinBenefProy = ahorroAnualProyectado > 0 ? inversionTotal / ahorroAnualProyectado : 0;
        const paybackConBenefProy = ahorroAnualProyectado > 0 ? inversionNetaConBeneficios / ahorroAnualProyectado : 0;

        // ========== SALDO Y PROGRESO DE RECUPERACIÓN ==========
        // Total recuperado = Ingresos operativos + Beneficios tributarios
        const totalRecuperado = ingresosOperativos + beneficioTributarioTotal;
        const saldoPendiente = inversionTotal - totalRecuperado;
        const pctRecuperado = inversionTotal > 0 ? (totalRecuperado / inversionTotal) * 100 : 0;

        // ========== FECHA ESTIMADA DE PAYBACK ==========
        // Basado en promedio mensual histórico
        const mesesParaPayback = ahorroPromedioMensualReal > 0 ? saldoPendiente / ahorroPromedioMensualReal : 0;
        const fechaActual = new Date();
        const fechaPaybackEstimada = new Date(fechaActual);
        fechaPaybackEstimada.setMonth(fechaPaybackEstimada.getMonth() + Math.ceil(mesesParaPayback));
        const fechaPaybackStr = fechaPaybackEstimada.toISOString().substring(0, 7); // YYYY-MM

        // ========== EBITDA AÑO ACTUAL ==========
        // Obtener ingresos del año actual (no histórico total)
        const anioActual = new Date().getFullYear();
        const ebitdaQuery = `
            WITH ingresos_anio AS (
                SELECT
                    COALESCE(SUM(ABS("Creditos de energia Subtotal COP") + ABS("Valoracion horaria Subtotal COP")), 0) as excedentes_anio
                FROM fs."FacCelsia"
                WHERE "Año" = $1
            ),
            autoconsumo_anio AS (
                SELECT
                    COALESCE(SUM(day_self_use_kwh), 0) as kwh_anio
                FROM (
                    SELECT
                        plant_code,
                        DATE(ts_utc AT TIME ZONE 'America/Bogota') as fecha,
                        MAX(day_self_use_kwh) as day_self_use_kwh
                    FROM raw.fs_energy_daily_snapshot
                    WHERE EXTRACT(YEAR FROM ts_utc AT TIME ZONE 'America/Bogota') = $1
                    GROUP BY plant_code, DATE(ts_utc AT TIME ZONE 'America/Bogota')
                ) daily
            )
            SELECT
                excedentes_anio,
                kwh_anio,
                (kwh_anio * 750) as ahorro_autoconsumo_anio
            FROM ingresos_anio, autoconsumo_anio
        `;
        const ebitdaRes = await dbQuery(ebitdaQuery, [anioActual]);
        const excedentesAnio = parseFloat(ebitdaRes.rows[0]?.excedentes_anio || 0);
        const ahorroAutoconsumoAnio = parseFloat(ebitdaRes.rows[0]?.ahorro_autoconsumo_anio || 0);
        const ingresosAnioActual = excedentesAnio + ahorroAutoconsumoAnio;
        const ebitdaAnioActual = ingresosAnioActual * 0.95; // 95% margen operativo

        res.json({
            inversion: {
                total: inversionTotal,
                neta: inversionNetaConBeneficios
            },
            ingresos: {
                cobros_celsia: totalExcedentes,
                saldo_por_cobrar: saldoPendienteCelsia,
                ultimo_mes_celsia: ultimoMesCelsia,
                ultimo_anio_celsia: ultimoAnioCelsia,
                ahorro_autoconsumo: ahorroAutoconsumo,
                total_operativo: ingresosOperativos,
                kwh_autoconsumo: totalAutoconsumoKwh
            },
            gastos: {
                pagado_celsia: totalPagado
            },
            saldos: {
                pendiente_celsia: saldoActual,
                meses_operacion: mesesOperacion
            },
            // ========== NUEVO: Progreso de Recuperación ==========
            recuperacion: {
                total_recuperado: Math.round(totalRecuperado),
                saldo_pendiente: Math.round(saldoPendiente),
                pct_recuperado: Math.round(pctRecuperado * 10) / 10,
                meses_restantes: Math.ceil(mesesParaPayback),
                fecha_payback_estimada: fechaPaybackStr
            },
            // ========== NUEVO: EBITDA Año Actual ==========
            ebitda: {
                anio: anioActual,
                ingresos_anio: Math.round(ingresosAnioActual),
                ebitda_anio: Math.round(ebitdaAnioActual),
                margen: 95
            },
            beneficios_tributarios: {
                total: beneficioTributarioTotal,
                ahorro_renta_50: beneficioRenta,
                ahorro_depreciacion_5anos: beneficioDeprec
            },
            indicadores_reales: {
                ahorro_anual: Math.round(ahorroAnualReal),
                ahorro_mensual_promedio: Math.round(ahorroPromedioMensualReal),
                payback_sin_beneficios: Math.round(paybackSinBenefReal * 10) / 10,
                payback_con_beneficios: Math.round(paybackConBenefReal * 10) / 10,
                roi_porcentaje: Math.round(roiReal * 10) / 10
            },
            indicadores_proyectados: {
                generacion_anual_kwh: Math.round(generacionAnualProyectada),
                autoconsumo_anual_kwh: Math.round(autoconsumoAnualKwh),
                exportacion_anual_kwh: Math.round(exportacionAnualKwh),
                ahorro_autoconsumo: Math.round(ahorroAutoconsumoProyectado),
                ingreso_exportacion: Math.round(ingresoExportacionProyectado),
                ahorro_anual: Math.round(ahorroAnualProyectado),
                payback_sin_beneficios: Math.round(paybackSinBenefProy * 10) / 10,
                payback_con_beneficios: Math.round(paybackConBenefProy * 10) / 10,
                modelo: {
                    horas_sol_anual: HORAS_SOL_ANUAL,
                    tarifa_autoconsumo: TARIFA_AUTOCONSUMO,
                    tarifa_excedentes: TARIFA_EXCEDENTES,
                    pct_autoconsumo: PCT_AUTOCONSUMO * 100,
                    pct_exportacion: PCT_EXPORTACION * 100
                }
            }
        });

    } catch (err) {
        console.error('Error fetching investment summary:', err);
        res.status(500).json({ error: 'Error obteniendo resumen de inversiones' });
    }
};

// Obtener historia consolidada financiera (para gráficas globales)
export const getFinancialHistory = async (req, res) => {
    try {
        // 1. Consulta de facturación real (ETL Celsia)
        const invoiceQuery = `
             SELECT 
                "Planta" as plant_name,
                "Año" as year,
                "Mes" as month_name,
                
                -- Totales Básicos
                SUM(COALESCE("Tu consumo mes (kwh)", 0)) as total_consumption_kwh,
                SUM(COALESCE("Consumo importando Energia (kWh)", 0)) as grid_import_kwh,
                AVG(COALESCE("Consumo importado tarifa (COP)", 0)) as tariff_rate,
                
                -- Pagos Reales (Salidas de Caja)
                SUM(COALESCE("TOTAL A PAGAR ($)", 0)) as pay_real_total,
                SUM(COALESCE("TOTAL CELSIA (COP)", 0)) as pay_real_energy,
                
                -- Créditos Generados (Entradas Virtuales Brutas)
                SUM(
                    ABS(COALESCE("Creditos de energia Subtotal COP", 0)) + 
                    ABS(COALESCE("Valoracion horaria Subtotal COP", 0))
                ) as income_surplus,
                
                -- Saldo acumulado (Snapshot final del periodo)
                MAX(COALESCE("Saldo Acumulado (COP)", 0)) as balance_cumulative,
                
                -- Otros Cargos (Pass-through)
                SUM(
                    COALESCE("OTRAS ENTIDADES ($)", 0) + 
                    COALESCE("Alumbrado ($)", 0) + 
                    COALESCE("Aseo ($)", 0) + 
                    COALESCE("Otros ($)", 0)
                ) as other_charges

            FROM fs."FacCelsia"
            WHERE "Año" >= 2023
            GROUP BY "Planta", "Año", "Mes"
            ORDER BY "Año" ASC, "Mes" ASC
        `;

        // 2. Consulta de autoconsumo desde raw.fs_energy_daily_snapshot (datos reales FusionSolar)
        const autoconsumoQuery = `
            WITH daily_data AS (
                SELECT
                    e.plant_code,
                    DATE(e.ts_utc AT TIME ZONE 'America/Bogota') as fecha,
                    MAX(e.day_self_use_kwh) as day_self_use_kwh
                FROM raw.fs_energy_daily_snapshot e
                WHERE EXTRACT(YEAR FROM e.ts_utc AT TIME ZONE 'America/Bogota') >= 2023
                GROUP BY e.plant_code, DATE(e.ts_utc AT TIME ZONE 'America/Bogota')
            )
            SELECT
                fp.plant_name,
                EXTRACT(YEAR FROM d.fecha)::INTEGER as year,
                EXTRACT(MONTH FROM d.fecha)::INTEGER as month_num,
                SUM(COALESCE(d.day_self_use_kwh, 0)) as autoconsumo_kwh
            FROM daily_data d
            JOIN dim.fs_plants fp ON d.plant_code = fp.plant_code
            GROUP BY fp.plant_name, EXTRACT(YEAR FROM d.fecha), EXTRACT(MONTH FROM d.fecha)
        `;

        // Precio promedio por kWh para valorar autoconsumo (basado en tarifa Celsia histórica)
        const PRECIO_AUTOCONSUMO = 757; // COP/kWh promedio

        const [invoiceResult, autoconsumoResult] = await Promise.all([
            dbQuery(invoiceQuery),
            dbQuery(autoconsumoQuery)
        ]);

        // Crear mapa de autoconsumo por planta/año/mes
        const autoconsumoMap = {};
        autoconsumoResult.rows.forEach(row => {
            const key = `${row.plant_name}-${row.year}-${row.month_num}`;
            autoconsumoMap[key] = parseFloat(row.autoconsumo_kwh || 0);
        });

        // Post-procesamiento
        const monthMap = {
            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
            'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
        };

        const sortedRows = invoiceResult.rows.map(row => {
            // Obtener número de mes
            const monthNum = monthMap[row.month_name] || 0;

            // Buscar autoconsumo real desde plant_daily_metrics
            const autoconsumoKey = `${row.plant_name}-${row.year}-${monthNum}`;
            const autoconsumoKwhReal = autoconsumoMap[autoconsumoKey] || 0;

            // Conversión a números
            const excedentesDinero = parseFloat(row.income_surplus || 0);
            const pagoRealTotal = parseFloat(row.pay_real_total || 0);
            const otrosCargos = parseFloat(row.other_charges || 0);

            // 1. Ahorro por Autoconsumo: kWh autoconsumidos * Precio promedio
            const ahorroAutoconsumo = autoconsumoKwhReal * PRECIO_AUTOCONSUMO;

            // 2. Ingreso por Excedentes (Créditos de Celsia) - Ya viene de la factura

            // 3. Ahorro REAL Total = Ahorro Autoconsumo + Ingresos Excedentes
            const ahorroReal = ahorroAutoconsumo + excedentesDinero;

            // 4. Para calcular "Sin Solar", usamos: Pagado + Ahorro Real
            const costoConSolar = pagoRealTotal;
            const costoSinSolar = pagoRealTotal + ahorroReal;

            return {
                ...row,
                month_num: monthNum,

                // Campos principales para gráficas
                ahorro: ahorroReal,
                sinSolar: costoSinSolar,
                conSolar: costoConSolar,

                // Desgloses detallados
                ahorro_autoconsumo: ahorroAutoconsumo,
                autoconsumo_kwh: autoconsumoKwhReal,
                ingreso_excedentes: excedentesDinero,
                saldo_acumulado: parseFloat(row.balance_cumulative || 0),
                otros_cargos: otrosCargos
            };
        }).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month_num - b.month_num;
        });

        res.json(sortedRows);

    } catch (err) {
        console.error('Error fetching financial history from FacCelsia:', err);
        // Fallback a la tabla de métricas si falla FacCelsia (por si no está llena aún)
        try {
            const fallbackQuery = `
                SELECT 
                    EXTRACT(YEAR FROM date) as year,
                    EXTRACT(MONTH FROM date) as month,
                    SUM(fv_yield_kwh) as total_generation
                FROM fs.plant_daily_metrics
                GROUP BY 1, 2
                ORDER BY 1 ASC, 2 ASC
            `;
            const fbResult = await dbQuery(fallbackQuery);
            res.json(fbResult.rows.map(r => ({ ...r, source: 'metrics_fallback' })));
        } catch (e) {
            res.status(500).json({ error: 'Error crítico obteniendo historia' });
        }
    }
};

// Obtener historia de generación consolidada (para gráfica del Dashboard)
// Fuente: raw.fs_energy_daily_snapshot (datos reales de FusionSolar API)
export const getGenerationHistory = async (req, res) => {
    try {
        // Histórico completo desde snapshot raw (datos reales de FusionSolar)
        const query = `
            WITH daily_data AS (
                SELECT
                    plant_code,
                    DATE(ts_utc AT TIME ZONE 'America/Bogota') as fecha,
                    MAX(day_gen_kwh) as day_gen_kwh
                FROM raw.fs_energy_daily_snapshot
                GROUP BY plant_code, DATE(ts_utc AT TIME ZONE 'America/Bogota')
            )
            SELECT
                EXTRACT(YEAR FROM fecha)::int as year,
                EXTRACT(MONTH FROM fecha)::int as month,
                SUM(day_gen_kwh) as generation
            FROM daily_data
            GROUP BY 1, 2
            ORDER BY 1, 2
        `;
        const result = await dbQuery(query);

        // Obtener capacidad total y parámetros de referencia
        const capQuery = `SELECT SUM(capacity_kw) as total_kwp FROM dim.fs_plants`;
        const capRes = await dbQuery(capQuery);
        const totalKwp = parseFloat(capRes.rows[0].total_kwp || 620);

        // Parámetros de referencia (igual que n8n)
        const HPS_REF = 4.0;
        const PR_REF = 0.90;

        // Días por mes (promedio)
        const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // Formatear para Recharts: [{ month: 1, monthName: 'Enero', year2023: X, ... }, ...]
        const monthsData = Array(12).fill(0).map((_, i) => ({
            month: i + 1,
            monthName: getMonthName(i + 1),
            year2022: 0,
            year2023: 0,
            year2024: 0,
            year2025: 0,
            year2026: 0,
            // Meta mensual: kWp × HPS × PR × días del mes
            metaMensual: Math.round(totalKwp * HPS_REF * PR_REF * diasPorMes[i])
        }));

        // Procesar resultados
        result.rows.forEach(row => {
            const y = parseInt(row.year);
            const m = parseInt(row.month);
            const val = parseFloat(row.generation || 0);

            if (m >= 1 && m <= 12) {
                const monthIndex = m - 1;
                if (y === 2022) monthsData[monthIndex].year2022 = Math.round(val);
                if (y === 2023) monthsData[monthIndex].year2023 = Math.round(val);
                if (y === 2024) monthsData[monthIndex].year2024 = Math.round(val);
                if (y === 2025) monthsData[monthIndex].year2025 = Math.round(val);
                if (y === 2026) monthsData[monthIndex].year2026 = Math.round(val);
            }
        });

        res.json({
            data: monthsData,
            parametros: {
                totalKwp: Math.round(totalKwp),
                hpsRef: HPS_REF,
                prRef: PR_REF,
                // Meta diaria: kWp × HPS × PR
                metaDiaria: Math.round(totalKwp * HPS_REF * PR_REF),
                // Meta mensual promedio (30 días)
                metaMensual: Math.round(totalKwp * HPS_REF * PR_REF * 30)
            }
        });

    } catch (err) {
        console.error('Error fetching generation history:', err);
        res.status(500).json({ error: 'Error obteniendo historia de generación' });
    }
};

// Obtener distribución de energía (Autoconsumo vs Exportación)
// Fuente: raw.fs_energy_daily_snapshot (datos reales de FusionSolar API)
export const getEnergyDistribution = async (req, res) => {
    try {
        const query = `
            WITH daily_data AS (
                SELECT
                    plant_code,
                    DATE(ts_utc AT TIME ZONE 'America/Bogota') as fecha,
                    MAX(day_gen_kwh) as day_gen_kwh,
                    MAX(day_self_use_kwh) as day_self_use_kwh,
                    MAX(day_export_kwh) as day_export_kwh
                FROM raw.fs_energy_daily_snapshot
                GROUP BY plant_code, DATE(ts_utc AT TIME ZONE 'America/Bogota')
            )
            SELECT
                EXTRACT(YEAR FROM fecha)::int as year,
                EXTRACT(MONTH FROM fecha)::int as month,
                SUM(day_self_use_kwh) as autoconsumo_kwh,
                SUM(day_export_kwh) as exportacion_kwh,
                SUM(day_gen_kwh) as generacion_total_kwh
            FROM daily_data
            GROUP BY 1, 2
            ORDER BY 1, 2
        `;
        const result = await dbQuery(query);

        // Formatear para Recharts: array mensual con valores
        const data = result.rows.map(row => {
            const autoconsumo = parseFloat(row.autoconsumo_kwh || 0);
            const exportacion = parseFloat(row.exportacion_kwh || 0);
            const total = parseFloat(row.generacion_total_kwh || 0);

            return {
                periodo: `${getMonthName(row.month).substring(0, 3)} ${String(row.year).slice(-2)}`,
                year: row.year,
                month: row.month,
                autoconsumo: Math.round(autoconsumo),
                exportacion: Math.round(exportacion),
                total: Math.round(total),
                pctAutoconsumo: total > 0 ? Math.round((autoconsumo / total) * 100) : 0,
                pctExportacion: total > 0 ? Math.round((exportacion / total) * 100) : 0
            };
        });

        // Calcular resumen por año
        const resumenAnual = {};
        result.rows.forEach(row => {
            const y = row.year;
            if (!resumenAnual[y]) {
                resumenAnual[y] = { autoconsumo: 0, exportacion: 0, total: 0 };
            }
            resumenAnual[y].autoconsumo += parseFloat(row.autoconsumo_kwh || 0);
            resumenAnual[y].exportacion += parseFloat(row.exportacion_kwh || 0);
            resumenAnual[y].total += parseFloat(row.generacion_total_kwh || 0);
        });

        const resumen = Object.keys(resumenAnual).map(year => ({
            year: parseInt(year),
            autoconsumo: Math.round(resumenAnual[year].autoconsumo),
            exportacion: Math.round(resumenAnual[year].exportacion),
            pctAutoconsumo: resumenAnual[year].total > 0
                ? (resumenAnual[year].autoconsumo / resumenAnual[year].total * 100).toFixed(1)
                : 0,
            pctExportacion: resumenAnual[year].total > 0
                ? (resumenAnual[year].exportacion / resumenAnual[year].total * 100).toFixed(1)
                : 0
        }));

        res.json({ data, resumen });

    } catch (err) {
        console.error('Error fetching energy distribution:', err);
        res.status(500).json({ error: 'Error obteniendo distribución de energía' });
    }
};

// Obtener facturas del comercializador (Celsia)
// Fuente: fs.FacCelsia
export const getFacturas = async (req, res) => {
    try {
        const { year, plant } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (year && year !== 'all') {
            params.push(parseInt(year));
            whereClause += ` AND "Año" = $${params.length}`;
        }

        if (plant && plant !== 'all') {
            params.push(plant);
            whereClause += ` AND "Planta" = $${params.length}`;
        }

        const query = `
            SELECT
                "Planta" as planta,
                "Codigo" as codigo,
                "Año" as anio,
                "Mes" as mes,
                CASE "Mes"
                    WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
                    WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
                    WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
                    WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
                END as mes_num,
                "Fecha inicial" as fecha_inicial,
                "Fecha final" as fecha_final,
                COALESCE("Tu consumo mes (kwh)", 0) as consumo_mes,
                COALESCE("Consumo importando Energia (kWh)", 0) as consumo_importado_kwh,
                COALESCE("Consumo importado tarifa (COP)", 0) as consumo_importado_precio,
                COALESCE("Consumo importado Subtotal COP", 0) as consumo_importado_total,
                COALESCE("Creditos de energia Energia (kWh)", 0) as credito_energia_kwh,
                COALESCE("Creditos de energia Tarifa (COP)", 0) as credito_energia_precio,
                COALESCE("Creditos de energia Subtotal COP", 0) as credito_energia_total,
                COALESCE("Valoracion horaria Energia (kWh)", 0) as valoracion_horaria_kwh,
                COALESCE("Valoracion horaria Tarifa(COP)", 0) as valoracion_horaria_precio,
                COALESCE("Valoracion horaria Subtotal COP", 0) as valoracion_horaria_total,
                COALESCE("Total Excedentes (kWh)", 0) as total_excedentes_kwh,
                COALESCE("Tarifa aplicada ($/kwh)", 0) as tarifa_aplicada,
                COALESCE("OTRAS ENTIDADES ($)", 0) as otras_entidades,
                COALESCE("SALDO ANTERIOR ($)", 0) as saldo_anterior,
                COALESCE("Saldo Acumulado (COP)", 0) as saldo_acumulado
            FROM fs."FacCelsia"
            ${whereClause}
            ORDER BY "Año" DESC,
                CASE "Mes"
                    WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
                    WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
                    WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
                    WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
                END DESC
        `;

        const result = await dbQuery(query, params);

        // Calcular ahorro por factura (estimado sin solar vs con solar)
        const facturas = result.rows.map((row, idx) => {
            const tarifaCompleta = parseFloat(row.tarifa_aplicada) || 750;
            const consumoTotal = parseFloat(row.consumo_mes) || 0;
            const sinSolar = Math.round(consumoTotal * tarifaCompleta);
            const conSolar = parseFloat(row.total_pagar) || 0;
            const ahorro = sinSolar - conSolar;

            return {
                id: idx + 1,
                planta: row.planta,
                codigo: row.codigo,
                periodo: `${row.mes} ${row.anio}`,
                anio: row.anio,
                mes: row.mes,
                mesNum: row.mes_num,
                fechaInicial: row.fecha_inicial,
                fechaFinal: row.fecha_final,
                consumoMes: parseFloat(row.consumo_mes),
                consumoImportadoKwh: parseFloat(row.consumo_importado_kwh),
                consumoImportadoPrecio: parseFloat(row.consumo_importado_precio),
                consumoImportadoTotal: parseFloat(row.consumo_importado_total),
                creditoEnergiaKwh: parseFloat(row.credito_energia_kwh),
                creditoEnergiaPrecio: parseFloat(row.credito_energia_precio),
                creditoEnergiaTotal: parseFloat(row.credito_energia_total),
                valoracionHorariaKwh: parseFloat(row.valoracion_horaria_kwh),
                valoracionHorariaPrecio: parseFloat(row.valoracion_horaria_precio),
                valoracionHorariaTotal: parseFloat(row.valoracion_horaria_total),
                totalExcedentesKwh: parseFloat(row.total_excedentes_kwh),
                tarifaAplicada: parseFloat(row.tarifa_aplicada) || tarifaCompleta,
                otrasEntidades: parseFloat(row.otras_entidades),
                saldoAnterior: parseFloat(row.saldo_anterior),
                saldoAcumulado: parseFloat(row.saldo_acumulado),
                totalCelsia: parseFloat(row.consumo_importado_total) - parseFloat(row.credito_energia_total) - parseFloat(row.valoracion_horaria_total),
                totalPagar: parseFloat(row.consumo_importado_total) - parseFloat(row.credito_energia_total) - parseFloat(row.valoracion_horaria_total) + parseFloat(row.otras_entidades),
                sinSolar,
                conSolar: Math.round(conSolar),
                ahorro
            };
        });

        // Calcular totales
        const totals = facturas.reduce((acc, f) => ({
            consumo: acc.consumo + f.consumoMes,
            importacion: acc.importacion + f.consumoImportadoKwh,
            credito: acc.credito + f.creditoEnergiaKwh,
            totalCelsia: acc.totalCelsia + f.totalCelsia,
            totalPagar: acc.totalPagar + f.totalPagar,
            ahorro: acc.ahorro + f.ahorro,
            sinSolar: acc.sinSolar + f.sinSolar
        }), { consumo: 0, importacion: 0, credito: 0, totalCelsia: 0, totalPagar: 0, ahorro: 0, sinSolar: 0 });

        // Saldo acumulado actual (último de cada planta)
        const saldoQuery = `
            SELECT SUM(saldo) as saldo_total FROM (
                SELECT DISTINCT ON ("Planta") "Saldo Acumulado (COP)" as saldo
                FROM fs."FacCelsia"
                ORDER BY "Planta", "Año" DESC,
                    CASE "Mes"
                        WHEN 'Enero' THEN 1 WHEN 'Febrero' THEN 2 WHEN 'Marzo' THEN 3
                        WHEN 'Abril' THEN 4 WHEN 'Mayo' THEN 5 WHEN 'Junio' THEN 6
                        WHEN 'Julio' THEN 7 WHEN 'Agosto' THEN 8 WHEN 'Septiembre' THEN 9
                        WHEN 'Octubre' THEN 10 WHEN 'Noviembre' THEN 11 WHEN 'Diciembre' THEN 12
                    END DESC
            ) sub
        `;
        const saldoRes = await dbQuery(saldoQuery);
        const saldoAcumuladoTotal = parseFloat(saldoRes.rows[0]?.saldo_total || 0);

        // Plantas disponibles para filtro
        const plantasQuery = `SELECT DISTINCT "Planta" as planta FROM fs."FacCelsia" ORDER BY "Planta"`;
        const plantasRes = await dbQuery(plantasQuery);
        const plantas = plantasRes.rows.map(r => r.planta);

        // Años disponibles
        const aniosQuery = `SELECT DISTINCT "Año" as anio FROM fs."FacCelsia" ORDER BY "Año" DESC`;
        const aniosRes = await dbQuery(aniosQuery);
        const anios = aniosRes.rows.map(r => r.anio);

        res.json({
            facturas,
            totals: {
                ...totals,
                pctAhorro: totals.sinSolar > 0 ? Math.round(totals.ahorro / totals.sinSolar * 100) : 0
            },
            saldoAcumuladoTotal,
            plantas,
            anios
        });

    } catch (err) {
        console.error('Error fetching facturas:', err);
        res.status(500).json({ error: 'Error obteniendo facturas' });
    }
};

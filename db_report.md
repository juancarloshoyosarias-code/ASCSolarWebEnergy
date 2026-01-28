# Reporte de Base de Datos

Encontradas 17 tablas.

### "dim"."fs_plants"
- **Registros:** 6
- **Columnas:** `plant_code` (*text*), `plant_name` (*text*), `capacity_kw` (*numeric*), `pr_target` (*numeric*), `hps_reference` (*numeric*)

### "fs"."FacCelsia"
- **Registros:** 193
- **Columnas:** `id` (*integer*), `Planta` (*character varying*), `Mes` (*character varying*), `Año` (*integer*), `Codigo` (*character varying*), `Fecha inicial` (*date*), `Fecha final` (*date*), `Tarifa aplicada ($/kwh)` (*numeric*), `Tu consumo mes (kwh)` (*numeric*), `Consumo importando Energia (kWh)` (*numeric*), `Consumo importado tarifa (COP)` (*numeric*), `Consumo importado Subtotal COP` (*numeric*), `Creditos de energia Energia (kWh)` (*numeric*), `Creditos de energia Tarifa (COP)` (*numeric*), `Creditos de energia Subtotal COP` (*numeric*), `Valoracion horaria Energia (kWh)` (*numeric*), `Valoracion horaria Tarifa(COP)` (*numeric*), `Valoracion horaria Subtotal COP` (*numeric*), `Total Excedentes (kWh)` (*numeric*), `Saldo Acumulado (COP)` (*numeric*), `OTRAS ENTIDADES ($)` (*numeric*), `SALDO ANTERIOR ($)` (*numeric*), `TOTAL CELSIA (COP)` (*numeric*), `TOTAL A PAGAR ($)` (*numeric*), `Generacion ($/kWh)` (*numeric*), `Comercializacion ($/kWh)` (*numeric*), `Transmision ($/kWh)` (*numeric*), `Restricciones ($/kWh)` (*numeric*), `Distribucion ($/kWh)` (*numeric*), `Perdidas ($/kWh)` (*numeric*), `Alumbrado ($)` (*numeric*), `Aseo ($)` (*numeric*), `Otros ($)` (*numeric*)

### "fs"."amortizacion_solar"
- **Registros:** 138
- **Columnas:** `id` (*integer*), `planta` (*character varying*), `periodo` (*character varying*), `fecha` (*date*), `tipo_movimiento` (*character varying*), `monto_cop` (*numeric*), `saldo_pendiente_cop` (*numeric*), `descripcion` (*text*), `created_at` (*timestamp without time zone*)

### "fs"."analisis_solar_mensual"
- **Registros:** 186
- **Columnas:** `id` (*integer*), `planta` (*character varying*), `mes` (*character varying*), `anio` (*integer*), `fecha_inicial` (*date*), `fecha_final` (*date*), `consumo_factura_kwh` (*numeric*), `tarifa_aplicada` (*numeric*), `consumo_importado_kwh` (*numeric*), `consumo_importado_tarifa` (*numeric*), `valoracion_horaria_kwh` (*numeric*), `valoracion_horaria_tarifa` (*numeric*), `total_excedentes_kwh` (*numeric*), `comercializacion_tarifa` (*numeric*), `total_celsia_cop` (*numeric*), `otras_entidades_cop` (*numeric*), `saldo_anterior_cop` (*numeric*), `total_pagar_cop` (*numeric*), `produccion_solar_kwh` (*numeric*), `autoconsumo_kwh` (*numeric*), `energia_exportada_kwh` (*numeric*), `dias_con_datos` (*integer*), `ahorro_autoconsumo_cop` (*numeric*), `valor_excedentes_bruto_cop` (*numeric*), `descuento_comercializacion_cop` (*numeric*), `valor_excedentes_neto_cop` (*numeric*), `ahorro_total_cop` (*numeric*), `costo_sin_paneles_cop` (*numeric*), `inversion_cop` (*numeric*), `capacidad_kw` (*numeric*), `created_at` (*timestamp without time zone*), `updated_at` (*timestamp without time zone*), `excedentes_celsia_kwh` (*numeric*), `excedentes_fusion_kwh` (*numeric*), `desviacion_kwh` (*numeric*), `desviacion_pct` (*numeric*), `saldo_acumulado_celsia_cop` (*numeric*), `valoracion_subtotal_cop` (*numeric*)

### "fs"."energy_reading_v2"
- **Registros:** 0
- **Columnas:** `ts` (*timestamp with time zone*), `plant_id` (*integer*), `metric_code` (*text*), `granularity` (*character*), `value_kwh` (*numeric*), `source` (*text*), `load_id` (*uuid*)

### "fs"."inversiones_solar"
- **Registros:** 6
- **Columnas:** `id` (*integer*), `planta` (*character varying*), `inversion_cop` (*numeric*), `capacidad_kw` (*numeric*), `costo_por_kw` (*numeric*), `fecha_inicio` (*date*), `created_at` (*timestamp without time zone*), `deduccion_50_cop` (*numeric*), `ahorro_impuestos_cop` (*numeric*), `inversion_neta_cop` (*numeric*), `depreciacion_anual_cop` (*numeric*), `ahorro_depreciacion_anual_cop` (*numeric*), `vida_util_acelerada` (*integer*)

### "fs"."metric"
- **Registros:** 5
- **Columnas:** `metric_code` (*text*), `descripcion` (*text*)

### "fs"."plant"
- **Registros:** 6
- **Columnas:** `plant_id` (*integer*), `nombre` (*text*), `kwp` (*numeric*), `tz` (*text*)

### "fs"."plant_alias"
- **Registros:** 6
- **Columnas:** `alias` (*text*), `plant_id` (*integer*)

### "fs"."plant_daily_metrics"
- **Registros:** 5160
- **Columnas:** `id` (*integer*), `plant_id` (*integer*), `plant_code` (*text*), `date` (*date*), `fv_yield_kwh` (*numeric*), `inverter_yield_kwh` (*numeric*), `cumulative_energy_kwh` (*numeric*), `specific_yield_kwh_kwp` (*numeric*), `consumption_kwh` (*numeric*), `self_consumption_kwh` (*numeric*), `exported_energy_kwh` (*numeric*), `imported_energy_kwh` (*numeric*), `max_power_kw` (*numeric*), `co2_avoided_t` (*numeric*), `source` (*text*), `created_at` (*timestamp with time zone*), `updated_at` (*timestamp with time zone*)

### "public"."hps_std_param"
- **Registros:** 1
- **Columnas:** `id` (*integer*), `hps_value` (*numeric*), `updated_at` (*timestamp with time zone*)

### "raw"."fs_energy_daily_snapshot"
- **Registros:** 154158
- **Columnas:** `ts_utc` (*timestamp with time zone*), `plant_code` (*text*), `day_gen_kwh` (*numeric*), `day_use_kwh` (*numeric*), `day_export_kwh` (*numeric*), `day_self_use_kwh` (*numeric*), `day_import_kwh` (*numeric*)

### "raw"."fs_history_power"
- **Registros:** 0
- **Columnas:** `plant_id` (*text*), `ts` (*timestamp with time zone*), `power_w` (*double precision*), `energy_wh` (*double precision*), `payload` (*jsonb*)

### "raw"."fs_meter_energy_daily"
- **Registros:** 0
- **Columnas:** `ts_date` (*date*), `plant_code` (*text*), `day_use_kwh` (*numeric*), `day_grid_kwh` (*numeric*), `autoconsumo_kwh` (*numeric*), `import_kwh` (*numeric*)

### "raw"."fs_plants_daily_last"
- **Registros:** 324
- **Columnas:** `plant_code` (*text*), `d_utc` (*date*), `plant_name` (*text*), `gen_kwh` (*numeric*), `export_kwh` (*numeric*), `consumption_kwh` (*numeric*), `autoconsumo_kwh` (*numeric*), `import_kwh` (*numeric*), `updated_utc` (*timestamp with time zone*)

### "raw"."fs_plants_last"
- **Registros:** 6
- **Columnas:** `plant_code` (*text*), `updated_utc` (*timestamp with time zone*), `plant_name` (*text*), `power_kw` (*numeric*), `day_power_kwh` (*numeric*), `month_power_kwh` (*numeric*), `total_power_kwh` (*numeric*), `health` (*integer*)

### "raw"."fs_realtime_plants"
- **Registros:** 163954
- **Columnas:** `ts_utc` (*timestamp with time zone*), `plant_code` (*text*), `plant_name` (*text*), `power_kw` (*numeric*), `day_power_kwh` (*numeric*), `month_power_kwh` (*numeric*), `total_power_kwh` (*numeric*), `health` (*integer*)


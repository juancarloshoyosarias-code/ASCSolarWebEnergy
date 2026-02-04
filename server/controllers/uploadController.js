import { query as dbQuery } from '../config/db.js';
import pdfParse from 'pdf-parse';

// Mapa de códigos a nombres de plantas
const MAPA_PLANTA = {
    "1165450000": "Maracaibo",
    "5497410000": "Pozo 2",
    "6497410000": "Pozo 1",
    "4806050000": "Porvenir",
    "1056060000": "Cabañita",
    "2036110000": "Casa Trejo",
};

// Helper para parsear números
function num(s) {
    if (!s) return 0;
    let x = s.replace(/[\s.]/g, "");
    x = x.replace(/,(\d{2})$/, ".$1");
    const v = parseFloat(x.replace(/[^0-9.-]/g, ""));
    return isNaN(v) ? 0 : v;
}

// Helper para encontrar patrones
function find(text, re) {
    const m = text.match(re);
    return m ? (m[1] || m[0]).trim() : "";
}

// Extraer datos de la factura PDF (lógica igual que n8n)
function extractFacturaData(text) {
    const t = text || "";

    // ENCABEZADO
    const mesStr = find(t, /MES\s*:\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+)/);
    let mesNombre = mesStr ? mesStr.charAt(0).toUpperCase() + mesStr.slice(1).toLowerCase() : "";

    const codigo = find(t, /C[ÓO]DIGO\s*:\s*([0-9]{7,})/);

    const per = t.match(/Periodo\s+facturado:\s*(\d{2}\/\d{2}\/\d{4})\s+al\s+(\d{2}\/\d{2}\/\d{4})/);
    const periodoIni = per ? per[1] : "";
    const periodoFin = per ? per[2] : "";

    let anio = 0;
    if (periodoFin.includes("/")) {
        anio = Number(periodoFin.split("/")[2]);
    }

    // AUTOGENERADOR
    const ci = t.match(/Consumo\s+importado\s+([\d\.,]+)\s+([\d\.,]+)\s+(-?[\d\.,-]+)/i);
    const consumoKwh = ci ? num(ci[1]) : 0;
    const precioEnergia = ci ? num(ci[2]) : 0;
    const subtotalConsumo = ci ? num(ci[3]) : 0;

    const cr = t.match(/Cr[eé]dito\s+de\s+energ[ií]a\s+([\d\.,]+)\s+([\d\.,]+)\s+(-?[\d\.,-]+)/i);
    const creditoKwh = cr ? num(cr[1]) : 0;
    const precioCredito = cr ? num(cr[2]) : 0;
    const subtotalCredito = cr ? num(cr[3]) : 0;

    const vh = t.match(/Valoraci[oó]n\s+horaria\s+([\d\.,]+)\s+([\d\.,]+)\s*(-?[\d\.,-]+)/i);
    const valHorKwh = vh ? num(vh[1]) : 0;
    const precioValHor = vh ? num(vh[2]) : 0;
    const subtotalValHor = vh ? num(vh[3]) : 0;

    const totalExcedentesKwh = num(find(t, /Total\s+excedentes\s+([\d\.,-]+)/i));

    // TARIFA APLICADA
    const tarifaAplicada = num(find(t, /Tarifa aplicada.*?\$?\s*([\d\.,-]+)/i));

    // TARIFAS UNITARIAS
    let tarifas = t.match(
        /TARIFA[\s\S]*?Generaci[oó]n:\s*([\d\.,]+)[\s\S]*?Comercializaci[oó]n:\s*([\d\.,]+)[\s\S]*?Transmisi[oó]n:\s*([\d\.,]+)[\s\S]*?Restricciones:\s*([\d\.,]+)[\s\S]*?Distribuci[oó]n:\s*([\d\.,]+)[\s\S]*?P[eé]rdidas:\s*([\d\.,]+)/i
    );

    let generacion = 0, comercializacion = 0, transmision = 0, restricciones = 0, distribucion = 0, perdidas = 0;

    if (tarifas) {
        generacion = num(tarifas[1]);
        comercializacion = num(tarifas[2]);
        transmision = num(tarifas[3]);
        restricciones = num(tarifas[4]);
        distribucion = num(tarifas[5]);
        perdidas = num(tarifas[6]);
    } else {
        generacion = num(find(t, /Generaci[oó]n:\s*([\d\.,-]+)/i));
        comercializacion = num(find(t, /Comercializaci[oó]n:\s*[\d\.,]+\s*kWh\s*a\s*\$?([\d\.,]+)/i));
        transmision = num(find(t, /Transmisi[oó]n:\s*([\d\.,-]+)/i));
        restricciones = num(find(t, /Restricciones:\s*([\d\.,-]+)/i));
        distribucion = num(find(t, /Distribuci[oó]n:\s*([\d\.,-]+)/i));
        perdidas = num(find(t, /P[eé]rdidas:\s*([\d\.,-]+)/i));
    }

    // TOTAL CELSIA
    let totalCelsia = 0;
    let total1 = find(t, /(?:Valor\s+consumo\s+neto[\s\S]*?Subtotal:|TOTAL\s+CELSIA)\s*\$?\s*([\d\.,-]+)/i);
    let total2 = find(t, /Subtotal:\s*\$?\s*(-?[\d\.,-]+)/i);
    if (total1) totalCelsia = num(total1);
    else if (total2) totalCelsia = num(total2);

    // OTRAS ENTIDADES
    const alumbrado = num(find(t, /Alumbrado\s+P[úu]blico.*?\$?\s*([\d\.,-]+)/i));
    const aseo = num(find(t, /Aseo.*?\$?\s*([\d\.,-]+)/i));

    let otros = 0;
    let otrosSubtotal1 = find(t, /OTROS\*[\s\S]*?Subtotal:\s*\$?\s*([\d\.,-]+)/i);
    let otrosSubtotal2 = find(t, /OTROS[\s\S]*?Subtotal:\s*\$?\s*([\d\.,-]+)/i);
    if (otrosSubtotal1) otros = num(otrosSubtotal1);
    else if (otrosSubtotal2) otros = num(otrosSubtotal2);
    else {
        otros = num(find(t, /Tasa\s+de\s+Seguridad.*?\$?\s*([\d\.,-]+)/i))
            + num(find(t, /Aproximaci[oó]n.*?\$?\s*([\d\.,-]+)/i));
    }
    const otrasEnt = alumbrado + aseo + otros;

    // SALDOS
    const saldoAnterior = num(find(t, /Saldo\s+anterior\s*\$?\s*([\d\.,-]+)/i));
    const saldoAcumulado = num(find(t, /Saldo\s+a\s+favor\s+acumulado\s*\$?\s*([\d\.,-]+)/i));
    const totalPagar = num(find(t, /TOTAL\s+A\s+PAGAR\s*:\s*\$?\s*([\d\.,-]+)/i));

    // Tu consumo mes
    const tuConsumoMes = num(find(t, /Tu consumo mes[:\s]+([\d\.,]+)/i)) || 0;

    // Planta desde código
    const planta = MAPA_PLANTA[codigo] || "";

    return {
        planta,
        mes: mesNombre,
        anio,
        codigo,
        fechaInicial: periodoIni,
        fechaFinal: periodoFin,
        tarifaAplicada,
        tuConsumoMes,
        consumoKwh,
        precioEnergia,
        subtotalConsumo,
        creditoKwh,
        precioCredito,
        subtotalCredito,
        valHorKwh,
        precioValHor,
        subtotalValHor,
        totalExcedentesKwh,
        otrasEnt,
        saldoAnterior,
        totalCelsia,
        totalPagar,
        saldoAcumulado,
        generacion,
        comercializacion,
        transmision,
        restricciones,
        distribucion,
        perdidas,
        alumbrado,
        aseo,
        otros
    };
}

// Insertar factura en la BD
async function insertFactura(data) {
    const query = `
        INSERT INTO fs."FacCelsia" (
            "Planta", "Mes", "Año", "Codigo",
            "Fecha inicial", "Fecha final",
            "Tarifa aplicada ($/kwh)", "Tu consumo mes (kwh)",
            "Consumo importando Energia (kWh)", "Consumo importado tarifa (COP)", "Consumo importado Subtotal COP",
            "Creditos de energia Energia (kWh)", "Creditos de energia Tarifa (COP)", "Creditos de energia Subtotal COP",
            "Valoracion horaria Energia (kWh)", "Valoracion horaria Tarifa(COP)", "Valoracion horaria Subtotal COP",
            "Total Excedentes (kWh)", "Saldo Acumulado (COP)",
            "OTRAS ENTIDADES ($)", "SALDO ANTERIOR ($)",
            "TOTAL CELSIA (COP)", "TOTAL A PAGAR ($)",
            "Generacion ($/kWh)", "Comercializacion ($/kWh)", "Transmision ($/kWh)",
            "Restricciones ($/kWh)", "Distribucion ($/kWh)", "Perdidas ($/kWh)",
            "Alumbrado ($)", "Aseo ($)", "Otros ($)"
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
        )
        ON CONFLICT ("Codigo", "Año", "Mes") DO UPDATE SET
            "Fecha inicial" = EXCLUDED."Fecha inicial",
            "Fecha final" = EXCLUDED."Fecha final",
            "Tarifa aplicada ($/kwh)" = EXCLUDED."Tarifa aplicada ($/kwh)",
            "Tu consumo mes (kwh)" = EXCLUDED."Tu consumo mes (kwh)",
            "Consumo importando Energia (kWh)" = EXCLUDED."Consumo importando Energia (kWh)",
            "Consumo importado tarifa (COP)" = EXCLUDED."Consumo importado tarifa (COP)",
            "Consumo importado Subtotal COP" = EXCLUDED."Consumo importado Subtotal COP",
            "Creditos de energia Energia (kWh)" = EXCLUDED."Creditos de energia Energia (kWh)",
            "Creditos de energia Tarifa (COP)" = EXCLUDED."Creditos de energia Tarifa (COP)",
            "Creditos de energia Subtotal COP" = EXCLUDED."Creditos de energia Subtotal COP",
            "Valoracion horaria Energia (kWh)" = EXCLUDED."Valoracion horaria Energia (kWh)",
            "Valoracion horaria Tarifa(COP)" = EXCLUDED."Valoracion horaria Tarifa(COP)",
            "Valoracion horaria Subtotal COP" = EXCLUDED."Valoracion horaria Subtotal COP",
            "Total Excedentes (kWh)" = EXCLUDED."Total Excedentes (kWh)",
            "Saldo Acumulado (COP)" = EXCLUDED."Saldo Acumulado (COP)",
            "OTRAS ENTIDADES ($)" = EXCLUDED."OTRAS ENTIDADES ($)",
            "SALDO ANTERIOR ($)" = EXCLUDED."SALDO ANTERIOR ($)",
            "TOTAL CELSIA (COP)" = EXCLUDED."TOTAL CELSIA (COP)",
            "TOTAL A PAGAR ($)" = EXCLUDED."TOTAL A PAGAR ($)",
            "Generacion ($/kWh)" = EXCLUDED."Generacion ($/kWh)",
            "Comercializacion ($/kWh)" = EXCLUDED."Comercializacion ($/kWh)",
            "Transmision ($/kWh)" = EXCLUDED."Transmision ($/kWh)",
            "Restricciones ($/kWh)" = EXCLUDED."Restricciones ($/kWh)",
            "Distribucion ($/kWh)" = EXCLUDED."Distribucion ($/kWh)",
            "Perdidas ($/kWh)" = EXCLUDED."Perdidas ($/kWh)",
            "Alumbrado ($)" = EXCLUDED."Alumbrado ($)",
            "Aseo ($)" = EXCLUDED."Aseo ($)",
            "Otros ($)" = EXCLUDED."Otros ($)",
            updated_at = CURRENT_TIMESTAMP
        RETURNING *;
    `;

    const values = [
        data.planta,
        data.mes,
        data.anio,
        data.codigo,
        data.fechaInicial,
        data.fechaFinal,
        data.tarifaAplicada || 0,
        data.tuConsumoMes || 0,
        data.consumoKwh || 0,
        data.precioEnergia || 0,
        data.subtotalConsumo || 0,
        data.creditoKwh || 0,
        data.precioCredito || 0,
        data.subtotalCredito || 0,
        data.valHorKwh || 0,
        data.precioValHor || 0,
        data.subtotalValHor || 0,
        data.totalExcedentesKwh || 0,
        data.saldoAcumulado || 0,
        data.otrasEnt || 0,
        data.saldoAnterior || 0,
        data.totalCelsia || 0,
        data.totalPagar || 0,
        data.generacion || 0,
        data.comercializacion || 0,
        data.transmision || 0,
        data.restricciones || 0,
        data.distribucion || 0,
        data.perdidas || 0,
        data.alumbrado || 0,
        data.aseo || 0,
        data.otros || 0
    ];

    return await dbQuery(query, values);
}

// Endpoint para subir facturas PDF (soporta múltiples archivos)
export const uploadFacturas = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se recibieron archivos' });
        }

        const results = [];
        const errors = [];

        for (const file of req.files) {
            try {
                // Extraer texto del PDF
                const pdfData = await pdfParse(file.buffer);
                const text = pdfData.text;

                // Extraer datos estructurados
                const facturaData = extractFacturaData(text);

                // Validar datos mínimos
                if (!facturaData.codigo || !facturaData.anio || !facturaData.mes) {
                    errors.push({
                        filename: file.originalname,
                        error: 'No se pudo extraer información básica (código, año o mes)',
                        extracted: { codigo: facturaData.codigo, anio: facturaData.anio, mes: facturaData.mes }
                    });
                    continue;
                }

                // Insertar en BD
                const result = await insertFactura(facturaData);

                results.push({
                    filename: file.originalname,
                    success: true,
                    data: {
                        planta: facturaData.planta,
                        mes: facturaData.mes,
                        anio: facturaData.anio,
                        codigo: facturaData.codigo,
                        consumoKwh: facturaData.consumoKwh,
                        tarifa: facturaData.precioEnergia,
                        totalPagar: facturaData.totalPagar
                    }
                });

            } catch (fileError) {
                errors.push({
                    filename: file.originalname,
                    error: fileError.message
                });
            }
        }

        res.json({
            success: true,
            processed: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (err) {
        console.error('Error uploading facturas:', err);
        res.status(500).json({ error: 'Error procesando facturas: ' + err.message });
    }
};

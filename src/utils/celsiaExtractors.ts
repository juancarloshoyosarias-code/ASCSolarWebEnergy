// ============================================================
//  SCRIPTS DE EXTRACCIÓN DE FACTURAS CELSIA (n8n / Node.js)
//  Documentación para integración con Backend OCR
// ============================================================
//
//  Estos scripts se ejecutan en un workflow de n8n cuando se
//  sube un PDF de factura de Celsia. Extraen los datos usando
//  regex sobre el texto OCR del documento.
//
//  FLUJO DE INTEGRACIÓN:
//  1. Usuario sube PDF en el frontend
//  2. Frontend envía al backend (API)
//  3. Backend extrae texto del PDF (pdftotext, PyMuPDF, etc.)
//  4. Backend ejecuta uno de estos scripts según el formato detectado
//  5. Datos estructurados se guardan en PostgreSQL
//  6. Frontend recibe confirmación y actualiza la tabla
//
// ============================================================

// =============================
//  SCRIPT 1: MODELO COMPLETO (Autogeneradores)
//  Extrae todos los campos detallados de la factura
// =============================
export const extractorModeloCompleto = `
const t = $json.text || $json.content || $json.plainText || "";

// ---------- HELPERS ----------
function num(s) {
	if (!s) return 0;
	let x = s.replace(/[\\s.]/g, "");
	x = x.replace(/,(\\d{2})$/, ".$1");
	const v = parseFloat(x.replace(/[^0-9.-]/g, ""));
	return isNaN(v) ? 0 : v;
}

function find(re) {
	const m = t.match(re);
	return m ? (m[1] || m[0]).trim() : "";
}

// =============================
//  ENCABEZADO
// =============================
const mesStr = find(/MES\\s*:\\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+)/);
let mesNombre = mesStr ? mesStr.charAt(0).toUpperCase() + mesStr.slice(1).toLowerCase() : "";

const codigo = find(/C[ÓO]DIGO\\s*:\\s*([0-9]{7,})/);

const per = t.match(/Periodo\\s+facturado:\\s*(\\d{2}\\/\\d{2}\\/\\d{4})\\s+al\\s+(\\d{2}\\/\\d{2}\\/\\d{4})/);
const periodoIni = per ? per[1] : "";
const periodoFin = per ? per[2] : "";

let anio = 0;
if (periodoFin.includes("/")) {
	anio = Number(periodoFin.split("/")[2]);
}

// =============================
//  AUTOGENERADOR
// =============================
const ci = t.match(/Consumo\\s+importado\\s+([\\d\\.,]+)\\s+([\\d\\.,]+)\\s+(-?[\\d\\.,-]+)/i);
const consumoKwh = ci ? num(ci[1]) : 0;
const precioEnergia = ci ? num(ci[2]) : 0;
const subtotalConsumo = ci ? num(ci[3]) : 0;

const cr = t.match(/Cr[eé]dito\\s+de\\s+energ[ií]a\\s+([\\d\\.,]+)\\s+([\\d\\.,]+)\\s+(-?[\\d\\.,-]+)/i);
const creditoKwh = cr ? num(cr[1]) : 0;
const precioCredito = cr ? num(cr[2]) : 0;
const subtotalCredito = cr ? num(cr[3]) : 0;

const vh = t.match(/Valoraci[oó]n\\s+horaria\\s+([\\d\\.,]+)\\s+([\\d\\.,]+)\\s*(-?[\\d\\.,-]+)/i);
const valHorKwh = vh ? num(vh[1]) : 0;
const precioValHor = vh ? num(vh[2]) : 0;
const subtotalValHor = vh ? num(vh[3]) : 0;

const totalExcedentesKwh = num(find(/Total\\s+excedentes\\s+([\\d\\.,-]+)/i));

// =============================
//  TARIFA APLICADA
// =============================
const tarifaAplicada = num(find(/Tarifa aplicada.*?\\$?\\s*([\\d\\.,-]+)/i));

// =============================
//  TARIFAS UNITARIAS (1ra o 2da hoja)
// =============================
let tarifas = t.match(
	/TARIFA[\\s\\S]*?Generaci[oó]n:\\s*([\\d\\.,]+)[\\s\\S]*?Comercializaci[oó]n:\\s*([\\d\\.,]+)[\\s\\S]*?Transmisi[oó]n:\\s*([\\d\\.,]+)[\\s\\S]*?Restricciones:\\s*([\\d\\.,]+)[\\s\\S]*?Distribuci[oó]n:\\s*([\\d\\.,]+)[\\s\\S]*?P[eé]rdidas:\\s*([\\d\\.,]+)/i
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
	generacion       = num(find(/Generaci[oó]n:\\s*([\\d\\.,-]+)/i));
	comercializacion = num(find(/Comercializaci[oó]n:\\s*[\\d\\.,]+\\s*kWh\\s*a\\s*\\$?([\\d\\.,]+)/i));
	transmision      = num(find(/Transmisi[oó]n:\\s*([\\d\\.,-]+)/i));
	restricciones    = num(find(/Restricciones:\\s*([\\d\\.,-]+)/i));
	distribucion     = num(find(/Distribuci[oó]n:\\s*([\\d\\.,-]+)/i));
	perdidas         = num(find(/P[eé]rdidas:\\s*([\\d\\.,-]+)/i));
}

// =============================
//  TOTAL CELSIA (moderno o viejo)
// =============================
let totalCelsia = 0;

let total1 = find(/(?:Valor\\s+consumo\\s+neto[\\s\\S]*?Subtotal:|TOTAL\\s+CELSIA)\\s*\\$?\\s*([\\d\\.,-]+)/i);
let total2 = find(/Subtotal:\\s*\\$?\\s*(-?[\\d\\.,-]+)/i);

if (total1) totalCelsia = num(total1);
else if (total2) totalCelsia = num(total2);

// =============================
//  OTRAS ENTIDADES (Subtotal real)
// =============================
const alumbrado = num(find(/Alumbrado\\s+P[úu]blico.*?\\$?\\s*([\\d\\.,-]+)/i));
const aseo      = num(find(/Aseo.*?\\$?\\s*([\\d\\.,-]+)/i));

let otros = 0;

let otrosSubtotal1 = find(/OTROS\\*[\\s\\S]*?Subtotal:\\s*\\$?\\s*([\\d\\.,-]+)/i);
let otrosSubtotal2 = find(/OTROS[\\s\\S]*?Subtotal:\\s*\\$?\\s*([\\d\\.,-]+)/i);

if (otrosSubtotal1) otros = num(otrosSubtotal1);
else if (otrosSubtotal2) otros = num(otrosSubtotal2);
else {
	otros =
		  num(find(/Tasa\\s+de\\s+Seguridad.*?\\$?\\s*([\\d\\.,-]+)/i))
		+ num(find(/Aproximaci[oó]n.*?\\$?\\s*([\\d\\.,-]+)/i));
}

const otrasEnt = alumbrado + aseo + otros;

// =============================
//  SALDOS
// =============================
const saldoAnterior  = num(find(/Saldo\\s+anterior\\s*\\$?\\s*([\\d\\.,-]+)/i));
const saldoAcumulado = num(find(/Saldo\\s+a\\s+favor\\s+acumulado\\s*\\$?\\s*([\\d\\.,-]+)/i));
const totalPagar     = num(find(/TOTAL\\s+A\\s+PAGAR\\s*:\\s*\\$?\\s*([\\d\\.,-]+)/i));

// =============================
//  MAPA PLANTA
// =============================
const mapaPlanta = {
	"1165450000": "Maracaibo",
	"5497410000": "Pozo 2",
	"6497410000": "Pozo 1",
	"4806050000": "Porvenir",
	"1056060000": "Cabañita",
	"2036110000": "Casa Trejo",
};

const planta = mapaPlanta[codigo] || "";

// =============================
//  RETURN FINAL
// =============================
return {
	json: {
		"Planta": planta,
		"Mes": mesNombre,
		"Año": anio,
		"Codigo": codigo,
		"Fecha inicial": periodoIni,
		"Fecha final": periodoFin,

		// TARIFA
		"Tarifa aplicada ($/kWh)": tarifaAplicada,

		// CONSUMOS
		"Tu consumo mes (kWh)": num(find(/Tu consumo mes[:\\s]+([\\d\\.,]+)/i)) || 0,
		"Consumo importado (kWh)": consumoKwh,
		"Consumo importado (Precio kWh)": precioEnergia,
		"Consumo importado ($)": subtotalConsumo,

		"Creditos de energia (kWh)": creditoKwh,
		"Creditos de energia (Precio kWh)": precioCredito,
		"Creditos de energia ($)": subtotalCredito,

		"Valoracion horaria (kWh)": valHorKwh,
		"Valoracion horaria (Precio kWh)": precioValHor,
		"Valoracion horaria ($)": subtotalValHor,

		"Total Excedentes (kWh)": totalExcedentesKwh,

		// TOTALES
		"OTRAS ENTIDADES ($)": otrasEnt,
		"SALDO ANTERIOR ($)": saldoAnterior,
		"TOTAL CELSIA (COP)": totalCelsia,
		"TOTAL A PAGAR ($)": totalPagar,
		"Saldo acumulado ($)": saldoAcumulado,

		// TARIFAS UNITARIAS
		"Generacion ($/kWh)": generacion,
		"Comercializacion ($/kWh)": comercializacion,
		"Transmision ($/kWh)": transmision,
		"Restricciones ($/kWh)": restricciones,
		"Distribucion ($/kWh)": distribucion,
		"Perdidas ($/kWh)": perdidas,

		// OTROS
		"Alumbrado ($)": alumbrado,
		"Aseo ($)": aseo,
		"Otros ($)": otros
	}
};
`;


// =============================
//  SCRIPT 2: MODELO SIMPLIFICADO (Fallback)
//  Para facturas con formato viejo o cuando el OCR no extrae todo
// =============================
export const extractorModeloSimplificado = `
const t = $json.text || $json.content || "";

// Helpers
function num(s) {
	if (!s) return 0;
	let x = s.replace(/[\\s.]/g, "");
	x = x.replace(/,(\\d{2})$/, ".$1");
	const v = parseFloat(x.replace(/[^0-9.-]/g, ""));
	return isNaN(v) ? 0 : v;
}
function find(re) {
	const m = t.match(re);
	return m ? (m[1] || m[0]).trim() : "";
}

// ========================================
//   ENCABEZADO
// ========================================
const mesStr = find(/MES\\s*:\\s*([A-Za-zÁÉÍÓÚñ]+)/i);
const mes = mesStr ? mesStr.charAt(0).toUpperCase() + mesStr.slice(1).toLowerCase() : "";

const codigo = find(/C[ÓO]DIGO\\s*:\\s*([0-9]{7,})/);

const per = t.match(/Periodo\\s+facturado:\\s*(\\d{2}\\/\\d{2}\\/\\d{4})\\s+al\\s+(\\d{2}\\/\\d{2}\\/\\d{4})/);
const fechaIni = per ? per[1] : "";
const fechaFin = per ? per[2] : "";
const anio = fechaFin ? Number(fechaFin.split("/")[2]) : 0;

// ========================================
//   MODELO NUEVO
// ========================================
let totalCelsia = num(find(/TOTAL\\s+CELSIA\\s*\\$?\\s*([\\d\\.,-]+)/i));
let totalOtras = num(find(/TOTAL\\s+OTRAS\\s+ENTIDADES\\s*\\$?\\s*([\\d\\.,-]+)/i));
let saldoAnterior = num(find(/SALDO\\s+ANTERIOR\\s*\\$?\\s*([\\d\\.,-]+)/i));
let totalPagar = num(find(/TOTAL\\s+A\\s+PAGAR\\s*\\$?\\s*([\\d\\.,-]+)/i));

// ----------------------------------------
//   SI NO SE ENCONTRÓ MODELO NUEVO
//   USAR MODELO VIEJO (bloque de 5 líneas con $)
// ----------------------------------------
if (totalCelsia === 0 && totalOtras === 0 && saldoAnterior === 0) {

	// patrón: 5 líneas seguidas con dinero
	const bloque = t.match(
		/\\$\\s*([\\d\\.,-]+)\\s*\\n\\$\\s*([\\d\\.,-]+)\\s*\\n\\$\\s*([\\d\\.,-]+)\\s*\\n\\$\\s*([\\d\\.,-]+)\\s*\\n\\$\\s*([\\d\\.,-]+)/
	);

	if (bloque) {
		totalCelsia    = num(bloque[1]);   // línea 1
		totalOtras     = num(bloque[2]);   // línea 2
		saldoAnterior  = num(bloque[4]);   // línea 4
		totalPagar     = num(bloque[5]);   // línea 5
	}
}

// ========================================
//   MAPA PLANTA
// ========================================
const mapaPlanta = {
	"1165450000": "Maracaibo",
	"5497410000": "Pozo 2",
	"6497410000": "Pozo 1",
	"4806050000": "Porvenir",
	"1056060000": "Cabañita",
	"2036110000": "Casa Trejo",
};
const planta = mapaPlanta[codigo] || "";

// ========================================
//   SALIDA
// ========================================
return {
	json: {
		"Planta": planta,
		"Mes": mes,
		"Año": anio,
		"Codigo": codigo,
		"Fecha inicial": fechaIni,
		"Fecha final": fechaFin,
		"TOTAL CELSIA (COP)": totalCelsia,
		"TOTAL OTRAS ENTIDADES ($)": totalOtras,
		"SALDO ANTERIOR ($)": saldoAnterior,
		"TOTAL A PAGAR ($)": totalPagar
	}
};
`;


// =============================
//  MAPA DE CÓDIGOS DE CUENTA -> PLANTA
// =============================
export const mapaCodigoPlanta = {
    "1165450000": "Maracaibo",
    "5497410000": "Pozo 2",
    "6497410000": "Pozo 1",
    "4806050000": "Porvenir",
    "1056060000": "Cabañita",
    "2036110000": "Casa Trejo",
};


// =============================
//  INSTRUCCIONES DE INTEGRACIÓN
// =============================
/*
INTEGRACIÓN CON BACKEND (Node.js / Python):

1. INSTALAR DEPENDENCIAS:
   - Node.js: pdf-parse, tesseract.js
   - Python: PyMuPDF, pytesseract, pdfplumber

2. FLUJO DE PROCESAMIENTO:
   a) Recibir archivo PDF del frontend (multer, formidable)
   b) Extraer texto con OCR o pdftotext
   c) Detectar tipo de factura (buscar patrones clave)
   d) Ejecutar el script de extracción correspondiente
   e) Validar datos extraídos
   f) Insertar en PostgreSQL

3. ENDPOINT API (ejemplo Express):
   
   POST /api/facturas/upload
   Content-Type: multipart/form-data
   
   Response:
   {
     "success": true,
     "data": {
       "Planta": "Cabañita",
       "Mes": "Noviembre",
       "Año": 2025,
       "Codigo": "1056060000",
       ...
     }
   }

4. TABLA PostgreSQL (sugerida):
   
   CREATE TABLE facturas_celsia (
     id SERIAL PRIMARY KEY,
     plant_id VARCHAR(50) REFERENCES plants(id),
     codigo_cuenta VARCHAR(20),
     mes VARCHAR(20),
     anio INTEGER,
     fecha_inicial DATE,
     fecha_final DATE,
     consumo_mes_kwh DECIMAL(10,2),
     consumo_importado_kwh DECIMAL(10,2),
     consumo_importado_precio DECIMAL(10,2),
     consumo_importado_total DECIMAL(12,2),
     credito_energia_kwh DECIMAL(10,2),
     credito_energia_precio DECIMAL(10,2),
     credito_energia_total DECIMAL(12,2),
     valoracion_horaria_kwh DECIMAL(10,2),
     valoracion_horaria_precio DECIMAL(10,2),
     valoracion_horaria_total DECIMAL(12,2),
     total_excedentes_kwh DECIMAL(10,2),
     tarifa_aplicada DECIMAL(10,2),
     generacion DECIMAL(10,2),
     comercializacion DECIMAL(10,2),
     transmision DECIMAL(10,2),
     restricciones DECIMAL(10,2),
     distribucion DECIMAL(10,2),
     perdidas DECIMAL(10,2),
     total_celsia DECIMAL(12,2),
     otras_entidades DECIMAL(12,2),
     alumbrado DECIMAL(12,2),
     aseo DECIMAL(12,2),
     otros DECIMAL(12,2),
     saldo_anterior DECIMAL(12,2),
     saldo_acumulado DECIMAL(12,2),
     total_pagar DECIMAL(12,2),
     sin_solar DECIMAL(12,2),
     con_solar DECIMAL(12,2),
     ahorro DECIMAL(12,2),
     pdf_url TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

*/

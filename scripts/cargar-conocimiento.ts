// scripts/cargar-conocimiento.ts
import { neon } from '@neondatabase/serverless';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const conocimientos = [
  {
    titulo: 'Regla de prescripción de incapacidades',
    contenido: 'Las incapacidades prescriben a los 1080 días (aproximadamente 3 años) contados desde la fecha de inicio. Si han transcurrido más de 1080 días, se marca como PRESCRITA. Si han transcurrido menos de 1050 días, se marca como LIQUIDAR. Entre 1050 y 1080 días, se marca como REVISAR.',
    categoria: 'normativa',
  },
  {
    titulo: 'Regla de relación laboral de 59 días',
    contenido: 'Si la relación laboral del empleado es mayor a 59 días antes del inicio de la incapacidad, se genera la palabra LIQUIDAR. Si es menor a 59 días, se genera SIN RECONOCIMIENTO POR PERIODOS MÍNIMOS.',
    categoria: 'normativa',
  },
  {
    titulo: 'Liquidación de Enfermedad General Nueva',
    contenido: 'Para incapacidades por Enfermedad General (EG) de tipo NUEVA: se restan 2 días a la incapacidad, luego se divide el SMLV del año en 30 y se multiplica por los días restantes. Ejemplo: 10 días de incapacidad, SMLV 2026 = 1.750.905. Días liquidables = 8. Monto = (1.750.905 / 30) * 8 = 466.908.',
    categoria: 'liquidacion',
  },
  {
    titulo: 'Liquidación de Enfermedad General Prórroga',
    contenido: 'Para incapacidades por Enfermedad General (EG) de tipo PRÓRROGA: 1) Del día 1 al 89 con IBC mayor a 1.5 SMLV: IBC/30 * 66.67% * días. 2) Del día 90 al 180 con IBC mayor a 2 SMLV: IBC/30 * 50% * días. 3) Del día 1 al 180 con IBC menor a 1.5 SMLV: IBC/30 * días (con el SMLV del año).',
    categoria: 'liquidacion',
  },
  {
    titulo: 'Liquidación de ARL Nueva',
    contenido: 'Para incapacidades por ARL de tipo NUEVA: se resta 1 día a la incapacidad, luego se divide el SMLV del año en 30 y se multiplica por los días restantes. Ejemplo: 10 días, SMLV 2026 = 1.750.905. Días liquidables = 9. Monto = (1.750.905 / 30) * 9 = 525.272.',
    categoria: 'liquidacion',
  },
  {
    titulo: 'Liquidación de ARL Prórroga',
    contenido: 'Para incapacidades por ARL de tipo PRÓRROGA: se coge el IBC del empleado, se divide en 30 y se multiplica por los días. Fórmula: IBC / 30 * días.',
    categoria: 'liquidacion',
  },
  {
    titulo: 'Liquidación de Licencia de Maternidad',
    contenido: 'Para licencias de maternidad (LM): se valida la relación laboral en meses. Si es >= 9 meses, LIQUIDACIÓN TOTAL. Si es < 9 meses, LIQUIDACIÓN PROPORCIONAL. En ambos casos: IBC / 30 * días de la licencia (126 días en Colombia).',
    categoria: 'liquidacion',
  },
  {
    titulo: 'Liquidación de Licencia de Paternidad',
    contenido: 'Para licencias de paternidad (LP): se valida la relación laboral en meses. Si es >= 9 meses, LIQUIDACIÓN TOTAL. Si es < 9 meses, LIQUIDACIÓN PROPORCIONAL. Fórmula: IBC / 30 * días de la licencia (14 días en Colombia).',
    categoria: 'liquidacion',
  },
  {
    titulo: 'Valores de SMLV por año en Colombia',
    contenido: 'SMLV en Colombia: 2026 = 1.750.905, 2025 = 1.425.500, 2024 = 1.300.000, 2023 = 1.116.000, 2022 = 1.000.000, 2017 = 908.526.',
    categoria: 'normativa',
  },
  {
    titulo: 'Clasificación de tipos de incapacidad',
    contenido: 'EG (Enfermedad General) para enfermedad común. ARL (Accidente/Enfermedad Laboral) por causa laboral. LM (Licencia de Maternidad) para embarazo/parto. LP (Licencia de Paternidad) para el padre.',
    categoria: 'clasificacion',
  },
  {
    titulo: 'Validaciones para AT y EP',
    contenido: 'Para Accidente de Trabajo (AT) y Enfermedad Profesional (EP), el sistema debe indicar "corresponde a ARL" y direccionar al proceso de ARL.',
    categoria: 'clasificacion',
  },
  {
    titulo: 'Plazo para radicar incapacidades',
    contenido: 'Las incapacidades deben radicarse ante EPS/ARL dentro de los 3 días hábiles. Para recobros, el plazo máximo es de 3 años (1080 días).',
    categoria: 'plazos',
  },
  {
    titulo: 'Derecho de petición para incapacidades negadas',
    contenido: 'Si EPS/ARL niega una incapacidad, se radica derecho de petición en 15 días hábiles. El sistema debe generar alerta de vencimiento.',
    categoria: 'plazos',
  },
  {
    titulo: 'Radicación por Supersalud y tutela',
    contenido: 'Si no hay respuesta favorable al derecho de petición, se puede escalar a Supersalud o interponer acción de tutela.',
    categoria: 'plazos',
  },
  {
    titulo: 'Estados de las incapacidades en el sistema',
    contenido: 'Estados: LIQUIDAR (se reconoce), PRESCRITA (>1080 días), SIN_RECONOCIMIENTO (relación laboral <59 días), REVISAR (análisis manual).',
    categoria: 'estados',
  },
  {
    titulo: 'IBC - Ingreso Base de Cotización',
    contenido: 'El IBC es el valor sobre el cual se calculan las cotizaciones y liquidaciones. Es fundamental para prórrogas de EG, LM y LP.',
    categoria: 'general',
  },
  {
    titulo: 'Diferencia entre nueva y prórroga',
    contenido: 'NUEVA es la primera incapacidad. PRÓRROGA es la continuación por el mismo diagnóstico. Las prórrogas usan el IBC del empleado y no restan días.',
    categoria: 'general',
  },
  {
    titulo: 'Relación entre ARL y EPS',
    contenido: 'ARL cubre accidentes/enfermedades laborales. EPS cubre enfermedades generales, LM y LP. El recobro se direcciona a la entidad correspondiente.',
    categoria: 'general',
  },
];

async function generarEmbedding(texto: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: texto,
    config: { taskType: 'RETRIEVAL_DOCUMENT' },
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error('Gemini no devolvió embeddings');
  }

  const values = response.embeddings[0].values;
  if (!values || values.length === 0) {
    throw new Error('Embedding vacío');
  }

  return values as number[];
}

async function main() {
  console.log('🚀 Iniciando carga directa a Neon...\n');

  let exitosos = 0;
  let fallidos = 0;

  for (const c of conocimientos) {
    try {
      console.log(`⏳ Procesando: ${c.titulo}`);
      
      // 1. Generar embedding
      const embedding = await generarEmbedding(`${c.titulo}\n\n${c.contenido}`);

      // 2. Insertar directamente en Neon
      await sql`
        INSERT INTO conocimiento (titulo, contenido, categoria, embedding)
        VALUES (
          ${c.titulo}, 
          ${c.contenido}, 
          ${c.categoria}, 
          ${JSON.stringify(embedding)}::vector
        )
      `;

      exitosos++;
      console.log(`   ✅ Guardado\n`);
    } catch (err) {
      fallidos++;
      console.error(`   ❌ Error: ${err instanceof Error ? err.message : 'Desconocido'}\n`);
    }
  }

  console.log(`\n📊 Resultado final: ${exitosos} exitosos, ${fallidos} fallidos`);
}

main().catch(console.error);
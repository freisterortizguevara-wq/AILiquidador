// lib/liquidacion.ts

export const SMLV_POR_ANIO: Record<number, number> = {
  2026: 1750905,
  2025: 1425500,
  2024: 1300000,
  2023: 1116000,
  2022: 1000000,
  2017: 908526,
};

export type TipoIncapacidad = 'EG' | 'ARL' | 'LM' | 'LP';
export type Subtipo = 'NUEVA' | 'PRORROGA';

export interface DatosIncapacidad {
  tipo: TipoIncapacidad;
  subtipo: Subtipo;
  anio: number;
  dias: number;
  ibc?: number; // Requerido para prórrogas y LM/LP
  fechaInicio: Date;
  fechaFin: Date;
  fechaIngresoEmpleado?: Date;
}

export interface ResultadoLiquidacion {
  estado: 'LIQUIDAR' | 'SIN_RECONOCIMIENTO' | 'PRESCRITA' | 'REVISAR';
  diasLiquidables: number;
  monto: number;
  formula: string;
  smlvAplicado: number;
  observaciones: string[];
}

/**
 * Valida la fecha de inicio de la incapacidad contra la fecha actual
 * Regla: > 1080 días = PRESCRITA, < 1050 días = LIQUIDAR
 */
export function validarPrescripcion(fechaInicio: Date): 'PRESCRITA' | 'LIQUIDAR' | 'REVISAR' {
  const hoy = new Date();
  const diasTranscurridos = Math.floor(
    (hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diasTranscurridos > 1080) return 'PRESCRITA';
  if (diasTranscurridos < 1050) return 'LIQUIDAR';
  return 'REVISAR';
}

/**
 * Valida relación laboral vs inicio de incapacidad (regla 59 días)
 */
export function validarRelacionLaboral(
  fechaIngreso: Date,
  fechaInicioIncapacidad: Date
): 'LIQUIDAR' | 'SIN_RECONOCIMIENTO' {
  const diasRelacion = Math.floor(
    (fechaInicioIncapacidad.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diasRelacion > 59 ? 'LIQUIDAR' : 'SIN_RECONOCIMIENTO';
}

/**
 * Liquida una incapacidad por Enfermedad General (NUEVA)
 * Regla: restar 2 días, luego (SMLV / 30) * días restantes
 */
export function liquidarEGNueva(datos: DatosIncapacidad): ResultadoLiquidacion {
  const smlv = SMLV_POR_ANIO[datos.anio];
  if (!smlv) throw new Error(`No hay SMLV registrado para el año ${datos.anio}`);

  const diasLiquidables = Math.max(0, datos.dias - 2);
  const monto = (smlv / 30) * diasLiquidables;

  return {
    estado: 'LIQUIDAR',
    diasLiquidables,
    monto: Math.round(monto),
    formula: `(${smlv} / 30) * ${diasLiquidables}`,
    smlvAplicado: smlv,
    observaciones: [`Se restaron 2 días según regla EG Nueva.`],
  };
}

/**
 * Liquida una incapacidad por Enfermedad General (PRÓRROGA)
 * Reglas:
 *  - Día 1 al 89: si IBC > 1.5 SMLV → IBC/30 * 66.67% * días
 *  - Día 90 al 180: si IBC > 2 SMLV → IBC/30 * 50% * días
 *  - Día 1 al 180: si IBC < 1.5 SMLV → IBC/30 * días (con SMLV del año)
 */
export function liquidarEGProrroga(datos: DatosIncapacidad): ResultadoLiquidacion {
  const smlv = SMLV_POR_ANIO[datos.anio];
  if (!smlv) throw new Error(`No hay SMLV registrado para el año ${datos.anio}`);
  if (!datos.ibc) throw new Error('IBC es requerido para prórrogas');

  const observaciones: string[] = [];
  let monto = 0;
  let formula = '';

  if (datos.ibc > 1.5 * smlv && datos.dias <= 89) {
    monto = (datos.ibc / 30) * 0.6667 * datos.dias;
    formula = `(${datos.ibc} / 30) * 66.67% * ${datos.dias}`;
    observaciones.push('Aplica rango día 1-89 con IBC > 1.5 SMLV');
  } else if (datos.ibc > 2 * smlv && datos.dias >= 90 && datos.dias <= 180) {
    monto = (datos.ibc / 30) * 0.5 * datos.dias;
    formula = `(${datos.ibc} / 30) * 50% * ${datos.dias}`;
    observaciones.push('Aplica rango día 90-180 con IBC > 2 SMLV');
  } else if (datos.ibc < 1.5 * smlv) {
    monto = (smlv / 30) * datos.dias;
    formula = `(${smlv} / 30) * ${datos.dias} (SMLV ${datos.anio})`;
    observaciones.push('Aplica IBC < 1.5 SMLV, se liquida con SMLV del año');
  } else {
    throw new Error('Combinación de IBC y días no cubierta por las reglas');
  }

  return {
    estado: 'LIQUIDAR',
    diasLiquidables: datos.dias,
    monto: Math.round(monto),
    formula,
    smlvAplicado: smlv,
    observaciones,
  };
}

/**
 * Liquida una incapacidad por ARL (NUEVA)
 * Regla: restar 1 día, luego (SMLV / 30) * días restantes
 */
export function liquidarARLNueva(datos: DatosIncapacidad): ResultadoLiquidacion {
  const smlv = SMLV_POR_ANIO[datos.anio];
  if (!smlv) throw new Error(`No hay SMLV registrado para el año ${datos.anio}`);

  const diasLiquidables = Math.max(0, datos.dias - 1);
  const monto = (smlv / 30) * diasLiquidables;

  return {
    estado: 'LIQUIDAR',
    diasLiquidables,
    monto: Math.round(monto),
    formula: `(${smlv} / 30) * ${diasLiquidables}`,
    smlvAplicado: smlv,
    observaciones: [`Se restó 1 día según regla ARL Nueva.`],
  };
}

/**
 * Liquida una incapacidad por ARL (PRÓRROGA)
 * Regla: IBC / 30 * días
 */
export function liquidarARLProrroga(datos: DatosIncapacidad): ResultadoLiquidacion {
  if (!datos.ibc) throw new Error('IBC es requerido para prórrogas ARL');
  const monto = (datos.ibc / 30) * datos.dias;

  return {
    estado: 'LIQUIDAR',
    diasLiquidables: datos.dias,
    monto: Math.round(monto),
    formula: `(${datos.ibc} / 30) * ${datos.dias}`,
    smlvAplicado: SMLV_POR_ANIO[datos.anio],
    observaciones: ['Aplica fórmula ARL Prórroga: IBC/30 * días'],
  };
}

/**
 * Liquida licencia de maternidad o paternidad
 * Valida relación laboral en meses:
 *  - >= 9 meses: liquidación total → IBC/30 * días
 *  - < 9 meses: liquidación proporcional → IBC/30 * días
 */
export function liquidarLicencia(
  datos: DatosIncapacidad,
  tipo: 'LM' | 'LP'
): ResultadoLiquidacion {
  if (!datos.ibc) throw new Error('IBC es requerido para LM/LP');
  if (!datos.fechaIngresoEmpleado) throw new Error('Fecha de ingreso es requerida');

  const mesesRelacion = Math.floor(
    (datos.fechaInicio.getTime() - datos.fechaIngresoEmpleado.getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  );

  const monto = (datos.ibc / 30) * datos.dias;
  const esTotal = mesesRelacion >= 9;

  return {
    estado: 'LIQUIDAR',
    diasLiquidables: datos.dias,
    monto: Math.round(monto),
    formula: `(${datos.ibc} / 30) * ${datos.dias}`,
    smlvAplicado: SMLV_POR_ANIO[datos.anio],
    observaciones: [
      esTotal
        ? `Liquidación TOTAL (relación laboral ${mesesRelacion} meses ≥ 9)`
        : `Liquidación PROPORCIONAL (relación laboral ${mesesRelacion} meses < 9)`,
    ],
  };
}

/**
 * Función principal que enruta según tipo y subtipo
 */
export function liquidar(datos: DatosIncapacidad): ResultadoLiquidacion {
  // Validación de prescripción primero
  const estadoPrescripcion = validarPrescripcion(datos.fechaInicio);
  if (estadoPrescripcion === 'PRESCRITA') {
    return {
      estado: 'PRESCRITA',
      diasLiquidables: 0,
      monto: 0,
      formula: 'N/A',
      smlvAplicado: SMLV_POR_ANIO[datos.anio] ?? 0,
      observaciones: ['Incapacidad prescrita: más de 1080 días desde su inicio.'],
    };
  }

  // Validación de relación laboral si aplica
  if (datos.fechaIngresoEmpleado) {
    const estadoRelacion = validarRelacionLaboral(
      datos.fechaIngresoEmpleado,
      datos.fechaInicio
    );
    if (estadoRelacion === 'SIN_RECONOCIMIENTO') {
      return {
        estado: 'SIN_RECONOCIMIENTO',
        diasLiquidables: 0,
        monto: 0,
        formula: 'N/A',
        smlvAplicado: SMLV_POR_ANIO[datos.anio] ?? 0,
        observaciones: [
          'Sin reconocimiento: relación laboral menor a 59 días antes del inicio.',
        ],
      };
    }
  }

  // Enrutamiento por tipo y subtipo
  switch (datos.tipo) {
    case 'EG':
      return datos.subtipo === 'NUEVA'
        ? liquidarEGNueva(datos)
        : liquidarEGProrroga(datos);
    case 'ARL':
      return datos.subtipo === 'NUEVA'
        ? liquidarARLNueva(datos)
        : liquidarARLProrroga(datos);
    case 'LM':
      return liquidarLicencia(datos, 'LM');
    case 'LP':
      return liquidarLicencia(datos, 'LP');
    default:
      throw new Error(`Tipo de incapacidad no soportado: ${datos.tipo}`);
  }
}
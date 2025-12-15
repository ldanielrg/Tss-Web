/**
 * LÓGICA DE NEGOCIO - METODOLOGÍA COSS BÚ
 * Implementación de modelos estocásticos para problemas de decisión
 * 
 * PRINCIPIOS FUNDAMENTALES:
 * 1. Separación entre modelo matemático y lógica de negocio
 * 2. Validación de supuestos antes de la implementación
 * 3. Documentación exhaustiva de cada decisión de modelado
 * 4. Trazabilidad de resultados para auditoría
 */

import { getDiscrete, getTriangular } from './MathEngine';

// ==================== DEFINICIONES DE TIPOS ====================

export interface MagazineResult {
  profit: number;
  sold: number;
  unsoldReturn: number;
  missedSales: number;
  phase1Sales: number;
  phase2Sales: number;
  totalRevenue: number;
  totalCosts: number;
  demandPhase1: number;
  demandPhase2: number;
}

export interface InvestmentResult {
  vpn: number; // Valor Presente Neto
  isViable: boolean;
  yearlyFlows: number[];
  inflation: number;
  roi: number;
  initialInvestment: number;
  salvageValue: number;
  netCashFlows: number[];
}

// ==================== PROBLEMA DEL VENDEDOR DE REVISTAS ====================

/**
 * MODELO ESTOCÁSTICO DE INVENTARIOS
 * 
 * VARIABLES DE DECISIÓN:
 * Q = Cantidad inicial a comprar (variable de control)
 * 
 * VARIABLES ALEATORIAS:
 * D₁ ~ Demanda días 1-10 (distribución empírica)
 * D₂ ~ Demanda días 11-30 (distribución empírica)
 * 
 * PARÁMETROS ECONÓMICOS:
 * c₁ = $1.50 (costo inicial por revista)
 * p = $2.00 (precio de venta al público)
 * r₁ = $0.90 (precio de recompra día 10)
 * c₂ = $1.20 (costo de compra adicional día 10)
 * r₂ = $0.60 (precio de recompra día 30)
 * 
 * FUNCIÓN OBJETIVO:
 * Maximizar E[Utilidad] = E[Ingresos - Costos]
 * 
 * RESTRICCIONES:
 * - No se permiten ventas perdidas en fase 2
 * - Inventario no puede ser negativo
 * - Decisiones de recompra son obligatorias según política
 */

// DISTRIBUCIONES DE DEMANDA (extraídas del enunciado)
const MAG_DEMAND_1_PROBS = [0.15, 0.20, 0.30, 0.25, 0.10];
const MAG_DEMAND_1_VALS = [8, 9, 10, 11, 12];

const MAG_DEMAND_2_PROBS = [0.10, 0.15, 0.20, 0.25, 0.15, 0.10, 0.05];
const MAG_DEMAND_2_VALS = [6, 7, 8, 9, 10, 11, 12];

/**
 * SIMULACIÓN DEL MODELO DE INVENTARIOS
 * 
 * ALGORITMO DE SIMULACIÓN:
 * 1. Inicializar: Inventario = Q, Caja = -Q×c₁
 * 2. FASE 1 (días 1-10):
 *    - Generar D₁ según distribución empírica
 *    - Si Q ≥ D₁: Vender D₁, devolver (Q-D₁) a precio r₁
 *    - Si Q < D₁: Vender Q, comprar adicional para fase 2
 * 3. FASE 2 (días 11-30):
 *    - Generar D₂ según distribución empírica
 *    - Vender min(Inventario, D₂)
 *    - Devolver sobrante a precio r₂
 * 4. Calcular utilidad neta
 */
export const simulateMagazineMonth = (Q: number): MagazineResult => {
  // PARÁMETROS ECONÓMICOS DEL MODELO
  const C_INITIAL = 1.50;
  const P_SALE = 2.00;
  const P_RETURN_10 = 0.90;
  const C_REBUY = 1.20;
  const P_RETURN_30 = 0.60;

  // VARIABLES DE ESTADO
  let cash = -(Q * C_INITIAL);
  let inventory = Q;
  let totalSold = 0;
  let missed = 0;
  let phase1Sales = 0;
  let phase2Sales = 0;
  let totalRevenue = 0;
  let totalCosts = Q * C_INITIAL;

  // ==================== FASE 1: DÍAS 1-10 ====================
  /**
   * LÓGICA DE DECISIÓN FASE 1:
   * 
   * CASO 1: Q ≥ D₁ (Inventario suficiente)
   * - Ventas₁ = D₁
   * - Sobrante = Q - D₁
   * - Ingresos = D₁×p + Sobrante×r₁
   * - Inventario₂ = 0 (se devuelve todo el sobrante)
   * 
   * CASO 2: Q < D₁ (Inventario insuficiente)
   * - Ventas₁ = Q
   * - Faltante = D₁ - Q (demanda insatisfecha)
   * - Reposición = E[D₂] (política de recompra)
   * - Costos adicionales = Reposición×c₂
   * - Inventario₂ = Reposición
   */
  const d1 = getDiscrete(MAG_DEMAND_1_PROBS, MAG_DEMAND_1_VALS);
  
  if (inventory >= d1) {
    // CASO 1: Inventario suficiente en fase 1
    const sold = d1;
    const surplus = inventory - d1;
    
    cash += sold * P_SALE;
    totalRevenue += sold * P_SALE;
    
    cash += surplus * P_RETURN_10;
    totalRevenue += surplus * P_RETURN_10;
    
    inventory = 0; // Política: devolver todo el sobrante
    phase1Sales = sold;
    totalSold += sold;
    
    // Reposición para fase 2 basada en demanda esperada
    const expectedD2 = MAG_DEMAND_2_VALS.reduce((sum, val, idx) => 
      sum + val * MAG_DEMAND_2_PROBS[idx], 0);
    const reorderQ = Math.ceil(expectedD2);
    
    cash -= reorderQ * C_REBUY;
    totalCosts += reorderQ * C_REBUY;
    inventory = reorderQ;
  } else {
    // CASO 2: Inventario insuficiente en fase 1
    const sold = inventory;
    missed += (d1 - inventory);
    
    cash += sold * P_SALE;
    totalRevenue += sold * P_SALE;
    inventory = 0;
    phase1Sales = sold;
    totalSold += sold;
    
    // Política de reposición: cubrir faltante + demanda esperada fase 2
    const shortfall = d1 - Q;
    const expectedD2 = MAG_DEMAND_2_VALS.reduce((sum, val, idx) => 
      sum + val * MAG_DEMAND_2_PROBS[idx], 0);
    const reorderQ = Math.ceil(shortfall + expectedD2);
    
    cash -= reorderQ * C_REBUY;
    totalCosts += reorderQ * C_REBUY;
    inventory = reorderQ;
  }

  // ==================== FASE 2: DÍAS 11-30 ====================
  /**
   * LÓGICA DE DECISIÓN FASE 2:
   * 
   * OBJETIVO: Maximizar ingresos con inventario disponible
   * 
   * CASO 1: Inventario₂ ≥ D₂
   * - Ventas₂ = D₂
   * - Sobrante = Inventario₂ - D₂
   * - Ingresos = D₂×p + Sobrante×r₂
   * 
   * CASO 2: Inventario₂ < D₂
   * - Ventas₂ = Inventario₂
   * - Ingresos = Inventario₂×p
   * - Demanda insatisfecha = D₂ - Inventario₂
   */
  const d2 = getDiscrete(MAG_DEMAND_2_PROBS, MAG_DEMAND_2_VALS);

  if (inventory >= d2) {
    // CASO 1: Inventario suficiente en fase 2
    const sold = d2;
    const surplus = inventory - d2;
    
    cash += sold * P_SALE;
    totalRevenue += sold * P_SALE;
    
    cash += surplus * P_RETURN_30;
    totalRevenue += surplus * P_RETURN_30;
    
    phase2Sales = sold;
    totalSold += sold;
  } else {
    // CASO 2: Inventario insuficiente en fase 2
    const sold = inventory;
    cash += sold * P_SALE;
    totalRevenue += sold * P_SALE;
    
    phase2Sales = sold;
    totalSold += sold;
  }

  // CÁLCULO DE UTILIDAD NETA
  // Utilidad = Ingresos Totales - Costos Totales
  return {
    profit: cash,
    sold: totalSold,
    unsoldReturn: 0,
    missedSales: missed,
    phase1Sales,
    phase2Sales,
    totalRevenue,
    totalCosts,
    demandPhase1: d1,
    demandPhase2: d2
  };
};

// ==================== PROYECTO DE INVERSIÓN ====================

/**
 * MODELO DE EVALUACIÓN FINANCIERA
 * 
 * VARIABLES ESTOCÁSTICAS:
 * I₀ ~ Triangular(80k, 100k, 130k) [Inversión inicial]
 * VS ~ Triangular(16k, 20k, 26k)   [Valor de rescate]
 * Inf ~ Triangular(15%, 20%, 25%)  [Tasa de inflación]
 * Fₜ ~ Discreta{20k, 30k, 40k, 50k, 60k} [Flujos anuales]
 * 
 * PARÁMETROS FINANCIEROS:
 * TREMA = 20% (Tasa de Rendimiento Mínima Aceptable)
 * T = 50% (Tasa impositiva)
 * n = 5 años (Horizonte de evaluación)
 * 
 * CRITERIO DE DECISIÓN:
 * VPN ≥ 0 → Aceptar proyecto
 * VPN < 0 → Rechazar proyecto
 * 
 * FÓRMULA DEL VPN:
 * VPN = -I₀ + Σₜ₌₁ⁿ [FNEₜ/(1+TREMA)ᵗ] + VS/(1+TREMA)ⁿ
 * 
 * donde FNEₜ = Flujo Neto de Efectivo en el año t
 */

// DISTRIBUCIONES DE VARIABLES ESTOCÁSTICAS
const INV_FLOW_PROBS = [0.2, 0.2, 0.2, 0.2, 0.2];
const INV_FLOW_VALS = [20000, 30000, 40000, 50000, 60000];

/**
 * SIMULACIÓN DEL PROYECTO DE INVERSIÓN
 * 
 * METODOLOGÍA DE EVALUACIÓN:
 * 1. Generar variables estocásticas
 * 2. Calcular depreciación anual
 * 3. Construir estado de resultados pro forma
 * 4. Calcular flujos netos de efectivo
 * 5. Descontar flujos a valor presente
 * 6. Evaluar criterio de aceptación
 */
export const simulateProject = (): InvestmentResult => {
  // ==================== GENERACIÓN DE VARIABLES ESTOCÁSTICAS ====================
  
  /**
   * INVERSIÓN INICIAL:
   * Distribución: Triangular(80k, 100k, 130k)
   * Interpretación: Costo de activos fijos y capital de trabajo
   * Signo: Negativo (salida de efectivo en t=0)
   */
  const inversionInicial = getTriangular(80000, 100000, 130000); 

  /**
   * VALOR DE RESCATE:
   * Distribución: Triangular(16k, 20k, 26k)
   * Interpretación: Valor de liquidación al final del proyecto
   * Signo: Positivo (entrada de efectivo en t=5)
   */
  const valorRescate = getTriangular(16000, 20000, 26000);

  /**
   * TASA DE INFLACIÓN:
   * Distribución: Triangular(15%, 20%, 25%)
   * Interpretación: Inflación esperada durante el horizonte
   * Uso: Ajuste de flujos nominales (si aplica)
   */
  const inflacion = getTriangular(0.15, 0.20, 0.25);

  // ==================== PARÁMETROS FINANCIEROS ====================
  const TREMA = 0.20; // 20%
  const TAX_RATE = 0.50; // 50%
  const PROJECT_YEARS = 5;
  
  /**
   * CÁLCULO DE DEPRECIACIÓN:
   * Método: Línea recta
   * Base depreciable = Inversión - Valor en libros
   * Depreciación anual = (I₀ - VS_contable) / n
   * 
   * Supuesto: VS_contable = VS_real para simplificación
   */
  const depreciacionAnual = (inversionInicial - valorRescate) / PROJECT_YEARS;

  // ==================== EVALUACIÓN FINANCIERA ====================
  let vpn = -inversionInicial;
  const flujosNetos: number[] = [];
  const netCashFlows: number[] = [];

  for (let t = 1; t <= PROJECT_YEARS; t++) {
    /**
     * ESTADO DE RESULTADOS PRO FORMA (año t):
     * 
     * Ingresos Brutos                    Fₜ
     * (-) Depreciación                   D
     * (=) Utilidad Antes de Impuestos    UAI = Fₜ - D
     * (-) Impuestos                      I = UAI × T
     * (=) Utilidad Neta                  UN = UAI - I
     * (+) Depreciación                   D (no es salida de efectivo)
     * (=) Flujo Neto de Efectivo         FNE = UN + D
     */
    const ingresoBruto = getDiscrete(INV_FLOW_PROBS, INV_FLOW_VALS);
    
    const uai = ingresoBruto - depreciacionAnual;
    const impuestos = uai * TAX_RATE;
    const utilidadNeta = uai - impuestos;
    
    const flujoEfectivo = utilidadNeta + depreciacionAnual;
    flujosNetos.push(flujoEfectivo);
    netCashFlows.push(flujoEfectivo);

    /**
     * DESCUENTO A VALOR PRESENTE:
     * VP(FNEₜ) = FNEₜ / (1 + TREMA)ᵗ
     */
    vpn += flujoEfectivo / Math.pow(1 + TREMA, t);
  }

  /**
   * VALOR DE RESCATE DESCONTADO:
   * VP(VS) = VS / (1 + TREMA)ⁿ
   */
  vpn += valorRescate / Math.pow(1 + TREMA, PROJECT_YEARS);

  /**
   * CRITERIO DE DECISIÓN:
   * VPN ≥ 0 → El proyecto crea valor económico
   * VPN < 0 → El proyecto destruye valor económico
   */
  return {
    vpn: vpn,
    isViable: vpn >= 0,
    yearlyFlows: flujosNetos,
    inflation: inflacion,
    roi: (vpn / inversionInicial) * 100,
    initialInvestment: inversionInicial,
    salvageValue: valorRescate,
    netCashFlows
  };
};
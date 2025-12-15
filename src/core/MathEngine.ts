/**
 * MOTOR MATEMÁTICO - METODOLOGÍA COSS BÚ
 * Implementación rigurosa de métodos estocásticos para simulación
 * Referencia: Raúl Coss Bú, "Simulación: Un Enfoque Práctico"
 */

/**
 * Generador de Distribución Triangular usando el Método de la Transformada Inversa.
 * 
 * FUNDAMENTO TEÓRICO:
 * La distribución triangular es fundamental en simulación cuando se conocen:
 * - Valor mínimo (a): Escenario más optimista
 * - Valor modal (m): Escenario más probable  
 * - Valor máximo (b): Escenario más pesimista
 * 
 * FUNCIÓN DE DENSIDAD:
 * f(x) = { 2(x-a)/[(b-a)(m-a)]     para a ≤ x ≤ m
 *        { 2(b-x)/[(b-a)(b-m)]     para m < x ≤ b
 * 
 * FUNCIÓN DE DISTRIBUCIÓN ACUMULADA:
 * F(x) = { (x-a)²/[(b-a)(m-a)]     para a ≤ x ≤ m
 *        { 1 - (b-x)²/[(b-a)(b-m)] para m < x ≤ b
 * 
 * TRANSFORMADA INVERSA:
 * Sea R ~ U(0,1) y Fc = (m-a)/(b-a)
 * Si R < Fc: X = a + √[R(b-a)(m-a)]
 * Si R ≥ Fc: X = b - √[(1-R)(b-a)(b-m)]
 */
export const getTriangular = (min: number, mode: number, max: number): number => {
  const R = Math.random(); // Variable aleatoria U(0,1)
  const Fc = (mode - min) / (max - min); // Punto de corte en la acumulada (CDF)

  if (R < Fc) {
    // Tramo ascendente: Resolvemos F(x) = R para x ∈ [a,m]
    // (x-a)²/[(b-a)(m-a)] = R
    // x = a + √[R(b-a)(m-a)]
    return min + Math.sqrt(R * (max - min) * (mode - min));
  } else {
    // Tramo descendente: Resolvemos F(x) = R para x ∈ [m,b]
    // 1 - (b-x)²/[(b-a)(b-m)] = R
    // x = b - √[(1-R)(b-a)(b-m)]
    return max - Math.sqrt((1 - R) * (max - min) * (max - mode));
  }
};

/**
 * Generador de Distribución Discreta Empírica.
 * 
 * FUNDAMENTO TEÓRICO:
 * Para una variable aleatoria discreta X con valores {x₁, x₂, ..., xₙ}
 * y probabilidades {p₁, p₂, ..., pₙ}, la transformada inversa se basa en:
 * 
 * FUNCIÓN DE DISTRIBUCIÓN ACUMULADA:
 * F(xᵢ) = P(X ≤ xᵢ) = Σⱼ₌₁ⁱ pⱼ
 * 
 * ALGORITMO DE TRANSFORMADA INVERSA:
 * 1. Generar R ~ U(0,1)
 * 2. Encontrar el menor i tal que F(xᵢ) ≥ R
 * 3. Retornar X = xᵢ
 * 
 * COMPLEJIDAD: O(n) en el peor caso, O(1) promedio si está balanceado
 */
export const getDiscrete = (probs: number[], values: number[]): number => {
  const R = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (R <= cumulative) {
      return values[i];
    }
  }
  return values[values.length - 1]; // Fallback por precisión flotante
};

/**
 * EJERCICIO 1: FUNCIÓN DE DENSIDAD POR PARTES
 * 
 * DEFINICIÓN DE LA FUNCIÓN:
 * f(x) = { -x + 5/4    para 0 ≤ x ≤ 1
 *        { 1/4         para 1 < x ≤ 2
 *        { 0           en otro caso
 * 
 * VERIFICACIÓN DE VALIDEZ (∫f(x)dx = 1):
 * ∫₀¹(-x + 5/4)dx + ∫₁²(1/4)dx = [-x²/2 + 5x/4]₀¹ + [x/4]₁²
 * = (-1/2 + 5/4) + (2/4 - 1/4) = 3/4 + 1/4 = 1 ✓
 * 
 * FUNCIÓN DE DISTRIBUCIÓN ACUMULADA:
 * F(x) = { 0                           para x < 0
 *        { -x²/2 + 5x/4               para 0 ≤ x ≤ 1
 *        { 3/4 + (x-1)/4              para 1 < x ≤ 2
 *        { 1                           para x > 2
 * 
 * PUNTOS CRÍTICOS:
 * F(1) = -1/2 + 5/4 = 3/4 = 0.75
 * 
 * TRANSFORMADA INVERSA:
 * Para R ∈ [0, 0.75]: Resolver -x²/2 + 5x/4 = R
 * Ecuación cuadrática: -x²/2 + 5x/4 - R = 0
 * Multiplicando por -2: x² - 5x/2 + 2R = 0
 * Solución: x = (5/4 ± √(25/16 - 8R))/2
 * 
 * Para R ∈ (0.75, 1]: Resolver 3/4 + (x-1)/4 = R
 * x = 1 + 4(R - 3/4) = 4R - 2
 */
export const getCustomPDF = (): number => {
  const R = Math.random();
  // Punto de corte: F(1) = 0.75
  
  if (R <= 0.75) {
    // Tramo [0,1]: Resolver -x²/2 + 5x/4 = R
    // Forma estándar: -x²/2 + 5x/4 - R = 0
    // Multiplicando por -2: x² - 5x/2 + 2R = 0
    const a = -0.5;
    const b = 1.25;
    const c = -R;
    // Fórmula cuadrática: x = (-b ± √(b²-4ac))/(2a)
    // Seleccionamos la raíz que está en [0,1]
    return (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  } else {
    // Tramo [1,2]: Resolver 3/4 + (x-1)/4 = R
    // (x-1)/4 = R - 3/4
    // x = 1 + 4(R - 3/4) = 4R - 2
    return 4 * (R - 0.5);
  }
};

/**
 * EJERCICIO ERLANG-2: DISTRIBUCIÓN GAMMA CON k=2
 * 
 * FUNCIÓN DE DENSIDAD:
 * f(x) = (2λ)² · x · e^(-2λx) = 4λ²x·e^(-2λx)  para x ≥ 0
 * 
 * FUNDAMENTO TEÓRICO:
 * La distribución Erlang-k es un caso especial de la distribución Gamma
 * donde el parámetro de forma es un entero positivo k.
 * 
 * TEOREMA DE CONVOLUCIÓN:
 * Si X₁, X₂, ..., Xₖ son variables exponenciales independientes con parámetro λ,
 * entonces Y = X₁ + X₂ + ... + Xₖ ~ Erlang(k, λ)
 * 
 * PARA k=2:
 * Y = X₁ + X₂ donde X₁, X₂ ~ Exp(2λ)
 * 
 * TRANSFORMADA INVERSA PARA EXPONENCIAL:
 * Si R ~ U(0,1), entonces X = -ln(R)/λ ~ Exp(λ)
 * 
 * ALGORITMO:
 * 1. Generar R₁, R₂ ~ U(0,1)
 * 2. X₁ = -ln(R₁)/(2λ), X₂ = -ln(R₂)/(2λ)
 * 3. Y = X₁ + X₂ = -[ln(R₁) + ln(R₂)]/(2λ) = -ln(R₁·R₂)/(2λ)
 */
export const getErlang2 = (lambda: number): number => {
  // Generar dos variables uniformes independientes
  const R1 = Math.random();
  const R2 = Math.random();
  
  // Aplicar transformada inversa para suma de exponenciales
  // Y = -ln(R₁·R₂)/(2λ)
  const rate = 2 * lambda;
  
  return (-1 / rate) * Math.log(R1 * R2);
};

/**
 * FUNCIÓN AUXILIAR: Evaluación de PDF por partes
 * Utilizada para generar gráficos teóricos y validación
 */
export const evaluatePDF = (x: number): number => {
  if (x >= 0 && x <= 1) {
    return -x + 5/4;  // Tramo descendente
  } else if (x > 1 && x <= 2) {
    return 1/4;       // Tramo constante
  }
  return 0;           // Fuera del dominio
};

/**
 * FUNCIÓN AUXILIAR: Evaluación de CDF por partes
 * Utilizada para validación y verificación de resultados
 */
export const evaluateCDF = (x: number): number => {
  if (x < 0) return 0;
  if (x <= 1) {
    return -0.5 * x * x + (5/4) * x;  // ∫₀ˣ(-t + 5/4)dt
  } else if (x <= 2) {
    return 0.75 + 0.25 * (x - 1);     // F(1) + ∫₁ˣ(1/4)dt
  }
  return 1;
};
import { useState, useCallback, useRef } from 'react';
import { simulateMagazineMonth, simulateProject, MagazineResult, InvestmentResult } from '../core/BusinessLogic';
import { getCustomPDF } from '../core/MathEngine';

// Tipos para el Hook
type SimulationType = 'MAGAZINE' | 'INVESTMENT' | 'CUSTOM_PDF';

interface SimulationStats {
  iterations: number;
  mean: number;
  max: number;
  min: number;
  stdDev: number; // Desviación Estándar
  probabilitySuccess?: number; // Para el proyecto de inversión (VPN > 0)
}

export const useSimulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]); // Array crudo de datos
  const [stats, setStats] = useState<SimulationStats | null>(null);
  
  // Referencia para cancelar simulación si se desmonta el componente
  const abortRef = useRef(false);

  /**
   * Ejecutor Genérico de Simulaciones (Monte Carlo)
   * Usa setTimeout para permitir que la UI respire (non-blocking).
   */
  const runSimulation = useCallback(async (
    type: SimulationType, 
    iterations: number, 
    params?: any
  ) => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    abortRef.current = false;

    const BATCH_SIZE = 500; // Procesar 500 iteraciones por frame
    let currentIter = 0;
    let accumulatedResults: any[] = [];
    
    // Acumuladores para estadística Welford (media/varianza on-the-fly)
    let m_n = 0; // Media actual
    let s_n = 0; // Suma de cuadrados de diferencias

    const processBatch = () => {
      if (abortRef.current) return;

      const limit = Math.min(currentIter + BATCH_SIZE, iterations);
      
      for (; currentIter < limit; currentIter++) {
        let resultValue = 0;
        let rawResult: any = {};

        // 1. Ejecutar Lógica Unitaria
        if (type === 'MAGAZINE') {
          rawResult = simulateMagazineMonth(params.quantity || 10);
          resultValue = rawResult.profit;
        } else if (type === 'INVESTMENT') {
          rawResult = simulateProject();
          resultValue = rawResult.vpn;
        } else if (type === 'CUSTOM_PDF') {
          resultValue = getCustomPDF();
          rawResult = { value: resultValue };
        }

        // 2. Guardar Raw Data (Opcional: limitar si son 1M de datos)
        accumulatedResults.push(rawResult);

        // 3. Calcular Estadística Incremental (Algoritmo de Welford)
        const prevMean = m_n;
        m_n = m_n + (resultValue - m_n) / (currentIter + 1);
        s_n = s_n + (resultValue - m_n) * (resultValue - prevMean);
      }

      // Actualizar UI
      setProgress(Math.round((currentIter / iterations) * 100));

      if (currentIter < iterations) {
        // Programar siguiente lote
        setTimeout(processBatch, 0);
      } else {
        // --- FINALIZACIÓN ---
        const variance = s_n / (iterations - 1);
        const stdDev = Math.sqrt(variance);
        
        // Cálculos específicos post-simulación
        let probSuccess = undefined;
        if (type === 'INVESTMENT') {
            const successCount = accumulatedResults.filter(r => r.isViable).length;
            probSuccess = successCount / iterations;
        }

        // Buscar Min/Max (costoso en arrays grandes, hacerlo al final)
        const values = accumulatedResults.map(r => 
            type === 'MAGAZINE' ? r.profit : (type === 'INVESTMENT' ? r.vpn : r.value)
        );
        
        setStats({
          iterations,
          mean: m_n,
          stdDev,
          min: Math.min(...values),
          max: Math.max(...values),
          probabilitySuccess: probSuccess
        });

        setResults(accumulatedResults);
        setIsRunning(false);
      }
    };

    // Iniciar el loop
    setTimeout(processBatch, 0);

  }, []);

  const stopSimulation = () => {
    abortRef.current = true;
    setIsRunning(false);
  };

  // Legacy compatibility methods
  const runInvestmentSimulation = (iterations: number, seed?: number) => {
    runSimulation('INVESTMENT', iterations);
  };

  const runMagazineSimulation = (policyQ: number, iterations: number, seed?: number) => {
    runSimulation('MAGAZINE', iterations, { quantity: policyQ });
  };

  return {
    runSimulation,
    stopSimulation,
    isRunning,
    progress,
    results, // Array completo para gráficas (Histogramas)
    stats,   // Resumen estadístico
    // Legacy compatibility
    runInvestmentSimulation,
    runMagazineSimulation,
    summary: stats ? {
      probabilityPositiveNPV: stats.probabilitySuccess || 0,
      averageNPV: stats.mean,
      maxNPV: stats.max,
      minNPV: stats.min,
      standardDeviation: stats.stdDev,
      acceptanceRecommendation: (stats.probabilitySuccess || 0) >= 0.70 ? 'ACCEPT' : 
                               (stats.probabilitySuccess || 0) >= 0.50 ? 'MARGINAL' : 'REJECT',
      // Magazine specific
      averageProfit: stats.mean,
      profitVariance: stats.stdDev * stats.stdDev,
      successRate: stats.probabilitySuccess || 0,
      quantity: 0
    } : null
  };
};
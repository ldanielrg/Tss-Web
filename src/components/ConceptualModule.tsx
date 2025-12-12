import React, { useState } from 'react';
import { BookOpen, HelpCircle, Calculator, BarChart3 } from 'lucide-react';
import Tooltip from './Tooltip';

const ConceptualModule: React.FC = () => {
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const concepts = [
    {
      id: 'variable-aleatoria',
      title: 'Variable Aleatoria',
      icon: <Calculator className="w-6 h-6" />,
      description: 'Una función que asigna un número real a cada resultado de un experimento aleatorio.',
      details: `Una Variable Aleatoria (VA) es el resultado numérico de un experimento estocástico. 
      Por ejemplo, si lanzamos una moneda 10 veces, la VA podría ser "número de caras obtenidas".
      
      Matemáticamente: X: Ω → ℝ
      
      Donde Ω es el espacio muestral y ℝ son los números reales.`,
      formula: 'X(ω) = valor numérico del resultado ω'
    },
    {
      id: 'distribucion',
      title: 'Distribución de Probabilidad',
      icon: <BarChart3 className="w-6 h-6" />,
      description: 'Modelo matemático que describe cómo se distribuyen las probabilidades de una variable aleatoria.',
      details: `Una Distribución de Probabilidad es el modelo teórico que describe el comportamiento 
      probabilístico de una Variable Aleatoria.
      
      Componentes principales:
      • Función de Densidad de Probabilidad f(x)
      • Función de Distribución Acumulada F(x)
      • Parámetros que definen la forma de la distribución`,
      formula: 'P(a ≤ X ≤ b) = ∫[a,b] f(x)dx'
    },
    {
      id: 'simulacion',
      title: 'Simulación Monte Carlo',
      icon: <HelpCircle className="w-6 h-6" />,
      description: 'Método para imitar el comportamiento de sistemas reales usando números aleatorios.',
      details: `La Simulación Monte Carlo usa números pseudoaleatorios para imitar procesos reales 
      y estimar resultados cuando el análisis matemático directo es complejo.
      
      Proceso básico:
      1. Generar números aleatorios U(0,1)
      2. Transformarlos según la distribución deseada
      3. Ejecutar el modelo muchas veces
      4. Analizar los resultados estadísticamente`,
      formula: 'X = F⁻¹(R) donde R ~ U(0,1)'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Módulo A: Conceptos Fundamentales</h2>
        </div>
        <p className="text-blue-100">
          Explora los fundamentos teóricos de la simulación estadística según la metodología de Coss Bú.
          Haz clic en cada concepto para profundizar en su explicación.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {concepts.map((concept) => (
          <div key={concept.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div 
              className="p-6 cursor-pointer"
              onClick={() => setSelectedConcept(selectedConcept === concept.id ? null : concept.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-blue-600">
                  {concept.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{concept.title}</h3>
                <Tooltip 
                  content="Haz clic para ver más detalles"
                  title="Ayuda"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </div>
              <p className="text-gray-600 text-sm">{concept.description}</p>
            </div>

            {selectedConcept === concept.id && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="mt-4 space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Explicación Detallada:</h4>
                    <p className="text-blue-800 text-sm whitespace-pre-line">{concept.details}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Fórmula:</h4>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{concept.formula}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <div className="flex items-start space-x-3">
          <div className="text-amber-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-800">Referencia Teórica</h4>
            <p className="text-amber-700 text-sm mt-1">
              Estos conceptos están basados en la metodología de simulación de Raúl Coss Bú. 
              La diferencia clave es que una <strong>Variable Aleatoria</strong> es el resultado de un experimento, 
              mientras que la <strong>Distribución</strong> es el modelo matemático que describe su comportamiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptualModule;
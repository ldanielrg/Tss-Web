import React from 'react';
import type { TruckQueueParams } from '../types/truckQueueSimulation';

type Props = {
  params: TruckQueueParams;
};

function fmtTime(s: string) {
  return s?.trim() || '-';
}

const TruckQueueStepOnePanel: React.FC<Props> = ({ params }) => {
  const H = params.duracionJornadaHoras;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-orange-800">Paso 1: Planteamiento y función de costo</h4>
        <span className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded">
          Objetivo: minimizar costo total
        </span>
      </div>

      <div className="bg-white rounded-lg border p-3">
        <p className="text-sm text-gray-700">
          <strong>Clientes:</strong> camiones.{' '}
          <strong>Servidor:</strong> el equipo completo de descarga (se modela como 1 servidor).{' '}
          <strong>Disciplina:</strong> FIFO.{' '}
          <strong>Decisión:</strong> comparar tamaño de equipo (3, 4, 5, 6) y elegir el de menor costo promedio.
        </p>
      </div>

      <div className="bg-white rounded-lg border p-3">
        <h5 className="text-sm font-semibold text-gray-800 mb-2">Línea de tiempo (horarios)</h5>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded bg-gray-50 border">
            <div className="font-medium">Inicio</div>
            <div className="text-gray-700">{fmtTime(params.horaInicio)} (t = 0)</div>
          </div>
          <div className="p-2 rounded bg-gray-50 border">
            <div className="font-medium">Límite de llegadas</div>
            <div className="text-gray-700">{fmtTime(params.limiteLlegadas)}</div>
          </div>
          <div className="p-2 rounded bg-gray-50 border">
            <div className="font-medium">Break</div>
            <div className="text-gray-700">
              {fmtTime(params.horaBreak)} + {fmtTime(params.duracionBreak)} (no interrumpe servicio)
            </div>
          </div>
          <div className="p-2 rounded bg-gray-50 border">
            <div className="font-medium">Fin jornada normal</div>
            <div className="text-gray-700">{H} horas desde el inicio (define horas extra)</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-3">
        <h5 className="text-sm font-semibold text-gray-800 mb-2">Función de costo por noche</h5>

        <div className="text-sm text-gray-700 space-y-2">
          <div className="p-2 bg-gray-50 border rounded">
            <div className="font-medium">Costo total</div>
            <div className="font-mono text-xs md:text-sm">
              C_total = C_sal_normal + C_sal_extra + C_espera + C_operación
            </div>
          </div>

          <ul className="list-disc ml-5 space-y-1">
            <li>
              <span className="font-medium">Salario normal:</span>{' '}
              <span className="font-mono text-xs md:text-sm">C_sal_normal = n · salarioHora · H</span>
            </li>
            <li>
              <span className="font-medium">Salario extra:</span>{' '}
              <span className="font-mono text-xs md:text-sm">
                C_sal_extra = n · salarioExtraHora · max(0, (FinÚltimo − H·60))/60
              </span>
            </li>
            <li>
              <span className="font-medium">Espera de camiones:</span>{' '}
              <span className="font-mono text-xs md:text-sm">
                C_espera = costoEsperaCamionHora · (Σ Espera_i)/60
              </span>
            </li>
            <li>
              <span className="font-medium">Operación del almacén:</span>{' '}
              <span className="font-mono text-xs md:text-sm">
                C_operación = costoOperacionAlmacenHora · (TiempoOperación)/60
              </span>
            </li>
          </ul>

          <div className="text-xs text-gray-600">
            <strong>n</strong> = # de personas (trabajadores) en el equipo de descarga. <br />
            <strong>n</strong> ∈ {'{'}3,4,5,6{'}'}
          </div>

          <p className="text-xs text-gray-500">
            Nota: FinÚltimo es el tiempo (en minutos desde el inicio) cuando termina de descargarse el último camión
            atendido en la noche.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-3">
        <h5 className="text-sm font-semibold text-gray-800 mb-2">Parámetros actuales</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm border">
            <tbody>
              <tr>
                <td className="border px-2 py-2 font-medium">Salario/Hora</td>
                <td className="border px-2 py-2">Bs. {params.salarioHora}</td>
                <td className="border px-2 py-2 font-medium">Salario Extra/Hora</td>
                <td className="border px-2 py-2">Bs. {params.salarioExtraHora}</td>
              </tr>
              <tr>
                <td className="border px-2 py-2 font-medium">Espera Camión/H</td>
                <td className="border px-2 py-2">Bs. {params.costoEsperaCamionHora}</td>
                <td className="border px-2 py-2 font-medium">Operación Almacén/H</td>
                <td className="border px-2 py-2">Bs. {params.costoOperacionAlmacenHora}</td>
              </tr>
              <tr>
                <td className="border px-2 py-2 font-medium">Turnos (N)</td>
                <td className="border px-2 py-2">{params.nTurnos}</td>
                <td className="border px-2 py-2 font-medium">Equipo</td>
                <td className="border px-2 py-2">{params.personas}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          En el Paso 2 se mostrarán las distribuciones (tablas) y cómo se generan los tiempos mediante la transformada
          inversa.
        </p>
      </div>
    </div>
  );
};

export default TruckQueueStepOnePanel;

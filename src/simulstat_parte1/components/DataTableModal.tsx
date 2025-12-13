import { downloadCsv } from "../utils/csv";

export default function DataTableModal({
  title,
  rows,
  onClose,
  previewRows = 200,
  fileName = "resultados.csv",
}: {
  title: string;
  rows: Record<string, any>[];
  onClose: () => void;
  previewRows?: number;
  fileName?: string;
}) {
  const preview = rows.slice(0, previewRows);
  const headers = preview.length ? Object.keys(preview[0]) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[85vh] overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 text-sm rounded bg-gray-900 text-white"
              onClick={() => downloadCsv(fileName, rows)}
            >
              Descargar CSV
            </button>
            <button className="px-3 py-2 text-sm rounded border" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto max-h-[75vh]">
          {!rows.length ? (
            <div className="text-sm text-gray-500">Sin datos</div>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-2">
                Mostrando {preview.length} de {rows.length} filas (preview).
              </div>
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="border px-2 py-1 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, idx) => (
                    <tr key={idx}>
                      {headers.map((h) => (
                        <td key={h} className="border px-2 py-1">{String(r[h])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

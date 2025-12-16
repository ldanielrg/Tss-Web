export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);

  const escape = (v: any) => {
    const s = String(v ?? "");

    // reemplazo compatible (sin replaceAll)
    const escapedQuotes = s.split('"').join('""');

    if (s.includes(",") || s.includes("\n") || s.includes('"')) {
      return `"${escapedQuotes}"`;
    }
    return escapedQuotes;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

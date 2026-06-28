
export default function TableFormat({ columns, rows, emptyText = "No data found.", loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
            {columns.map((c) => (
              <div key={c.key} className="h-4 skeleton rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 py-3 text-left font-body text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="font-body text-center py-16 text-gray-400 text-sm"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors duration-100"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 font-body text-gray-700 align-middle ${col.className || ""}`}>
                      {col.render ? col.render(row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  actions,
  pageSize = 10
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || searchKeys.length === 0) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => {
      return searchKeys.some(key => {
        const val = item[key];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Safe parse for sorting
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  return (
    <div className="bg-white border border-brand-sand rounded-2xl shadow-sm overflow-hidden flex flex-col font-inter">
      {/* Top Search & Actions Bar */}
      <div className="p-4 md:p-5 border-b border-brand-sand flex flex-col sm:flex-row items-center justify-between gap-4">
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-brand-cream border border-brand-sand rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-brand-primary placeholder-brand-dark/40"
            />
            <Search className="w-4 h-4 text-brand-dark/45 absolute left-3 top-2.5" />
          </div>
        )}
        <div className="w-full sm:w-auto flex items-center justify-end">
          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-brand-cream border-b border-brand-sand text-brand-ocean font-bold">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && requestSort(col.key)}
                  className={`px-6 py-4 select-none ${col.sortable ? 'cursor-pointer hover:bg-brand-sand/30' : ''}`}
                >
                  <div className="flex items-center gap-1.5 uppercase tracking-wider">
                    {col.label}
                    {col.sortable && <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-sand">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center font-medium text-brand-dark/50">
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-brand-sand/10 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-3.5 font-medium text-brand-dark/80">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-brand-sand flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-cream/35">
        <p className="text-xs font-semibold text-brand-dark/50 font-space">
          Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} records
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 font-space">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1.5 border border-brand-sand bg-white hover:bg-brand-sand/20 rounded-lg text-brand-dark transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-brand-ocean px-3.5">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-brand-sand bg-white hover:bg-brand-sand/20 rounded-lg text-brand-dark transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

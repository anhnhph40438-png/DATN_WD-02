import React from 'react';

const TableSkeleton = ({ columns, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {columns.map((col, colIndex) => (
            <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-dark-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  onRowClick,
  striped = false,
  hoverable = true
}) => {
  const isEmpty = !loading && (!data || data.length === 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-dark-100">
        {/* Header */}
        <thead className="bg-dark-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                scope="col"
                className={`
                  px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider
                  ${column.className || ''}
                `}
                style={column.width ? { width: column.width } : {}}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-dark-100">
          {loading ? (
            <TableSkeleton columns={columns} />
          ) : isEmpty ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-dark-400"
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-dark-300 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row._id || row.id || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={`
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${hoverable ? 'hover:bg-dark-50' : ''}
                  ${striped && rowIndex % 2 === 1 ? 'bg-dark-50' : ''}
                `}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    className={`
                      px-6 py-4 whitespace-nowrap text-sm text-dark-900
                      ${column.cellClassName || ''}
                    `}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

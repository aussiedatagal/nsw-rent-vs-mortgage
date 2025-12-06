import { useState, useMemo } from 'react';

export function DataTable({ housingData, suburbLookup, onPostcodeClick, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('ratio');
  const [sortDirection, setSortDirection] = useState('desc');

  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  });

  const tableData = useMemo(() => {
    let data = Object.values(housingData)
      .filter(
        (d) =>
          suburbLookup[d.Postcode] ||
          d.yearly_median_weekly_rent ||
          d.yearly_median_sales_price_000s
      )
      .map((d) => ({
        postcode: d.Postcode,
        suburb: suburbLookup[d.Postcode] || `Postcode ${d.Postcode}`,
        ratio: d.rent_vs_payment_ratio,
        rent: d.yearly_median_weekly_rent,
        mortgage_payment: d.calculated_weekly_payment
      }));

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      data = data.filter(
        (item) =>
          item.postcode.includes(lowerQuery) ||
          item.suburb.toLowerCase().includes(lowerQuery)
      );
    }

    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (sortKey === 'suburb') {
        return valA.localeCompare(valB) * (sortDirection === 'asc' ? 1 : -1);
      }
      return (valA - valB) * (sortDirection === 'asc' ? 1 : -1);
    });

    return data;
  }, [housingData, suburbLookup, searchQuery, sortKey, sortDirection]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (val) => (val !== null && val !== undefined ? formatter.format(val) : 'N/A');
  const formatRatio = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (val === Infinity) return '∞';
    return val.toFixed(2);
  };

  const getSortClass = (key) => {
    if (sortKey !== key) return '';
    return sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
  };

  return (
    <div className="w-full md:w-1/3 max-w-lg bg-white p-4 shadow-xl flex-col h-full hidden md:flex">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-4 sticky top-0 bg-white pt-1 pb-2 border-b">
        Housing Cost Data
      </h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search postcode or suburb..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading data...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th
                  onClick={() => handleSort('suburb')}
                  className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 ${getSortClass('suburb')}`}
                >
                  Suburb
                </th>
                <th
                  onClick={() => handleSort('postcode')}
                  className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 ${getSortClass('postcode')}`}
                >
                  Postcode
                </th>
                <th
                  onClick={() => handleSort('ratio')}
                  className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 ${getSortClass('ratio')}`}
                >
                  Ratio
                </th>
                <th
                  onClick={() => handleSort('rent')}
                  className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 ${getSortClass('rent')}`}
                >
                  Rent (Wk)
                </th>
                <th
                  onClick={() => handleSort('mortgage_payment')}
                  className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 ${getSortClass('mortgage_payment')}`}
                >
                  Mortgage (Wk)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((item) => (
                <tr
                  key={item.postcode}
                  onClick={() => onPostcodeClick(item.postcode)}
                  className="hover:bg-gray-50 cursor-pointer transition:background-color"
                >
                  <td className="px-2 py-2 text-sm text-gray-900 min-w-[160px] max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.suburb}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900">{item.postcode}</td>
                  <td className="px-2 py-2 text-sm text-gray-900">{formatRatio(item.ratio)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900">{formatCurrency(item.rent)}</td>
                  <td className="px-2 py-2 text-sm text-gray-900">
                    {formatCurrency(item.mortgage_payment)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


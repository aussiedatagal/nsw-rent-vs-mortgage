import { BoxPlot } from './BoxPlot';

export function Popup({ postcode, data, suburbLookup, mortgageType }) {
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  });

  const suburbs = suburbLookup[postcode] || `Postcode ${postcode}`;
  let displaySuburbs = suburbs;
  const suburbList = suburbs.split(/\s*,\s*/);
  if (suburbList.length > 9) {
    displaySuburbs = suburbList.slice(0, 9).join(', ') + '...';
  }

  const formatCurrency = (val) => (val != null ? formatter.format(val) : 'N/A');
  const salesPrice = (data.yearly_median_sales_price_000s || 0) * 1000;

  const rentQ3 = data.yearly_third_quartile_weekly_rent || data.yearly_median_weekly_rent || 0;
  const paymentQ3 = data.yearly_third_quartile_total_weekly_cost || data.yearly_third_quartile_weekly_payment || data.total_weekly_homeowner_cost || data.calculated_weekly_payment || 0;
  const maxCost = Math.max(rentQ3, paymentQ3) * 1.1 || 100;

  return (
    <div className="p-2 font-sans" style={{ width: '320px', minWidth: '320px', maxWidth: '400px', boxSizing: 'border-box' }}>
      <h3 className="text-base font-bold mb-0 leading-tight break-words" title={suburbs} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
        {displaySuburbs}
      </h3>
      <div className="text-xs text-gray-500 mb-2">Postcode: {postcode}</div>

      <div className="mb-2 border-b pb-2">
        <h4 className="text-xs font-bold text-gray-700 mb-1">Median Weekly Costs</h4>

        <div className="flex justify-between items-center">
          <span className="text-xs">Median Rent:</span>
          <span className="font-semibold text-sm text-blue-700">
            {formatCurrency(data.yearly_median_weekly_rent)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs">
            {mortgageType === 'IO' ? 'Interest Payment:' : 'Mortgage Payment:'}
          </span>
          <span className="font-semibold text-sm text-red-600">
            {formatCurrency(
              mortgageType === 'IO'
                ? data.calculated_weekly_interest
                : data.calculated_weekly_payment
            )}
          </span>
        </div>

        {mortgageType === 'PI' && (
          <div className="flex justify-between items-center">
            <span className="text-xs pl-2 text-gray-600">└ Interest Component:</span>
            <span className="font-semibold text-sm text-gray-600">
              {formatCurrency(data.calculated_weekly_interest)}
            </span>
          </div>
        )}

        {data.total_weekly_homeowner_cost && data.total_weekly_homeowner_cost > data.calculated_weekly_payment && (
          <div className="flex justify-between items-center">
            <span className="text-xs pl-2 text-gray-600">└ + Homeowner Costs:</span>
            <span className="font-semibold text-sm text-gray-600">
              {formatCurrency(data.total_weekly_homeowner_cost - data.calculated_weekly_payment)}
            </span>
          </div>
        )}

        {data.total_weekly_homeowner_cost && (
          <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200">
            <span className="text-xs font-semibold">Total Weekly Cost:</span>
            <span className="font-bold text-sm text-red-700">
              {formatCurrency(data.total_weekly_homeowner_cost)}
            </span>
          </div>
        )}
      </div>

      <h4 className="text-xs font-semibold mt-2 mb-1">Weekly Cost Range</h4>
      <div className="box-plot-container">
        <BoxPlot
          q1={data.yearly_first_quartile_weekly_rent}
          median={data.yearly_median_weekly_rent}
          q3={data.yearly_third_quartile_weekly_rent}
          label="Rent"
          color="#22c55e"
          maxCost={maxCost}
        />
        <BoxPlot
          q1={data.yearly_first_quartile_total_weekly_cost || data.yearly_first_quartile_weekly_payment}
          median={data.total_weekly_homeowner_cost || data.calculated_weekly_payment}
          q3={data.yearly_third_quartile_total_weekly_cost || data.yearly_third_quartile_weekly_payment}
          label={mortgageType === 'PI' ? 'P+I' : 'I.O.'}
          color="#ef4444"
          maxCost={maxCost}
        />
      </div>

      <div className="text-xs text-gray-500 mt-1">
        Median Sale Price: {salesPrice > 0 ? (salesPrice / 1000).toLocaleString() : 'N/A'} k
      </div>
    </div>
  );
}


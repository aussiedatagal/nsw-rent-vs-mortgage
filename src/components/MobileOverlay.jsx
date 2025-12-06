import { BoxPlot } from './BoxPlot';

export function MobileOverlay({ postcode, data, suburbLookup, mortgageType, onClose }) {
  if (!data) return null;

  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  });

  const suburbs = suburbLookup[postcode] || `Postcode ${postcode}`;
  const formatCurrency = (val) => (val != null ? formatter.format(val) : 'N/A');
  const salesPrice = (data.yearly_median_sales_price_000s || 0) * 1000;

  const rentQ3 = data.yearly_third_quartile_weekly_rent || data.yearly_median_weekly_rent || 0;
  const paymentQ3 = data.yearly_third_quartile_weekly_payment || data.calculated_weekly_payment || 0;
  const maxCost = Math.max(rentQ3, paymentQ3) * 1.1 || 100;

  return (
    <div
      className="md:hidden fixed inset-0 bg-white z-[2000] transform translate-y-0 transition-transform duration-300 ease-in-out overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 truncate">{suburbs}</h2>
            <div className="text-sm text-gray-500">Postcode: {postcode}</div>
          </div>
        </div>
      </div>
      <div className="p-4 pb-8">
        <div className="mb-4 border-b pb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Median Weekly Costs</h3>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Median Rent:</span>
            <span className="font-semibold text-base text-blue-700">
              {formatCurrency(data.yearly_median_weekly_rent)}
            </span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {mortgageType === 'IO' ? 'Interest Payment:' : 'Mortgage Payment:'}
            </span>
            <span className="font-semibold text-base text-red-600">
              {formatCurrency(
                mortgageType === 'IO'
                  ? data.calculated_weekly_interest
                  : data.calculated_weekly_payment
              )}
            </span>
          </div>

          {mortgageType === 'PI' && (
            <div className="flex justify-between items-center">
              <span className="text-sm pl-2 text-gray-600">└ Interest Component:</span>
              <span className="font-semibold text-base text-gray-600">
                {formatCurrency(data.calculated_weekly_interest)}
              </span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Weekly Cost Range</h3>
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
              q1={data.yearly_first_quartile_weekly_payment}
              median={data.calculated_weekly_payment}
              q3={data.yearly_third_quartile_weekly_payment}
              label={mortgageType === 'PI' ? 'P+I' : 'I.O.'}
              color="#ef4444"
              maxCost={maxCost}
            />
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Median Sale Price: <span className="font-semibold">
            {salesPrice > 0 ? (salesPrice / 1000).toLocaleString() : 'N/A'} k
          </span>
        </div>
      </div>
    </div>
  );
}


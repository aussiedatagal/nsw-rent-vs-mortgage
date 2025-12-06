import { useState } from 'react';

export function Header() {
  const [isOpen, setIsOpen] = useState(true);

  const description = "This map compares median weekly rent to an estimated mortgage payment in each postcode. Red areas highlight where rent meets or exceeds the mortgage payment, meaning tenants are covering the full cost of the loan and, in some places, even putting extra cash straight into the landlord's pocket for an asset they will never own.";

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm w-full z-20">
      <div className="max-w-7xl mx-auto p-2 md:p-4">
        <div className="flex justify-between items-center gap-2">
          <h1 className="text-base md:text-2xl font-bold text-gray-800 flex-1">
            Paying off your landlord's house
          </h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            aria-label={isOpen ? 'Hide header' : 'Show header'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {isOpen && (
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
            <p className="text-xs md:text-sm text-gray-600">
              {description}
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="font-semibold text-gray-700 mt-2 mb-1">Data Sources:</div>
              <div>
                <strong>Rent & Sales Data:</strong>{' '}
                <a
                  href="https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  NSW Department of Communities and Justice (DCJ)
                </a>
              </div>
              <div>
                <strong>Postcode Boundaries:</strong>{' '}
                <a
                  href="https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Australian Bureau of Statistics (ABS)
                </a>
              </div>
              <div>
                <strong>Suburb Names:</strong>{' '}
                <a
                  href="https://www.data.gov.au/data/dataset/asgs-edition-3-2021-correspondences"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  data.gov.au
                </a>
              </div>
              <div>
                <strong>Map tiles:</strong>{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  OpenStreetMap
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}


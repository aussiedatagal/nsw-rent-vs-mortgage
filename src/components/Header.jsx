import { useState } from 'react';

export function Header() {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const description = "This map compares median weekly rent to an estimated mortgage payment in each postcode. Red areas highlight where rent meets or exceeds the mortgage payment, meaning tenants are covering the full cost of the loan and, in some places, even putting extra cash straight into the landlord's pocket for an asset they will never own.";

  return (
    <header className="bg-white border-b border-gray-200 p-2 md:p-4 shadow-sm w-full z-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center gap-2">
          <h1 className="text-base md:text-2xl font-bold text-gray-800 flex-1">
            Paying off your landlord's house
          </h1>
          <button
            onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
            className="md:hidden w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            aria-label={isDescriptionOpen ? 'Hide description' : 'Show description'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isDescriptionOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              )}
            </svg>
          </button>
        </div>
        <p className="text-xs md:text-sm text-gray-600 mt-1 hidden md:block">
          {description}
        </p>
        <p className={`text-xs text-gray-600 mt-1 ${isDescriptionOpen ? '' : 'hidden'}`}>
          {description}
        </p>
      </div>
    </header>
  );
}


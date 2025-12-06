import { useState } from 'react';

export function MortgageSettings({ settings, onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="info-card absolute top-2 right-2 md:top-4 md:right-4 rounded-xl w-64 md:w-80 z-[1000]">
      <div
        className="p-4 md:p-5 flex justify-between items-center cursor-pointer hover:bg-gray-100/50 rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h1 className="text-sm font-bold text-gray-800">Mortgage Settings</h1>
        <svg
          className={`w-6 h-6 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-gray-200">
          <p className="text-xs text-gray-600 pt-4 mb-4">
            Map color indicates the Weekly Rent / Weekly Mortgage Payment ratio.
            <span className="font-semibold block mt-1">
              A ratio &gt; 1 (Red) means Rent is more expensive than the Mortgage Payment.
            </span>
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex flex-col">
              <label htmlFor="mortgageType" className="text-xs font-medium text-gray-700">
                Mortgage Type
              </label>
              <select
                id="mortgageType"
                value={settings.mortgageType}
                onChange={(e) => handleChange('mortgageType', e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PI">Principal & Interest (P+I)</option>
                <option value="IO">Interest Only (IO)</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="interestRate" className="text-xs font-medium text-gray-700">
                Interest Rate (%)
              </label>
              <input
                type="number"
                id="interestRate"
                value={settings.interestRate}
                onChange={(e) => handleChange('interestRate', parseFloat(e.target.value))}
                step="0.1"
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {settings.mortgageType === 'PI' && (
              <div className="flex flex-col">
                <label htmlFor="loanTerm" className="text-xs font-medium text-gray-700">
                  Loan Term (Years)
                </label>
                <input
                  type="number"
                  id="loanTerm"
                  value={settings.loanTermYears}
                  onChange={(e) => handleChange('loanTermYears', parseInt(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-1">Deposit Input Type</label>
              <div className="flex space-x-4 mb-2 text-xs">
                <label>
                  <input
                    type="radio"
                    name="depositType"
                    value="percent"
                    checked={settings.depositType === 'percent'}
                    onChange={(e) => handleChange('depositType', e.target.value)}
                  />{' '}
                  Percentage (%)
                </label>
                <label>
                  <input
                    type="radio"
                    name="depositType"
                    value="amount"
                    checked={settings.depositType === 'amount'}
                    onChange={(e) => handleChange('depositType', e.target.value)}
                  />{' '}
                  Amount ($)
                </label>
              </div>
              {settings.depositType === 'percent' ? (
                <input
                  type="number"
                  id="depositPercent"
                  value={settings.depositPercent}
                  onChange={(e) => handleChange('depositPercent', parseFloat(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <input
                  type="number"
                  id="depositAmount"
                  value={settings.depositAmount}
                  onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Data sourced from{' '}
            <a
              href="https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              NSW Dept. of Planning, Housing & Infrastructure
            </a>
            .
          </div>
        </div>
      )}
    </div>
  );
}


import { useState, useRef, useEffect } from 'react';

export function MortgageSettings({ settings, onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;

    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        const hasScroll = container.scrollHeight > container.clientHeight;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 5;
        setShowBottomFade(hasScroll && !isAtBottom);
      }
    };

    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    
    // Check again after a short delay to account for content rendering
    const timeoutId = setTimeout(checkScroll, 100);

    return () => {
      container?.removeEventListener('scroll', checkScroll);
      clearTimeout(timeoutId);
    };
  }, [isOpen]);

  return (
    <div className="info-card absolute top-2 right-2 md:top-4 md:right-4 rounded-xl w-64 md:w-80 z-[1000] max-h-[60vh] flex flex-col overflow-hidden">
      <div
        className="p-3 md:p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100/50 rounded-xl flex-shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h1 className="text-sm font-bold text-gray-800">Mortgage Settings</h1>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="relative border-t border-gray-200 flex-1 flex flex-col min-h-0">
          <div 
            ref={scrollContainerRef}
            className="px-3 md:px-4 pb-3 md:pb-4 overflow-y-auto flex-1 min-h-0"
            style={{
              scrollbarWidth: 'thin',
            }}
          >
          <div className="space-y-2 mb-3 pt-2">
            <div className="flex flex-col">
              <label htmlFor="mortgageType" className="text-xs font-medium text-gray-700">
                Mortgage Type
              </label>
              <select
                id="mortgageType"
                value={settings.mortgageType}
                onChange={(e) => handleChange('mortgageType', e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
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
                className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
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
                  className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-700 mb-0.5">Deposit Input Type</label>
              <div className="flex space-x-4 mb-1.5 text-xs">
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
                  className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <input
                  type="number"
                  id="depositAmount"
                  value={settings.depositAmount}
                  onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value))}
                  className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
            <div className="flex flex-col">
              <label htmlFor="weeklyHomeownerCosts" className="text-xs font-medium text-gray-700">
                Weekly Homeowner Costs ($)
              </label>
              <input
                type="number"
                id="weeklyHomeownerCosts"
                value={settings.weeklyHomeownerCosts}
                onChange={(e) => handleChange('weeklyHomeownerCosts', parseFloat(e.target.value) || 0)}
                step="1"
                min="0"
                className="p-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Includes council rates, water, insurance, maintenance, etc.
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
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
          {showBottomFade && (
            <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-white to-transparent rounded-b-xl" />
          )}
        </div>
      )}
    </div>
  );
}


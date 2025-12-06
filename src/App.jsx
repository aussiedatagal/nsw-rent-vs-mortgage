import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Map } from './components/Map';
import { DataTable } from './components/DataTable';
import { MortgageSettings } from './components/MortgageSettings';
import { useDataLoader } from './hooks/useDataLoader';
import { useMortgageSettings } from './hooks/useMortgageSettings';
import { updateAllRatios } from './utils/mortgageCalculations';

function App() {
  const { geojsonData, housingData: rawHousingData, suburbLookup, loading } = useDataLoader();
  const mortgageSettings = useMortgageSettings();

  const housingData = useMemo(() => {
    if (!rawHousingData || Object.keys(rawHousingData).length === 0) {
      return {};
    }
    return updateAllRatios(rawHousingData, mortgageSettings.settings);
  }, [rawHousingData, mortgageSettings.settings]);

  const handlePostcodeClick = (postcode) => {
    if (window.handlePostcodeClick) {
      window.handlePostcodeClick(postcode);
    }
  };

  return (
    <div className="font-sans bg-gray-50 flex flex-col h-screen">
      <Header />
      <main className="flex flex-col md:flex-row flex-grow min-h-0">
        <DataTable
          housingData={housingData}
          suburbLookup={suburbLookup}
          onPostcodeClick={handlePostcodeClick}
          loading={loading}
        />
        <div className="flex-grow relative h-full">
          <Map
            geojsonData={geojsonData}
            housingData={housingData}
            suburbLookup={suburbLookup}
            settings={mortgageSettings.settings}
            onPostcodeClick={handlePostcodeClick}
          />
          <MortgageSettings
            settings={mortgageSettings.settings}
            onSettingsChange={(newSettings) => {
              if (newSettings.mortgageType !== undefined) {
                mortgageSettings.setMortgageType(newSettings.mortgageType);
              }
              if (newSettings.interestRate !== undefined) {
                mortgageSettings.setInterestRate(newSettings.interestRate);
              }
              if (newSettings.loanTermYears !== undefined) {
                mortgageSettings.setLoanTerm(newSettings.loanTermYears);
              }
              if (newSettings.depositType !== undefined) {
                mortgageSettings.setDepositType(newSettings.depositType);
              }
              if (newSettings.depositPercent !== undefined) {
                mortgageSettings.setDepositPercent(newSettings.depositPercent);
              }
              if (newSettings.depositAmount !== undefined) {
                mortgageSettings.setDepositAmount(newSettings.depositAmount);
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}

export default App;


import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const GEOJSON_PATH = '/data/POA_2021_NSW.geojson';
const SUBURBS_PATH = '/data/postcode_to_suburbs.csv';
const AGGREGATED_DATA_PATH = '/data/aggregated_yearly_data.csv';

export function useDataLoader() {
  const [geojsonData, setGeojsonData] = useState(null);
  const [housingData, setHousingData] = useState({});
  const [suburbLookup, setSuburbLookup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [geojson, suburbs, affordability] = await Promise.all([
          fetch(GEOJSON_PATH).then(res => res.json()),
          loadCsv(SUBURBS_PATH),
          loadCsv(AGGREGATED_DATA_PATH)
        ]);

        const housingDataMap = {};
        affordability.forEach(item => {
          const postcode = String(item.Postcode);
          if (postcode && postcode !== 'null') {
            housingDataMap[postcode] = item;
          }
        });

        const suburbMap = {};
        suburbs.forEach(item => {
          const postcode = String(item.Postcode);
          if (postcode && postcode !== 'null' && item.Suburbs) {
            suburbMap[postcode] = item.Suburbs;
          }
        });

        setGeojsonData(geojson);
        setHousingData(housingDataMap);
        setSuburbLookup(suburbMap);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
        console.error('Data loading failed:', err);
      }
    }

    loadData();
  }, []);

  return { geojsonData, housingData, suburbLookup, loading, error };
}

function loadCsv(path) {
  return new Promise((resolve, reject) => {
    Papa.parse(path, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(new Error(`CSV parsing error for ${path}: ${err.message}`))
    });
  });
}


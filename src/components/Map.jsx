import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Popup } from './Popup';
import { MobileOverlay } from './MobileOverlay';
import { getColor, updateAllRatios, getRepresentativeInterestRatio } from '../utils/mortgageCalculations';

const defaultStyle = { weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 };
const highlightStyle = { weight: 3, color: '#333', fillOpacity: 1 };

export function Map({
  geojsonData,
  housingData,
  suburbLookup,
  settings,
  onPostcodeClick
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);
  const activePopupLayerRef = useRef(null);
  const legendRef = useRef(null);
  const [openPostcode, setOpenPostcode] = useState(null);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([-33, 149], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    map.on('popupclose', () => {
      if (activePopupLayerRef.current) {
        layerRef.current?.resetStyle(activePopupLayerRef.current);
      }
      setOpenPostcode(null);
      activePopupLayerRef.current = null;
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !geojsonData || !housingData) return;

    const updatedData = updateAllRatios(housingData, settings);

    const openPopupForLayer = (layer, postcode, data, latlng) => {
      setOpenPostcode(postcode);
      activePopupLayerRef.current = layer;
      layer.setStyle(highlightStyle);

      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setShowMobileOverlay(true);
        return;
      }

      const popupContainer = document.createElement('div');
      const root = createRoot(popupContainer);
      popupContainer._reactRoot = root;
      
      root.render(
        <Popup
          postcode={postcode}
          data={data}
          suburbLookup={suburbLookup}
          mortgageType={settings.mortgageType}
        />
      );

      if (!layer.getPopup()) {
        layer.bindPopup(popupContainer, {
          closeOnClick: false,
          keepInView: true,
          autoClose: false,
          maxWidth: 400,
          className: 'custom-popup',
          offset: [0, -10]
        });
      } else {
        const oldContent = layer.getPopup().getContent();
        if (oldContent && oldContent._reactRoot) {
          oldContent._reactRoot.unmount();
        }
        layer.getPopup().setContent(popupContainer);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          layer.openPopup(latlng);
          const popup = layer.getPopup();
          if (popup && popup.isOpen()) {
            popup.update();
          }
        });
      });
    };

    const styleFeature = (feature) => {
      const postcode = String(feature.properties.POA_CODE21).trim();
      const data = updatedData[postcode];
      const ratio = data ? data.rent_vs_payment_ratio : null;
      const interestToPaymentRatio = data ? data.interest_to_payment_ratio : null;
      return {
        ...defaultStyle,
        fillColor: getColor(ratio, interestToPaymentRatio)
      };
    };

    const onEachFeature = (feature, layer) => {
      layer.on({
        mouseover: () => {
          if (!layer.getPopup() || !layer.getPopup().isOpen()) {
            layer.setStyle(highlightStyle);
            layer.bringToFront();
          }
        },
        mouseout: () => {
          if (!layer.getPopup() || !layer.getPopup().isOpen()) {
            layerRef.current?.resetStyle(layer);
          }
        },
        click: (event) => {
          const postcode = String(feature.properties.POA_CODE21).trim();
          const data = updatedData[postcode];
          if (!data) return;

          const wasDifferentLayer = activePopupLayerRef.current && activePopupLayerRef.current !== layer;
          if (wasDifferentLayer) {
            activePopupLayerRef.current.closePopup();
            layerRef.current?.resetStyle(activePopupLayerRef.current);
            setTimeout(() => openPopupForLayer(layer, postcode, data, event.latlng), 50);
          } else {
            openPopupForLayer(layer, postcode, data, event.latlng);
          }
        }
      });
    };

    if (layerRef.current) {
      mapInstanceRef.current.removeLayer(layerRef.current);
    }

    layerRef.current = L.geoJson(geojsonData, {
      style: styleFeature,
      onEachFeature: onEachFeature
    }).addTo(mapInstanceRef.current);

    if (legendRef.current) {
      mapInstanceRef.current.removeControl(legendRef.current);
    }

    const isMobile = window.innerWidth < 768;
    const legend = L.control({ position: isMobile ? 'bottomleft' : 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const interestThreshold = getRepresentativeInterestRatio(
        settings.interestRate,
        settings.loanTermYears,
        settings.mortgageType
      );
      const interestThresholdPercent = (interestThreshold * 100).toFixed(0);

      const grades = [
        {
          ratio: interestThreshold * 0.5,
          color: getColor(interestThreshold * 0.5, interestThreshold),
          label: `< ${interestThresholdPercent}% (Rent does not cover interest)`
        },
        {
          ratio: (interestThreshold + 1.0) / 2,
          color: getColor((interestThreshold + 1.0) / 2, interestThreshold),
          label: `${interestThresholdPercent}% – 100% (Rent covers interest and then some)`
        },
        {
          ratio: 1.2,
          color: getColor(1.2, interestThreshold),
          label: '≥ 100% (Rent covers entire payment or more)'
        }
      ];

      const mobileClass = isMobile ? 'mobile-legend' : '';
      let content = `<h4 class="font-bold mb-0.5 md:mb-1 text-xs md:text-sm">Rent/Payment Ratio</h4><div class="space-y-0.5 md:space-y-1">`;
      grades.forEach((g) => {
        content += `<p class="text-xs leading-tight"><i style="background:${g.color}"></i> ${g.label}</p>`;
      });
      content += `</div><hr class="my-0.5 md:my-1 border-gray-300"><p class="text-xs leading-tight">No Data: <i style="background:#ccc; border: 1px solid #777; margin-left: 0;"></i></p>`;
      div.className = `info legend p-1.5 md:p-2 ${mobileClass}`;
      div.innerHTML = content;
      return div;
    };

    legend.addTo(mapInstanceRef.current);
    legendRef.current = legend;
  }, [geojsonData, housingData, suburbLookup, settings]);

  useEffect(() => {
    const handlePostcodeClick = (postcode) => {
      if (!layerRef.current || !mapInstanceRef.current) {
        console.warn('Map not ready for postcode click');
        return;
      }

      const targetPostcode = String(postcode).trim();
      let found = false;

      layerRef.current.eachLayer((layer) => {
        const layerPostcode = String(layer.feature.properties.POA_CODE21).trim();
        if (layerPostcode === targetPostcode) {
          if (activePopupLayerRef.current && activePopupLayerRef.current !== layer) {
            activePopupLayerRef.current.closePopup();
            layerRef.current?.resetStyle(activePopupLayerRef.current);
          }
          
          const bounds = layer.getBounds();
          mapInstanceRef.current.flyToBounds(bounds, {
            padding: [150, 150],
            duration: 1.0
          });
          
          setTimeout(() => {
            const center = bounds.getCenter();
            layer.fire('click', { latlng: center });
          }, 1100);
          
          found = true;
        }
      });

      if (!found) {
        console.warn(`Postcode ${targetPostcode} not found on map`);
      }
    };

    window.handlePostcodeClick = handlePostcodeClick;

    return () => {
      delete window.handlePostcodeClick;
    };
  }, []);

  const currentData = housingData && openPostcode ? housingData[openPostcode] : null;

  return (
    <>
      <div ref={mapRef} id="map" style={{ height: '100%', width: '100%' }} />
      {showMobileOverlay && currentData && (
        <MobileOverlay
          postcode={openPostcode}
          data={currentData}
          suburbLookup={suburbLookup}
          mortgageType={settings.mortgageType}
          onClose={() => {
            setShowMobileOverlay(false);
            if (activePopupLayerRef.current) {
              layerRef.current?.resetStyle(activePopupLayerRef.current);
            }
            setOpenPostcode(null);
            activePopupLayerRef.current = null;
          }}
        />
      )}
    </>
  );
}


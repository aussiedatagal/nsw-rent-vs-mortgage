// Data file paths
const GEOJSON_PATH = './data/POA_2021_NSW.geojson';
const SUBURBS_PATH = './data/postcode_to_suburbs.csv';
const AGGREGATED_DATA_PATH = './data/aggregated_yearly_data.csv';

class HousingCostMap {
    constructor() {
        // Map and data state
        this.map = null;
        this.geojsonData = null;
        this.housingData = {};
        this.suburbLookup = {};
        this.sortedDataList = [];
        this.openPostcode = null;
        this.geojsonLayer = null;
        this.activePopupLayer = null;

        // User-configurable settings
        this.depositType = 'percent';
        this.mortgageType = 'PI';

        // Layer styling
        this.defaultStyle = { weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 };
        this.highlightStyle = { weight: 3, color: '#333', fillOpacity: 1 };

        this._initialize();
    }

    async _initialize() {
        this._initMap();
        this._bindEventListeners();
        await this._fetchCurrentInterestRate();
        try {
            await this._loadData();
            this.updateMapAndTable();
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    }

    _initMap() {
        this.map = L.map('map').setView([-33, 149], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this._addLegend();
        this.map.on('popupclose', () => {
            if (this.activePopupLayer) {
                this.geojsonLayer.resetStyle(this.activePopupLayer);
            }
            this.openPostcode = null;
            this.activePopupLayer = null;
        });
    }

    _bindEventListeners() {
        document.getElementById('mortgageType').value = 'PI';

        const generalControls = ['interestRate', 'loanTerm', 'depositPercent', 'depositAmount'];
        generalControls.forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateMapAndTable());
        });

        document.getElementById('mortgageType').addEventListener('change', (event) => this._handleMortgageTypeChange(event.target.value));

        document.querySelectorAll('input[name="depositType"]').forEach(radio => {
            radio.addEventListener('change', (event) => this._handleDepositTypeChange(event.target.value));
        });

        document.getElementById('search-input').addEventListener('input', (event) => this._filterTable(event.target.value));
        document.querySelectorAll('#data-table th[data-sort]').forEach(header => {
            header.addEventListener('click', (event) => this._sortColumn(event.target.dataset.sort));
        });

        this._setupCollapsibleControls();
        this._setupDescriptionToggle();
        this._setupMobileOverlay();
    }

    async _fetchCurrentInterestRate() {
        const interestRateInput = document.getElementById('interestRate');
        if (!interestRateInput) return;

        const DEFAULT_RATE = 5.3;

        try {
            const savedRate = localStorage.getItem('lastInterestRate');
            if (savedRate) {
                const saved = parseFloat(savedRate);
                if (!isNaN(saved) && saved >= 2 && saved <= 15) {
                    interestRateInput.value = saved.toFixed(2);
                    return;
                }
            }
        } catch (error) {
            // localStorage not available
        }

        interestRateInput.value = DEFAULT_RATE;

        interestRateInput.addEventListener('change', () => {
            try {
                const newRate = parseFloat(interestRateInput.value);
                if (!isNaN(newRate) && newRate >= 2 && newRate <= 15) {
                    localStorage.setItem('lastInterestRate', newRate.toString());
                }
            } catch (error) {
                // Ignore
            }
        });
    }

    async _loadData() {
        const [geojson, suburbs, affordability] = await Promise.all([
            fetch(GEOJSON_PATH).then(res => res.json()),
            this._loadCsv(SUBURBS_PATH),
            this._loadCsv(AGGREGATED_DATA_PATH)
        ]);

        this.geojsonData = geojson;

        affordability.forEach(item => {
            const postcode = String(item.Postcode);
            if (postcode && postcode !== 'null') {
                this.housingData[postcode] = item;
            }
        });

        suburbs.forEach(item => {
            const postcode = String(item.Postcode);
            if (postcode && postcode !== 'null' && item.Suburbs) {
                this.suburbLookup[postcode] = item.Suburbs;
            }
        });
    }

    _loadCsv(path) {
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

    _calculateMortgage(loanAmount, annualRate, termYears, type) {
        if (loanAmount <= 0) {
            return { payment: 0, interest: 0 };
        }
        const numPayments = termYears * 12;
        if (annualRate === 0) {
            return { payment: loanAmount / numPayments, interest: 0 };
        }

        const monthlyRate = (annualRate / 100) / 12;
        const monthlyInterest = loanAmount * monthlyRate;

        // For an Interest Only loan, the payment is just the interest.
        if (type === 'IO') {
            return { payment: monthlyInterest, interest: monthlyInterest };
        }

        // For a Principal & Interest loan, calculate the full payment.
        const factor = Math.pow(1 + monthlyRate, numPayments);
        const principalAndInterestPayment = monthlyInterest * factor / (factor - 1);
        return { payment: principalAndInterestPayment, interest: monthlyInterest };
    }

    _updateAllRatios() {
        const getFloat = id => parseFloat(document.getElementById(id).value);
        const interestRate = getFloat('interestRate');
        const loanTermYears = getFloat('loanTerm');
        const depositPercent = getFloat('depositPercent');
        const depositAmount = getFloat('depositAmount');

        for (const postcode in this.housingData) {
            const data = this.housingData[postcode];
            const salesPrice = (data.yearly_median_sales_price_000s || 0) * 1000;
            const rent = data.yearly_median_weekly_rent;

            if (salesPrice) {
                const actualDeposit = this.depositType === 'percent'
                    ? salesPrice * (depositPercent / 100)
                    : depositAmount;

                const loanAmount = Math.max(0, salesPrice - actualDeposit);
                const mortgage = this._calculateMortgage(loanAmount, interestRate, loanTermYears, this.mortgageType);

                data.calculated_weekly_payment = mortgage.payment * 12 / 52;
                data.calculated_weekly_interest = mortgage.interest * 12 / 52;
                // Calculate the ratio of interest to payment - this is the threshold where rent covers interest only
                if (data.calculated_weekly_payment > 0) {
                    data.interest_to_payment_ratio = data.calculated_weekly_interest / data.calculated_weekly_payment;
                } else {
                    data.interest_to_payment_ratio = 0;
                }
                if (!rent) {
                    data.rent_vs_payment_ratio = null;
                } else if (data.calculated_weekly_payment > 0) {
                    data.rent_vs_payment_ratio = rent / data.calculated_weekly_payment;
                } else {
                    data.rent_vs_payment_ratio = Infinity;
                }
                this._calculateQuartilePayments(data, this.depositType, depositPercent, depositAmount, interestRate, loanTermYears, this.mortgageType);
            }
        }
    }

    _calculateQuartilePayments(data, depositType, depositPercent, depositAmount, rate, term, type) {
        const q1Sales = (data.yearly_first_quartile_sales_000s || 0) * 1000;
        if (q1Sales) {
            // Recalculate deposit for Q1 based on deposit type
            const q1Deposit = depositType === 'percent'
                ? q1Sales * (depositPercent / 100)
                : depositAmount;
            const q1Loan = Math.max(0, q1Sales - q1Deposit);
            const q1Mortgage = this._calculateMortgage(q1Loan, rate, term, type);
            data.yearly_first_quartile_weekly_payment = q1Mortgage.payment * 12 / 52;
        } else {
            data.yearly_first_quartile_weekly_payment = null;
        }
        const q3Sales = (data.yearly_third_quartile_sales_000s || 0) * 1000;
        if (q3Sales) {
            // Recalculate deposit for Q3 based on deposit type
            const q3Deposit = depositType === 'percent'
                ? q3Sales * (depositPercent / 100)
                : depositAmount;
            const q3Loan = Math.max(0, q3Sales - q3Deposit);
            const q3Mortgage = this._calculateMortgage(q3Loan, rate, term, type);
            data.yearly_third_quartile_weekly_payment = q3Mortgage.payment * 12 / 52;
        } else {
            data.yearly_third_quartile_weekly_payment = null;
        }
    }

    _renderMap() {
        if (this.geojsonLayer) {
            this.map.removeLayer(this.geojsonLayer);
        }
        this.geojsonLayer = L.geoJson(this.geojsonData, {
            style: (feature) => this._styleFeature(feature),
            onEachFeature: (feature, layer) => this._onEachFeature(feature, layer)
        }).addTo(this.map);
    }

    updateMapAndTable() {
        this._updateAllRatios();

        if (this.geojsonLayer) {
            this.geojsonLayer.setStyle((feature) => this._styleFeature(feature));
        } else {
            this._renderMap();
        }

        this._prepareAndRenderTable();
        this._updateLegend();

        if (this.openPostcode) {
            this._refreshOpenPopup();
        }
    }

    _getColor(ratio, interestToPaymentRatio = null) {
        if (ratio === null || isNaN(ratio)) return '#ccc';
        // Use the interest-to-payment ratio as the threshold for Category 1 (Green)
        // This is where rent covers interest only
        const interestThreshold = interestToPaymentRatio !== null && interestToPaymentRatio > 0 
            ? interestToPaymentRatio 
            : 0.75; // Fallback to 0.75 if not available
        
        if (ratio >= 1.0 || ratio === Infinity) return '#ef4444'; // Category 3: Rent covers entire payment or more
        if (ratio >= interestThreshold) return '#fbbf24'; // Category 2: Rent covers interest and then some
        return '#22c55e'; // Category 1: Rent does not even cover the interest
    }

    _styleFeature(feature) {
        const postcode = String(feature.properties.POA_CODE21).trim();
        const data = this.housingData[postcode];
        const ratio = data ? data.rent_vs_payment_ratio : null;
        const interestToPaymentRatio = data ? data.interest_to_payment_ratio : null;
        return {
            ...this.defaultStyle,
            fillColor: this._getColor(ratio, interestToPaymentRatio)
        };
    }

    _onEachFeature(feature, layer) {
        layer.on({
            mouseover: () => {
                // Only highlight on hover if this layer doesn't have an open popup
                if (!layer.getPopup() || !layer.getPopup().isOpen()) {
                    this._highlightFeature(layer);
                }
            },
            mouseout: () => {
                // Only reset style if this layer doesn't have an open popup
                if (!layer.getPopup() || !layer.getPopup().isOpen()) {
                    this.geojsonLayer.resetStyle(layer);
                }
            },
            click: (event) => this._showPopup(event, feature, layer)
        });
    }

    _highlightFeature(layer) {
        layer.setStyle(this.highlightStyle);
        layer.bringToFront();
    }

    _prepareAndRenderTable() {
        this.sortedDataList = Object.values(this.housingData)
            .filter(d => this.suburbLookup[d.Postcode] || d.yearly_median_weekly_rent || d.yearly_median_sales_price_000s)
            .map(d => ({
                postcode: d.Postcode,
                suburb: this.suburbLookup[d.Postcode] || `Postcode ${d.Postcode}`,
                ratio: d.rent_vs_payment_ratio,
                rent: d.yearly_median_weekly_rent,
                mortgage_payment: d.calculated_weekly_payment
            }));

        this.sortedDataList.sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1));

        document.getElementById('loading-table').style.display = 'none';
        this._renderTable(this.sortedDataList);

        const ratioHeader = document.querySelector('#data-table th[data-sort="ratio"]');
        if (ratioHeader) ratioHeader.classList.add('sorted-desc');
    }

    _renderTable(data) {
        const tbody = document.getElementById('data-table-body');
        const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
        tbody.innerHTML = '';

        data.forEach(item => {
            const row = tbody.insertRow();
            row.className = 'hover:bg-gray-50';
            row.dataset.postcode = item.postcode;
            row.onclick = () => this._highlightAndZoom(item.postcode);

            const formatCurrency = (val) => (val !== null && val !== undefined) ? formatter.format(val) : 'N/A';
            const formatRatio = (val) => {
                if (val === null || val === undefined) return 'N/A';
                if (val === Infinity) return '∞';
                return val.toFixed(2);
            };

            row.insertCell().textContent = item.suburb;
            row.insertCell().textContent = item.postcode;
            row.insertCell().textContent = formatRatio(item.ratio);
            row.insertCell().textContent = formatCurrency(item.rent);
            row.insertCell().textContent = formatCurrency(item.mortgage_payment);
        });
    }

    _filterTable(query) {
        const lowerQuery = query.toLowerCase().trim();
        const filteredData = this.sortedDataList.filter(item =>
            item.postcode.includes(lowerQuery) || item.suburb.toLowerCase().includes(lowerQuery)
        );
        this._renderTable(filteredData);
    }

    _sortColumn(key) {
        const header = document.querySelector(`#data-table th[data-sort="${key}"]`);
        const isAsc = header.classList.contains('sorted-asc');
        const direction = isAsc ? -1 : 1;

        document.querySelectorAll('#data-table th').forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
        header.classList.toggle('sorted-asc', !isAsc);
        header.classList.toggle('sorted-desc', isAsc);

        this.sortedDataList.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (valA == null) return 1;
            if (valB == null) return -1;

            if (key === 'suburb') {
                return valA.localeCompare(valB) * direction;
            }
            return (valA - valB) * direction;
        });

        this._renderTable(this.sortedDataList);
    }

    _highlightAndZoom(postcode) {
        const targetPostcode = String(postcode).trim();
        let found = false;
        this.geojsonLayer.eachLayer(layer => {
            const layerPostcode = String(layer.feature.properties.POA_CODE21).trim();
            if (layerPostcode === targetPostcode) {
                this.map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.0 });
                this._showPopup({ latlng: layer.getBounds().getCenter() }, layer.feature, layer);
                found = true;
            }
        });
        if (!found) {
            console.warn(`Postcode ${targetPostcode} not found on map`);
        }
    }

    _showPopup(event, feature, layer, isRefresh = false) {
        const postcode = String(feature.properties.POA_CODE21).trim();
        const data = this.housingData[postcode];
        if (!data) return;

        // Reset style of previous active layer if switching to a different postcode
        if (this.activePopupLayer && this.activePopupLayer !== layer) {
            this.activePopupLayer.closePopup();
            this.geojsonLayer.resetStyle(this.activePopupLayer);
        }

        if (!isRefresh) {
            this.openPostcode = postcode;
            this.activePopupLayer = layer;
        }

        // Highlight the clicked layer (for both mobile and desktop)
        this._highlightFeature(layer);

        // Check if mobile and show overlay instead
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            this._showMobileOverlay(postcode, data, layer);
            return;
        }

        const popupContent = this._createPopupContent(postcode, data);

        if (!layer.getPopup()) {
            layer.bindPopup(popupContent, { closeOnClick: false, keepInView: false, autoClose: false });
        } else {
            layer.getPopup().setContent(popupContent);
        }

        if (!layer.getPopup().isOpen()) {
            layer.openPopup(event.latlng);
        }
    }

    _refreshOpenPopup() {
        // Check if mobile overlay is open
        const overlay = document.getElementById('mobile-detail-overlay');
        if (overlay && !overlay.classList.contains('translate-y-full')) {
            // Refresh mobile overlay - find the layer and highlight it
            if (this.openPostcode && this.geojsonLayer) {
                const data = this.housingData[this.openPostcode];
                if (data) {
                    // Find and highlight the correct layer
                    const targetPostcode = String(this.openPostcode).trim();
                    let foundLayer = null;
                    this.geojsonLayer.eachLayer(layer => {
                        const layerPostcode = String(layer.feature.properties.POA_CODE21).trim();
                        if (layerPostcode === targetPostcode) {
                            // Reset previous active layer if different
                            if (this.activePopupLayer && this.activePopupLayer !== layer) {
                                this.geojsonLayer.resetStyle(this.activePopupLayer);
                            }
                            this.activePopupLayer = layer;
                            this._highlightFeature(layer);
                            foundLayer = layer;
                        }
                    });
                    this._showMobileOverlay(this.openPostcode, data, foundLayer);
                }
            }
        } else if (this.openPostcode && this.geojsonLayer) {
            // Refresh desktop popup - find the correct layer by matching postcode
            let found = false;
            const targetPostcode = String(this.openPostcode).trim();
            this.geojsonLayer.eachLayer(layer => {
                const layerPostcode = String(layer.feature.properties.POA_CODE21).trim();
                if (layerPostcode === targetPostcode) {
                    // Reset previous active layer if it's different
                    if (this.activePopupLayer && this.activePopupLayer !== layer) {
                        this.geojsonLayer.resetStyle(this.activePopupLayer);
                    }
                    this.activePopupLayer = layer;
                    this._showPopup({ latlng: layer.getBounds().getCenter() }, layer.feature, layer, true);
                    found = true;
                }
            });
            // If we didn't find the layer, clear the active popup
            if (!found) {
                this.openPostcode = null;
                this.activePopupLayer = null;
            }
        }
    }

    _createPopupContent(postcode, data) {
        const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
        const template = document.getElementById('popup-template').content.cloneNode(true);
        const suburbs = this.suburbLookup[postcode] || `Postcode ${postcode}`;

        let displaySuburbs = suburbs;
        const suburbList = suburbs.split(/\s*,\s*/);
        if (suburbList.length > 9) {
            displaySuburbs = suburbList.slice(0, 9).join(', ') + '...';
        }

        const setContent = (selector, text) => { template.querySelector(selector).textContent = text; };

        // Header
        setContent('#popup-suburbs', displaySuburbs);
        template.querySelector('#popup-suburbs').setAttribute('title', suburbs); // Full list remains in the tooltip
        setContent('#popup-postcode', `Postcode: ${postcode}`);

        // Median Costs
        const formatCurrency = (val) => (val != null) ? formatter.format(val) : 'N/A';
        setContent('#median-rent-weekly', formatCurrency(data.yearly_median_weekly_rent));
        const salesPrice = (data.yearly_median_sales_price_000s || 0) * 1000;
        setContent('#median-sale-price-000s', salesPrice > 0 ? (salesPrice / 1000).toLocaleString() : 'N/A');

        // Mortgage Details
        const mortgageLabel = template.querySelector('#mortgage-label');
        const interestWrapper = template.querySelector('#interest-component-wrapper');

        if (this.mortgageType === 'IO') {
            mortgageLabel.textContent = `Interest Payment:`;
            setContent('#mortgage-payment-weekly', formatCurrency(data.calculated_weekly_interest));
            interestWrapper.classList.add('hidden');
        } else {
            mortgageLabel.textContent = `Mortgage Payment:`;
            setContent('#mortgage-payment-weekly', formatCurrency(data.calculated_weekly_payment));
            setContent('#interest-component-weekly', formatCurrency(data.calculated_weekly_interest));
            interestWrapper.classList.remove('hidden');
        }

        // Box Plots
        const rentQ3 = data.yearly_third_quartile_weekly_rent || data.yearly_median_weekly_rent || 0;
        const paymentQ3 = data.yearly_third_quartile_weekly_payment || data.calculated_weekly_payment || 0;
        let maxCost = Math.max(rentQ3, paymentQ3) * 1.1;
        if (maxCost === 0) {
            maxCost = 100;
        }

        this._createBoxPlot(template.querySelector('#box-plot-rent'), {
            q1: data.yearly_first_quartile_weekly_rent,
            median: data.yearly_median_weekly_rent,
            q3: data.yearly_third_quartile_weekly_rent,
            label: 'Rent',
            color: '#22c55e',
            maxCost
        });
        this._createBoxPlot(template.querySelector('#box-plot-mortgage'), {
            q1: data.yearly_first_quartile_weekly_payment,
            median: data.calculated_weekly_payment,
            q3: data.yearly_third_quartile_weekly_payment,
            label: this.mortgageType === 'PI' ? 'P+I' : 'I.O.',
            color: '#ef4444',
            maxCost
        });

        const popupContainer = document.createElement('div');
        popupContainer.appendChild(template);
        return popupContainer;
    }

    _createBoxPlot(container, { q1, median, q3, label, color, maxCost }) {
        if (q1 == null || median == null || q3 == null) {
            container.innerHTML = `<p class="text-xs text-gray-500 p-2">Range data not available.</p>`;
            return;
        }

        const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
        const width = 220, height = 50, margin = { top: 20, right: 10, bottom: 5, left: 40 };
        if (q1 > q3) [q1, q3] = [q3, q1];

        d3.select(container).select('svg').remove();
        const svg = d3.select(container).append("svg").attr("width", width).attr("height", height)
            .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([0, maxCost]).range([0, width - margin.left - margin.right]);
        const center = (height - margin.top - margin.bottom) / 2;

        svg.append("line").attr("x1", x(q1)).attr("x2", x(q3)).attr("y1", center).attr("y2", center).attr("stroke", color).attr("stroke-width", 2);
        svg.append("rect").attr("x", x(q1)).attr("y", center - 6).attr("width", x(q3) - x(q1)).attr("height", 12).attr("stroke", color).attr("fill", color).attr("fill-opacity", 0.3);
        svg.append("line").attr("x1", x(median)).attr("x2", x(median)).attr("y1", center - 8).attr("y2", center + 8).attr("stroke", color).attr("stroke-width", 3);

        const addLabel = (val, y, weight = "600") => {
            svg.append("text").attr("x", x(val)).attr("y", y).attr("text-anchor", "middle").style("font-size", "10px").style("font-weight", weight).attr("fill", color).text(formatter.format(val));
        };
        addLabel(q1, -2);
        addLabel(q3, -2);
        addLabel(median, -12, "bold");

        svg.append("text").attr("x", -margin.left + 5).attr("y", center + 4).attr("fill", "#1f2937").style("font-size", "10px").style("font-weight", "bold").text(label);
    }

    _getRepresentativeInterestRatio() {
        // Calculate interest-to-payment ratio using a representative loan amount
        // This is used for the legend display
        const getFloat = id => parseFloat(document.getElementById(id)?.value) || 0;
        const interestRate = getFloat('interestRate');
        const loanTermYears = getFloat('loanTerm');
        const REPRESENTATIVE_LOAN = 500000; // $500k representative loan
        
        if (interestRate > 0 && loanTermYears > 0 && this.mortgageType === 'PI') {
            const mortgage = this._calculateMortgage(REPRESENTATIVE_LOAN, interestRate, loanTermYears, this.mortgageType);
            const weeklyPayment = mortgage.payment * 12 / 52;
            const weeklyInterest = mortgage.interest * 12 / 52;
            if (weeklyPayment > 0) {
                return weeklyInterest / weeklyPayment;
            }
        }
        // For IO loans, interest equals payment, so ratio is 1.0
        if (this.mortgageType === 'IO') {
            return 1.0;
        }
        // Fallback
        return 0.75;
    }

    _updateLegend() {
        if (this.legend) {
            this.map.removeControl(this.legend);
        }
        this._addLegend();
    }

    _addLegend() {
        // Use different position on mobile to avoid overlap with toggle button
        const isMobile = window.innerWidth < 768;
        const legend = L.control({ position: isMobile ? 'bottomleft' : 'bottomright' });
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend p-1.5 md:p-2 mobile-legend');
            const interestThreshold = this._getRepresentativeInterestRatio();
            const interestThresholdPercent = (interestThreshold * 100).toFixed(0);
            
            const grades = [
                { ratio: interestThreshold * 0.5, color: this._getColor(interestThreshold * 0.5, interestThreshold), label: `&lt; ${interestThresholdPercent}% (Rent does not cover interest)` },
                { ratio: (interestThreshold + 1.0) / 2, color: this._getColor((interestThreshold + 1.0) / 2, interestThreshold), label: `${interestThresholdPercent}% &ndash; 100% (Rent covers interest and then some)` },
                { ratio: 1.2, color: this._getColor(1.2, interestThreshold), label: '&ge; 100% (Rent covers entire payment or more)' }
            ];

            let content = '<h4 class="font-bold mb-0.5 md:mb-1 text-xs md:text-sm">Rent/Payment Ratio</h4><div class="space-y-0.5 md:space-y-1">';
            grades.forEach(g => {
                content += `<p class="text-xs leading-tight"><i style="background:${g.color}"></i> ${g.label}</p>`;
            });
            content += '</div><hr class="my-0.5 md:my-1 border-gray-300"><p class="text-xs leading-tight">No Data: <i style="background:#ccc; border: 1px solid #777; margin-left: 0;"></i></p>';
            div.innerHTML = content;
            return div;
        };
        this.legend = legend;
        legend.addTo(this.map);
    }

    _handleMortgageTypeChange(type) {
        this.mortgageType = type;
        this._toggleLoanTermVisibility();
        this.updateMapAndTable();
    }

    _handleDepositTypeChange(type) {
        this.depositType = type;
        const isPercent = type === 'percent';
        document.getElementById('depositPercent').style.display = isPercent ? 'block' : 'none';
        document.getElementById('depositAmount').style.display = isPercent ? 'none' : 'block';
        this.updateMapAndTable();
    }

    _toggleLoanTermVisibility() {
        const loanTermGroup = document.getElementById('loanTermGroup');
        loanTermGroup.style.display = (this.mortgageType === 'IO') ? 'none' : 'flex';
    }

    _setupCollapsibleControls() {
        const header = document.getElementById('controls-header');
        header.addEventListener('click', () => {
            document.getElementById('controls-content').classList.toggle('hidden');
            document.getElementById('controls-chevron').classList.toggle('rotate-180');
        });
    }

    _setupDescriptionToggle() {
        const toggleBtn = document.getElementById('toggle-description');
        const mobileDesc = document.getElementById('mobile-description');
        const plusIcon = document.getElementById('plus-icon');
        const xIcon = document.getElementById('x-icon');
        
        if (toggleBtn && mobileDesc && plusIcon && xIcon) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = mobileDesc.classList.contains('hidden');
                mobileDesc.classList.toggle('hidden');
                
                // Toggle icons
                if (isHidden) {
                    plusIcon.classList.add('hidden');
                    xIcon.classList.remove('hidden');
                    toggleBtn.setAttribute('aria-label', 'Hide description');
                } else {
                    plusIcon.classList.remove('hidden');
                    xIcon.classList.add('hidden');
                    toggleBtn.setAttribute('aria-label', 'Show description');
                }
            });
        }
    }

    _setupMobileOverlay() {
        const closeBtn = document.getElementById('close-overlay');
        const overlay = document.getElementById('mobile-detail-overlay');
        
        if (closeBtn && overlay) {
            closeBtn.addEventListener('click', () => {
                this._hideMobileOverlay();
            });
            
            // Close on backdrop click (optional)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this._hideMobileOverlay();
                }
            });
        }
    }

    _showMobileOverlay(postcode, data, layer = null) {
        const overlay = document.getElementById('mobile-detail-overlay');
        if (!overlay) return;

        // Store the open postcode for refresh
        this.openPostcode = postcode;
        
        // If layer is provided, ensure it's set as active (for highlighting)
        if (layer) {
            this.activePopupLayer = layer;
        }

        const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
        const suburbs = this.suburbLookup[postcode] || `Postcode ${postcode}`;

        // Set header content
        document.getElementById('overlay-suburbs').textContent = suburbs;
        document.getElementById('overlay-postcode').textContent = `Postcode: ${postcode}`;

        // Set median costs
        const formatCurrency = (val) => (val != null) ? formatter.format(val) : 'N/A';
        document.getElementById('overlay-median-rent-weekly').textContent = formatCurrency(data.yearly_median_weekly_rent);
        const salesPrice = (data.yearly_median_sales_price_000s || 0) * 1000;
        document.getElementById('overlay-median-sale-price-000s').textContent = salesPrice > 0 ? (salesPrice / 1000).toLocaleString() : 'N/A';

        // Set mortgage details
        const mortgageLabel = document.getElementById('overlay-mortgage-label');
        const interestWrapper = document.getElementById('overlay-interest-component-wrapper');

        if (this.mortgageType === 'IO') {
            mortgageLabel.textContent = 'Interest Payment:';
            document.getElementById('overlay-mortgage-payment-weekly').textContent = formatCurrency(data.calculated_weekly_interest);
            interestWrapper.classList.add('hidden');
        } else {
            mortgageLabel.textContent = 'Mortgage Payment:';
            document.getElementById('overlay-mortgage-payment-weekly').textContent = formatCurrency(data.calculated_weekly_payment);
            document.getElementById('overlay-interest-component-weekly').textContent = formatCurrency(data.calculated_weekly_interest);
            interestWrapper.classList.remove('hidden');
        }

        // Create box plots
        const rentQ3 = data.yearly_third_quartile_weekly_rent || data.yearly_median_weekly_rent || 0;
        const paymentQ3 = data.yearly_third_quartile_weekly_payment || data.calculated_weekly_payment || 0;
        let maxCost = Math.max(rentQ3, paymentQ3) * 1.1;
        if (maxCost === 0) {
            maxCost = 100;
        }

        // Clear existing plots
        const rentPlot = document.getElementById('overlay-box-plot-rent');
        const mortgagePlot = document.getElementById('overlay-box-plot-mortgage');
        rentPlot.innerHTML = '';
        mortgagePlot.innerHTML = '';

        this._createBoxPlot(rentPlot, {
            q1: data.yearly_first_quartile_weekly_rent,
            median: data.yearly_median_weekly_rent,
            q3: data.yearly_third_quartile_weekly_rent,
            label: 'Rent',
            color: '#22c55e',
            maxCost
        });
        this._createBoxPlot(mortgagePlot, {
            q1: data.yearly_first_quartile_weekly_payment,
            median: data.calculated_weekly_payment,
            q3: data.yearly_third_quartile_weekly_payment,
            label: this.mortgageType === 'PI' ? 'P+I' : 'I.O.',
            color: '#ef4444',
            maxCost
        });

        // Show overlay with animation
        overlay.classList.remove('translate-y-full');
        overlay.classList.add('translate-y-0');
        document.body.style.overflow = 'hidden';
    }

    _hideMobileOverlay() {
        const overlay = document.getElementById('mobile-detail-overlay');
        if (!overlay) return;

        // Reset the highlighted layer style
        if (this.activePopupLayer) {
            this.geojsonLayer.resetStyle(this.activePopupLayer);
        }

        overlay.classList.remove('translate-y-0');
        overlay.classList.add('translate-y-full');
        document.body.style.overflow = '';
        this.openPostcode = null;
        this.activePopupLayer = null;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    new HousingCostMap();
});
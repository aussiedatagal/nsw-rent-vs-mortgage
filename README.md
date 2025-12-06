# Who Pays for the Asset? A Renter's Map of NSW

I threw this map together to explore a simple question about the housing market: who's actually paying for the asset? It compares the median weekly rent in a postcode to an estimated mortgage payment. The red spots highlight where renters aren't just covering the landlord's costs but are actively helping pay off a property that someone else owns.

**[View the live map here!](https://aussiedatagal.github.io/nsw-rent-vs-buy)**

![Screenshot](screenshot.png)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

This will start the Vite development server, typically at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

This project has been refactored from a monolithic HTML/JS application into a modern React application with component-based architecture.

```
rent_vs_buy/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx       # Page header with description
│   │   ├── Map.jsx          # Main map component with Leaflet integration
│   │   ├── DataTable.jsx    # Data table with sorting and filtering
│   │   ├── MortgageSettings.jsx  # Settings panel for mortgage calculations
│   │   ├── MobileOverlay.jsx     # Mobile detail overlay
│   │   ├── Popup.jsx        # Map popup component
│   │   └── BoxPlot.jsx     # D3 box plot visualization
│   ├── hooks/               # Custom React hooks
│   │   ├── useDataLoader.js      # Data loading hook
│   │   └── useMortgageSettings.js # Mortgage settings state management
│   ├── utils/               # Utility functions
│   │   └── mortgageCalculations.js  # Mortgage calculation logic
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles with Tailwind
├── public/
│   └── data/                # Data files (served statically)
│       ├── POA_2021_NSW.geojson
│       ├── postcode_to_suburbs.csv
│       └── aggregated_yearly_data.csv
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

## Component Overview

- **Header**: Displays title and description with mobile toggle
- **Map**: Main Leaflet map with GeoJSON rendering, popups, and legend
- **DataTable**: Sortable and filterable table of housing data
- **MortgageSettings**: Collapsible panel for configuring mortgage calculations
- **MobileOverlay**: Full-screen overlay for mobile device details
- **Popup**: Map popup showing postcode details
- **BoxPlot**: D3.js visualization for cost ranges

## The Data

This project is built on publicly available data from Australian government agencies.

1. **Rent and Sales Data**: The data file `public/data/aggregated_yearly_data.csv` is an aggregate of the **NSW Department of Communities and Justice (DCJ)** rent and sales report. This provides the median weekly rent and quarterly sales price data.
   * [Link to source](https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html)
2. **Postcode Boundaries (GeoJSON)**: Sourced from the **Australian Bureau of Statistics (ABS)** as part of the Australian Statistical Geography Standard (ASGS).
   * [Link to source](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files)
3. **Postcode to Suburb Names**: Sourced from **data.gov.au**. This provides a lookup to list the suburbs within each postcode.
   * [Link to source](https://www.data.gov.au/data/dataset/asgs-edition-3-2021-correspondences)

### Data Files

Ensure the following files are in `public/data/`:
- `POA_2021_NSW.geojson` - NSW postcode boundaries
- `postcode_to_suburbs.csv` - Postcode to suburb mapping
- `aggregated_yearly_data.csv` - Housing cost data

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Leaflet** - Interactive maps
- **D3.js** - Data visualizations
- **PapaParse** - CSV parsing
- **Tailwind CSS** - Styling

## Key Improvements

1. **Component-Based Architecture**: The monolithic code has been broken down into reusable, maintainable components
2. **Custom Hooks**: Business logic is separated into custom hooks for better reusability
3. **Modern Build System**: Using Vite for fast development and optimized production builds
4. **Better State Management**: React hooks for managing application state
5. **Separation of Concerns**: UI components, business logic, and utilities are clearly separated

## License

The code for this project is licensed under the **MIT License**. See the `LICENSE` file for details.

The data sourced from government agencies is subject to Creative Commons Attribution. Please see the source links above for the specific terms.

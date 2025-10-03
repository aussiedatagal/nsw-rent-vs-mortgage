# Who Pays for the Asset? A Renter's Map of NSW

*I threw this map together to explore a simple question about the housing market: who's actually paying for the asset? It compares the median weekly rent in a postcode to an estimated mortgage payment. The red spots highlight where renters aren't just covering the landlord's costs but are actively helping pay off a property that someone else owns*

**[View the live map here\!](https://aussiedatagal.github.io/nsw-rent-vs-buy)**

## The Data

This project is built on publicly available data from Australian government agencies.

1.  **Rent and Sales Data**: The data file `data/aggregated_yearly_data.csv` us an aggregate of the **NSW Department of Communities and Justice (DCJ)** rent and sales report. This provides the median weekly rent and quarterly sales price data.
      * [Link to source](https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html)
2.  **Postcode Boundaries (GeoJSON)**: Sourced from the **Australian Bureau of Statistics (ABS)** as part of the Australian Statistical Geography Standard (ASGS).
      * [Link to source](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files)
3.  **Postcode to Suburb Names**: Sourced from **data.gov.au**. This provides a lookup to list the suburbs within each postcode.
      * [Link to source](https://www.data.gov.au/data/dataset/asgs-edition-3-2021-correspondences)

## Technology Stack

  * **Mapping**: [Leaflet.js](https://leafletjs.com/)
  * **Data Visualization (Box Plots)**: [D3.js](https://d3js.org/)
  * **CSV Parsing**: [PapaParse](https://www.papaparse.com/)
  * **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## License

The code for this project is licensed under the **MIT License**. See the `LICENSE` file for details.

The data sourced from government agencies is subject to Creative Commons Attribution. Please see the source links above for the specific terms.

Using the Browser
=================

Navigating the Browser
^^^^^^^^^^^^^^^^^^^^^^
The browser has five main components:

    1. Title bar
    2. Map Display
    3. Data Filters
    4. Data Tables
    5. Data Upload

.. image:: _static/browser_sections.png

1. Title Bar

   As well as displaying the main title, the title bar contains the settings icon, which allows access to the browser settings panel. The main title can be changed through the settings panel.

2. Map Display

   The map display section shows a graphical rendering of the dataset after applying all selected filters and intersections. The map display is updated in real time whenever data filters are added/removed, when external data are intersected through the Data Upload component, and when changes are applied through the Settings panel. The density of the fill color corresponds to the number/density of modules present in each node. Nodes with no modules matching the current set of filters are rendered with a gray fill color, but still respond to click and hover events. By contrast, "empty" nodes, with no associated data in the overall dataset, are rendered in a light gray fill color with white outlines and disabled. Hovering the mouse over a map node will bring up a tooltip with basic information about the node. Clicking a node will bring up detailed data on the currently-displayed modules assigned to that node in the Data Tables section. The currently-selected node is always highlighted by a bright green outline.

   The map display can be toggled between showing the raw record count for each map node or the fraction of records from each node that match the current set of filters and intersections. Displayed data can also be log-transformed by clicking the "Log2 Transform" box. Tooltips can also be customized through the settings panel.

   This is also where you will find buttons enabling data and images to be downloaded and saved locally. Images are stored as SVG files. The filtered and/or intersected dataset can be saved as a text file, either in tab-delimeted BED format, suitable for analysis in many genomics packages, or as JSON data. The JSON option is useful in cases where successive intersections are desired as its output can be reloaded in the browser as a new dataset for further analysis.

3. Data Filters

   Data Filters allow exploration of the dataset by successively applying/removing filters against specific data fields. The filters are data-driven, meaning that a filter will be available for every non-nested field found in the primary module documents. By default, selections are combined with 'AND', such that multiple selections succesively narrow the search results. Filters for numeric fields currently default to a range-slider format. Future versions will make configuration of individual filters possible for greater search flexibility. The data filters component can be collapsed by clicking the chevron icon if desired.

4. Data Tables

   This sections shows a configurable set of detailed data tables for the currently-selected map node. The first table is fixed, and shows summary data for the selected node. Subsequent tables show module-level data for the selected node. Tables can be added/removed and configured through the settings panel. Several options are available for aggregating and displaying the data.

5. Data Upload

   One of the most powerful features of the browser is its ability to interface directly with the well-known bedTools suite, enabling real-time intersection with external datasets. BED files for any genomic annotation can be uploaded through the Data Upload component in plain text or gzipped format. Clicking the "intersect" button will then intersect the currently displayed data with the uploaded dataset and render the resulting intersection to the map display and data tables.

   .. note::
      The Map Display will always show the number/density of *modules* that intersect any records in the uploaded BED file, meaning that a single module intersecting multiple BED records is only counted once in the map data. However, the Data Tables and BED data will contain a row for every intersecting BED record, meaning that individual modules from the parent dataset may show up more than once.

   .. warning::
      Intersected data are **NOT** currently available for direct search through the Data Filters component. **Adding/removing data filters will cause the intersection to be reset.** This means you will need to click the "intersect" button each time you add or remove a data filter to obtain new results.

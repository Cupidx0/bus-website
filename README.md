# MetroBus XML to JSON Converter

This tool converts MetroBus XML data in TransXChange format to JSON format for easier consumption in JavaScript applications. It's optimized for handling large XML files efficiently.

## Setup

1. Make sure you have Node.js installed on your machine
2. Install the dependencies:
   ```
   npm install
   ```

## Usage

### Converting XML to JSON

1. Ensure your MetroBus XML file is located in the `metrobus_1740751016` directory and named `metrobus-1.xml`
2. Run the conversion script:
   ```
   npm run convert
   ```
3. The script will generate a file called `metrobus-data.json` in the project root directory

### Extracting Route Information

The full JSON file contains a lot of data that might not be immediately useful. To extract just the relevant route information:

1. First convert the XML to JSON (if you haven't already)
2. Run the extract script:
   ```
   npm run extract
   ```
3. This will generate a file called `route-summary.json` with just the relevant route data

### Generating JavaScript Data for Web Application

To generate JavaScript data that can be directly used in your Bus Route Finder web application:

1. First generate the route summary (if you haven't already)
2. Run the generate-js script:
   ```
   npm run generate-js
   ```
3. This will create a file called `bus-routes-data.js` with JavaScript constants for bus routes and stops

### Processing Everything at Once

To run all steps (convert XML to JSON, extract route information, and generate JavaScript data) in one command:

```
npm run process-all
```

## Output Files

- `metrobus-data.json` - The complete JSON representation of the XML data
- `route-summary.json` - A simplified JSON file containing just the route and stop information
- `bus-routes-data.js` - JavaScript file with constants ready to use in a web application

## Using in Web Application

To use the generated data in your Bus Route Finder application:

1. Include the generated JavaScript file in your HTML:
   ```html
   <script src="bus-routes-data.js"></script>
   ```

2. Use the `busRoutes` and `busStops` variables in your application code:
   ```javascript
   // Display bus routes in a dropdown
   function populateBusRoutes() {
     const select = document.getElementById('busRouteSelect');
     busRoutes.forEach(route => {
       const option = document.createElement('option');
       option.value = route.id;
       option.textContent = route.name;
       select.appendChild(option);
     });
   }
   
   // Show bus stops on map
   function showBusStopsOnMap(map) {
     busStops.forEach(stop => {
       const marker = new google.maps.Marker({
         position: { lat: stop.lat, lng: stop.lng },
         map: map,
         title: stop.name
       });
     });
   }
   ```

## Customization

If you need to convert a different XML file or change the output paths, you can modify the variables in the script files:

- In `xml_to_json.js`:
  - `xmlFilePath`: Path to the XML file you want to convert
  - `jsonFilePath`: Path where the converted JSON file should be saved

- In `extract_routes.js`:
  - `jsonFilePath`: Path to the JSON file to read
  - `summaryFilePath`: Path where the summary JSON file should be saved

- In `generate_js_data.js`:
  - `summaryFilePath`: Path to the summary JSON file to read
  - `jsOutputPath`: Path where the JavaScript file should be saved

## Parser Options

The converter uses the following options for XML to JSON conversion:

- `ignoreAttributes: false` - Preserve XML attributes in the JSON output
- `attributeNamePrefix: ""` - Don't add any prefix to attribute names
- `isArray` - Function to determine which elements should be treated as arrays

The converter specifically treats the following elements as arrays:
- services
- journeypatternref
- journeypatterns
- routes
- routesections
- stoppoints
- operators
- servicecodelist

If you need a different JSON structure, you can modify these options in the script. 
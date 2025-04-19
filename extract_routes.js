// Script to extract useful route information from all JSON files
const fs = require('fs');
const path = require('path');

// Directory containing JSON files
const jsonDirectory = path.join(__dirname, 'json_output');
// Output directory for route summaries
const summaryDirectory = path.join(__dirname, 'route_summaries');
// Combined output file path
const combinedSummaryFilePath = path.join(__dirname, 'all-routes-summary.json');

// Create output directory if it doesn't exist
if (!fs.existsSync(summaryDirectory)) {
    fs.mkdirSync(summaryDirectory);
}

// Combined data for all routes
const allServices = [];
const allStops = {};

try {
    console.log('Reading JSON directory...');
    const files = fs.readdirSync(jsonDirectory);
    const jsonFiles = files.filter(file => file.toLowerCase().endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files to process`);
    
    // Process each JSON file
    let successCount = 0;
    let errorCount = 0;
    
    jsonFiles.forEach((jsonFile, index) => {
        const jsonFilePath = path.join(jsonDirectory, jsonFile);
        const routeNumber = jsonFile.replace('route-', '').replace('.json', '');
        const summaryFilePath = path.join(summaryDirectory, `summary-${routeNumber}.json`);
        
        try {
            console.log(`[${index + 1}/${jsonFiles.length}] Processing ${jsonFile}...`);
            
            // Read JSON file
            const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
            
            // Extract TransXChange data
            const transXChange = jsonData.TransXChange;
            if (!transXChange) {
                throw new Error('TransXChange data not found in the JSON file');
            }
            
            // Extract services
            if (transXChange.Services && transXChange.Services.Service) {
                const services = Array.isArray(transXChange.Services.Service) 
                    ? transXChange.Services.Service 
                    : [transXChange.Services.Service];
                
                // Extract stops
                const stops = transXChange.StopPoints ? transXChange.StopPoints.StopPoint : [];
                const stopsMap = {};
                
                if (Array.isArray(stops)) {
                    stops.forEach(stop => {
                        if (!stop.StopPointRef) return;
                        
                        const stopRef = stop.StopPointRef;
                        stopsMap[stopRef] = {
                            name: stop.Descriptor ? stop.Descriptor.CommonName : 'Unknown',
                            location: stop.Location ? {
                                latitude: stop.Location.Latitude,
                                longitude: stop.Location.Longitude
                            } : null
                        };
                        
                        // Add to combined stops if not already present
                        if (!allStops[stopRef]) {
                            allStops[stopRef] = stopsMap[stopRef];
                        }
                    });
                }
                
                // Create summary of routes
                const routeSummary = services.map(service => {
                    let lines = [];
                    
                    if (service.Lines && service.Lines.Line) {
                        lines = Array.isArray(service.Lines.Line) 
                            ? service.Lines.Line 
                            : [service.Lines.Line];
                    }
                    
                    const summaryItem = {
                        serviceCode: service.ServiceCode,
                        operatorRef: service.RegisteredOperatorRef,
                        description: service.Description || service.ServiceCode,
                        lines: lines.map(line => ({
                            id: line.id,
                            name: line.LineName,
                            color: line.LineColour || '#000000'
                        })),
                        routes: service.StandardService ? service.StandardService.JourneyPattern : []
                    };
                    
                    // Add to combined services
                    allServices.push(summaryItem);
                    
                    return summaryItem;
                });
                
                // Save individual summary to file
                fs.writeFileSync(summaryFilePath, JSON.stringify({
                    services: routeSummary,
                    stops: stopsMap
                }, null, 2));
                
                console.log(`  ✓ Summary saved to ${path.basename(summaryFilePath)}`);
                console.log(`  Found ${routeSummary.length} services and ${Object.keys(stopsMap).length} stops`);
                
                successCount++;
            } else {
                throw new Error('No services found in the JSON file');
            }
        } catch (error) {
            console.error(`  ✗ Error processing ${jsonFile}: ${error.message}`);
            errorCount++;
        }
    });
    
    // Save combined summary to file
    console.log('\nGenerating combined summary...');
    fs.writeFileSync(combinedSummaryFilePath, JSON.stringify({
        services: allServices,
        stops: allStops
    }, null, 2));
    
    console.log(`Combined summary saved to ${combinedSummaryFilePath}`);
    console.log(`Total: ${allServices.length} services and ${Object.keys(allStops).length} stops`);
    
    console.log('\nExtraction complete!');
    console.log(`Successfully processed: ${successCount} files`);
    if (errorCount > 0) {
        console.log(`Failed to process: ${errorCount} files`);
    }
    
} catch (error) {
    console.error('Error:', error.message);
} 
const fs = require('fs');
const path = require('path');

// Path to the TransXChange data directory
const dataDirectory = path.join(__dirname, 'json_output');
const outputFile = path.join(__dirname, 'all-bus-routes-data.js');

try {
    console.log('Reading TransXChange data directory...');
    const files = fs.readdirSync(dataDirectory);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const routes = new Map();
    const stops = new Map();

    jsonFiles.forEach(file => {
        console.log(`Processing ${file}...`);
        const data = JSON.parse(fs.readFileSync(path.join(dataDirectory, file)));
        // STEP 0: Map JourneyPatternSections by ID
        const journeyPatternSections = new Map();
        if (data.TransXChange && Array.isArray(data.TransXChange.JourneyPatternSections)) {
            data.TransXChange.JourneyPatternSections.forEach(wrapper => {
                if (Array.isArray(wrapper.JourneyPatternSection)) {
                    wrapper.JourneyPatternSection.forEach(section => {
                        journeyPatternSections.set(section.id.toString(), section);
                    });
                }
            });
        }

        // Extract routes
        if (data.TransXChange && Array.isArray(data.TransXChange.Services)) {
            data.TransXChange.Services.forEach(serviceWrapper => {
                const service = serviceWrapper.Service;
                if (!service) return;
        
                const routeId = service.ServiceCode;
                const lineName = service.Lines?.Line?.LineName || routeId;
                const description = service.Description || '';
                const route = {
                    id: routeId,
                    name: `Route ${lineName}`,
                    description: description,
                    stops: []
                };
                // Handle JourneyPatterns
                const journeySections = data.TransXChange?.JourneyPatternSections?.JourneyPatternSection || [];

                journeySections.forEach(section => {
                    const links = Array.isArray(section.JourneyPatternTimingLink)
                            ? section.JourneyPatternTimingLink
                            : section.JourneyPatternTimingLink
                            ? [section.JourneyPatternTimingLink]
                            : [];
                    links.forEach(link => {
                        const fromStop = link.From?.StopPointRef;
                        const toStop = link.To?.StopPointRef;

                        if (fromStop && !route.stops.includes(fromStop)) {
                            route.stops.push(fromStop);
                        }
                        if (toStop && !route.stops.includes(toStop)) {
                            route.stops.push(toStop);
                        }
                    });
                });

                routes.set(routeId, route);
            });
        }
        // Extract stops
        if (data.TransXChange && Array.isArray(data.TransXChange.StopPoints)) {
            data.TransXChange.StopPoints.forEach(stopGroup => {
                if (Array.isArray(stopGroup.AnnotatedStopPointRef)) {
                    stopGroup.AnnotatedStopPointRef.forEach(stop => {
                        if (stop.StopPointRef && stop.CommonName && stop.Location) {
                            stops.set(stop.StopPointRef, {
                                id: stop.StopPointRef,
                                name: stop.CommonName,
                                lat: parseFloat(stop.Location.Latitude),
                                lng: parseFloat(stop.Location.Longitude)
                            });
                        }
                    });
                }
            });
        }
    });
    // Generate JavaScript file content
    const jsContent = `// Generated from MetroBus TransXChange data
// Generated on: ${new Date().toISOString()}
// Contains data for ${routes.size} bus routes and ${stops.size} bus stops

// Bus routes data
window.busRoutes = ${JSON.stringify([...routes.values()], null, 2)};

// Bus stop locations
window.busStops = ${JSON.stringify([...stops.values()], null, 2)};

// Helper functions
${fs.readFileSync(path.join(__dirname, 'helper-functions.js'), 'utf8')}`;

    // Write to file
    fs.writeFileSync(outputFile, jsContent);
    console.log(`Generated JavaScript data with ${routes.size} routes and ${stops.size} stops`);

} catch (error) {
    console.error('Error generating JavaScript data:', error);
    process.exit(1);
}

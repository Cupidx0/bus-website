// Script to convert all XML files to JSON - optimized for large files
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// Directory containing XML files
const xmlDirectory = path.join(__dirname, 'metrobus_1740751016');
// Output directory for JSON files
const jsonDirectory = path.join(__dirname, 'json_output');

// Create output directory if it doesn't exist
if (!fs.existsSync(jsonDirectory)) {
    fs.mkdirSync(jsonDirectory);
}

// Parser options
const options = {
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Elements that should always be treated as arrays
        const arrayElements = [
            'services', 'journeypatternref', 'journeypatterns', 'routes', 
            'routesections', 'stoppoints', 'operators', 'servicecodelist'
        ];
        return arrayElements.includes(name.toLowerCase());
    }
};

// Get all XML files in the directory
try {
    console.log('Reading XML directory...');
    const files = fs.readdirSync(xmlDirectory);
    const xmlFiles = files.filter(file => file.toLowerCase().endsWith('.xml'));
    
    console.log(`Found ${xmlFiles.length} XML files to process`);
    
    // Process each XML file
    let successCount = 0;
    let errorCount = 0;
    
    xmlFiles.forEach((xmlFile, index) => {
        const xmlFilePath = path.join(xmlDirectory, xmlFile);
        const routeNumber = xmlFile.replace('metrobus-', '').replace('.xml', '');
        const jsonFilePath = path.join(jsonDirectory, `route-${routeNumber}.json`);
        
        try {
            console.log(`[${index + 1}/${xmlFiles.length}] Processing ${xmlFile}...`);
            
            // Read and parse XML
            const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
            const parser = new XMLParser(options);
            const result = parser.parse(xmlData);
            
            // Write JSON to file
            fs.writeFileSync(jsonFilePath, JSON.stringify(result, null, 2));
            
            console.log(`  ✓ Converted to ${path.basename(jsonFilePath)}`);
            successCount++;
        } catch (error) {
            console.error(`  ✗ Error processing ${xmlFile}: ${error.message}`);
            errorCount++;
        }
    });
    
    console.log('\nConversion complete!');
    console.log(`Successfully converted: ${successCount} files`);
    if (errorCount > 0) {
        console.log(`Failed to convert: ${errorCount} files`);
    }
    
} catch (error) {
    console.error('Error:', error.message);
} 
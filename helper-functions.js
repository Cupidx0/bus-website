function findNearbyStops(lat, lng, radiusKm = 1) {
    if (!Array.isArray(busStops)) {
        console.error('Bus stops data not available');
        return [];
    }

    const R = 6371; // Earth's radius in km
    return busStops.filter(stop => {
        // Convert degrees to radians
        const φ1 = lat * Math.PI / 180;
        const φ2 = stop.lat * Math.PI / 180;
        const Δφ = (stop.lat - lat) * Math.PI / 180;
        const Δλ = (stop.lng - lng) * Math.PI / 180;

        // Haversine formula
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return distance <= radiusKm;
    }).sort((a, b) => {
        // Sort by distance from current location
        const distA = Math.sqrt(Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2));
        const distB = Math.sqrt(Math.pow(b.lat - lat, 2) + Math.pow(b.lng - lng, 2));
        return distA - distB;
    });
}
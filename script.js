let map; // Global map instance
    
document.getElementById('find-route').addEventListener('click', function() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end) {
        alert("Please enter both start and end locations.");
        return;
    }

    // Clear any existing map instance
    if (map) {
        map.remove();
    }

    // Geocode start and end locations
    Promise.all([geocodeLocation(start), geocodeLocation(end)])
        .then(([startCoords, endCoords]) => {
            map = L.map('map').setView([startCoords[1], startCoords[0]], 13);

            // Fix map container size
            setTimeout(() => map.invalidateSize(), 300);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add markers for start and end points
            const startMarker = L.marker([startCoords[1], startCoords[0]])
                .addTo(map)
                .bindPopup("Start: " + start)
                .openPopup();
            const endMarker = L.marker([endCoords[1], endCoords[0]])
                .addTo(map)
                .bindPopup("End: " + end)
                .openPopup();

            // Fetch the shortest route using OSRM
            const osrmURL = `https://router.project-osrm.org/route/v1/driving/${startCoords.join(',')};${endCoords.join(',')}?overview=full&geometries=geojson`;
            fetch(osrmURL)
                .then(response => response.json())
                .then(data => {
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

                        // Draw the route on the map
                        const routeLine = L.polyline(coordinates, { color: 'blue', weight: 5 }).addTo(map);
                        map.fitBounds(routeLine.getBounds());

                        // Display route information
                        document.getElementById('route-results').innerHTML = `
                            <p class="text-green-700 font-semibold">
                                Shortest Route Found: ${(route.distance / 1000).toFixed(2)} km 
                                <br> Duration: ${(route.duration / 60).toFixed(2)} minutes
                            </p>
                        `;
                    } else {
                        alert("No route found between these locations.");
                    }
                })
                .catch(err => {
                    console.error("Error fetching route:", err);
                    alert("Failed to fetch the route. Please try again.");
                });
        })
        .catch(err => {
            console.error("Error geocoding location:", err);
            alert("Location not found. Please check your inputs.");
        });
});

// Geocoding function using Nominatim API
function geocodeLocation(location) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) throw new Error("Location not found.");
            return [data[0].lon, data[0].lat];
        });
}

document.getElementById('pay-now').addEventListener('click', function() {
    const name = document.getElementById('passenger-name').value;
    const destination = document.getElementById('destination').value;
    const paymentStatusDiv = document.getElementById('payment-status');
    const qrcodeContainer = document.getElementById('qrcode');

    if (!name || !destination) {
        alert("Please fill in all the fields.");
        return;
    }

    // Simulate Payment Process
    paymentStatusDiv.classList.remove('hidden');

    // Generate Ticket Information
    const ticketData = `Passenger: ${name}\nDestination: ${destination}\nDate: ${new Date().toLocaleDateString()}\nStatus: Paid`;

    // Clear previous QR Code
    qrcodeContainer.innerHTML = "";

    // Generate QR Code
    const qrCode = new QRCode(qrcodeContainer, {
        text: ticketData,
        width: 128,
        height: 128
    });
});
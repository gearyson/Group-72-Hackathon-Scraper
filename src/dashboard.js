const FIRECRAWL_API_KEY = 'fc-4c3d213630b945bdbe0316d532407c3b';
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape';

if (localStorage.getItem('loggedIn') !== 'true') {
    window.location.href = '/';
}

const username = localStorage.getItem('username');
document.getElementById('userDisplay').textContent = `Welcome, ${username}`;

window.setUrl = function(url) {
    document.getElementById('scrapeUrl').value = url;
};

window.logout = function() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    window.location.href = '/';
};

window.startScraping = async function() {
    const url = document.getElementById('scrapeUrl').value;
    const location = document.getElementById('location').value;
    const propertyType = document.getElementById('propertyType').value;
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const distanceFrom = document.getElementById('distanceFrom').value;
    const maxDistance = document.getElementById('maxDistance').value;

    if (!url) {
        alert('Please enter a URL to scrape');
        return;
    }

    document.getElementById('loading').classList.add('active');
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('scrapeBtn').disabled = true;
    document.getElementById('scrapeBtn').textContent = '⏳ Scraping...';

    try {
        const response = await fetch(FIRECRAWL_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                formats: ['markdown', 'html'],
                onlyMainContent: true
            })
        });

        const result = await response.json();

        document.getElementById('loading').classList.remove('active');
        document.getElementById('scrapeBtn').disabled = false;
        document.getElementById('scrapeBtn').textContent = '🚀 Scrape';

        if (response.ok) {
            const params = {
                location,
                property_type: propertyType,
                min_price: minPrice,
                max_price: maxPrice,
                distance_from: distanceFrom,
                max_distance: maxDistance
            };

            const scraped_content = result.data || {};
            const listings = parseRealEstateData(scraped_content, params);

            displayResults({
                success: true,
                data: listings,
                raw_content: scraped_content.markdown ? scraped_content.markdown.substring(0, 2000) : '',
                source_url: url
            });
        } else {
            displayError(`Firecrawl API error: ${response.status}`, result.error || response.statusText);
        }
    } catch (error) {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('scrapeBtn').disabled = false;
        document.getElementById('scrapeBtn').textContent = '🚀 Scrape';
        displayError('Network error: ' + error.message);
    }
};

function parseRealEstateData(content, params) {
    const listings = [];

    const markdown = content.markdown || '';

    const listing = {
        source: 'Scraped Data',
        location: params.location || 'N/A',
        property_type: params.property_type || 'N/A',
        price_range: `$${params.min_price || '0'} - $${params.max_price || 'No limit'}`,
        distance_from: params.distance_from || 'N/A',
        max_distance: params.max_distance || 'N/A',
        content_preview: markdown.substring(0, 500) || 'No content extracted',
        status: 'Scraped Successfully'
    };
    listings.push(listing);

    return listings;
}

function displayResults(result) {
    const container = document.getElementById('resultsContainer');

    let html = `
        <p style="color: #666; margin-bottom: 15px;">
            <strong>Source:</strong> ${result.source_url}
        </p>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Price Range</th>
                    <th>Distance From</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    result.data.forEach(item => {
        html += `
            <tr>
                <td>${item.source}</td>
                <td>${item.location}</td>
                <td>${item.property_type}</td>
                <td>${item.price_range}</td>
                <td>${item.distance_from}</td>
                <td><span class="status-success">${item.status}</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    if (result.raw_content) {
        html += `
            <h3 style="margin-top: 30px; color: #333;">Raw Scraped Content (Preview)</h3>
            <div class="raw-content">${escapeHtml(result.raw_content)}</div>
        `;
    }

    container.innerHTML = html;
}

function displayError(error, details) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="error-box">
            <strong>Error:</strong> ${error}
            ${details ? '<br><br><strong>Details:</strong> ' + details : ''}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

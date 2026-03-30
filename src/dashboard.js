import { supabase } from './supabaseClient.js';

const FIRECRAWL_API_KEY = 'fc-4c3d213630b945bdbe0316d532407c3b';
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape';

if (localStorage.getItem('loggedIn') !== 'true') {
    window.location.href = '/';
}

const username = localStorage.getItem('username');
document.getElementById('userDisplay').textContent = `Welcome, ${username}`;

let currentScrapeData = null;
let currentUserId = null;

async function initializeUser() {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (data) {
        currentUserId = data.id;
    }
}

initializeUser();

window.switchTab = function(tabName) {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    if (tabName === 'realEstate') {
        document.querySelector('.tab-button:nth-child(1)').classList.add('active');
        document.getElementById('realEstateTab').classList.add('active');
    } else if (tabName === 'general') {
        document.querySelector('.tab-button:nth-child(2)').classList.add('active');
        document.getElementById('generalTab').classList.add('active');
    } else if (tabName === 'history') {
        document.querySelector('.tab-button:nth-child(3)').classList.add('active');
        document.getElementById('historyTab').classList.add('active');
        loadHistory();
    }
};

window.setUrl = function(url) {
    document.getElementById('scrapeUrl').value = url;
};

window.setGeneralUrl = function(url) {
    document.getElementById('generalScrapeUrl').value = url;
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

            currentScrapeData = {
                scrape_type: 'real_estate',
                url: url,
                title: `Real Estate - ${params.location || 'Unknown Location'}`,
                content: {
                    params,
                    scraped_content,
                    listings
                }
            };

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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <p style="color: #666; margin: 0;">
                <strong>Source:</strong> ${result.source_url}
            </p>
            <button class="btn-save" onclick="saveToDatabase()">💾 Save to Database</button>
        </div>
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

window.startGeneralScraping = async function() {
    const url = document.getElementById('generalScrapeUrl').value;
    const format = document.getElementById('scrapeFormat').value;
    const mainContentOnly = document.getElementById('mainContentOnly').value === 'true';

    if (!url) {
        alert('Please enter a URL to scrape');
        return;
    }

    document.getElementById('loading').classList.add('active');
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('generalScrapeBtn').disabled = true;
    document.getElementById('generalScrapeBtn').textContent = '⏳ Scraping...';

    try {
        const formats = format === 'both' ? ['markdown', 'html'] : [format];

        const response = await fetch(FIRECRAWL_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                formats: formats,
                onlyMainContent: mainContentOnly
            })
        });

        const result = await response.json();

        document.getElementById('loading').classList.remove('active');
        document.getElementById('generalScrapeBtn').disabled = false;
        document.getElementById('generalScrapeBtn').textContent = '🚀 Scrape';

        if (response.ok) {
            const data = result.data || {};
            currentScrapeData = {
                scrape_type: 'general',
                url: url,
                title: data.metadata?.title || `Web Scrape - ${url}`,
                content: {
                    format,
                    mainContentOnly,
                    data: result.data
                }
            };
            displayGeneralResults(result, url, format);
        } else {
            displayError(`Firecrawl API error: ${response.status}`, result.error || response.statusText);
        }
    } catch (error) {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('generalScrapeBtn').disabled = false;
        document.getElementById('generalScrapeBtn').textContent = '🚀 Scrape';
        displayError('Network error: ' + error.message);
    }
};

function displayGeneralResults(result, url, format) {
    const container = document.getElementById('resultsContainer');
    const data = result.data || {};

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
                <p style="color: #666; margin-bottom: 10px;">
                    <strong>Source URL:</strong> <a href="${url}" target="_blank" style="color: #0f3460;">${url}</a>
                </p>
                <p style="color: #666; margin-bottom: 10px;">
                    <strong>Format:</strong> ${format === 'both' ? 'Markdown & HTML' : format.toUpperCase()}
                </p>
                <p style="color: #666;">
                    <strong>Status:</strong> <span class="status-success">Successfully Scraped</span>
                </p>
            </div>
            <button class="btn-save" onclick="saveToDatabase()">💾 Save to Database</button>
        </div>
    `;

    if (data.markdown) {
        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">📝 Markdown Content</h3>
                <div class="raw-content" style="max-height: 500px;">${escapeHtml(data.markdown)}</div>
            </div>
        `;
    }

    if (data.html && format !== 'markdown') {
        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">🔖 HTML Content</h3>
                <div class="raw-content" style="max-height: 500px;">${escapeHtml(data.html.substring(0, 5000))}</div>
            </div>
        `;
    }

    if (data.metadata) {
        html += `
            <div>
                <h3 style="color: #333; margin-bottom: 15px;">📊 Metadata</h3>
                <div class="raw-content" style="max-height: 300px;">${escapeHtml(JSON.stringify(data.metadata, null, 2))}</div>
            </div>
        `;
    }

    container.innerHTML = html;
}

window.saveToDatabase = async function() {
    if (!currentScrapeData || !currentUserId) {
        alert('No data to save or user not found');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('scraped_data')
            .insert([{
                user_id: currentUserId,
                scrape_type: currentScrapeData.scrape_type,
                url: currentScrapeData.url,
                title: currentScrapeData.title,
                content: currentScrapeData.content
            }])
            .select();

        if (error) {
            console.error('Error saving to database:', error);
            alert('Failed to save to database: ' + error.message);
        } else {
            alert('Successfully saved to database!');
            currentScrapeData = null;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save to database');
    }
};

async function loadHistory() {
    if (!currentUserId) {
        document.getElementById('historyContainer').innerHTML = '<p style="color: #666;">Please wait, loading user data...</p>';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('scraped_data')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading history:', error);
            document.getElementById('historyContainer').innerHTML = '<p style="color: #f44336;">Failed to load history</p>';
            return;
        }

        if (!data || data.length === 0) {
            document.getElementById('historyContainer').innerHTML = '<div class="no-results"><p>No saved scrapes yet. Scrape some websites and save them to see them here!</p></div>';
            return;
        }

        displayHistory(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('historyContainer').innerHTML = '<p style="color: #f44336;">Failed to load history</p>';
    }
}

function displayHistory(items) {
    const container = document.getElementById('historyContainer');

    let html = '<div class="history-grid">';

    items.forEach(item => {
        const date = new Date(item.created_at).toLocaleString();
        const typeLabel = item.scrape_type === 'real_estate' ? 'Real Estate' : 'General Web';
        const typeBadge = item.scrape_type === 'real_estate' ? 'badge-real-estate' : 'badge-general';

        html += `
            <div class="history-card">
                <div class="history-header">
                    <h3>${escapeHtml(item.title)}</h3>
                    <span class="history-badge ${typeBadge}">${typeLabel}</span>
                </div>
                <p class="history-url">
                    <strong>URL:</strong> <a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.url)}</a>
                </p>
                <p class="history-date">
                    <strong>Date:</strong> ${date}
                </p>
                <div class="history-actions">
                    <button class="btn-view" onclick="viewScrapeDetails('${item.id}')">View Details</button>
                    <button class="btn-delete" onclick="deleteScrape('${item.id}')">Delete</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

window.viewScrapeDetails = async function(id) {
    try {
        const { data, error } = await supabase
            .from('scraped_data')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error || !data) {
            alert('Failed to load scrape details');
            return;
        }

        const content = JSON.stringify(data.content, null, 2);
        const detailsHtml = `
            <div class="details-modal">
                <div class="details-modal-content">
                    <div class="details-modal-header">
                        <h2>${escapeHtml(data.title)}</h2>
                        <button onclick="closeDetails()" class="btn-close">×</button>
                    </div>
                    <div class="details-modal-body">
                        <p><strong>URL:</strong> <a href="${escapeHtml(data.url)}" target="_blank">${escapeHtml(data.url)}</a></p>
                        <p><strong>Type:</strong> ${data.scrape_type === 'real_estate' ? 'Real Estate' : 'General Web'}</p>
                        <p><strong>Date:</strong> ${new Date(data.created_at).toLocaleString()}</p>
                        <h3>Content:</h3>
                        <div class="raw-content" style="max-height: 400px;">${escapeHtml(content)}</div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailsHtml);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load details');
    }
};

window.closeDetails = function() {
    const modal = document.querySelector('.details-modal');
    if (modal) {
        modal.remove();
    }
};

window.deleteScrape = async function(id) {
    if (!confirm('Are you sure you want to delete this scrape?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('scraped_data')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Failed to delete scrape');
            return;
        }

        alert('Scrape deleted successfully');
        loadHistory();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete scrape');
    }
};

# Realtor.com Scraper using Firecrawl

A Python module for scraping real estate listings from Realtor.com using the Firecrawl API.

## Features

- ✅ Scrape single property listings
- ✅ Crawl search results with filters
- ✅ Extract structured data (price, bedrooms, bathrooms, sqft, etc.)
- ✅ Export to CSV and JSON
- ✅ Built-in data cleaning and analysis with pandas
- ✅ Rate limiting to respect servers
- ✅ Error handling and logging

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Get a Firecrawl API key:
   - Sign up at [firecrawl.dev](https://firecrawl.dev)
   - Get your API key from the dashboard

3. Set your API key as an environment variable:
```bash
export FIRECRAWL_API_KEY='your-api-key-here'
```

Or create a `.env` file:
```
FIRECRAWL_API_KEY=your-api-key-here
```

## Quick Start

### Scrape a Single Listing

```python
from realtor_scraper import RealtorScraper

scraper = RealtorScraper(api_key='your-api-key')

# Scrape one property
listing = scraper.scrape_single_listing(
    'https://www.realtor.com/realestateandhomes-detail/123-Main-St...'
)

print(listing.to_dict())
```

### Scrape Search Results

```python
# Search San Francisco properties
listings = scraper.scrape_search_results(
    location="San-Francisco_CA",
    limit=20,  # Number of pages to crawl
    price_min=500000,
    price_max=1000000,
    beds_min=2
)

# Convert to DataFrame for analysis
df = scraper.to_dataframe(listings)
print(df.head())

# Get price statistics
print(df['price_numeric'].describe())
```

### Save Results

```python
# Save to CSV
scraper.save_to_csv(listings, "sf_listings.csv")

# Save to JSON
scraper.save_to_json(listings, "sf_listings.json")
```

## Usage Examples

### Example 1: Analyze Price Distribution

```python
from realtor_scraper import RealtorScraper
import matplotlib.pyplot as plt

scraper = RealtorScraper()

# Scrape listings
listings = scraper.scrape_search_results(
    location="Austin_TX",
    limit=50,
    beds_min=3
)

df = scraper.to_dataframe(listings)

# Plot price distribution
df['price_numeric'].hist(bins=20)
plt.xlabel('Price ($)')
plt.ylabel('Frequency')
plt.title('Price Distribution - Austin, TX')
plt.show()
```

### Example 2: Compare Multiple Cities

```python
cities = ['San-Francisco_CA', 'Austin_TX', 'Miami_FL']
all_listings = []

for city in cities:
    listings = scraper.scrape_search_results(
        location=city,
        limit=30,
        beds_min=2
    )
    all_listings.extend(listings)

df = scraper.to_dataframe(all_listings)
print(df.groupby('city')['price_numeric'].mean())
```

### Example 3: Filter and Export

```python
# Scrape with specific criteria
listings = scraper.scrape_search_results(
    location="Seattle_WA",
    limit=100,
    price_min=400000,
    price_max=800000,
    beds_min=3,
    baths_min=2
)

df = scraper.to_dataframe(listings)

# Filter for properties with descriptions
df_filtered = df[df['description'].notna()]

# Export
df_filtered.to_csv('seattle_filtered.csv', index=False)
```

## Location Format

Locations should be formatted as: `City-Name_STATE`

Examples:
- `San-Francisco_CA`
- `New-York_NY`
- `Los-Angeles_CA`
- `Miami_FL`
- `Austin_TX`

For multi-word cities, use hyphens:
- `San-Diego_CA`
- `Salt-Lake-City_UT`

## Available Filters

- `price_min`: Minimum price
- `price_max`: Maximum price
- `beds_min`: Minimum bedrooms
- `baths_min`: Minimum bathrooms

## Data Fields

Each `PropertyListing` contains:
- `url`: Listing URL
- `price`: Price as string
- `bedrooms`: Number of bedrooms
- `bathrooms`: Number of bathrooms
- `sqft`: Square footage
- `address`: Street address
- `city`: City
- `state`: State
- `zip_code`: ZIP code
- `property_type`: Type (house, condo, etc.)
- `description`: Property description
- `lot_size`: Lot size
- `year_built`: Year built
- `scraped_at`: Timestamp of scraping

## Important Notes

### Legal & Ethical Considerations

⚠️ **Before using this scraper:**

1. **Review Terms of Service**: Check Realtor.com's Terms of Service and robots.txt
2. **Respect Rate Limits**: The module includes built-in delays, but be mindful of request volume
3. **Consider Official APIs**: Check if Realtor.com offers an official API for your use case
4. **Personal Use**: This tool is intended for personal analysis and research
5. **Don't Resell Data**: Don't redistribute or sell scraped data

### Rate Limiting

The scraper includes:
- 1-second delay between individual listing scrapes
- Configurable wait times for dynamic content
- Respect for server resources

### Troubleshooting

**API Key Error:**
```
ValueError: API key must be provided
```
Solution: Set the `FIRECRAWL_API_KEY` environment variable

**No Results Found:**
- Check location format
- Verify filters aren't too restrictive
- Ensure the search URL is valid

**Extraction Issues:**
- Some fields may be None if not found on page
- Website structure changes may affect extraction
- Monitor Firecrawl API responses for errors

## Advanced Usage

### Custom Schema Extraction

```python
result = scraper.app.scrape_url(url, params={
    'formats': ['extract'],
    'extract': {
        'schema': {
            'type': 'object',
            'properties': {
                'hoa_fees': {'type': 'number'},
                'parking_spaces': {'type': 'number'},
                'schools_nearby': {'type': 'array'}
            }
        }
    }
})
```

### Batch Processing

```python
import time

urls = [...]  # List of listing URLs

for i, url in enumerate(urls):
    listing = scraper.scrape_single_listing(url)
    # Process listing
    
    if (i + 1) % 10 == 0:
        print(f"Processed {i + 1}/{len(urls)}")
        time.sleep(5)  # Longer pause every 10 requests
```

## License

This project is for educational and personal use only. Always respect website terms of service and legal requirements when scraping data.

## Contributing

Feel free to submit issues or pull requests for improvements!

## Changelog

- **v1.0.0** (Dec 2025): Initial release
  - Single listing scraping
  - Search results crawling
  - CSV/JSON export
  - pandas integration
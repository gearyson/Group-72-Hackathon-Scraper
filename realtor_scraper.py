"""
Realtor.com Scraper Module using Firecrawl
A data analyst tool for extracting real estate listing data from Realtor.com

Author: Data Analytics Team
Date: December 2025
"""

import os
import json
import time
from typing import Dict, List, Optional, Union
from dataclasses import dataclass, asdict
from datetime import datetime
import pandas as pd
from firecrawl import FirecrawlApp


@dataclass
class PropertyListing:
    """Data class for real estate property listings"""
    url: str
    price: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    sqft: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    property_type: Optional[str] = None
    description: Optional[str] = None
    listing_date: Optional[str] = None
    lot_size: Optional[str] = None
    year_built: Optional[int] = None
    scraped_at: str = None
    
    def __post_init__(self):
        if self.scraped_at is None:
            self.scraped_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)


class RealtorScraper:
    """
    Main scraper class for Realtor.com using Firecrawl API
    
    Usage:
        scraper = RealtorScraper(api_key='your-api-key')
        listings = scraper.scrape_search_results('San-Francisco_CA', limit=10)
        df = scraper.to_dataframe(listings)
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the scraper
        
        Args:
            api_key: Firecrawl API key. If None, reads from FIRECRAWL_API_KEY env variable
        """
        self.api_key = api_key or os.getenv('FIRECRAWL_API_KEY')
        if not self.api_key:
            raise ValueError("API key must be provided or set in FIRECRAWL_API_KEY environment variable")
        
        self.app = FirecrawlApp(api_key=self.api_key)
        self.base_url = "https://www.realtor.com"
        
    def scrape_single_listing(self, url: str, extract_structured: bool = True) -> PropertyListing:
        """
        Scrape a single property listing
        
        Args:
            url: Full URL of the property listing
            extract_structured: If True, extract structured data using schema
            
        Returns:
            PropertyListing object with extracted data
        """
        try:
            if extract_structured:
                result = self.app.scrape_url(url, params={
                    'formats': ['extract'],
                    'extract': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'price': {'type': 'string'},
                                'bedrooms': {'type': 'number'},
                                'bathrooms': {'type': 'number'},
                                'sqft': {'type': 'number'},
                                'address': {'type': 'string'},
                                'city': {'type': 'string'},
                                'state': {'type': 'string'},
                                'zip_code': {'type': 'string'},
                                'property_type': {'type': 'string'},
                                'description': {'type': 'string'},
                                'lot_size': {'type': 'string'},
                                'year_built': {'type': 'number'}
                            }
                        }
                    }
                })
                
                extracted_data = result.get('extract', {})
                return PropertyListing(url=url, **extracted_data)
            else:
                result = self.app.scrape_url(url, params={'formats': ['markdown']})
                return PropertyListing(
                    url=url,
                    description=result.get('markdown', '')[:500]  # First 500 chars
                )
                
        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
            return PropertyListing(url=url)
    
    def build_search_url(self, location: str, **filters) -> str:
        """
        Build search URL with filters
        
        Args:
            location: Location string (e.g., 'San-Francisco_CA', 'New-York_NY')
            **filters: Additional filters like price_min, price_max, beds_min, etc.
            
        Returns:
            Constructed search URL
        """
        url = f"{self.base_url}/realestateandhomes-search/{location}"
        
        # Add common filters
        params = []
        if 'price_min' in filters:
            params.append(f"price-min={filters['price_min']}")
        if 'price_max' in filters:
            params.append(f"price-max={filters['price_max']}")
        if 'beds_min' in filters:
            params.append(f"beds-min={filters['beds_min']}")
        if 'baths_min' in filters:
            params.append(f"baths-min={filters['baths_min']}")
            
        if params:
            url += "?" + "&".join(params)
            
        return url
    
    def scrape_search_results(
        self, 
        location: str, 
        limit: int = 50,
        wait_time: int = 2000,
        **filters
    ) -> List[PropertyListing]:
        """
        Scrape multiple listings from search results
        
        Args:
            location: Location string (e.g., 'San-Francisco_CA')
            limit: Maximum number of pages to crawl
            wait_time: Time to wait for dynamic content (ms)
            **filters: Search filters (price_min, price_max, beds_min, etc.)
            
        Returns:
            List of PropertyListing objects
        """
        search_url = self.build_search_url(location, **filters)
        
        print(f"Crawling search results from: {search_url}")
        print(f"Limit: {limit} pages")
        
        try:
            crawl_result = self.app.crawl_url(
                search_url,
                params={
                    'limit': limit,
                    'scrapeOptions': {
                        'formats': ['markdown', 'links'],
                        'waitFor': wait_time
                    }
                }
            )
            
            # Extract listing URLs from crawled pages
            listing_urls = []
            for page in crawl_result.get('data', []):
                # Look for detail page URLs in links
                links = page.get('links', [])
                for link in links:
                    if '/realestateandhomes-detail/' in link:
                        listing_urls.append(link)
            
            # Remove duplicates
            listing_urls = list(set(listing_urls))
            print(f"Found {len(listing_urls)} unique listings")
            
            # Scrape individual listings
            listings = []
            for i, url in enumerate(listing_urls, 1):
                print(f"Scraping listing {i}/{len(listing_urls)}: {url}")
                listing = self.scrape_single_listing(url)
                listings.append(listing)
                
                # Rate limiting - be respectful
                if i < len(listing_urls):
                    time.sleep(1)
            
            return listings
            
        except Exception as e:
            print(f"Error during crawl: {str(e)}")
            return []
    
    def to_dataframe(self, listings: List[PropertyListing]) -> pd.DataFrame:
        """
        Convert list of PropertyListing objects to pandas DataFrame
        
        Args:
            listings: List of PropertyListing objects
            
        Returns:
            pandas DataFrame
        """
        data = [listing.to_dict() for listing in listings]
        df = pd.DataFrame(data)
        
        # Data cleaning
        if 'price' in df.columns:
            # Convert price string to numeric (remove $, commas)
            df['price_numeric'] = df['price'].str.replace('$', '').str.replace(',', '').str.extract('(\d+)').astype(float)
        
        return df
    
    def save_to_csv(self, listings: List[PropertyListing], filename: str):
        """Save listings to CSV file"""
        df = self.to_dataframe(listings)
        df.to_csv(filename, index=False)
        print(f"Saved {len(listings)} listings to {filename}")
    
    def save_to_json(self, listings: List[PropertyListing], filename: str):
        """Save listings to JSON file"""
        data = [listing.to_dict() for listing in listings]
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Saved {len(listings)} listings to {filename}")


def main():
    """Example usage"""
    # Initialize scraper (make sure to set FIRECRAWL_API_KEY environment variable)
    scraper = RealtorScraper()
    
    # Example 1: Scrape a single listing
    print("Example 1: Scraping single listing")
    single_url = "https://www.realtor.com/realestateandhomes-detail/..."
    # listing = scraper.scrape_single_listing(single_url)
    # print(listing.to_dict())
    
    # Example 2: Scrape search results with filters
    print("\nExample 2: Scraping search results")
    listings = scraper.scrape_search_results(
        location="San-Francisco_CA",
        limit=10,
        price_min=500000,
        price_max=1000000,
        beds_min=2
    )
    
    # Convert to DataFrame for analysis
    df = scraper.to_dataframe(listings)
    print(f"\nScraped {len(df)} listings")
    print(df.head())
    
    # Save results
    scraper.save_to_csv(listings, "realtor_listings.csv")
    scraper.save_to_json(listings, "realtor_listings.json")
    
    # Basic analysis
    if not df.empty and 'price_numeric' in df.columns:
        print(f"\nPrice Statistics:")
        print(df['price_numeric'].describe())


if __name__ == "__main__":
    main()
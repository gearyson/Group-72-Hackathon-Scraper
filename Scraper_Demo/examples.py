"""
Example usage script for Realtor.com scraper
Demonstrates common data analysis workflows
"""

import os
from realtor_scraper import RealtorScraper
import pandas as pd


def example_basic_scraping():
    """Example 1: Basic scraping and export"""
    print("=" * 60)
    print("Example 1: Basic Scraping")
    print("=" * 60)
    
    scraper = RealtorScraper()
    
    # Scrape San Francisco listings
    listings = scraper.scrape_search_results(
        location="San-Francisco_CA",
        limit=10,  # Start small for testing
        price_min=500000,
        beds_min=2
    )
    
    print(f"\nScraped {len(listings)} listings")
    
    # Convert to DataFrame
    df = scraper.to_dataframe(listings)
    print("\nFirst few listings:")
    print(df[['address', 'price', 'bedrooms', 'bathrooms', 'sqft']].head())
    
    # Save results
    scraper.save_to_csv(listings, "san_francisco_listings.csv")
    scraper.save_to_json(listings, "san_francisco_listings.json")
    
    return df


def example_price_analysis():
    """Example 2: Price analysis across multiple searches"""
    print("\n" + "=" * 60)
    print("Example 2: Price Analysis")
    print("=" * 60)
    
    scraper = RealtorScraper()
    
    # Scrape with different price ranges
    price_ranges = [
        (300000, 500000),
        (500000, 750000),
        (750000, 1000000)
    ]
    
    all_listings = []
    
    for price_min, price_max in price_ranges:
        print(f"\nScraping ${price_min:,} - ${price_max:,}")
        listings = scraper.scrape_search_results(
            location="Austin_TX",
            limit=5,
            price_min=price_min,
            price_max=price_max
        )
        all_listings.extend(listings)
    
    df = scraper.to_dataframe(all_listings)
    
    if not df.empty and 'price_numeric' in df.columns:
        print("\nPrice Statistics:")
        print(df['price_numeric'].describe())
        
        print("\nAverage price by bedroom count:")
        print(df.groupby('bedrooms')['price_numeric'].mean())
    
    return df


def example_multi_city_comparison():
    """Example 3: Compare properties across cities"""
    print("\n" + "=" * 60)
    print("Example 3: Multi-City Comparison")
    print("=" * 60)
    
    scraper = RealtorScraper()
    
    cities = {
        'Austin_TX': 'Austin',
        'Miami_FL': 'Miami',
        'Seattle_WA': 'Seattle'
    }
    
    city_data = []
    
    for location, city_name in cities.items():
        print(f"\nScraping {city_name}...")
        listings = scraper.scrape_search_results(
            location=location,
            limit=10,
            beds_min=2,
            baths_min=2
        )
        
        # Add city name to each listing
        for listing in listings:
            listing.city = city_name
        
        city_data.extend(listings)
    
    df = scraper.to_dataframe(city_data)
    
    if not df.empty and 'price_numeric' in df.columns:
        print("\nAverage prices by city:")
        city_avg = df.groupby('city')['price_numeric'].agg(['mean', 'median', 'count'])
        print(city_avg)
        
        print("\nAverage price per sqft by city:")
        df['price_per_sqft'] = df['price_numeric'] / df['sqft']
        print(df.groupby('city')['price_per_sqft'].mean())
    
    # Save combined data
    scraper.save_to_csv(city_data, "multi_city_comparison.csv")
    
    return df


def example_filtered_search():
    """Example 4: Highly specific filtered search"""
    print("\n" + "=" * 60)
    print("Example 4: Filtered Search")
    print("=" * 60)
    
    scraper = RealtorScraper()
    
    # Very specific criteria
    listings = scraper.scrape_search_results(
        location="Denver_CO",
        limit=15,
        price_min=400000,
        price_max=600000,
        beds_min=3,
        baths_min=2
    )
    
    df = scraper.to_dataframe(listings)
    
    # Additional filtering in pandas
    if not df.empty:
        # Filter for properties with good sqft
        df_filtered = df[df['sqft'] >= 1500]
        
        # Filter for specific property types
        if 'property_type' in df.columns:
            df_filtered = df_filtered[df_filtered['property_type'].str.contains('Single Family|House', case=False, na=False)]
        
        print(f"\nFiltered to {len(df_filtered)} properties meeting all criteria")
        print("\nFiltered listings:")
        print(df_filtered[['address', 'price', 'bedrooms', 'bathrooms', 'sqft']].head(10))
        
        # Export filtered results
        df_filtered.to_csv("denver_filtered_listings.csv", index=False)
    
    return df


def example_data_quality_check():
    """Example 5: Check data quality and completeness"""
    print("\n" + "=" * 60)
    print("Example 5: Data Quality Check")
    print("=" * 60)
    
    scraper = RealtorScraper()
    
    listings = scraper.scrape_search_results(
        location="Portland_OR",
        limit=20
    )
    
    df = scraper.to_dataframe(listings)
    
    if not df.empty:
        print("\nData Completeness Report:")
        print("-" * 40)
        
        # Check for missing values
        missing_data = df.isnull().sum()
        print("\nMissing values per field:")
        print(missing_data[missing_data > 0])
        
        # Completeness percentage
        completeness = (1 - df.isnull().sum() / len(df)) * 100
        print("\nData completeness (%):")
        print(completeness.sort_values(ascending=False))
        
        # Check for outliers in price
        if 'price_numeric' in df.columns:
            q1 = df['price_numeric'].quantile(0.25)
            q3 = df['price_numeric'].quantile(0.75)
            iqr = q3 - q1
            outliers = df[(df['price_numeric'] < q1 - 1.5*iqr) | (df['price_numeric'] > q3 + 1.5*iqr)]
            print(f"\nPotential price outliers: {len(outliers)}")
    
    return df


def main():
    """Run all examples"""
    
    # Check for API key
    if not os.getenv('FIRECRAWL_API_KEY'):
        print("⚠️  WARNING: FIRECRAWL_API_KEY environment variable not set")
        print("Please set your API key:")
        print("export FIRECRAWL_API_KEY='your-api-key-here'")
        return
    
    print("\n🏠 Realtor.com Scraper - Example Usage\n")
    
    try:
        # Run examples (comment out ones you don't want to run)
        
        # Example 1: Basic scraping
        df1 = example_basic_scraping()
        
        # Example 2: Price analysis (commented out to save API calls)
        # df2 = example_price_analysis()
        
        # Example 3: Multi-city comparison (commented out to save API calls)
        # df3 = example_multi_city_comparison()
        
        # Example 4: Filtered search
        # df4 = example_filtered_search()
        
        # Example 5: Data quality check
        # df5 = example_data_quality_check()
        
        print("\n" + "=" * 60)
        print("✅ Examples completed successfully!")
        print("=" * 60)
        print("\nGenerated files:")
        print("- san_francisco_listings.csv")
        print("- san_francisco_listings.json")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nTroubleshooting tips:")
        print("1. Verify your API key is correct")
        print("2. Check your internet connection")
        print("3. Ensure you have Firecrawl API credits")
        print("4. Try reducing the 'limit' parameter")


if __name__ == "__main__":
    main()
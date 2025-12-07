# Real Estate Scraper - Hackathon Project 🏠

A web application that scrapes real estate listings using Firecrawl API.

## Team: Blind Squirrel 🐿️
*"Even a blind squirrel finds an acorn every now and then"*

## Features

- ✅ User authentication (login/logout)
- ✅ URL-based web scraping via Firecrawl
- ✅ Search parameters:
  - Location (City, State)
  - Property Type (Purchase, Rent, Lease)
  - Price Range (Min/Max)
  - Distance from a location
  - Neighborhood quality indicators
- ✅ Results displayed in table format
- ✅ Quick links to popular real estate sites

## Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gearyson/hackathon-scraper.git
cd hackathon-scraper
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and go to:
```
http://localhost:5000
```

### Demo Credentials

| Username | Password |
|----------|----------|
| demo | demo123 |
| hackathon | outskill2024 |
| admin | admin123 |

## Tech Stack

- **Backend:** Python Flask
- **Frontend:** HTML, CSS, JavaScript
- **Scraping:** Firecrawl API
- **Authentication:** Session-based

## How It Works

1. User logs in with credentials
2. User enters a real estate URL (Zillow, Realtor.com, Redfin, etc.)
3. User optionally fills in search parameters
4. Click "Scrape" to fetch listings
5. Results are displayed in a table with raw content preview

## API Used

- [Firecrawl](https://www.firecrawl.dev/) - Web scraping API

## Team Members

- James Martin
- Jonathan Brigain
- Keisha Hunley
- Michael Friedman
- Nick Gillis
- Richard Hughes
- Santhi Dhanasekaran
- Terest Conrad
- Varun Ramanujam
- Dan Geary

## License

MIT License - Built for Outskill AI Generalist Accelerator Hackathon

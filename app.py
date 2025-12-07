"""
Real Estate Scraper App - Hackathon Project
A Flask web application that scrapes real estate listings using Firecrawl
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import requests
import json
import os

app = Flask(__name__)
app.secret_key = 'hackathon-secret-key-2024'  # Change in production

# Firecrawl API Configuration
FIRECRAWL_API_KEY = 'fc-4c3d213630b945bdbe0316d532407c3b'
FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape'

# Simple user database (for demo purposes)
USERS = {
    'demo': 'demo123',
    'admin': 'admin123',
    'hackathon': 'outskill2024'
}

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    """Redirect to login or dashboard"""
    if 'logged_in' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    error = None
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        
        if username in USERS and USERS[username] == password:
            session['logged_in'] = True
            session['username'] = username
            return redirect(url_for('dashboard'))
        else:
            error = 'Invalid credentials. Please try again.'
    
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    """Handle user logout"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard with scraper interface"""
    return render_template('dashboard.html', username=session.get('username'))

@app.route('/scrape', methods=['POST'])
@login_required
def scrape():
    """Handle scraping request"""
    try:
        data = request.get_json()
        url = data.get('url', '')
        params = {
            'location': data.get('location', ''),
            'property_type': data.get('property_type', 'any'),  # lease, rent, purchase
            'min_price': data.get('min_price', ''),
            'max_price': data.get('max_price', ''),
            'distance_from': data.get('distance_from', ''),
            'max_distance': data.get('max_distance', '')
        }
        
        if not url:
            return jsonify({'success': False, 'error': 'URL is required'})
        
        # Call Firecrawl API
        headers = {
            'Authorization': f'Bearer {FIRECRAWL_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'url': url,
            'formats': ['markdown', 'html'],
            'onlyMainContent': True
        }
        
        response = requests.post(FIRECRAWL_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract and process the scraped data
            scraped_content = result.get('data', {})
            
            # Parse the content to extract property listings
            listings = parse_real_estate_data(scraped_content, params)
            
            return jsonify({
                'success': True,
                'data': listings,
                'raw_content': scraped_content.get('markdown', '')[:2000],  # First 2000 chars for preview
                'source_url': url
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Firecrawl API error: {response.status_code}',
                'details': response.text
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def parse_real_estate_data(content, params):
    """
    Parse scraped content to extract property listings
    This is a simplified parser - in production you'd want more sophisticated parsing
    """
    listings = []
    
    # Get the markdown content
    markdown = content.get('markdown', '')
    html = content.get('html', '')
    
    # For demo purposes, create a structured response
    # In a real app, you'd parse the actual content more thoroughly
    listing = {
        'source': 'Scraped Data',
        'location': params.get('location', 'N/A'),
        'property_type': params.get('property_type', 'N/A'),
        'price_range': f"${params.get('min_price', '0')} - ${params.get('max_price', 'No limit')}",
        'distance_from': params.get('distance_from', 'N/A'),
        'max_distance': params.get('max_distance', 'N/A'),
        'content_preview': markdown[:500] if markdown else 'No content extracted',
        'status': 'Scraped Successfully'
    }
    listings.append(listing)
    
    return listings

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

/*
  # Web Scraper Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique user identifier
      - `username` (text, unique, not null) - User's login username
      - `password_hash` (text, not null) - Hashed password for authentication
      - `created_at` (timestamptz) - Account creation timestamp

    - `scraped_data`
      - `id` (uuid, primary key) - Unique scrape identifier
      - `user_id` (uuid, foreign key) - References users table
      - `scrape_type` (text, not null) - Type of scrape: 'real_estate' or 'general'
      - `url` (text, not null) - URL that was scraped
      - `title` (text) - Title or description of the scraped content
      - `content` (jsonb, not null) - Complete scraped data stored as JSON
      - `created_at` (timestamptz) - Timestamp when scrape was performed

  2. Security
    - Enable RLS on both tables
    - Users can only read/write their own data
    - Users table: users can read their own profile
    - Scraped_data table: users can manage only their own scrapes

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for sorting by date
    - Index on scrape_type for filtering
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create scraped_data table
CREATE TABLE IF NOT EXISTS scraped_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scrape_type text NOT NULL CHECK (scrape_type IN ('real_estate', 'general')),
  url text NOT NULL,
  title text,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scraped_data_user_id ON scraped_data(user_id);
CREATE INDEX IF NOT EXISTS idx_scraped_data_created_at ON scraped_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_data_scrape_type ON scraped_data(scrape_type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for scraped_data table
CREATE POLICY "Users can view own scraped data"
  ON scraped_data FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own scraped data"
  ON scraped_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scraped data"
  ON scraped_data FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own scraped data"
  ON scraped_data FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

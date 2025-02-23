/*
  # Job Details Schema

  1. New Tables
    - `job_details`
      - `id` (uuid, primary key)
      - `job_title` (text)
      - `job_details` (text)
      - `skills_requirements` (text)
      - `education_req` (text)
      - `experience_req` (text)
      - `additional_req` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `job_details` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS job_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title text NOT NULL,
  job_details text NOT NULL,
  skills_requirements text NOT NULL,
  education_req text NOT NULL,
  experience_req text NOT NULL,
  additional_req text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON job_details
  FOR SELECT
  TO public
  USING (true);
/*
  # Create Documents Storage Table

  ## Purpose
  Store PDF and other document files in the database for the library system.
  This includes the user manual PDF and future documents.

  ## Changes
  1. Create documents table to store:
     - Document metadata (title, description, type)
     - File content as bytea (binary data)
     - File information (size, mime type)
     - Timestamps and version tracking

  2. Security
     - Enable RLS on documents table
     - Staff can manage all documents
     - Members and public can view published documents
     - Track who created and updated documents

  ## Notes
  - Uses bytea for efficient binary storage
  - Includes version number for document tracking
  - Status field to control visibility (draft/published)
*/

-- Create document_type enum
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('manual', 'policy', 'form', 'report', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create document_status enum
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  document_type document_type NOT NULL DEFAULT 'other',
  status document_status NOT NULL DEFAULT 'draft',
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_data BYTEA NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- RLS Policies

-- Anyone can view published documents
CREATE POLICY "Anyone can view published documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Staff can view all documents
CREATE POLICY "Staff can view all documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
    )
  );

-- Staff can insert documents
CREATE POLICY "Staff can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
    )
  );

-- Staff can update documents
CREATE POLICY "Staff can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
    )
  );

-- Staff can delete documents
CREATE POLICY "Staff can delete documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_documents_timestamp ON documents;
CREATE TRIGGER trigger_update_documents_timestamp
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

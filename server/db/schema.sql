CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'student')),
  name VARCHAR,
  course VARCHAR,
  school VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scholarships(
  id SERIAL PRIMARY KEY,
  posted_by INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR NOT NULL,
  organization VARCHAR NOT NULL,
  description TEXT,
  amount NUMERIC,
  slots INTEGER,
  requirements TEXT,
  deadline DATE NOT NULL,
  status  VARCHAR CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE applications(
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  -- NULL for a "personal" entry: a scholarship the student added themselves
  scholarship_id INTEGER REFERENCES scholarships(id),
  status VARCHAR NOT NULL CHECK (status IN ('interested', 'applied', 'interview', 'result')) DEFAULT 'interested',
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  personal_title VARCHAR,
  personal_organization VARCHAR,
  personal_amount NUMERIC,
  personal_deadline DATE,
  UNIQUE (student_id, scholarship_id),
  -- a row tracks either a listing or the student's own scholarship, never a mix of both
  CONSTRAINT applications_listing_or_personal CHECK (
    (scholarship_id IS NOT NULL
      AND personal_title IS NULL AND personal_organization IS NULL
      AND personal_amount IS NULL AND personal_deadline IS NULL)
    OR
    (scholarship_id IS NULL
      AND personal_title IS NOT NULL AND personal_organization IS NOT NULL)
  )
);
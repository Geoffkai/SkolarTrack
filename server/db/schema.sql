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
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id),
  status VARCHAR NOT NULL CHECK (status IN ('interested', 'applied', 'interview', 'result')) DEFAULT 'interested',
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (student_id, scholarship_id)
);
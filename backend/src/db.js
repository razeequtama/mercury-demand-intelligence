import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/mercury_db',
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
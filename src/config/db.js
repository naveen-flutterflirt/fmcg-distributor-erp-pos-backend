const {
	Pool
} = require('pg');
require('dotenv').config();
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
	max: 10,
	idleTimeoutMillis: 60000,
	connectionTimeoutMillis: 20000,
	keepAlive: true,
});
pool.on('connect', () => {
	console.log('Connected to PostgreSQL (Neon DB)');
});
pool.on('error', (err) => {
	console.error('Unexpected error on idle PostgreSQL client', err);
});

// Provide backward compatibility for both `const db = require(...)` and `const pool = require(...)`
pool.query = pool.query.bind(pool);
pool.connect = pool.connect.bind(pool);
pool.pool = pool;

module.exports = pool;

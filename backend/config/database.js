const mysql = require('mysql2/promise');

let pool = null;

/**
 * Initialize database connection pool
 */
async function connect() {
  if (pool) {
    return pool;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smiths_detection_ecommerce',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(`[${new Date().toISOString()}] Database connected successfully`);
    connection.release();

    return pool;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Database connection failed:`, error.message);
    throw error;
  }
}

/**
 * Execute a query with parameters
 */
async function query(sql, params = []) {
  if (!pool) {
    await connect();
  }

  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('[DATABASE ERROR]', {
      message: error.message,
      sql: sql.substring(0, 100),
      code: error.code,
    });
    throw error;
  }
}

/**
 * Close database connection pool
 */
async function disconnect() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log(`[${new Date().toISOString()}] Database disconnected`);
  }
}

/**
 * Get the connection pool
 */
function getPool() {
  return pool;
}

module.exports = {
  connect,
  query,
  disconnect,
  getPool,
};

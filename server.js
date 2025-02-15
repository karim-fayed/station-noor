
const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());

// إنشاء جدول المستخدمين
app.get('/setup', async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location_lat DECIMAL(10,8) NOT NULL,
        location_lng DECIMAL(11,8) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ message: 'تم إنشاء الجداول بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة محطة جديدة
app.post('/stations', async (req, res) => {
  const { name, location_lat, location_lng, address } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO stations (name, location_lat, location_lng, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, location_lat, location_lng, address]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// الحصول على جميع المحطات
app.get('/stations', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

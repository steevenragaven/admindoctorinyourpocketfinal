const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Initialize pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// GET all timeslots
app.get('/api/timeslots', async (req, res, next) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM DoctorTimeSlots');
    client.release();
    res.json(result.rows);
  } catch (error) {
    next(error); // Pass error to middleware
  }
});

// POST create a new timeslot
// POST create a new timeslot
app.post('/api/timeslots', async (req, res, next) => {
  console.log('good');
  const { date, starttime, endtime, doctorid=1 } = req.body;
  
  if (!date || !starttime || !endtime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO DoctorTimeSlots (date, starttime, endtime, doctorid) VALUES ($1, $2, $3, $4) RETURNING *',
      [date, starttime, endtime, doctorid || 1]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});


// PUT update an existing timeslot
app.put('/api/timeslots/:timeslotid', async (req, res, next) => {
  const timeslotid = req.params.timeslotid;
  const { doctorid, date, starttime, endtime, available } = req.body;
  try {
    const query = `
      UPDATE DoctorTimeSlots
      SET doctorid = $1, date = $2, starttime = $3, endtime = $4, available = $5
      WHERE timeslotid = $6
      RETURNING *;
    `;
    const values = [doctorid, date, starttime, endtime, available, timeslotid];
    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (error) {
    next(error); // Pass error to middleware
  }
});

app.get('/doctor/:doctorid/patients', async (req, res) => {
  const { doctorid } = req.params;

  try {
    const getPatientsQuery = `
      SELECT 
        dp.doctorpatientid,
        p.patientid,
        p.name AS patient_name,
        p.profileimageurl,
        p.phone,
        p.email,
        p.address,
        p.latitude,
        p.longitude
      FROM 
        public."DoctorPatient" dp
      JOIN 
        public."Patient" p ON dp.patientid = p.patientid
      WHERE 
        dp.doctorid = $1
      ORDER BY 
        p.name ASC;
    `;
    const result = await pool.query(getPatientsQuery, [doctorid]);
    
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'No patients found for this doctor.' });
    }
  } catch (error) {
    console.error('Error fetching patients for doctor:', error);
    res.status(500).json({ message: 'Server error while retrieving patients.' });
  }
});
app.delete('/api/timeslots/:timeslotid', async (req, res, next) => {
  const timeslotid = req.params.timeslotid;
  try {
    await pool.query('DELETE FROM DoctorTimeSlots WHERE timeslotid = $1', [timeslotid]);
    res.status(204).end();
  } catch (error) {
    next(error); // Pass error to middleware
  }
});
app.get('/doctors/:doctorid/appointments', async (req, res) => {
  try {
    const { doctorid } = req.params;

    const query = `
      SELECT 
        a.appointmentid,
        a.date,
        a.time,
        a.type,
        a.active,
        a.patientid,
        p.patientid,
        p.name AS patient_name,
        p.age,
        p.gender,
        p.phone,
        p.address,
        p.email,
        p.profileimageurl,
        p.latitude,
        p.longitude
      FROM 
        public."Appointment" a
      INNER JOIN 
        public."Patient" p ON a.patientid = p.userid
      WHERE 
        a.doctorid = $1
      ORDER BY 
        a.date ASC, a.time ASC;
    `;
    const result = await pool.query(query, [doctorid]);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'No appointments found for the specified doctor.' });
    }
  } catch (error) {
    console.error('Error fetching appointments for doctor:', error);
    res.status(500).json({ message: 'Server error while retrieving appointments.' });
  }
});
// Error handling middleware - should be defined last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

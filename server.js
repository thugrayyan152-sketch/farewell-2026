const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS for production (allow Netlify frontend)
app.use((req, res, next) => {
    const allowedOrigins = ['https://farewellentry.netlify.app', 'http://localhost:3000', 'http://localhost:3001'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Database setup
// Use Railway's persistent storage if available, otherwise use local path
const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'database.sqlite')
    : './database.sqlite';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        father_name TEXT,
        roll_number TEXT,
        has_entered INTEGER DEFAULT 0,
        entry_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Table creation error:', err);
        else insertDefaultStudents();
    });
}

function insertDefaultStudents() {
    const students = [
        { name: 'Abdul Rehman', father_name: 'Irfan', roll_number: 'P01' },
        { name: 'Ayaan Shahbaz', father_name: '', roll_number: 'P02' },
        { name: 'Hamza Javed', father_name: '', roll_number: 'P03' },
        { name: 'Hasnain Zulfiqar', father_name: '', roll_number: 'P04' },
        { name: 'Muhammad Abubakar Nadeem', father_name: '', roll_number: 'P05' },
        { name: 'Muhammad Amin Hashmi', father_name: '', roll_number: 'P06' },
        { name: 'Muhammad Bilal', father_name: '', roll_number: 'P07' },
        { name: 'Muhammad Haroon Saghar', father_name: '', roll_number: 'P08' },
        { name: 'Muhammad Hassaan Sajad', father_name: '', roll_number: 'P09' },
        { name: 'Muhammad Mateen', father_name: '', roll_number: 'P25' },
        { name: 'Muhammad Nouman Akram', father_name: '', roll_number: 'P27' },
        { name: 'Muhammad Waseet Ali', father_name: '', roll_number: 'P10' },
        { name: 'Naim Alvi', father_name: '', roll_number: 'P11' },
        { name: 'Rana Hassaan Sajid', father_name: '', roll_number: 'P12' },
        { name: 'Sheikh Muhammad Ahmed', father_name: '', roll_number: 'P13' },
        { name: 'Usman Mohyuddin', father_name: '', roll_number: 'P40' }
    ];

    students.forEach(student => {
        db.run(`INSERT OR IGNORE INTO students (name, father_name, roll_number) VALUES (?, ?, ?)`,
            [student.name, student.father_name, student.roll_number]);
    });
}

// API Routes
app.get('/api/students', (req, res) => {
    db.all('SELECT * FROM students ORDER BY name', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/students/add', (req, res) => {
    const { name, father_name, roll_number } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    db.run('INSERT INTO students (name, father_name, roll_number) VALUES (?, ?, ?)',
        [name, father_name || '', roll_number || ''],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Student already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, message: 'Student added successfully' });
        });
});

app.post('/api/verify', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    db.get('SELECT * FROM students WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Student not found' });

        res.json({
            exists: true,
            student: row,
            canEnter: row.has_entered === 0,
            message: row.has_entered ? 'Already entered' : 'Entry allowed'
        });
    });
});

app.post('/api/entry', (req, res) => {
    const { name } = req.body;
    const entryTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });

    db.run('UPDATE students SET has_entered = 1, entry_time = ? WHERE LOWER(name) = LOWER(?)',
        [entryTime, name],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Student not found' });
            res.json({ success: true, message: 'Entry recorded', time: entryTime });
        });
});

app.post('/api/reset', (req, res) => {
    db.run('UPDATE students SET has_entered = 0, entry_time = NULL', [], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'All entries reset' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Student Portal: http://localhost:${PORT}`);
    console.log(`Guard Portal: http://localhost:${PORT}/guard.html`);
    console.log(`Admin Portal: http://localhost:${PORT}/admin.html`);
});

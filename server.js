const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.static('public'));

const DB_FILE = path.join(__dirname, 'sids.json');

// Ensure DB exists
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));

// Serve the EXE
app.get('/exe', (req, res) => {
    const exe = path.join(__dirname, 'winhostupdater.exe');
    if (!fs.existsSync(exe)) return res.status(404).send('EXE not found');
    res.download(exe);
});

// Add SID from Dashboard
app.post('/api/add_sid', (req, res) => {
    const { name, sid, expire_time } = req.body;
    if (!name || !sid || !expire_time) return res.status(400).json({ success: false, message: "Missing fields" });
    
    try {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        db[sid] = { name, expire_time };
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ success: true, message: "SID Added!" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Check SID from Python EXE
app.post('/api/check_sid', (req, res) => {
    const { hwid } = req.body;
    try {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        if (db[hwid]) {
            if (Date.now() < db[hwid].expire_time) {
                return res.json({ active: true, name: db[hwid].name });
            }
        }
        res.json({ active: false });
    } catch (e) {
        res.status(500).json({ active: false });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

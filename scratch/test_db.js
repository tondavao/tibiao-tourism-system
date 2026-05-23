const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database', 'tibiao_tourism.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, name, created_at, total, status FROM visitors", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Total records:", rows.length);
        console.log("Sample records:");
        rows.forEach(r => {
            console.log(`- ID: ${r.id}, Name: ${r.name}, Created At: '${r.created_at}', JS Parse (raw): ${new Date(r.created_at)}, JS Parse (UTC enforced): ${new Date(r.created_at.replace(' ', 'T') + 'Z')}`);
        });
    }
    db.close();
});

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'tibiao_tourism.db');
const outputDir = path.join(__dirname, '..', 'sql_export');
const outputFile = path.join(outputDir, 'tibiao_tourism_backup.sql');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

let sqlDump = '-- Tibiao Tourism System Database SQL Export\n';
sqlDump += `-- Exported on: ${new Date().toISOString()}\n\n`;
sqlDump += 'PRAGMA foreign_keys=OFF;\n';
sqlDump += 'BEGIN TRANSACTION;\n\n';

db.all("SELECT sql, name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], async (err, tables) => {
    if (err) {
        console.error('Error listing tables:', err);
        process.exit(1);
    }

    try {
        for (const table of tables) {
            const tableName = table.name;
            const createSql = table.sql;
            
            sqlDump += `-- Table structure for table \`${tableName}\`\n`;
            sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            sqlDump += `${createSql};\n\n`;

            // Query rows
            const rows = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM \`${tableName}\``, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            if (rows.length > 0) {
                sqlDump += `-- Dumping data for table \`${tableName}\`\n`;
                for (const row of rows) {
                    const columns = Object.keys(row);
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        // Escape single quotes
                        const escaped = String(val).replace(/'/g, "''");
                        return `'${escaped}'`;
                    });
                    sqlDump += `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${values.join(', ')});\n`;
                }
                sqlDump += '\n';
            }
        }

        sqlDump += 'COMMIT;\n';

        fs.writeFileSync(outputFile, sqlDump, 'utf8');
        console.log(`Successfully exported SQL dump to: ${outputFile}`);
    } catch (dumpErr) {
        console.error('Error generating SQL dump:', dumpErr);
    } finally {
        db.close();
    }
});

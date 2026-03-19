const fs = require('fs');
const path = require('path');
const db = require('./db');


const migrationsDir = path.join(__dirname, 'migrations');

fs.readdir(migrationsDir, async (err, files) => {
    if (err) {
        console.error("Error reading migrations directory:", err);
        process.exit(1);
    }

    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    console.log(`Found ${sqlFiles.length} migration files.`);

    try {
        for (const file of sqlFiles) {
            console.log(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

            for (const query of queries) {
                await new Promise((resolve, reject) => {
                    db.query(query, (err, result) => {
                        if (err) {
                            if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
                                console.warn(`[WARN] Skipping known error in ${file}: ${err.sqlMessage}`);
                                resolve();
                            } else {
                                reject(err);
                            }
                        } else {
                            resolve(result);
                        }
                    });
                });
            }
        }
        console.log("All migrations executed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
});

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'ikd.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function ensureDatabase() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    return db;
}

module.exports = { ensureDatabase, DB_PATH };

import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const als = new AsyncLocalStorage();

export const isPostgres = Boolean(process.env.DATABASE_URL);

function translateSql(sql) {
  if (!isPostgres) return sql;
  let text = sql.replace(/INSERT OR IGNORE INTO profiles \(user_id\) VALUES \(\?\)/gi, 'INSERT INTO profiles (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING');
  text = text.replace(/datetime\('now'\s*,\s*'([^']+)'\)/gi, (_, rel) => `(NOW() + INTERVAL '${rel.replace(/^\+\s*/, '')}')`);
  text = text.replace(/datetime\('now'\)/gi, 'NOW()');
  text = text.replace(/\bLIKE\b/g, 'ILIKE');
  if (/^\s*INSERT\b/i.test(text) && !/RETURNING\b/i.test(text)) text += ' RETURNING id';
  let n = 0;
  return text.replace(/\?/g, () => `$${++n}`);
}

function normalizeRow(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) out[key] = value.toISOString();
    else if (typeof value === 'boolean') out[key] = value ? 1 : 0;
    else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value) && /price|latitude|longitude|rating|area|volume|amount|avg|n$/i.test(key)) {
      out[key] = Number(value);
    } else out[key] = value;
  }
  return out;
}

function makeStatement(queryFn, sql) {
  const text = translateSql(sql);
  return {
    async get(...params) {
      const result = await queryFn(text, params);
      return normalizeRow(result.rows[0]);
    },
    async all(...params) {
      const result = await queryFn(text, params);
      return result.rows.map(normalizeRow);
    },
    async run(...params) {
      const result = await queryFn(text, params);
      const last = result.rows?.[result.rows.length - 1];
      return {
        lastInsertRowid: last?.id ?? 0,
        changes: result.rowCount ?? 0,
      };
    },
  };
}

async function createPostgres() {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
  const query = (text, params) => {
    const client = als.getStore();
    return client ? client.query(text, params) : pool.query(text, params);
  };
  return {
    dialect: 'pg',
    prepare: (sql) => makeStatement(query, sql),
    async exec(sql) {
      const parts = sql
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const part of parts) await query(translateSql(part), []);
    },
    pragma() {},
    transaction(fn) {
      return async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await als.run(client, fn);
          await client.query('COMMIT');
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      };
    },
    async close() {
      await pool.end();
    },
  };
}

function createSqlite() {
  return import('better-sqlite3').then(({ default: Database }) => {
    const dbPath = path.resolve(__dirname, process.env.DB_PATH || '../../database/market.db');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    const wrap = (stmt) => ({
      async get(...params) {
        return stmt.get(...params);
      },
      async all(...params) {
        return stmt.all(...params);
      },
      async run(...params) {
        return stmt.run(...params);
      },
    });
    return {
      dialect: 'sqlite',
      prepare: (sql) => wrap(sqlite.prepare(sql)),
      async exec(sql) {
        sqlite.exec(sql);
      },
      pragma(v) {
        sqlite.pragma(v);
      },
      transaction(fn) {
        return async () => {
          sqlite.exec('BEGIN');
          try {
            const result = await fn();
            sqlite.exec('COMMIT');
            return result;
          } catch (err) {
            sqlite.exec('ROLLBACK');
            throw err;
          }
        };
      },
      async close() {
        sqlite.close();
      },
    };
  });
}

export async function createDb() {
  return isPostgres ? createPostgres() : createSqlite();
}

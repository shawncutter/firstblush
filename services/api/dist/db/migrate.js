import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dbPool, dbQuery } from "./client.js";
const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations");
async function ensureMigrationTable() {
    await dbQuery(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}
async function getMigrationFiles() {
    const entries = await readdir(migrationsDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
}
async function hasMigration(version) {
    const result = await dbQuery("select exists(select 1 from schema_migrations where version = $1) as exists", [version]);
    return result.rows[0]?.exists ?? false;
}
async function applyMigration(version, sql) {
    const client = await dbPool.connect();
    try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into schema_migrations(version) values ($1)", [version]);
        await client.query("commit");
    }
    catch (error) {
        await client.query("rollback");
        throw error;
    }
    finally {
        client.release();
    }
}
async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
export async function migrateDatabase() {
    const maxAttempts = Number(process.env.DB_CONNECT_RETRIES ?? 20);
    const retryDelayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS ?? 1000);
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            await dbQuery("select 1");
            break;
        }
        catch (error) {
            attempts += 1;
            if (attempts >= maxAttempts) {
                throw error;
            }
            console.warn(`database not ready (attempt ${attempts}/${maxAttempts}), retrying...`);
            await sleep(retryDelayMs);
        }
    }
    await ensureMigrationTable();
    const migrationFiles = await getMigrationFiles();
    for (const fileName of migrationFiles) {
        const version = fileName.replace(/\.sql$/, "");
        if (await hasMigration(version)) {
            continue;
        }
        const sql = await readFile(join(migrationsDir, fileName), "utf8");
        await applyMigration(version, sql);
        console.log(`applied migration: ${version}`);
    }
}

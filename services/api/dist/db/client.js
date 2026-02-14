import { Pool } from "pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is required");
}
export const dbPool = new Pool({
    connectionString
});
export async function dbQuery(text, values) {
    return dbPool.query(text, values);
}
export async function dbPing() {
    await dbQuery("select 1");
}

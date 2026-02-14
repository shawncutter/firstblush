import { Pool, type QueryResult, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export const dbPool = new Pool({
  connectionString
});

export async function dbQuery<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>> {
  return dbPool.query<R>(text, values);
}

export async function dbPing(): Promise<void> {
  await dbQuery("select 1");
}

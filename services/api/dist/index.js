import { createApp } from "./app.js";
import { migrateDatabase } from "./db/migrate.js";
async function main() {
    await migrateDatabase();
    const port = Number(process.env.PORT ?? 28110);
    const app = createApp();
    app.listen(port, () => {
        // Keep logging simple until structured logger and tracing are added.
        console.log(`firstblush-api listening on :${port}`);
    });
}
main().catch((error) => {
    console.error("failed to start firstblush-api", error);
    process.exit(1);
});

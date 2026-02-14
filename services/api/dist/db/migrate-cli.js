import { migrateDatabase } from "./migrate.js";
migrateDatabase()
    .then(() => {
    console.log("database migrations complete");
    process.exit(0);
})
    .catch((error) => {
    console.error("database migration failed", error);
    process.exit(1);
});

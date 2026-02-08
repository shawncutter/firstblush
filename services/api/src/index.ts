import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 8080);
const app = createApp();

app.listen(port, () => {
  // Keep logging simple until structured logger and tracing are added.
  console.log(`firstblush-api listening on :${port}`);
});

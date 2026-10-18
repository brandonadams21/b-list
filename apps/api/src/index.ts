import { buildServer } from "./server.js";

const app = buildServer();

try {
  await app.listen({ host: "127.0.0.1", port: 8787 });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}

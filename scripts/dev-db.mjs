// Database PostgreSQL lokal untuk pengembangan (PGlite + socket server).
// Jalankan: npm run db:dev   (biarkan terminal ini tetap terbuka)
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.DEV_DB_PORT ?? 5433);
const db = await PGlite.create("./.pglite");
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await server.start();
console.log(`PGlite siap di postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);

async function shutdown() {
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

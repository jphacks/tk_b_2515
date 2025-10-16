import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import app from "./index";

// Load .env from project root (parent directory of backend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../.env") });

const port = Number(process.env.PORT) || 8787;
console.log(process.env.NEXT_PUBLIC_API_URL);
serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`Server is running on http://localhost:${port}`);
  }
);

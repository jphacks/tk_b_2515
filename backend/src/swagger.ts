// biome-ignore assist/source/organizeImports: keep imports grouped by library
import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";

// A basic OpenAPI document
const openApiDoc = {
  openapi: "3.0.0", // This is the required version field
  info: {
    title: "API Documentation",
    version: "1.0.0",
    description: "API documentation for your service",
  },
  paths: {
    // Add your API paths here
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
          },
        },
      },
    },
    // Add more endpoints as needed
  },
};

const app = new Hono();

// Serve the OpenAPI document
app.get("/doc", (c) => c.json(openApiDoc));

// Use the middleware to serve Swagger UI at /ui
app.get("/ui", swaggerUI({ url: "/doc" }));

app.get("/health", (c) => c.text("OK"));

export default app;

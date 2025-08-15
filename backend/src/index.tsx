/// <reference types="node" />

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import { mockRouter } from "./routes/mock";

const app = express();

// Security headers
app.use(helmet());

// CORS: allow frontend origin(s) from env or default localhost:5173
const allowedOrigins =
process.env.CORS_ORIGIN?.split(",").map(s => s.trim()) ?? ["http://localhost:5173"];

app.use(
cors({
origin: allowedOrigins,
credentials: true,
})
);

// JSON body parsing
app.use(express.json({ limit: "2mb" }));

// HTTP request logging
app.use(morgan("dev"));
app.use("/api", mockRouter);
// Health check
app.get("/health", (_req, res) => {
res.json({
ok: true,
service: "ai-fashion-assistant-backend",
ts: Date.now(),
node: process.version,
env: process.env.NODE_ENV ?? "development",
});
});

// Placeholder for future routes
// app.post("/api/suggest-outfits", suggestOutfitsHandler);
// app.get("/api/search-images", searchImagesHandler);
// app.get("/api/buy-links", buyLinksHandler);
// app.get("/api/filters", filtersHandler);

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
console.log(`Backend listening on http://localhost:${PORT}`);
console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});

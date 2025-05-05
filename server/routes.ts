import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - path prefixed with /api
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });

  // Demo submission endpoint - just returns success for the registration form example
  app.post("/api/register", (req, res) => {
    try {
      // In a real app we would validate the input and store it
      res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (error) {
      res.status(400).json({ success: false, message: "Registration failed" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}

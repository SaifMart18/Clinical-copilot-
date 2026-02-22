import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let supabaseInstance: any = null;

/**
 * Lazy-initializes the Supabase client for the server.
 */
function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE_URL or SUPABASE_ANON_KEY is missing in server environment variables.");
    throw new Error("Supabase configuration missing on server.");
  }
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

async function startServer() {
  console.log("🚀 Starting Clinical Copilot Server...");
  console.log("📍 Environment:", process.env.NODE_ENV || "development");
  console.log("🔗 Supabase URL detected:", supabaseUrl ? "YES" : "NO");
  console.log("🔑 Supabase Key detected:", supabaseKey ? "YES" : "NO");

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/cases", async (req, res) => {
    try {
      const { user_id, complaint, symptoms, vitals, labs } = req.body;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
        return res.json({ id: "demo-case-" + Math.random().toString(36).substring(7) });
      }

      const { data, error } = await getSupabase()
        .from("cases")
        .insert([{ user_id, complaint, symptoms, vitals, labs }])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: error.message });
      }
      
      if (!data) {
        return res.status(500).json({ error: "Failed to create case" });
      }
      
      res.json({ id: data.id });
    } catch (err: any) {
      console.error("Case creation error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/outputs", async (req, res) => {
    try {
      const { case_id, content } = req.body;

      if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
        return res.json({ id: "demo-output-" + Math.random().toString(36).substring(7) });
      }

      const { data, error } = await getSupabase()
        .from("outputs")
        .insert([{ case_id, content }])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase output error:", error);
        return res.status(500).json({ error: error.message });
      }
      
      res.json({ id: data?.id || "ok" });
    } catch (err: any) {
      console.error("Output creation error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/history/:user_id", async (req, res) => {
    try {
      const { user_id } = req.params;

      // Handle demo user or missing config
      if (user_id === 'demo-user' || !supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
        return res.json([]);
      }

      const { data, error } = await getSupabase()
        .from("cases")
        .select(`
          *,
          outputs (
            content
          )
        `)
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase history error:", error);
        return res.status(500).json({ error: error.message });
      }
      
      // Format to match previous structure
      const history = (data || []).map((item: any) => ({
        ...item,
        report: item.outputs ? JSON.stringify(item.outputs.content) : null
      }));
      
      res.json(history);
    } catch (err: any) {
      console.error("History fetch error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // --- Vite Middleware ---
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    console.log("🛠️ Running in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Running in production mode...");
    // In Vercel, the dist folder is usually in the same directory as the function or relative to process.cwd()
    const distPath = path.resolve(process.cwd(), "dist");
    const indexPath = path.resolve(distPath, "index.html");
    
    import("fs").then(fs => {
      if (fs.existsSync(indexPath)) {
        console.log("✅ Found index.html at:", indexPath);
      } else {
        console.error("❌ index.html NOT FOUND at:", indexPath);
        console.log("📂 Directory contents of dist:", fs.readdirSync(distPath).join(", "));
      }
    }).catch(err => console.error("Error checking file system:", err));

    app.use(express.static(distPath));
    
    // Serve index.html for any other route (SPA fallback)
    app.get("*", (req, res) => {
      res.sendFile(indexPath);
    });
  }

  // Only listen if not running on Vercel
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer().catch(err => {
  console.error("❌ Failed to start server:", err);
  throw err;
});

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};

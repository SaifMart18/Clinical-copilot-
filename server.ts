import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

let supabaseInstance: any = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is missing in environment variables.");
  }
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

async function startServer() {
  console.log("🚀 Starting server...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // --- API Routes ---

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
    const { user_id } = req.params;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
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
    
    if (error) return res.status(500).json({ error: error.message });
    
    // Format to match previous structure
    const history = data.map((item: any) => ({
      ...item,
      report: item.outputs ? JSON.stringify(item.outputs.content) : null
    }));
    
    res.json(history);
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
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    
    // Serve index.html for any other route (SPA fallback)
    app.get("*", (req, res) => {
      const indexPath = path.resolve(distPath, "index.html");
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

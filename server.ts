import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ SUPABASE_URL or SUPABASE_ANON_KEY is missing. Database features will not work.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Simple Auth (Demo purposes)
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    // Fallback for Demo Mode if Supabase is not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
      console.log("🛠️ Supabase not configured. Using Demo Mode login.");
      return res.json({ 
        user: { 
          id: "demo-user-id", 
          email: email,
          isDemo: true 
        } 
      });
    }

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
      
      if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
        return res.status(500).json({ error: error.message });
      }

      if (!user) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([{ email, password_hash: password }])
          .select()
          .single();
        
        if (insertError) return res.status(500).json({ error: insertError.message });
        return res.json({ user: newUser });
      }

      res.json({ user });
    } catch (err: any) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Database connection failed. Please check your Supabase configuration." });
    }
  });

  app.post("/api/cases", async (req, res) => {
    const { user_id, complaint, symptoms, vitals, labs } = req.body;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
      return res.json({ id: "demo-case-" + Math.random().toString(36).substring(7) });
    }

    const { data, error } = await supabase
      .from("cases")
      .insert([{ user_id, complaint, symptoms, vitals, labs }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.post("/api/outputs", async (req, res) => {
    const { case_id, content } = req.body;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
      return res.json({ id: "demo-output-" + Math.random().toString(36).substring(7) });
    }

    const { data, error } = await supabase
      .from("outputs")
      .insert([{ case_id, content }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.get("/api/history/:user_id", async (req, res) => {
    const { user_id } = req.params;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === "" || supabaseKey === "") {
      return res.json([]);
    }

    const { data, error } = await supabase
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
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running on Vercel
  if (process.env.VITE_VERCEL !== "true") {
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

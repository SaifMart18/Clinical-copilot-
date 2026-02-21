import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Simple Auth (Demo purposes)
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
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
  });

  app.post("/api/cases", async (req, res) => {
    const { user_id, complaint, symptoms, vitals, labs } = req.body;
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Only listen if not running on Vercel
  if (process.env.VITE_VERCEL !== "true") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};

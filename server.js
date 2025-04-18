// server.js
import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";
import OpenAI  from "openai";

// 1. Load your .env
dotenv.config();

// 2. Create and configure Express
const app = express();
app.use(cors());           // ← now app exists
app.use(express.json());
app.use(express.static("public"));



// 3. Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 4. Define your endpoint
app.post("/api/term", async (req, res) => {
  const { question, value } = req.body;
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You’re a therapist. Give one adjective." },
        { role: "user",   content: `Answer ${value} for: "${question}".` }
      ]
    });
    res.json({ term: chat.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

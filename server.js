// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// 1. Load your .env
dotenv.config();

// 2. Create and configure Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serves index.html from /public

// 3. Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 4. Define AI descriptor endpoint (single-question use)
app.post("/api/term", async (req, res) => {
  const { question, value } = req.body;
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You’re a therapist. Give one adjective." },
        { role: "user", content: `Answer ${value} for: "${question}".` }
      ]
    });
    res.json({ term: chat.choices[0].message.content.trim() });
  } catch (err) {
    console.error("Error in /api/term:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Define new AI analysis endpoint for all answers combined
app.post("/api/analyze", async (req, res) => {
  const { questions } = req.body;
  try {
    const formatted = questions.map((q, i) => `Q${i + 1}: ${q.prompt} = ${q.value}`).join("\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a psychologist. Read all emotional questions and answers, and return the most likely overall emotion the person is experiencing. Respond with one word." },
        { role: "user", content: `Here are the responses:\n\n${formatted}` }
      ]
    });

    res.json({ overall: chat.choices[0].message.content.trim() });
  } catch (err) {
    console.error("Error in /api/analyze:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

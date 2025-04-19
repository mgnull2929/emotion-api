// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

// Configure Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve HTML and static assets

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Single adjective generator
app.post("/api/term", async (req, res) => {
  const { question, value } = req.body;
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You're a therapist. Given the question and slider value, return one emotional adjective only." },
        { role: "user", content: `Q: ${question}\nSlider value: ${value}` }
      ]
    });

    const term = chat.choices[0].message.content.trim();
    res.json({ term });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating term", detail: err.message });
  }
});

// Full emotion analysis
app.post("/api/analyze", async (req, res) => {
  const { questions } = req.body;
  try {
    const basePrompt = questions.map((q, i) => `Q${i+1}: ${q.prompt} → ${q.value}`).join("\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an emotion analyst. Based on slider answers, return a combined emotion, its definition, and 3 synonyms. Always return something, even if neutral. Use JSON: {"overall": "emotion", "definition": "text", "synonyms": ["word1", "word2", "word3"]}.`
        },
        {
          role: "user",
          content: `Answers:\n${basePrompt}`
        }
      ],
      temperature: 0.5
    });

    const raw = chat.choices[0].message.content.trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const json = JSON.parse(raw.slice(start, end + 1));

    res.json(json);
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "Failed to analyze emotion", detail: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API listening on http://localhost:${PORT}`);
});

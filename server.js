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
  const basePrompt = questions.map((q, i) => `Q${i + 1}: ${q.prompt} → ${q.value}`).join("\n");

  const prompt = `
You are an expert in emotional psychology. Analyze the following slider-based responses and provide:

1. A single-word emotional state that best fits the overall answers.
2. A plain-language definition of that emotional state.
3. Three emotional synonyms.

Always give a meaningful result, even if all answers are neutral. In neutral cases, use words like "calm", "centered", "balanced", "reflective", or "content". Never return "unknown", "none", or vague results.

Format your output strictly as valid JSON:
{
  "emotion": "emotion word",
  "definition": "a clear definition",
  "synonyms": ["syn1", "syn2", "syn3"]
}

Here are the answers:
${basePrompt}
  `;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.5
    });

    const raw = chat.choices[0].message.content.trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const cleanJSON = JSON.parse(raw.slice(start, end + 1));

    // Basic fallback if model somehow returns something unusable
    const emotion = cleanJSON.emotion?.toLowerCase();
    if (!emotion || emotion.includes("unknown") || emotion.includes("none")) {
      return res.json({
        emotion: "calm",
        definition: "A peaceful and balanced emotional state.",
        synonyms: ["serene", "relaxed", "composed"]
      });
    }

    res.json(cleanJSON);
  } catch (err) {
    console.error("Analyze error:", err);
    // Fallback response on failure
    res.json({
      emotion: "calm",
      definition: "A peaceful and balanced emotional state.",
      synonyms: ["serene", "relaxed", "composed"]
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API listening on http://localhost:${PORT}`);
});

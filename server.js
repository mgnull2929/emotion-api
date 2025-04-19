// server.js
import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";
import OpenAI  from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/analyze", async (req, res) => {
  const { answers } = req.body;

  try {
    const questionsFormatted = Object.entries(answers)
      .map(([key, val]) => `${key}: ${val}`)
      .join("\n");

    const prompt = `
You are a clinical psychologist. Based on the user's answers below, infer a single emotional state the user might be experiencing. 
Be concise and give one primary emotion as your final answer. Do not explain or add extra text.

Answers:
${questionsFormatted}
`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a psychologist. Your job is to identify emotional states." },
        { role: "user", content: prompt }
      ]
    });

    const emotion = chat.choices[0].message.content.trim();
    res.json({ emotion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

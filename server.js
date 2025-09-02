import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("🟢 Received prompt:", prompt);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    console.log("🟡 Full OpenAI Response:", JSON.stringify(data, null, 2));

    // If OpenAI returns an error, show it clearly
    if (data.error) {
      console.error("❌ OpenAI API Error:", data.error);
      return res.status(500).json({ error: data.error.message || "OpenAI API failed" });
    }

    // Safely check choices
    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: "Unexpected OpenAI response format", raw: data });
    }

    const responseText = data.choices[0].message.content;
    console.log("🟢 OpenAI Response Text:", responseText);

    res.json({ response: responseText });
  } catch (err) {
    console.error("❌ Fatal Error:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});


// Start server
app.listen(PORT, () =>
  console.log(`✅ OpenAI backend running → http://localhost:${PORT}`)
);



// backend/src/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// If you still need bodyParser for other content types, you can keep it,
// but express.json() already handles JSON bodies.
dotenv.config();

// ---- Your existing adapters / NLP pieces ----
import { makeLLMFromEnv } from "./adapters/llm.js";
import { generateLLMReply } from "./nlp/generate_with_llm.js";
import { handleSmalltalk } from "./nlp/smalltalk.js";

// ---- FS path helpers ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- App setup ----
const app = express();
// app.use(cors());
// app.use(express.json({ limit: "1mb" }));
app.use(cors({
  origin: ["http://localhost:3000", "https://sanilkumar-chitti.onrender.com"],
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json()); 


// ---------- Portfolio loader (robust path detection) ----------
function findFirstExisting(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadPortfolio() {
  // Try common locations relative to backend/src
  const candidates = [
    path.join(__dirname, "portfolio.json"),             // backend/src/portfolio.json
    path.join(__dirname, "..", "portfolio.json"),       // backend/portfolio.json
    path.join(__dirname, "..", "..", "portfolio.json"), // <projectRoot>/portfolio.json
  ];

  const chosen = findFirstExisting(candidates);
  if (!chosen) {
    throw new Error("portfolio.json not found. Looked in:\n" + candidates.join("\n"));
  }
  return JSON.parse(fs.readFileSync(chosen, "utf-8"));
}

// ---------- Off-topic tracking ----------
const violMap = new Map(); // sessionId -> non-portfolio count
function getEscalation(sessionId) {
  if (!sessionId) return 1;
  const count = violMap.get(sessionId) || 0;
  if (count >= 6) return 3;
  if (count >= 2) return 2;
  return 1;
}
function bump(sessionId, intent) {
  if (!sessionId) return;
  if (intent !== "portfolio") {
    violMap.set(sessionId, (violMap.get(sessionId) || 0) + 1);
  }
}

// ---------- Health ----------
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---------- Chat ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string." });
    }

    // 1) Rule-based smalltalk first
    const smalltalk = handleSmalltalk(message);
    if (smalltalk) {
      return res.json({
        reply: smalltalk.content,
        intent: smalltalk.meta.intent,
        escalation: 1,
        nonPortfolioCount: violMap.get(sessionId) || 0,
        adapter: "rule",
        level: smalltalk.meta.level,
      });
    }

    // 2) Fall back to LLM
    const pf = loadPortfolio();
    const nonPortfolioCount = sessionId ? (violMap.get(sessionId) || 0) : 0;
    const escalationLevel = getEscalation(sessionId);
    const llm = makeLLMFromEnv(process.env);

    const { reply, intent, escalation } = await generateLLMReply({
      llm,
      message,
      pf,
      meta: { escalationLevel, nonPortfolioCount },
    });

    bump(sessionId, intent);

  res.json({
  answer: reply, // 👈 match frontend expectation
  intent,
  escalation,
  nonPortfolioCount: violMap.get(sessionId) || 0,
  adapter: (process.env.ADAPTER || "gemini"),
});

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Internal error" });
  }
});

// ---------- Contact (email) ----------
app.post("/api/send", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (![name, email, subject, message].every(Boolean)) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    console.error("❌ GMAIL_USER or GMAIL_PASS missing in environment");
    return res
      .status(500)
      .json({ success: false, message: "Email configuration missing" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }, // use Gmail App Password
    });

    await transporter.verify(); // optional but helpful

    const mailOptions = {
      from: `"Portfolio Contact" <${user}>`, // ✅ your Gmail
      to: user,                               // ✅ send to yourself
      replyTo: email,                         // ✅ reply goes to visitor
      subject: `New Contact Form: ${subject}`,
      text: `Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({
      success: false,
      message: "Error sending message. Check logs for details.",
    });
  }
});


// ---------- Start ----------
const PORT = process.env.PORT || 4000; // keep 4000 if you’re already using that
app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT} using ${(process.env.ADAPTER || "gemini").toUpperCase()} adapter`);
  console.log(`Contact route available at http://localhost:${PORT}/api/send`);
});

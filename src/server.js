// // backend/src/server.js
// import express from "express";
// import cors from "cors";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import nodemailer from "nodemailer";

// // env
// dotenv.config();

// // ---- Adapters / NLP ----
// import { makeLLMFromEnv } from "./adapters/llm.js";
// import { generateLLMReply } from "./nlp/generate_with_llm.js";
// import { handleSmalltalk } from "./nlp/smalltalk.js";

// // ---- FS path helpers ----
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ---- App setup ----
// const app = express();

// // ✅ CORS: allow your deployed frontend + local dev
// const allowedOrigins = [
//   "https://sanilkumar7.vercel.app", // your live frontend on Vercel
//   "http://localhost:5173",          // vite (optional for local dev)
//   "http://localhost:3000",          // CRA/Next local dev (optional)
// ];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true, // set true only if you use cookies/sessions
//   })
// );

// // JSON body parser
// app.use(express.json({ limit: "5mb" })); // adjust as needed

// // ---------- Portfolio loader (robust path detection) ----------
// function findFirstExisting(paths) {
//   for (const p of paths) {
//     if (fs.existsSync(p)) return p;
//   }
//   return null;
// }

// function loadPortfolio() {
//   // Try common locations relative to backend/src
//   const candidates = [
//     path.join(__dirname, "portfolio.json"), // backend/src/portfolio.json
//     path.join(__dirname, "..", "portfolio.json"), // backend/portfolio.json
//     path.join(__dirname, "..", "..", "portfolio.json"), // <projectRoot>/portfolio.json
//   ];

//   const chosen = findFirstExisting(candidates);
//   if (!chosen) {
//     throw new Error(
//       "portfolio.json not found. Looked in:\n" + candidates.join("\n")
//     );
//   }
//   return JSON.parse(fs.readFileSync(chosen, "utf-8"));
// }

// // ---------- Off-topic tracking ----------
// const violMap = new Map(); // sessionId -> non-portfolio count
// function getEscalation(sessionId) {
//   if (!sessionId) return 1;
//   const count = violMap.get(sessionId) || 0;
//   if (count >= 6) return 3;
//   if (count >= 2) return 2;
//   return 1;
// }
// function bump(sessionId, intent) {
//   if (!sessionId) return;
//   if (intent !== "portfolio") {
//     violMap.set(sessionId, (violMap.get(sessionId) || 0) + 1);
//   }
// }

// // ---------- Health ----------
// app.get("/api/health", (req, res) => res.json({ ok: true }));

// // ---------- Chat ----------
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message, sessionId } = req.body || {};
//     if (!message || typeof message !== "string") {
//       return res.status(400).json({ error: "Missing 'message' string." });
//     }

//     // 1) Rule-based smalltalk first
//     const smalltalk = handleSmalltalk(message);
//     if (smalltalk) {
//       return res.json({
//         reply: smalltalk.content,
//         intent: smalltalk.meta.intent,
//         escalation: 1,
//         nonPortfolioCount: violMap.get(sessionId) || 0,
//         adapter: "rule",
//         level: smalltalk.meta.level,
//       });
//     }

//     // 2) Fall back to LLM
//     const pf = loadPortfolio();
//     const nonPortfolioCount = sessionId ? violMap.get(sessionId) || 0 : 0;
//     const escalationLevel = getEscalation(sessionId);
//     const llm = makeLLMFromEnv(process.env);

//     const { reply, intent, escalation } = await generateLLMReply({
//       llm,
//       message,
//       pf,
//       meta: { escalationLevel, nonPortfolioCount },
//     });

//     bump(sessionId, intent);

//     return res.json({
//       answer: reply, // frontend expects "answer"
//       intent,
//       escalation,
//       nonPortfolioCount: violMap.get(sessionId) || 0,
//       adapter: (process.env.ADAPTER || "gemini"),
//     });
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ error: e.message || "Internal error" });
//   }
// });

// // ---------- Contact (email) ----------
// app.post("/api/send", async (req, res) => {
//   const { name, email, subject, message } = req.body || {};

//   // 1) Input validation
//   if (!name || !email || !subject || !message) {
//     return res
//       .status(400)
//       .json({ success: false, message: "All fields are required" });
//   }

//   // 2) Env check
//   if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
//     console.error("ERROR: GMAIL_USER or GMAIL_PASS missing in .env");
//     return res.status(500).json({
//       success: false,
//       message: "Server email configuration is missing.",
//     });
//   }

//   try {
//     // 3) Create transporter (stable SMTP; avoids some Gmail 'service' quirks)
//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS, // Gmail App Password (not your normal password)
//       },
//     });

//     // 4) Compose email — DMARC-safe: keep from=your account, set replyTo=visitor
//     const mailOptions = {
//       from: process.env.GMAIL_USER, // authenticated sender
//       replyTo: email, // visitor's email (so you can reply directly)
//       to: process.env.GMAIL_USER, // receiver is site owner (you)
//       subject: `New Contact Form: ${subject}`,
//       text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage:\n${message}`,
//     };

//     // 5) Send
//     await transporter.sendMail(mailOptions);
//     return res.json({ success: true, message: "Message sent successfully!" });
//   } catch (err) {
//     console.error("Error sending email:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Error sending message" });
//   }
// });

// // ---------- Start ----------
// const PORT = process.env.PORT || 4000; // Render sets PORT for you
// app.listen(PORT, () => {
//   console.log(
//     `[backend] listening on http://localhost:${PORT} using ${(process.env.ADAPTER || "gemini")
//       .toUpperCase()} adapter`
//   );
//   console.log(`Health:  GET  /api/health`);
//   console.log(`Chat:    POST /api/chat`);
//   console.log(`Contact: POST /api/send`);
// });











// backend/src/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// env
dotenv.config();

// ---- Adapters / NLP ----
import { makeLLMFromEnv } from "./adapters/llm.js";
import { generateLLMReply } from "./nlp/generate_with_llm.js";
import { handleSmalltalk } from "./nlp/smalltalk.js";

// ---- FS path helpers ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- App setup ----
const app = express();

// ✅ CORS: allow your deployed frontend + local dev
const allowedOrigins = [
  "https://sanilkumar7.vercel.app", // your live frontend on Vercel
  "http://localhost:5173",          // vite (optional for local dev)
  "http://localhost:3000",          // CRA/Next local dev (optional)
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // set true only if you use cookies/sessions
  })
);

// JSON body parser
app.use(express.json({ limit: "5mb" })); // adjust as needed

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
    path.join(__dirname, "portfolio.json"), // backend/src/portfolio.json
    path.join(__dirname, "..", "portfolio.json"), // backend/portfolio.json
    path.join(__dirname, "..", "..", "portfolio.json"), // <projectRoot>/portfolio.json
  ];

  const chosen = findFirstExisting(candidates);
  if (!chosen) {
    throw new Error(
      "portfolio.json not found. Looked in:\n" + candidates.join("\n")
    );
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

/* ---------- Boundary Guard (personal/creepy detector) ----------
   Enabled by default (set BOUNDARY_GUARD=off to disable).
   Detection is rule-based; the response is generated by the LLM with
   a special instruction to keep it witty, short, and redirective.
-----------------------------------------------------------------*/
const PERSONAL_PATTERNS = [
  /\b(girlfriend|boyfriend|bf|gf|date|dating|single|married|wife|husband)\b/i,
  /\b(crush|flirt|kiss|love (you|me)|relationship)\b/i,
  /\b(age|how old are you)\b/i,
  /\b(phone|whatsapp|number|address)\b/i,
  /\b(what do you (look like|wear)|appearance|face reveal)\b/i,
  /\b(salary|how much (do you|you) (make|earn))\b/i,
];

function detectPersonalProbe(message = "") {
  if (!message || typeof message !== "string") return null;
  const matched = PERSONAL_PATTERNS.find((re) => re.test(message));
  return matched ? { type: "off_topic_personal", pattern: matched.toString() } : null;
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

    // 0) Boundary guard FIRST (before smalltalk/LLM)
    if (process.env.BOUNDARY_GUARD !== "off") {
      const personalHit = detectPersonalProbe(message);
      if (personalHit) {
        // escalate tone by past behavior
        const nonPortfolioCount = sessionId ? (violMap.get(sessionId) || 0) : 0;
        const escalationLevel = getEscalation(sessionId);

        // Build a dynamic instruction for the LLM to craft a witty boundary
        const boundaryPrompt =
`SYSTEM: You are a portfolio site assistant. The user asked a personal/off-topic question.
Respond with a brief, witty, boundary-setting message in a "savage but professional" tone.

Rules:
- 1–2 sentences max.
- No insults, slurs, harassment, or profanity. Be assertive, not abusive.
- Clearly set the boundary and redirect to portfolio topics (projects, skills, experience).
- Escalation level: ${escalationLevel} (1=polite-witty, 2=sharper, 3=firm shutdown).
- If level 3, firmly state the chat will end if they continue.

USER: ${message}
ASSISTANT:`;

        // Use your existing LLM plumbing so adapters/env keep working
        const pf = loadPortfolio(); // not strictly needed, but harmless to pass
        const llm = makeLLMFromEnv(process.env);

        const { reply } = await generateLLMReply({
          llm,
          message: boundaryPrompt,
          pf,
          meta: {
            mode: "boundary_guard",
            escalationLevel,
            nonPortfolioCount
          },
        });

        // Count it as a non-portfolio violation to escalate next time
        if (sessionId) {
          violMap.set(sessionId, nonPortfolioCount + 1);
        }

        return res.json({
          answer: reply || "Personal topics are off-limits. Ask about the portfolio.",
          intent: "off_topic_personal",
          escalation: escalationLevel,
          nonPortfolioCount: violMap.get(sessionId) || 0,
          adapter: (process.env.ADAPTER || "gemini"),
        });
      }
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
    const nonPortfolioCount = sessionId ? violMap.get(sessionId) || 0 : 0;
    const escalationLevel = getEscalation(sessionId);
    const llm = makeLLMFromEnv(process.env);

    const { reply, intent, escalation } = await generateLLMReply({
      llm,
      message,
      pf,
      meta: { escalationLevel, nonPortfolioCount },
    });

    bump(sessionId, intent);

    return res.json({
      answer: reply, // frontend expects "answer"
      intent,
      escalation,
      nonPortfolioCount: violMap.get(sessionId) || 0,
      adapter: (process.env.ADAPTER || "gemini"),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Internal error" });
  }
});

// ---------- Contact (email) ----------
app.post("/api/send", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  // 1) Input validation
  if (!name || !email || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // 2) Env check
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("ERROR: GMAIL_USER or GMAIL_PASS missing in .env");
    return res.status(500).json({
      success: false,
      message: "Server email configuration is missing.",
    });
  }

  try {
    // 3) Create transporter (stable SMTP; avoids some Gmail 'service' quirks)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // Gmail App Password (not your normal password)
      },
    });

    // 4) Compose email — DMARC-safe: keep from=your account, set replyTo=visitor
    const mailOptions = {
      from: process.env.GMAIL_USER, // authenticated sender
      replyTo: email, // visitor's email (so you can reply directly)
      to: process.env.GMAIL_USER, // receiver is site owner (you)
      subject: `New Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage:\n${message}`,
    };

    // 5) Send
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Error sending email:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error sending message" });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 4000; // Render sets PORT for you
app.listen(PORT, () => {
  console.log(
    `[backend] listening on http://localhost:${PORT} using ${(process.env.ADAPTER || "gemini")
      .toUpperCase()} adapter`
  );
  console.log(`Health:  GET  /api/health`);
  console.log(`Chat:    POST /api/chat`);
  console.log(`Contact: POST /api/send`);
});

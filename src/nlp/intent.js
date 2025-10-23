
// export function normalize(s='') {
//   return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
// }

// const kw = {
//   aboutme: ['about me','about yourself','tell me about you','who are you','height','skin tone','skin colour','skin color','hobbies','interests','eye color','hair color','pronouns'],
//   portfolio: [
//     'portfolio','resume','cv','skill','skills','project','projects','experience','work','company',
//     'role','education','degree','school','university','college','contact','email','github','stack','tech'
//   ],
//   smalltalk: ['how are you',"what's up",'hi','hello','hey','good morning','good evening','sup','how is it going','how do you do'],
//   personal: ['your age','married','relationship','religion','salary','politics','where do you live','phone number','address'],
//   joke: ['joke','funny','meme','lol','lmao','rofl','haha','make me laugh'],
//   rude: ['stupid','idiot','dumb','shut up','useless','hate you','trash','moron','noob'],
//   help: ['help','what can you do','commands','how to use','guide']
// };

// export function classifyIntent(text) {
//   const t = normalize(text);
//   let scores = { portfolio:0, smalltalk:0, personal:0, joke:0, rude:0, help:0, aboutme:0, offtopic:0 };

// // intent.js (drop-in)

// /** Normalize text */
// export function normalize(s = "") {
//   return s
//     .toLowerCase()
//     .replace(/[^\p{L}\p{N}\s]/gu, " ")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// /** Known projects (normalized) → canonical key */
// const PROJECT_ALIASES = new Map([
//   // StudyBuddy
//   ["studybuddy", "studybuddy"],
//   ["study buddy", "studybuddy"],
//   ["ai pdf q a", "studybuddy"],
//   ["ai pdf qa", "studybuddy"],
//   ["pdf chat", "studybuddy"],
//   // Spam Shield
//   ["spam shield", "spam shield"],
//   ["sentiment spam detection", "spam shield"],
//   ["comment moderation", "spam shield"],
//   // Portfolio Website
//   ["portfolio website", "portfolio website"],
//   ["personal website", "portfolio website"],
//   ["portfolio site", "portfolio website"],
//   // Earthquake Visualizer
//   ["earthquake visualizer", "earthquake visualizer"],
//   ["earthquake app", "earthquake visualizer"],
//   ["seismic dashboard", "earthquake visualizer"],
//   // YouTube Clone
//   ["youtube clone", "youtube clone"],
//   ["yt clone", "youtube clone"],
//   ["youtube ui", "youtube clone"]
// ]);

// /** Known certificates (normalized) → canonical key */
// const CERT_ALIASES = new Map([
//   ["java programming certification", "java programming certification"],
//   ["java certification", "java programming certification"],
//   ["hackerrank java", "java programming certification"],
//   ["frontend development with react and next.js", "frontend development with react and next.js"],
//   ["frontend certification", "frontend development with react and next.js"],
//   ["react next.js certification", "frontend development with react and next.js"],
//   ["linux kernel development (lfd103)", "linux kernel development (lfd103)"],
//   ["linux kernel", "linux kernel development (lfd103)"],
//   ["lfd103", "linux kernel development (lfd103)"]
// ]);

// /** topic hints (skills, experience, etc.) for better routing */
// const TOPIC_HINTS = {
//   skills: ["skill", "skills", "stack", "tech", "technology", "tools"],
//   experience: ["experience", "work", "company", "role", "intern", "internship", "career"],
//   education: ["education", "degree", "school", "university", "college"],
//   contact: ["contact", "email", "github", "linkedin", "website", "portfolio"],
//   projects: ["project", "projects", "built", "builds"],
//   certifications: ["certificate", "certificates", "certification", "certifications", "badge", "badges", "courses", "achievements"]
// };

// const kw = {
//   aboutme: [
//     "about me",
//     "about yourself",
//     "tell me about you",
//     "who are you",
//     "height",
//     "skin tone",
//     "skin colour",
//     "skin color",
//     "hobbies",
//     "interests",
//     "eye color",
//     "hair color",
//     "pronouns"
//   ],
//   portfolio: [
//     "portfolio",
//     "resume",
//     "cv",
//     "skill",
//     "skills",
//     "project",
//     "projects",
//     "experience",
//     "work",
//     "company",
//     "role",
//     "education",
//     "degree",
//     "school",
//     "university",
//     "college",
//     "contact",
//     "email",
//     "github",
//     "stack",
//     "tech"
//   ],
//   smalltalk: [
//     "how are you",
//     "what's up",
//     "whats up",
//     "hi",
//     "hello",
//     "hey",
//     "good morning",
//     "good evening",
//     "sup",
//     "how is it going",
//     "how do you do"
//   ],
//   personal: ["your age", "married", "relationship", "religion", "salary", "politics", "where do you live", "phone number", "address"],
//   joke: ["joke", "funny", "meme", "lol", "lmao", "rofl", "haha", "make me laugh"],
//   rude: ["stupid", "idiot", "dumb", "shut up", "useless", "hate you", "trash", "moron", "noob"],
//   help: ["help", "what can you do", "commands", "how to use", "guide"]
// };

// /** Try to map a normalized phrase to a canonical project key */
// function detectProject(tNorm) {
//   for (const [alias, key] of PROJECT_ALIASES.entries()) {
//     if (tNorm.includes(alias)) return key;
//   }
//   // pattern: tell me about/explain/how does X work
//   const m =
//     tNorm.match(/\b(tell me about|explain|show me|walk me through|how does)\s+([a-z0-9\s\-]+?)(?:\s+work|\.|$)/i) || [];
//   const candidate = normalize(m[2] || "");
//   if (candidate) {
//     for (const [alias, key] of PROJECT_ALIASES.entries()) {
//       if (candidate.includes(alias)) return key;
//     }
//   }
//   return null;
// }

// /** Try to map a normalized phrase to a canonical certificate key */
// function detectCertificate(tNorm) {
//   // direct alias hit
//   for (const [alias, key] of CERT_ALIASES.entries()) {
//     if (tNorm.includes(alias)) return key;
//   }
//   // patterns similar to projects
//   const m =
//     tNorm.match(/\b(tell me about|explain|show me|what|which)\s+([a-z0-9\s\-\(\)]+?)(?:\s+certificate| certification| badge| course|$)/i) || [];
//   const candidate = normalize(m[2] || "");
//   if (candidate) {
//     for (const [alias, key] of CERT_ALIASES.entries()) {
//       if (candidate.includes(alias)) return key;
//     }
//   }
//   return null;
// }

// /** light topic extraction for portfolio subsections */
// function detectTopic(tNorm) {
//   for (const [topic, words] of Object.entries(TOPIC_HINTS)) {
//     for (const w of words) {
//       if (tNorm.includes(w)) return topic;
//     }
//   }
//   return null;
// }

// export function classifyIntent(text) {
//   const t = normalize(text);

//   let scores = {
//     portfolio: 0,
//     smalltalk: 0,
//     personal: 0,
//     joke: 0,
//     rude: 0,
//     help: 0,
//     aboutme: 0,
//     offtopic: 0,
//     project_detail: 0,   // specific project asked
//     certs: 0,            // generic certifications asked
//     cert_detail: 0       // specific certificate asked
//   };

//   // keyword scoring (original weights preserved) 9429ab00d831cc65a14359d4109d16ee0ecea6da
//   for (const k of kw.portfolio) if (t.includes(k)) scores.portfolio += 2;
//   for (const k of kw.smalltalk) if (t.includes(k)) scores.smalltalk += 1.7;
//   for (const k of kw.personal) if (t.includes(k)) scores.personal += 2;
//   for (const k of kw.joke) if (t.includes(k)) scores.joke += 1.6;
//   for (const k of kw.rude) if (t.includes(k)) scores.rude += 3;
//   for (const k of kw.help) if (t.includes(k)) scores.help += 2;
//   for (const k of kw.aboutme) if (t.includes(k)) scores.aboutme += 2.2;

//   if (/\b(c#|asp\.?net|sql|entity framework|react|angular|azure|docker)\b/i.test(text)) scores.portfolio += 1.5;
//   if (/who are you|about yourself|introduce yourself/i.test(text)) scores.portfolio += 1.2;

//   const maxLabel = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
//   const label = (maxLabel && maxLabel[1] > 0) ? maxLabel[0] : 'offtopic';
//   return { label, scores };
// }

//   // tech stack nudge → portfolio
//   if (/\b(c#|asp\.?net|sql|entity framework|react|angular|azure|docker)\b/i.test(text)) scores.portfolio += 1.5;
//   if (/who are you|about yourself|introduce yourself/i.test(text)) scores.portfolio += 1.2;

//   // NEW: certifications generic keywords boost
//   if (/\b(cert|certificate|certificates|certification|certifications|badge|badges|course|courses|achievements?)\b/i.test(text)) {
//     scores.certs += 3.5;
//     scores.portfolio += 0.8;
//   }

//   // NEW: project/cert detail detection boosts
//   const project = detectProject(t);
//   if (project) {
//     scores.project_detail += 4.8; // higher than generic portfolio
//     scores.portfolio += 1.5;
//   }

//   const certificate = detectCertificate(t);
//   if (certificate) {
//     scores.cert_detail += 5.0; // highest priority when specific cert is asked
//     scores.certs += 1.5;
//     scores.portfolio += 0.8;
//   }

//   // NEW: topic extraction for portfolio sub-routing
//   const topic = detectTopic(t);

//   // greeting flag for nicer responses
//   const isGreeting = (kw.smalltalk.some((k) => t.includes(k)) || /\b(hi|hello|hey)\b/.test(t));

//   // pick top score
//   const [label, topScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] || ["offtopic", 0];

//   // Prioritize detail intents over generic ones on ties
//   let finalLabel = "offtopic";
//   if (scores.cert_detail >= Math.max(scores.certs, scores.project_detail, scores.portfolio, scores.smalltalk)) {
//     finalLabel = "cert_detail";
//   } else if (scores.project_detail >= Math.max(scores.certs, scores.portfolio, scores.smalltalk)) {
//     finalLabel = "project_detail";
//   } else if (scores.certs >= Math.max(scores.portfolio, scores.smalltalk)) {
//     finalLabel = "certs";
//   } else if (topScore > 0) {
//     finalLabel = label;
//   }

//   return {
//     label: finalLabel, // 'cert_detail' | 'project_detail' | 'certs' | 'portfolio' | 'smalltalk' | ...
//     scores,
//     entities: {
//       project,      // canonical project key or null
//       certificate,  // canonical certificate key or null
//       topic,        // 'skills' | 'experience' | 'education' | 'contact' | 'projects' | 'certifications' | null
//       isGreeting
//     },
//     textOriginal: text,
//     textNormalized: t
//   };
// }
//         sessionId,                                      
















// src/nlp/intent.js  (ESM)

// ---------- Utils ----------
/** Normalize text */
export function normalize(s = "") {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Domain data ----------

/** Known projects (normalized) → canonical key */
const PROJECT_ALIASES = new Map([
  // StudyBuddy
  ["studybuddy", "studybuddy"],
  ["study buddy", "studybuddy"],
  ["ai pdf q a", "studybuddy"],
  ["ai pdf qa", "studybuddy"],
  ["pdf chat", "studybuddy"],

  // Spam Shield
  ["spam shield", "spam shield"],
  ["sentiment spam detection", "spam shield"],
  ["comment moderation", "spam shield"],

  // Portfolio Website
  ["portfolio website", "portfolio website"],
  ["personal website", "portfolio website"],
  ["portfolio site", "portfolio website"],

  // Earthquake Visualizer
  ["earthquake visualizer", "earthquake visualizer"],
  ["earthquake app", "earthquake visualizer"],
  ["seismic dashboard", "earthquake visualizer"],

  // YouTube Clone
  ["youtube clone", "youtube clone"],
  ["yt clone", "youtube clone"],
  ["youtube ui", "youtube clone"]
]);

/** Known certificates (normalized) → canonical key */
const CERT_ALIASES = new Map([
  ["java programming certification", "java programming certification"],
  ["java certification", "java programming certification"],
  ["hackerrank java", "java programming certification"],

  ["frontend development with react and next.js", "frontend development with react and next.js"],
  ["frontend certification", "frontend development with react and next.js"],
  ["react next.js certification", "frontend development with react and next.js"],

  ["linux kernel development (lfd103)", "linux kernel development (lfd103)"],
  ["linux kernel", "linux kernel development (lfd103)"],
  ["lfd103", "linux kernel development (lfd103)"]
]);

/** topic hints (skills, experience, etc.) for better routing */
const TOPIC_HINTS = {
  skills: ["skill", "skills", "stack", "tech", "technology", "tools"],
  experience: ["experience", "work", "company", "role", "intern", "internship", "career"],
  education: ["education", "degree", "school", "university", "college"],
  contact: ["contact", "email", "github", "linkedin", "website", "portfolio"],
  projects: ["project", "projects", "built", "builds"],
  certifications: ["certificate", "certificates", "certification", "certifications", "badge", "badges", "courses", "achievements"]
};

const kw = {
  aboutme: [
    "about me",
    "about yourself",
    "tell me about you",
    "who are you",
    "height",
    "skin tone",
    "skin colour",
    "skin color",
    "hobbies",
    "interests",
    "eye color",
    "hair color",
    "pronouns"
  ],
  portfolio: [
    "portfolio",
    "resume",
    "cv",
    "skill",
    "skills",
    "project",
    "projects",
    "experience",
    "work",
    "company",
    "role",
    "education",
    "degree",
    "school",
    "university",
    "college",
    "contact",
    "email",
    "github",
    "stack",
    "tech"
  ],
  smalltalk: [
    "how are you",
    "what's up",
    "whats up",
    "hi",
    "hello",
    "hey",
    "good morning",
    "good evening",
    "sup",
    "how is it going",
    "how do you do"
  ],
  personal: ["your age", "married", "relationship", "religion", "salary", "politics", "where do you live", "phone number", "address"],
  joke: ["joke", "funny", "meme", "lol", "lmao", "rofl", "haha", "make me laugh"],
  rude: ["stupid", "idiot", "dumb", "shut up", "useless", "hate you", "trash", "moron", "noob"],
  help: ["help", "what can you do", "commands", "how to use", "guide"]
};

// ---------- Detectors ----------

/** Try to map a normalized phrase to a canonical project key */
function detectProject(tNorm) {
  for (const [alias, key] of PROJECT_ALIASES.entries()) {
    if (tNorm.includes(alias)) return key;
  }
  // pattern: tell me about/explain/how does X work
  const m =
    tNorm.match(/\b(tell me about|explain|show me|walk me through|how does)\s+([a-z0-9\s\-]+?)(?:\s+work|\.|$)/i) || [];
  const candidate = normalize(m[2] || "");
  if (candidate) {
    for (const [alias, key] of PROJECT_ALIASES.entries()) {
      if (candidate.includes(alias)) return key;
    }
  }
  return null;
}

/** Try to map a normalized phrase to a canonical certificate key */
function detectCertificate(tNorm) {
  for (const [alias, key] of CERT_ALIASES.entries()) {
    if (tNorm.includes(alias)) return key;
  }
  const m =
    tNorm.match(
      /\b(tell me about|explain|show me|what|which)\s+([a-z0-9\s\-\(\)]+?)(?:\s+certificate| certification| badge| course|$)/i
    ) || [];
  const candidate = normalize(m[2] || "");
  if (candidate) {
    for (const [alias, key] of CERT_ALIASES.entries()) {
      if (candidate.includes(alias)) return key;
    }
  }
  return null;
}

/** light topic extraction for portfolio subsections */
function detectTopic(tNorm) {
  for (const [topic, words] of Object.entries(TOPIC_HINTS)) {
    for (const w of words) {
      if (tNorm.includes(w)) return topic;
    }
  }
  return null;
}

// ---------- Classifier ----------
export function classifyIntent(text) {
  const t = normalize(text);

  let scores = {
    portfolio: 0,
    smalltalk: 0,
    personal: 0,
    joke: 0,
    rude: 0,
    help: 0,
    aboutme: 0,
    offtopic: 0,
    project_detail: 0, // specific project asked
    certs: 0,          // generic certifications asked
    cert_detail: 0     // specific certificate asked
  };

  // keyword scoring
  for (const k of kw.portfolio) if (t.includes(k)) scores.portfolio += 2;
  for (const k of kw.smalltalk) if (t.includes(k)) scores.smalltalk += 1.7;
  for (const k of kw.personal) if (t.includes(k)) scores.personal += 2;
  for (const k of kw.joke) if (t.includes(k)) scores.joke += 1.6;
  for (const k of kw.rude) if (t.includes(k)) scores.rude += 3;
  for (const k of kw.help) if (t.includes(k)) scores.help += 2;
  for (const k of kw.aboutme) if (t.includes(k)) scores.aboutme += 2.2;

  // tech stack nudge → portfolio
  if (/\b(c#|asp\.?net|sql|entity framework|react|angular|azure|docker)\b/i.test(text)) scores.portfolio += 1.5;
  if (/who are you|about yourself|introduce yourself/i.test(text)) scores.portfolio += 1.2;

  // certifications generic keywords boost
  if (/\b(cert|certificate|certificates|certification|certifications|badge|badges|course|courses|achievements?)\b/i.test(text)) {
    scores.certs += 3.5;
    scores.portfolio += 0.8;
  }

  // project/cert detail detection boosts
  const project = detectProject(t);
  if (project) {
    scores.project_detail += 4.8;
    scores.portfolio += 1.5;
  }

  const certificate = detectCertificate(t);
  if (certificate) {
    scores.cert_detail += 5.0;
    scores.certs += 1.5;
    scores.portfolio += 0.8;
  }

  // topic extraction for portfolio sub-routing
  const topic = detectTopic(t);

  // greeting flag for nicer responses
  const isGreeting = kw.smalltalk.some((k) => t.includes(k)) || /\b(hi|hello|hey)\b/.test(t);

  // choose label: prioritize detail intents over generic ones
  const [labelCandidate, topScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] || ["offtopic", 0];
  let finalLabel = "offtopic";
  if (scores.cert_detail >= Math.max(scores.certs, scores.project_detail, scores.portfolio, scores.smalltalk)) {
    finalLabel = "cert_detail";
  } else if (scores.project_detail >= Math.max(scores.certs, scores.portfolio, scores.smalltalk)) {
    finalLabel = "project_detail";
  } else if (scores.certs >= Math.max(scores.portfolio, scores.smalltalk)) {
    finalLabel = "certs";
  } else if (topScore > 0) {
    finalLabel = labelCandidate;
  }

  return {
    label: finalLabel, // 'cert_detail' | 'project_detail' | 'certs' | 'portfolio' | 'smalltalk' | ...
    scores,
    entities: {
      project,      // canonical project key or null
      certificate,  // canonical certificate key or null
      topic,        // 'skills' | 'experience' | 'education' | 'contact' | 'projects' | 'certifications' | null
      isGreeting
    },
    textOriginal: text,
    textNormalized: t
  };
}

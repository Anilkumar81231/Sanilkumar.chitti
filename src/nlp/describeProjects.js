// ESM import (ensure backend/package.json has { "type": "module" })
import config from "../portfolio.json" assert { type: "json" };

/** Expand acronyms one time per response */
function expandAcronymsOnce(text) {
  const map = config.naturalLanguage?.acronyms || {};
  let out = text;
  for (const [abbr, meaning] of Object.entries(map)) {
    const re = new RegExp(`\\b${abbr}\\b`, "g");
    out = out.replace(re, `${abbr} (${meaning})`);
  }
  return out;
}

/** Build a lookup (name -> example) from projectExplanationStyle.examples */
const exampleMap = (() => {
  const arr = config.projectExplanationStyle?.examples || [];
  const m = new Map();
  for (const ex of arr) m.set(ex.name.toLowerCase(), ex);
  return m;
})();

/** Format a single project with friendly, human text */
function formatProject(project) {
  // Try to use the curated example if it exists (nicer wording),
  // otherwise synthesize from the project fields.
  const ex =
    exampleMap.get(project.name.toLowerCase()) ||
    {
      name: project.name,
      oneLine: project.about || "A project by Anil.",
      impact: "Helps users with a clear, practical benefit.",
      techHighLevel: `Built with ${Array.isArray(project.stack) ? project.stack.join(", ") : "modern tools"}.`,
      role: project.role || "Contributed across design, implementation, and testing.",
      cta: project.link ? `Link: ${project.link}` : "Ask for a demo!"
    };

  const msg = `
**${ex.name}**
• **What it is:** ${ex.oneLine}
• **Why it matters:** ${ex.impact}
• **How it works:** ${ex.techHighLevel}
• **My part:** ${ex.role}
→ ${ex.cta}
`.trim();

  return expandAcronymsOnce(msg);
}

/** List all projects in friendly style */
export function describeAllProjects() {
  const items = (config.projects || []).map(formatProject);
  return items.join("\n\n");
}

/** Describe a single project by fuzzy name match */
export function describeSingleProject(queryName) {
  const q = (queryName || "").toLowerCase().trim();
  const projects = config.projects || [];
  let best = projects.find(p => p.name.toLowerCase() === q);
  if (!best) best = projects.find(p => p.name.toLowerCase().includes(q));
  if (!best) return "Hmm, I couldn’t find that project. Try the exact name or ask “projects” for the full list.";
  return formatProject(best);
}

/* ------------------------------------------------------------------
   ✅ Additions (non-breaking): exports useful for routing/UX
-------------------------------------------------------------------*/

/** Array of canonical project names (for auto-complete / quick replies) */
export const projectNames = (config.projects || []).map(p => p.name);

/** Get a simple markdown bullet list of project names */
export function listProjectNames() {
  if (!projectNames.length) return "No projects found.";
  return projectNames.map(n => `• ${n}`).join("\n");
}

/** Default export (optional convenience) */
const api = {
  describeAllProjects,
  describeSingleProject,
  projectNames,
  listProjectNames
};
export default api;

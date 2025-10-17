// ESM router that uses your classifyIntent() and dispatches to certs/projects/smalltalk

import { classifyIntent } from "./intent.js";
import { describeAllProjects, describeSingleProject } from "./describeProjects.js";
import { describeAllCerts, describeSingleCert } from "./describeCerts.js";
import { handleSmalltalk } from "./smalltalk.js";

export function handleMessage(userText = "") {
  const intent = classifyIntent(userText);
  const { label, entities } = intent;

  // console.log("INTENT", intent); // helpful while testing

  switch (label) {
    case "cert_detail": {
      // specific certificate (e.g., "linux kernel", "java certificate")
      return describeSingleCert(entities.certificate);
    }
    case "certs": {
      // generic certificates request
      return describeAllCerts();
    }
    case "project_detail": {
      // specific project (e.g., "explain studybuddy")
      return describeSingleProject(entities.project);
    }
    case "portfolio": {
      // generic portfolio; if they mention projects explicitly, show all projects
      if (entities.topic === "projects") {
        return describeAllProjects();
      }
      if (entities.topic === "certifications") {
        return describeAllCerts();
      }
      // otherwise, give a friendly nudge
      return "I can walk you through Anil’s **projects** or **certifications** — which one would you like?";
    }
    case "smalltalk": {
      return handleSmalltalk(userText);
    }
    case "help": {
      return "You can ask me about **projects**, **certifications**, **skills**, **experience**, or **education**.";
    }
    case "rude": {
      return "I’m here to help 🙂. Want to see Anil’s projects or certifications?";
    }
    default: {
      // fallback
      return "I can show Anil’s **projects** and **certifications** in detail. What would you like to see?";
    }
  }
}

export default handleMessage;

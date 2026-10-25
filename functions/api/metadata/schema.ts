// ============================================================
// SHIKSHA SAHAYAK OS API: /api/metadata/schema
// ============================================================

import { jsonResponse } from "../../lib/json";

export async function onRequestGet() {
  return jsonResponse({
    specVersion: "1.0.0",
    specificationName: "ShikshaSahayak OS Universal Metadata Specification",
    domains: [
      { name: "system", description: "Identity, slug, title, status, timestamps, audit tracking" },
      { name: "academic", description: "University, Degree, Branch, Semester, Subject, Unit, Topic, Credits" },
      { name: "resource", description: "Type, format, file size, reading time, thumbnail, author, license" },
      { name: "learning", description: "Difficulty, stage, knowledge level, objectives, Bloom's taxonomy" },
      { name: "assessment", description: "Question type, marks, duration, passing criteria, attempts" },
      { name: "discovery", description: "Tags, keywords, aliases, search weight, featured, trending" },
      { name: "engagement", description: "Views, downloads, bookmarks, likes, shares, completion rate, popularity score" },
      { name: "relationships", description: "Parent, children, related, alternative, prerequisite, video mapping" },
      { name: "personalization", description: "Recommended branch, semester, goal, skill, dashboard priority" },
      { name: "search", description: "Search index tokens, filters, autocomplete terms, synonyms, boost" },
    ],
  }, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

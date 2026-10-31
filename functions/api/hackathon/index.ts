// ============================================================
// SHIKSHA SAHAYAK OS API: /api/hackathon
// Official VBYLD 2027 Hack for Social Cause Endpoint
// ============================================================

import { jsonResponse } from "../../lib/json";

export async function onRequestGet() {
  return jsonResponse({
    success: true,
    data: {
      event: {
        name: "Hack for Social Cause — VBYLD 2027",
        shortName: "HSC 2027",
        initiative: "Viksit Bharat Young Leaders Dialogue (VBYLD) 2027",
        organizer: "Ministry of Youth Affairs & Sports (MoYAS), Government of India",
        knowledgePartner: "Indian Institute of Technology Bombay (IIT Bombay)",
        digitalBackbone: "MY Bharat Portal",
        vision: "Think Global, Hack Local — Technology for Social Transformation"
      },
      submission: {
        projectTitle: "ShikshaSahayak",
        tagline: "Universalizing Higher Technical Education Via Zero-Paywall Courseware & Curriculum-Grounded AI",
        primaryTheme: {
          id: 2,
          name: "Education & Skill Development",
          description: "Universalizing access to verified semester notes, past exam question papers, and AI tutoring across Tier-2/Tier-3 engineering & diploma colleges."
        },
        secondaryThemes: [
          { id: 6, name: "Digital Inclusion", description: "Zero-cost, lightweight web architecture optimized for low-end budget smartphones (<₹8,000) and flaky rural connectivity." },
          { id: 7, name: "Artificial Intelligence & Emerging Technologies", description: "Curriculum-grounded AI mentor with anti-hallucination prompt injection and bilingual explanations." }
        ],
        unSdgsAligned: [
          { code: "SDG 4", name: "Quality Education", target: "Universal, zero-cost access to accredited study materials & 24/7 AI tutoring" },
          { code: "SDG 8", name: "Decent Work & Economic Growth", target: "Practical coding skill pathways & internship opportunities" },
          { code: "SDG 10", name: "Reduced Inequalities", target: "Closing the privilege divide between premier metro institutes and remote rural polytechnics" }
        ],
        nationalAlignment: ["NEP 2020 (Section 24)", "Viksit Bharat @ 2047"]
      }
    }
  });
}


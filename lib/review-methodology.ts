// Methodology copy for the Leap Review drawer.
// Tone: helpful older sibling who's been through the process. Plain English,
// honest about what the tool can and can't do.

import type { MethodologyItem } from "@/components/MethodologyDrawer";

export const reviewMethodology: MethodologyItem[] = [
  {
    heading: "What this is",
    body: "Leap Review is a free SOP feedback tool built specifically for Indian students applying abroad. You paste your draft, pick the program you're applying to, and get back: an honest one-line verdict, scores against the kind of SOPs that actually get admitted at that program, the specific phrases that would make an admissions officer raise an eyebrow, and three concrete things to fix tonight. It's the feedback a strong older sibling who has been through this would give you.",
  },
  {
    heading: "How it scores your draft",
    body: "Each program has a rubric with six dimensions — your opening, why this program, how technically specific you are, the arc of your story, your voice, and how it's structured. For each dimension, we know roughly where admitted students at that program land. Your score is on the same 0–10 scale, with a tick mark on each bar showing the admitted-student median. Below the tick = work to do. At or above = you're at par.",
  },
  {
    heading: "Why Indian-student-specific",
    body: "Indian SOPs share predictable patterns that admissions officers see hundreds of times a cycle: childhood-passion openings, generic country praise, treating a top program as a backup, name-dropping faculty without showing you understand their work, and 'give back to my country' endings that sound copied. Most generic SOP feedback tools (and ChatGPT) miss these because they're trained on a global mix. Leap Review is calibrated against the specific patterns Indian applicants fall into — and that's exactly what's most likely to be hurting your draft.",
  },
  {
    heading: "What gets flagged inline",
    body: "Three categories of flags. (1) Clichés — opening phrases and stock claims that show up in 60–80% of Indian applicant SOPs and signal 'generic' to admissions readers. (2) Vague claims — sentences that sound nice but don't actually say anything specific. (3) Missing program hooks — places where you should be naming a specific course, faculty member, lab, or thing about the program but instead said something that could apply to any university. Click any highlighted phrase to see exactly why it was flagged.",
  },
  {
    heading: "What 'what to fix tonight' means",
    body: "The action plan is exactly three things, in priority order. They're written for THIS draft, not generic advice. Item 1 is the highest-leverage change — the thing that, if you only fix one thing tonight, you should fix this. The point is to give you a clear 'do this next' instead of a wall of feedback you don't know where to start with.",
  },
  {
    heading: "Limits to keep in mind",
    body: "(1) The rubrics for the three programs in this prototype are calibrated against public admissions guidance — in production they'd be derived from Leap's internal corpus of admitted SOPs. (2) The cliché list catches 22 common patterns; novel phrasings will slip through. (3) The verdict is honest but not infallible — it's meant to catch issues you can't see in your own draft, not replace your own judgment about your story. Use it as a second pair of eyes, not a final answer.",
  },
  {
    heading: "What this is NOT",
    body: "This is not a rewrite tool — it won't write your SOP for you, and that's intentional. The voice has to be yours. It's also not a counselor replacement. If you want a real human who has read thousands of SOPs at your target program to read your revised draft, talk to a Leap counselor — that's what they're for. This tool is what gets you ready to use that conversation well.",
  },
];

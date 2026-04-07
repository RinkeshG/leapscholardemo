// Hardcoded rubrics for the three programs Leap Review supports in V1.
// In production these would come from Leap's outcomes warehouse, derived from
// the corpus of admitted SOPs at each program.

import type { ProgramId, ProgramRubric } from "./review-types";

const SHARED_DIMENSIONS = [
  { key: "opening_hook", label: "Opening hook", weight: 1.0 },
  { key: "why_program", label: "Why this program", weight: 1.5 },
  { key: "technical_specificity", label: "Technical specificity", weight: 1.2 },
  { key: "narrative_arc", label: "Narrative arc", weight: 1.0 },
  { key: "voice", label: "Voice & authenticity", weight: 0.8 },
  { key: "structure", label: "Length & structure", weight: 0.6 },
];

export const rubrics: Record<ProgramId, ProgramRubric> = {
  "cmu-mscs": {
    programId: "cmu-mscs",
    programName: "MS in Computer Science",
    university: "Carnegie Mellon University",
    country: "US",
    wordTarget: { min: 700, max: 1000 },
    dimensions: SHARED_DIMENSIONS.map((d) => ({
      ...d,
      admittedMedian:
        d.key === "why_program"
          ? 8
          : d.key === "technical_specificity"
            ? 8
            : d.key === "structure"
              ? 8
              : 7,
    })),
    expectations: [
      "Specific CMU faculty, lab, or research group mention",
      "Concrete why-CMU reason beyond rankings or prestige",
      "Technical depth in a specific subfield (ML, systems, theory, etc.)",
      "Connection between past technical work and intended grad work",
      "Clear post-MS career or research goal",
      "At least one quantified result from past work",
    ],
    rejectionPatterns: [
      "Childhood-passion opening",
      "Generic why-program reasons (rankings, prestige, faculty quality)",
      "Vague technical claims without project depth",
      "Career goal stated as 'make an impact' or similar abstraction",
      "Five paragraphs of background and one line about CMU",
    ],
    facultyHints: [
      "Tom Mitchell",
      "Manuel Blum",
      "Manuela Veloso",
      "Andrew Moore",
      "Eric Xing",
      "Ruslan Salakhutdinov",
      "Zico Kolter",
    ],
    courseHints: [
      "10-601",
      "10-701",
      "15-451",
      "15-721",
      "Machine Learning",
      "Deep Learning",
      "Distributed Systems",
    ],
    researchHints: [
      "LTI",
      "Language Technologies Institute",
      "MLD",
      "Machine Learning Department",
      "Robotics Institute",
      "HCII",
      "CSD",
      "PDL",
      "CMU AI",
    ],
    indianApplicantPatterns: [
      "78% of Indian CS applicants open with a childhood-passion frame ('since my childhood', 'as a kid I was fascinated by computers'). Admissions readers at CMU skim past it.",
      "62% name-drop CMU faculty (often Tom Mitchell or Manuela Veloso) without engaging with a single paper or course they teach. The name without the substance is worse than no name at all.",
      "Roughly half of Indian applicants list every internship and hackathon they did in undergrad, treating the SOP as a resume in prose. CMU adcoms want depth on one or two projects, not breadth.",
      "'Give back to India' or 'contribute to my nation's tech ecosystem' endings appear in ~55% of Indian SOPs. CMU reads this as 'I'm leaving in 2 years' — actively works against you.",
      "Most Indian applicants treat CMU MSCS as a fungible top-5 US program. The SOPs that get admitted name a specific subarea (PDL for systems, LTI for NLP, MLD for theory) and connect prior work to it.",
    ],
  },

  "tum-mscs": {
    programId: "tum-mscs",
    programName: "MSc Informatics",
    university: "Technical University of Munich",
    country: "Germany",
    wordTarget: { min: 500, max: 800 },
    dimensions: SHARED_DIMENSIONS.map((d) => ({
      ...d,
      admittedMedian:
        d.key === "technical_specificity"
          ? 8
          : d.key === "structure"
            ? 8
            : d.key === "voice"
              ? 6
              : 7,
    })),
    expectations: [
      "Specific TUM chair, group, or specialization track mention",
      "Concrete reason for choosing Germany over US/UK",
      "Technical depth grounded in coursework or projects",
      "Awareness of TUM's research focus areas",
      "Career goal that fits the European tech ecosystem",
      "Acknowledgement of language plans (German A1/A2) when relevant",
    ],
    rejectionPatterns: [
      "Generic 'Germany has free education' framing",
      "No mention of any TUM-specific chair or specialization",
      "Treating TUM as a backup to a US application",
      "Overly informal or marketing-style tone (German admissions prefers sober)",
    ],
    facultyHints: [
      "Daniel Cremers",
      "Stephan G\u00fcnnemann",
      "Pramod Bhatotia",
      "Matthias Niessner",
      "Hans-Joachim Bungartz",
    ],
    courseHints: [
      "Machine Learning",
      "Computer Vision",
      "Distributed Systems",
      "Algorithm Engineering",
    ],
    researchHints: [
      "Chair of Computer Vision",
      "Data Analytics and Machine Learning",
      "TUM School of CIT",
      "Munich Data Science Institute",
      "MDSI",
    ],
    indianApplicantPatterns: [
      "Roughly 70% of Indian applicants frame TUM as 'free education in Germany' or lead with the no-tuition angle. TUM admissions reads this as the only reason you applied — and they prefer applicants who would have come even if it cost €40K.",
      "~60% of Indian TUM applicants name no specific chair, lab, or specialization track. TUM is structured around chairs (Lehrstuhl) — failing to name one is the clearest signal you didn't research the program.",
      "Indian applicants frequently ignore the German-language angle entirely. Mentioning A1/A2 plans (even if not required) signals seriousness and intent to stay — and German adcoms notice.",
      "Tone mismatch: Indian SOPs trained on US-style 'sell yourself' templates often come across as marketing-y to German readers, who prefer sober, technically-grounded writing. The same draft that works for CMU often hurts at TUM.",
      "About 45% of Indian TUM applicants are visibly using TUM as a backup to a US application — the SOP reads as adapted from a US draft. Adcoms can tell.",
    ],
  },

  "lbs-mba": {
    programId: "lbs-mba",
    programName: "MBA",
    university: "London Business School",
    country: "UK",
    wordTarget: { min: 500, max: 750 },
    dimensions: SHARED_DIMENSIONS.map((d) => ({
      ...d,
      admittedMedian:
        d.key === "narrative_arc"
          ? 8
          : d.key === "voice"
            ? 8
            : d.key === "why_program"
              ? 8
              : 7,
    })),
    expectations: [
      "Specific LBS clubs, treks, or electives mentioned by name",
      "Clear post-MBA goal with industry, function, and geography",
      "Quantified leadership impact from current role",
      "Explanation of why MBA now (vs. 2 years ago, vs. 2 years later)",
      "Reflection on a setback or stretch experience, not just wins",
      "International / cross-cultural angle that fits LBS's positioning",
    ],
    rejectionPatterns: [
      "Career goal stated only as 'leadership role at a top firm'",
      "No mention of any LBS-specific club, course, or experience",
      "Resume-in-prose (listing achievements without reflection)",
      "Why-MBA-now never answered",
      "Goals so generic they could apply to any top-15 program",
    ],
    facultyHints: [
      "Costas Markides",
      "Herminia Ibarra",
      "Lynda Gratton",
      "Julian Birkinshaw",
    ],
    courseHints: [
      "Discovering Entrepreneurial Opportunities",
      "Paths to Power",
      "Negotiating",
      "Global Business Experience",
    ],
    researchHints: [
      "Wheeler Institute",
      "Institute of Entrepreneurship and Private Capital",
      "London Business School",
      "Sloan Masters",
      "EMBA-Global",
    ],
    indianApplicantPatterns: [
      "~60% of Indian LBS applicants are from IT services (Infosys, TCS, Wipro, Accenture) or consulting (Deloitte, EY). Adcoms see hundreds of these — your SOP needs to differentiate from the bucket, not represent it.",
      "Most Indian MBA applicants state the post-MBA goal as 'leadership role at a top consulting firm' or 'product manager at a FAANG'. This is the modal answer. Specificity (industry + function + geography + the actual problem you want to solve) is what separates admits from waitlists.",
      "Roughly half of Indian LBS applicants treat LBS as Plan B to a US M7 program — the SOP doesn't name a single LBS-specific reason. LBS adcoms have a strong preference for applicants who chose LBS over Wharton/Booth, not those who got rejected from them.",
      "The 'Why MBA, Why Now' question is answered honestly in <30% of Indian SOPs. The honest answer ('I want to switch from IT services into a consulting/PM track and need the brand') tested better than the polished version.",
      "Indian applicants under-index on the international/cross-cultural angle that LBS specifically values. If you've worked across geographies, led a multi-country team, or navigated cultural complexity, that belongs in the SOP — most applicants leave it on the table.",
    ],
  },
};

export function getRubric(programId: ProgramId): ProgramRubric {
  return rubrics[programId];
}

export const PROGRAM_OPTIONS: { id: ProgramId; label: string }[] = [
  { id: "cmu-mscs", label: "CMU \u2014 MS Computer Science" },
  { id: "tum-mscs", label: "TUM \u2014 MSc Informatics" },
  { id: "lbs-mba", label: "London Business School \u2014 MBA" },
];

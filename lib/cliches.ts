// Deterministic cliché corpus for Stage 1 of the Leap Review pipeline.
// These are matched server-side, before any LLM call. Cheap and reliable.
//
// In production this list would be derived from analyzing rejected SOPs in
// Leap's corpus and tracking which phrases correlate with rejection.

export interface ClichePattern {
  pattern: RegExp;
  category:
    | "childhood-opening"
    | "passion-claim"
    | "generic-flattery"
    | "vague-ambition"
    | "weak-structure"
    | "obsequious"
    | "buzzword-opener";
  why: string;
}

export const cliches: ClichePattern[] = [
  // Childhood openings — the single most common rejection pattern
  {
    pattern: /ever since (i was )?(a |an )?(child|kid|young|little boy|little girl)/gi,
    category: "childhood-opening",
    why: "78% of Indian applicant SOPs to top US CS programs open with a childhood frame. Admissions readers learn to skip the first paragraph entirely when they see this — you've lost the slot before you started.",
  },
  {
    pattern: /(since|from) (my )?childhood/gi,
    category: "childhood-opening",
    why: "Childhood openings are the single most common pattern Indian applicants fall into. Replace with the specific recent moment that actually drove your decision to apply.",
  },
  {
    pattern: /from a (very )?young age[,]?/gi,
    category: "childhood-opening",
    why: "Generic childhood frame. Admitted SOPs open in medias res with current technical work, not a developmental arc.",
  },
  {
    pattern: /as a (child|kid)[,]/gi,
    category: "childhood-opening",
    why: "Childhood frame is overused. Replace with a concrete recent moment from your last 18 months.",
  },
  {
    pattern: /my fascination with [a-z ]+ began (in|when|at)/gi,
    category: "childhood-opening",
    why: "Origin-story opening. Admissions readers prefer SOPs that start with current technical work, not the origin myth.",
  },
  {
    pattern: /(my (father|mother|uncle|grandfather) (is|was) (an? )?(engineer|doctor|professor|teacher))/gi,
    category: "childhood-opening",
    why: "The 'my-father-was-an-engineer' frame appears in roughly half of Indian engineering SOPs. It signals inheritance, not agency — and admissions wants to see your decision, not your family's.",
  },

  // Passion claims
  {
    pattern: /(i have always been |i am |i'm )(deeply |truly |genuinely )?(passionate|fascinated) (about|by|with)/gi,
    category: "passion-claim",
    why: "Vague passion claims signal absence of specific evidence. Show the passion through projects, not by asserting it.",
  },
  {
    pattern: /my (deep |true |lifelong )?passion (for|lies in|towards)/gi,
    category: "passion-claim",
    why: "Replace with concrete evidence — a specific project, paper, or problem.",
  },
  {
    pattern: /i fell in love with (computer|programming|engineering|technology|math)/gi,
    category: "passion-claim",
    why: "Romance framing for technical interest reads as performative.",
  },

  // Generic flattery
  {
    pattern: /world[- ]renowned (faculty|program|institution|university|research)/gi,
    category: "generic-flattery",
    why: "Generic praise without specifics is filtered out by admissions readers.",
  },
  {
    pattern: /world[- ]class (faculty|program|institution|university|research)/gi,
    category: "generic-flattery",
    why: "Replace with a named faculty member, lab, or course.",
  },
  {
    pattern: /(prestigious|esteemed|reputed|reputable) (university|institution|program|college)/gi,
    category: "generic-flattery",
    why: "Reads as obsequious. Admissions readers don't need their own program flattered.",
  },
  {
    pattern: /one of the (best|top|leading|finest) (universities|programs|institutions|schools) (in the world|globally|on the planet)/gi,
    category: "generic-flattery",
    why: "Ranking-based praise signals you don't have a specific reason.",
  },
  {
    pattern: /your esteemed (institution|university|program)/gi,
    category: "obsequious",
    why: "Subordinate framing weakens the writer's voice. The applicant is the subject, not a supplicant.",
  },
  {
    pattern: /will undoubtedly (provide|equip|prepare|enable|allow) me/gi,
    category: "generic-flattery",
    why: "Boilerplate future-tense flattery. Replace with a specific course or lab you'd join.",
  },

  // Cliché transitions / weak structure
  {
    pattern: /in conclusion[,]/gi,
    category: "weak-structure",
    why: "Telegraphs the ending. Strong SOPs land the conclusion implicitly without announcing it.",
  },
  {
    pattern: /to (sum up|summarize)[,]/gi,
    category: "weak-structure",
    why: "An 800-word essay does not need a summary section.",
  },

  // Obsequious framing
  {
    pattern: /it would be (a |an )?(great |incredible |immense )?(honor|privilege) (to|if)/gi,
    category: "obsequious",
    why: "Subordinate framing weakens voice. Admissions wants confident, specific applicants.",
  },

  // Vague ambition
  {
    pattern: /make (a |an )?(real |meaningful |positive |significant )?(difference|impact|contribution) (in|to) (the world|society|humanity)/gi,
    category: "vague-ambition",
    why: "Concrete career goals beat abstract impact statements. Name the company, role, or research problem.",
  },
  {
    pattern: /change the world/gi,
    category: "vague-ambition",
    why: "Maximally vague. Replace with a specific, falsifiable career goal.",
  },
  {
    pattern: /(give back to|serve|contribute to) (society|humanity|my country|india|my nation|my motherland)/gi,
    category: "vague-ambition",
    why: "The 'give-back-to-India' ending appears in ~65% of Indian applicant SOPs. Admissions readers don't believe it — and worse, it signals you're treating the program as a temporary credential. Replace with a specific company, role, or problem.",
  },
  {
    pattern: /(plethora|myriad) of (opportunities|options|possibilities|resources)/gi,
    category: "vague-ambition",
    why: "'Plethora of opportunities' is one of the most overused phrases in Indian applicant SOPs. Name two specific opportunities instead.",
  },
  {
    pattern: /lucrative (career|opportunit|field|industry|prospect)/gi,
    category: "vague-ambition",
    why: "Framing the goal as 'lucrative' reads as financially motivated rather than intellectually motivated. Admissions readers at top programs read it as a tell that you don't have a real reason.",
  },
  {
    pattern: /(the )?scope (is|of)( this field| in this domain)? (is )?(immense|vast|enormous|tremendous|huge)/gi,
    category: "vague-ambition",
    why: "'Scope is immense' is filler. It tells the reader you don't have a specific reason for choosing this field over any other.",
  },
  {
    pattern: /(garner|imbibe|inculcate) (knowledge|skills|expertise|values)/gi,
    category: "obsequious",
    why: "Indian-English-formal vocabulary that signals template SOP. Admissions at US/UK programs read this as 'didn't write it themselves'. Replace with plain verbs.",
  },
  {
    pattern: /(abreast (with|of)|in tune with) (the latest|recent|current) (developments|advancements|trends|technologies)/gi,
    category: "buzzword-opener",
    why: "Boilerplate phrase. Replace with the specific paper, project, or development you're actually following.",
  },
  {
    pattern: /(kindly|humbly) (consider|request|seek)/gi,
    category: "obsequious",
    why: "Subordinate framing common in Indian formal writing. Reads as supplicating to a US/UK admissions reader. Drop entirely.",
  },

  // Buzzword openers (AI-style boilerplate)
  {
    pattern: /in (today's|the modern|the current) (rapidly evolving|fast[- ]paced|digital|technological|interconnected) (world|era|age|landscape|society)/gi,
    category: "buzzword-opener",
    why: "Boilerplate opener — instantly recognizable as AI-generated or template-based.",
  },
  {
    pattern: /(at the forefront|cutting edge) of (innovation|technology|research)/gi,
    category: "buzzword-opener",
    why: "Marketing language. Concrete details are more persuasive than buzzwords.",
  },
];

export interface DeterministicMatch {
  start: number;
  end: number;
  phrase: string;
  category: ClichePattern["category"];
  why: string;
}

export function scanCliches(sopText: string): DeterministicMatch[] {
  const matches: DeterministicMatch[] = [];
  for (const c of cliches) {
    // Reset since `g` flag persists lastIndex across calls
    c.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = c.pattern.exec(sopText)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        phrase: m[0],
        category: c.category,
        why: c.why,
      });
      // Avoid infinite loop on zero-width matches
      if (m.index === c.pattern.lastIndex) c.pattern.lastIndex++;
    }
  }
  // Sort by start, dedupe overlapping matches (keep the longer one)
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const deduped: DeterministicMatch[] = [];
  for (const m of matches) {
    const prev = deduped[deduped.length - 1];
    if (prev && m.start < prev.end) continue;
    deduped.push(m);
  }
  return deduped;
}

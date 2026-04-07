// Eval set for Leap Review.
//
// 12 calibrated SOPs across 3 programs × 3 quality bands. Each SOP has
// explicit ground-truth labels: expected band, expected scores per dimension
// (with tolerance), expected flag counts, expected missing-element list.
//
// PROVENANCE — read this carefully:
//   These SOPs are SYNTHETIC. They are deliberately constructed to test
//   specific failure modes of the review pipeline. They are not real student
//   SOPs and they are not labeled by admissions officers. Each SOP is annotated
//   with the calibration intent — what it is supposed to test.
//
//   In production, the eval set would be replaced by real labeled SOPs from
//   Leap's admit/reject corpus, with ground-truth labels derived from actual
//   admissions outcomes. The purpose of *this* set is to give us a reproducible
//   regression test for the pipeline before that data exists.
//
//   The synthesis is calibrated against:
//     - Public admissions guidance from CMU SCS, TUM CIT, and LBS
//     - Common rejection patterns documented in admissions blogs
//     - The rubric definitions in lib/rubrics.ts
//     - The cliché corpus in lib/cliches.ts
//
//   Trust this set for "does the pipeline behave consistently and catch the
//   things we built it to catch." Do NOT trust it for "does this match real
//   admissions outcomes" — that requires real data.

import type { OverallBand, ProgramId } from "@/lib/review-types";

export interface EvalSop {
  id: string;
  programId: ProgramId;
  qualityBand: OverallBand;
  // What this SOP is built to test. Drives the acceptance criteria.
  intent: string;
  source: "synthesized";
  text: string;
  // Per-dimension expected scores (0-10). Pipeline output within ±tolerance counts as a hit.
  expectedScores: {
    opening_hook: number;
    why_program: number;
    technical_specificity: number;
    narrative_arc: number;
    voice: number;
    structure: number;
  };
  scoreTolerance: number; // ± per dimension; default 2
  expectedClicheCount: { min: number; max: number };
  expectedFlagCount: { min: number; max: number };
  // Specific things the pipeline should catch (free-text descriptions, used in
  // the report — not auto-checked, but listed so the human reviewing the eval
  // report can verify quickly).
  criticalIssuesShouldCatch: string[];
  // Things the pipeline should NOT flag (false-positive guard).
  shouldNotFlag: string[];
}

export const evalSops: EvalSop[] = [
  // ── CMU MSCS ──────────────────────────────────────────────

  {
    id: "cmu-strong-1",
    programId: "cmu-mscs",
    qualityBand: "strong",
    intent:
      "Strong-end SOP with named CMU faculty, technical depth, quantified results, and a clean opening. Pipeline should recognize this as strong on every dimension and flag few or no issues.",
    source: "synthesized",
    text: `When our recommendation model at Flipkart started returning the same five categories to every user in Tier-3 cities, the obvious answer was to add more features. I spent three weeks doing exactly that and the metric barely moved. The actual problem, I eventually realized, was that the embedding space had collapsed for users with sparse interaction histories — a failure mode I had read about in a Salakhutdinov paper but had never expected to debug at 11pm on a Thursday.

Solving it taught me more about machine learning than my undergraduate degree did. I implemented a contrastive pretraining step on the user-item graph, which lifted top-5 category diversity by 31% and click-through rate by 4.2% for the cold-start segment. The work shipped in production and now serves about 18 million users.

I want to do my MSCS at Carnegie Mellon because the questions I keep running into at work are the questions the Machine Learning Department was built around. I have followed Zico Kolter's work on robust learning since his 2017 paper on provable defenses, and the practical limitations of the methods we use at Flipkart — fragile to distribution shift, expensive to retrain, hard to audit — are exactly the failure modes his group studies. I would also want to take 10-708 (Probabilistic Graphical Models) because the structured prediction problems I face daily get hand-waved in most online courses.

My undergraduate work at IIT Bombay was in algorithms, not ML, which I think is an asset. I built strong foundations in convex optimization and graph theory through 15-451-style coursework, and I have used both in industry in ways my CS-major peers often have not. My final-year project on approximation algorithms for influence maximization was published at COMSNETS 2024.

After CMU, I want to join an industrial research lab — likely FAIR or Google Research — working on the boundary between large-scale recommender systems and reliable ML. Five years out, I want to lead a team that ships ML systems whose failure modes are understood before deployment, not discovered in production at 11pm on a Thursday.

I am applying to CMU because it is the only program where I can take 10-708, work with Zico Kolter, and have access to a research community that takes both theory and deployment seriously. I do not want to spend two years rederiving things I already know; I want to spend them on the things I currently get wrong.`,
    expectedScores: {
      opening_hook: 8,
      why_program: 9,
      technical_specificity: 9,
      narrative_arc: 8,
      voice: 8,
      structure: 8,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 0, max: 1 },
    expectedFlagCount: { min: 0, max: 3 },
    criticalIssuesShouldCatch: [],
    shouldNotFlag: [
      "The opening sentence (a specific work moment, not a childhood frame)",
      "The Zico Kolter mention (specific faculty, not generic flattery)",
    ],
  },

  {
    id: "cmu-medium-1",
    programId: "cmu-mscs",
    qualityBand: "average",
    intent:
      "Decent technical content but the why-CMU section is generic — no faculty, no courses, just rankings. Pipeline should score technical_specificity decently but flag missing program hooks and ding why_program.",
    source: "synthesized",
    text: `During my time at NIT Trichy, I built a deep learning model for early detection of diabetic retinopathy from fundus images. The model used a ResNet-50 backbone with attention pooling, and achieved 89% sensitivity at 92% specificity on the EyePACS dataset. I wrote the project up as my undergraduate thesis and presented it at our department's research day.

Since graduating, I have been working as an ML engineer at a healthcare analytics startup in Bangalore, where I am responsible for the model serving infrastructure. I have built data pipelines that process about 200k patient records per day and trained classifiers for three different clinical use cases. The work is interesting but I have hit the limits of what I can learn on the job — I want to go deeper into the foundations of machine learning, which is why I am applying for an MSCS.

CMU is one of the top computer science programs in the world, and I believe it would be the perfect place for me to deepen my technical knowledge. The faculty at CMU are world-class and the research output is unmatched. I would benefit enormously from being part of such a strong academic community. The breadth of courses available in machine learning, systems, and theory would let me explore areas beyond my current focus.

After completing my MSCS, I want to return to industry and work on machine learning systems that have real-world impact, particularly in healthcare. I am especially interested in problems where model reliability and fairness matter, since I have seen first-hand how a small accuracy gap can translate into very different outcomes for different patient subgroups.

I believe my combination of healthcare ML experience and strong undergraduate foundations would make me a strong fit for CMU's MSCS program, and I am excited about the opportunity to learn from and contribute to this community.`,
    expectedScores: {
      opening_hook: 6,
      why_program: 3,
      technical_specificity: 7,
      narrative_arc: 6,
      voice: 6,
      structure: 7,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 1, max: 4 },
    expectedFlagCount: { min: 2, max: 6 },
    criticalIssuesShouldCatch: [
      "No CMU faculty mentioned",
      "No specific CMU course mentioned",
      "Why-CMU is generic (rankings, world-class)",
      "'world-class' generic flattery",
    ],
    shouldNotFlag: [
      "The technical depth in the opening paragraph",
    ],
  },

  {
    id: "cmu-medium-2",
    programId: "cmu-mscs",
    qualityBand: "average",
    intent:
      "Tests dimension differentiation: strong opening and voice, but weak technical specificity (lots of hand-waving, no quantified results). Pipeline should differentiate dimensions instead of giving a uniform score.",
    source: "synthesized",
    text: `The first time I felt like a real engineer was the night before our college fest, when our event-registration site went down two hours before launch and I was the only one who knew where the database lived. We were expecting eight thousand sign-ups by morning. I spent the next four hours rewriting the connection pooling logic and watching the queue length on a terminal that I had taped to the wall. By 6am the site was up. By noon we had hit our number.

That night taught me that systems are not the things you draw on whiteboards — they are the things that fail when you stop paying attention. Since then I have been drawn to problems where the failure modes are interesting, which is why I want to study computer science at the graduate level. I think CMU is the right place for me because it takes systems and theory equally seriously, and because the people who work there seem to enjoy the same kinds of problems I do.

I have spent the last two years at a fintech company in Bangalore. I work on the payments team, where I have built a few internal tools and helped redesign one of the older services. The work has been good and I have learned a lot about how production systems actually behave, which is different from how the textbooks describe them. I also took an online course on distributed systems last year and read the Designing Data-Intensive Applications book, which I think is the best technical book I have read since college.

What I want from an MSCS is the chance to slow down and think carefully about things that I currently only get to think about under pressure. I want to take real systems courses, do a research project, and come out with a sharper understanding of how distributed systems are designed and why they fail. I am open to industry or research afterwards — I think both would be good — but what I am sure about is that I want to spend the next two years on this.

I think CMU is where I want to do that.`,
    expectedScores: {
      opening_hook: 8,
      why_program: 5,
      technical_specificity: 4,
      narrative_arc: 7,
      voice: 8,
      structure: 6,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 0, max: 2 },
    expectedFlagCount: { min: 1, max: 5 },
    criticalIssuesShouldCatch: [
      "No quantified results from work experience",
      "Technical claims are vague (built tools, helped redesign)",
      "No CMU faculty or specific course mentioned",
    ],
    shouldNotFlag: [
      "The opening anecdote (specific, vivid)",
      "The voice (genuine, not corporate)",
    ],
  },

  {
    id: "cmu-weak-1",
    programId: "cmu-mscs",
    qualityBand: "weak",
    intent:
      "Worst-case CMU SOP: childhood opening, passion claim, generic flattery, vague career goal, no technical specificity, no faculty mention. Pipeline should catch most clichés and rate below baseline on every dimension.",
    source: "synthesized",
    text: `Ever since I was a child, I have been fascinated by computers. I still remember the day my father brought home our first desktop computer — I would spend hours exploring every corner of it. From that day forward, I knew that computer science was my destiny.

This passion led me to pursue a Bachelor's degree in Computer Science from a reputed engineering college in Hyderabad. During my four years there, I took courses in data structures, algorithms, operating systems, computer networks, and databases. I particularly enjoyed the machine learning course, where I learned about the cutting edge of artificial intelligence. For my final year project, I built a machine learning model that achieved good accuracy on a standard dataset.

In today's rapidly evolving technological world, an advanced degree from a world-renowned institution is essential for anyone who wants to make a real difference in the field. Carnegie Mellon University is one of the top computer science programs in the world, and it would be a great honor to be part of your esteemed institution. The world-class faculty and prestigious program would undoubtedly provide me with the skills and knowledge I need to succeed.

After completing my MSCS at CMU, I want to give back to society by working on technology that changes the world. I am passionate about using artificial intelligence to make a positive impact in areas like healthcare, education, and climate change. In the long run, I hope to inspire the next generation of computer scientists and make a meaningful contribution to humanity.

I am confident that my unwavering passion, strong work ethic, and dedication to computer science will make me a valuable addition to the CMU community. In conclusion, I believe that CMU is the perfect place for me to achieve my dreams.`,
    expectedScores: {
      opening_hook: 2,
      why_program: 2,
      technical_specificity: 3,
      narrative_arc: 3,
      voice: 3,
      structure: 5,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 6, max: 12 },
    expectedFlagCount: { min: 6, max: 14 },
    criticalIssuesShouldCatch: [
      "Childhood-passion opening",
      "Generic flattery (world-renowned, prestigious, esteemed)",
      "Vague ambition (change the world, make a difference)",
      "No CMU faculty / course / lab mentioned",
      "No quantified results",
      "Passion claim ('I have been fascinated by')",
      "'In conclusion' weak structure",
    ],
    shouldNotFlag: [],
  },

  // ── TUM Informatics ──────────────────────────────────────

  {
    id: "tum-strong-1",
    programId: "tum-mscs",
    qualityBand: "strong",
    intent:
      "Strong TUM SOP with specific chair mention (Cremers/Niessner), concrete why-Germany reasoning, language plans, and sober tone. Pipeline should score high on why_program and recognize program-fit.",
    source: "synthesized",
    text: `The computer vision pipeline I built at my last internship struggled with depth ambiguity in low-light scenes. We were trying to get a quadruped robot to navigate warehouse aisles at night, and the off-the-shelf monocular depth models broke down exactly where we needed them most. Fixing it pulled me into the literature on learned multi-view stereo, and that is how I first read Daniel Cremers' work on Direct Sparse Odometry.

I am applying to the MSc Informatics at TUM because the Chair of Computer Vision and Artificial Intelligence is the only place where I could go deep on the kind of geometric deep learning my project required. I have read several papers from Cremers' group and from Matthias Niessner's group on neural scene representations, and I want to take Algorithms for 3D Scene Understanding in my first semester. Beyond the chairs, the Munich Data Science Institute's collaboration with the TUM School of CIT is exactly the cross-disciplinary structure I am looking for — I want to do my Master's thesis on the boundary between robotics and learned 3D representations.

I chose Germany over the US for two practical reasons. First, the European robotics ecosystem — particularly around Munich, with companies like Magazino, Wandelbots, and the BMW Group's autonomous driving lab — is closer to the deployed-systems work I want to do. Second, the German tradition of slow, careful engineering matches how I want to learn. I have started learning German and am currently at A2; I plan to be at B1 by the time the program starts and to take coursework in German where possible.

My undergraduate work at IIIT Hyderabad gave me a strong foundation in linear algebra, optimization, and classical computer vision. I have worked through the Hartley & Zisserman text, implemented bundle adjustment from scratch, and contributed a small patch to OpenCV. I am not coming to TUM to learn the basics — I am coming because the basics are not enough for the problems I want to solve.

After my Master's, I want to stay in Germany and join a robotics or autonomous-systems team that ships hardware. Long term, I want to lead a small team building perception systems that work outside the lab.`,
    expectedScores: {
      opening_hook: 8,
      why_program: 9,
      technical_specificity: 8,
      narrative_arc: 8,
      voice: 7,
      structure: 8,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 0, max: 1 },
    expectedFlagCount: { min: 0, max: 3 },
    criticalIssuesShouldCatch: [],
    shouldNotFlag: [
      "Daniel Cremers reference (correct chair mention)",
      "Germany choice rationale (specific, not generic)",
    ],
  },

  {
    id: "tum-medium-1",
    programId: "tum-mscs",
    qualityBand: "average",
    intent:
      "Treats TUM as a backup to a US application. Decent technical content but the why-Germany section reveals it's a fallback. Pipeline should ding why_program even though technical_specificity is okay.",
    source: "synthesized",
    text: `I am writing to apply for the MSc Informatics program at the Technical University of Munich for the Winter 2026 intake. My academic background and research interests align well with the program, and I am excited about the opportunity to study at a leading European technical university.

I completed my B.Tech in Computer Science from VIT Vellore in 2024 with a CGPA of 8.6/10. During my undergraduate studies, I focused on machine learning and built several projects, including a sentiment analysis tool for Indian regional languages and an image classification model for plant disease detection. My final year project involved building a recommendation system using collaborative filtering, which I deployed as a small web application.

After graduation, I joined Tata Consultancy Services as a Systems Engineer, where I have been working for the past year on a machine learning platform for one of our banking clients. My work primarily involves data preprocessing, model training, and writing inference APIs. I have learned a lot about the realities of deploying ML in production, but I want to go deeper into the theory and methods, which is why I am applying for a Master's degree.

I am interested in TUM because it is one of the top engineering universities in Europe and the MSc Informatics program offers a strong curriculum in machine learning and computer science fundamentals. Germany is also an attractive destination for me because of the affordable education, the strong job market for engineers, and the high quality of life. I am also applying to several universities in the United States, but TUM remains a top choice because of its reputation and the practical structure of the program.

I am currently learning German and plan to reach a basic conversational level before the program begins. I am confident that I will be able to adapt to life in Munich and make the most of my time at TUM. After completing my Master's, I hope to work at a leading tech company in Europe, gaining experience that I can eventually bring back to India.`,
    expectedScores: {
      opening_hook: 4,
      why_program: 4,
      technical_specificity: 6,
      narrative_arc: 5,
      voice: 5,
      structure: 7,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 0, max: 3 },
    expectedFlagCount: { min: 2, max: 6 },
    criticalIssuesShouldCatch: [
      "Treats TUM as backup ('also applying to several universities in the United States')",
      "No specific TUM chair mentioned",
      "Generic 'top engineering universities' flattery",
      "Generic 'affordable education' Germany framing",
    ],
    shouldNotFlag: [
      "Language plan (concrete, even if modest)",
    ],
  },

  {
    id: "tum-medium-2",
    programId: "tum-mscs",
    qualityBand: "average",
    intent:
      "Tone is too marketing-y for German admissions. Specific enough about TUM but reads like a sales pitch. Tests whether pipeline recognizes tone mismatch as a TUM-specific issue.",
    source: "synthesized",
    text: `I am thrilled to apply for the prestigious MSc Informatics program at the world-renowned Technical University of Munich, and I am absolutely confident that this incredible opportunity will transform me into the next generation of innovative computer scientists Europe needs.

My journey into computer science has been nothing short of extraordinary. From building my first website at 14 to leading a team of 6 talented engineers at a fast-growing Bangalore startup, I have consistently pushed the boundaries of what is possible. My passion for technology is matched only by my drive to make a meaningful impact in the world.

At TUM, I am particularly excited to explore the cutting-edge research at the Chair of Data Analytics and Machine Learning under Stephan Günnemann. His work on graph neural networks is genuinely revolutionary, and I believe my background in recommendation systems would allow me to contribute meaningfully to ongoing research. The Munich Data Science Institute represents the absolute pinnacle of interdisciplinary AI research in Europe, and the opportunity to engage with such brilliant minds is truly unparalleled.

My technical foundation is rock solid. I graduated from BITS Pilani with first class with distinction, ranked in the top 5% of my class, and have since built three production ML systems serving over a million users combined. I have published a workshop paper at a leading Indian AI conference and have been invited to speak at two industry meetups. I am fluent in Python, C++, Go, and Rust, and I am currently learning German to immerse myself fully in the TUM experience.

After graduating from this incredible program, I am determined to launch my own AI startup that will revolutionize how Indian businesses use machine learning. With the world-class TUM education behind me, I am confident I can build something truly transformative. I dream of one day returning to TUM as a guest speaker, sharing my journey with the next generation of brilliant students.

Thank you for considering my application. I am eagerly awaiting the chance to be part of the TUM family.`,
    expectedScores: {
      opening_hook: 4,
      why_program: 6,
      technical_specificity: 6,
      narrative_arc: 5,
      voice: 3,
      structure: 6,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 1, max: 4 },
    expectedFlagCount: { min: 3, max: 8 },
    criticalIssuesShouldCatch: [
      "Tone too marketing-y for German admissions ('thrilled', 'absolutely confident', 'truly unparalleled')",
      "Generic 'world-renowned', 'prestigious' flattery",
      "Self-promotional tone instead of sober/technical",
    ],
    shouldNotFlag: [
      "Stephan Günnemann reference (correct chair)",
      "Munich Data Science Institute reference (correct)",
    ],
  },

  {
    id: "tum-weak-1",
    programId: "tum-mscs",
    qualityBand: "weak",
    intent:
      "Weak TUM SOP: childhood opening, generic Germany framing, no chair mentioned, vague goals. Mirrors cmu-weak-1 but for TUM rubric.",
    source: "synthesized",
    text: `From a very young age, I have been deeply passionate about computers and technology. I still remember the first time I wrote a simple program in school — I was completely fascinated by how a few lines of code could make the computer do exactly what I wanted. That feeling has never left me, and it has shaped my entire educational journey.

I completed my Bachelor of Technology in Computer Science from a well-known engineering college in Mumbai, where I consistently ranked among the top students in my batch. My coursework covered all the fundamental areas of computer science: data structures, algorithms, operating systems, computer networks, database management systems, and software engineering. I also took elective courses in machine learning and artificial intelligence, which I found particularly fascinating.

Germany has always been my dream destination for higher studies because of its world-class education system, which is also affordable for international students. The Technical University of Munich is one of the most prestigious universities in Germany and is known for producing world-class engineers and researchers. The MSc Informatics program at TUM is highly regarded globally, and I am sure it will provide me with the skills and knowledge I need to succeed in my career.

After completing my Master's degree, I want to work as a software engineer at a top European tech company and gain valuable industry experience. In the long term, I hope to make a real difference in the world by working on technology that solves important problems and improves people's lives. I am particularly interested in artificial intelligence and machine learning, as I believe these fields have the potential to change the world.

I am confident that my strong academic background, combined with my passion for computer science and my willingness to work hard, will make me a valuable addition to TUM. It would be a great privilege to be part of this esteemed institution.`,
    expectedScores: {
      opening_hook: 2,
      why_program: 2,
      technical_specificity: 3,
      narrative_arc: 3,
      voice: 3,
      structure: 6,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 5, max: 12 },
    expectedFlagCount: { min: 5, max: 12 },
    criticalIssuesShouldCatch: [
      "Childhood-passion opening ('From a very young age')",
      "Generic 'affordable Germany' framing",
      "No specific TUM chair mentioned",
      "Vague ambition ('change the world', 'make a real difference')",
      "Generic flattery ('world-class', 'prestigious', 'esteemed')",
    ],
    shouldNotFlag: [],
  },

  // ── LBS MBA ──────────────────────────────────────────────

  {
    id: "lbs-strong-1",
    programId: "lbs-mba",
    qualityBand: "strong",
    intent:
      "Strong LBS SOP with specific clubs/electives, quantified leadership, why-MBA-now answered, international angle. Pipeline should score high across the board.",
    source: "synthesized",
    text: `When I was promoted to lead the credit-risk analytics team at HDFC Bank in 2024, I inherited a team of seven and a model that was about to be retired by the regulator. I had nine months to rebuild the model, retrain the team on a new methodology, and convince the credit committee that the new approach would not blow up our default rate. We did it. The new model went live in February 2025; the default rate on the affected portfolio dropped 14 basis points and the regulator signed off without conditions.

What I learned over those nine months is that I love building things with people but I am underprepared for the next step. I can run a seven-person analytics team. I cannot run a fifty-person business unit, and that is what I want to be doing in five years. The gap is not technical — it is in how you make decisions when the data runs out, how you sell a strategy to people who will never see your spreadsheets, and how you operate across cultures when the market you're entering looks nothing like the one you grew up in. That is what I am applying to LBS to learn.

I want to do my MBA at LBS specifically for three reasons. First, the elective Paths to Power with Herminia Ibarra is the closest thing I have found to a deliberate curriculum on the political dimension of leadership, which is the dimension I am weakest on. Second, the Wheeler Institute's work on emerging markets directly overlaps with where I want to be in ten years — I have read several of their case studies on Indian banking and financial inclusion. Third, the LBS Tech & Media Club's annual immersion trek and the Africa Club's work in Nigerian fintech are exactly the kind of structured exposure I cannot get from Indian programs.

Why now: I am 28. I have four years of progressively senior experience and I am about to take on a regional role that I believe I can do but will struggle with. An MBA two years from now would be a credential. An MBA now would be a foundation.

After LBS, I want to return to India to lead a vertical at a digital-first lender — Slice, Jupiter, or one of the new neo-banks — building the kind of credit infrastructure that lets first-time borrowers participate in formal finance. Long term, I want to start one. The combination of LBS's London base, its emerging-markets focus, and the kind of cohort it attracts is the only program that maps cleanly onto that path.`,
    expectedScores: {
      opening_hook: 8,
      why_program: 9,
      technical_specificity: 8,
      narrative_arc: 9,
      voice: 8,
      structure: 8,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 0, max: 1 },
    expectedFlagCount: { min: 0, max: 3 },
    criticalIssuesShouldCatch: [],
    shouldNotFlag: [
      "Herminia Ibarra reference (correct LBS faculty)",
      "Wheeler Institute reference (correct LBS center)",
      "Why-now answer (concrete and specific)",
    ],
  },

  {
    id: "lbs-medium-1",
    programId: "lbs-mba",
    qualityBand: "average",
    intent:
      "Good leadership quantification but the post-MBA goal is generic ('leadership role at top consulting firm'). Pipeline should reward what's there but flag missing specificity in goals and LBS reasons.",
    source: "synthesized",
    text: `I currently work as a Senior Associate at Bain & Company in Mumbai, where I have spent the last four years on consulting projects across financial services, retail, and healthcare. I have led work streams of up to four people and consistently been rated in the top quartile of my cohort. Most recently, I led the analytics work stream on a large transformation project for an Indian private bank, where our recommendations are projected to save the client around ₹120 crore annually.

Before joining Bain, I completed my undergraduate degree in Economics from St. Stephen's College, Delhi, where I graduated as the top student in my year. I was active in the debating society and represented the college at the World Universities Debating Championship. My undergraduate thesis on financial inclusion in rural India was published in an undergraduate economics journal.

I am applying for an MBA at this stage in my career because I want to transition from project-based consulting to general management. I have learned a lot about how businesses operate from the outside, and I am ready to learn how they operate from the inside. I believe an MBA is the right way to make this transition because it will give me the structured exposure to functional areas that consulting work alone does not.

I am applying to London Business School because of its strong reputation, its diverse international cohort, and its location in one of the world's leading financial centers. The faculty at LBS are world-class, and the curriculum offers the right balance of academic rigor and practical relevance. I am particularly excited about the case-method teaching style and the opportunity to learn from peers with backgrounds different from mine.

After my MBA, I want to take on a leadership role at a top consulting firm or move into a senior strategy role at a large corporation. In the long term, I want to be a CEO of a major Indian company, ideally in financial services, where I can apply the analytical and leadership skills I will have developed over my career.`,
    expectedScores: {
      opening_hook: 6,
      why_program: 4,
      technical_specificity: 7,
      narrative_arc: 6,
      voice: 6,
      structure: 7,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 0, max: 3 },
    expectedFlagCount: { min: 2, max: 6 },
    criticalIssuesShouldCatch: [
      "Generic post-MBA goal ('leadership role at a top consulting firm')",
      "Generic long-term goal ('be a CEO of a major Indian company')",
      "No specific LBS club, elective, or course mentioned",
      "Generic 'world-class' flattery",
    ],
    shouldNotFlag: [
      "₹120 crore quantification",
      "Bain leadership context",
    ],
  },

  {
    id: "lbs-medium-2",
    programId: "lbs-mba",
    qualityBand: "average",
    intent:
      "Resume in prose. Lots of accomplishments listed but no narrative arc or reflection. Pipeline should flag resume-style writing as a known LBS rejection pattern.",
    source: "synthesized",
    text: `I am applying to the MBA program at London Business School for the September 2026 intake. I bring six years of progressive experience in investment banking and private equity, and I am confident that an MBA from LBS will be the right next step in my career.

I started my career at Morgan Stanley in Mumbai in 2019, where I worked in the M&A team for two and a half years. During this time, I worked on twelve transactions worth a combined $4.2 billion, including the sale of a renewable energy platform to a global infrastructure fund and the acquisition of an Indian e-commerce company by a Southeast Asian conglomerate. I was promoted from Analyst to Senior Analyst after eighteen months, ahead of my class average of twenty-four months.

In 2022, I joined ChrysCapital as an Associate, where I have evaluated over forty potential investments across consumer, healthcare, and financial services. I have led the diligence and execution of two completed investments totaling $180 million in equity capital. I currently sit on the board of one portfolio company, an Indian D2C beauty brand, where I have helped the founders restructure their supply chain and recruit a new CMO. I was also part of the team that exited an enterprise software investment at a 4.2x return last year.

Outside of work, I have been an active mentor at a financial-literacy NGO in Mumbai for the past three years, where I have led weekend workshops for students from underserved communities. I have also completed the Level III CFA exam and am in the process of completing the FRM certification.

I am applying to LBS because of its strong finance program, the diversity of its student body, and its global alumni network. The LBS brand is highly recognized in Asia, where I plan to spend the rest of my career, and I believe the connections I will make at LBS will be valuable for the rest of my professional life. After my MBA, I want to return to private equity in Mumbai or Singapore, ideally in a more senior role that involves a higher degree of investment leadership.`,
    expectedScores: {
      opening_hook: 3,
      why_program: 4,
      technical_specificity: 7,
      narrative_arc: 3,
      voice: 4,
      structure: 7,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 0, max: 2 },
    expectedFlagCount: { min: 3, max: 7 },
    criticalIssuesShouldCatch: [
      "Resume-in-prose structure (listing achievements without reflection)",
      "No reflection on a setback or stretch experience",
      "Why-MBA-now never explicitly answered",
      "No specific LBS club or elective mentioned",
      "Generic alumni-network framing",
    ],
    shouldNotFlag: [
      "The $4.2 billion / $180 million quantification",
      "Specific deal context",
    ],
  },

  {
    id: "lbs-weak-1",
    programId: "lbs-mba",
    qualityBand: "weak",
    intent:
      "Worst-case LBS SOP: childhood-passion opening, generic flattery, vague goals, no LBS specifics, obsequious closing. Should hit nearly every cliché category and rate weak across the board.",
    source: "synthesized",
    text: `Ever since I was a child, I have been passionate about business and leadership. I would watch my father run his small textile business in Surat and dream of one day building something of my own. This passion has only grown stronger over the years and has shaped every decision I have made.

After completing my B.Tech from a prestigious institution, I joined Deloitte as a consultant. Over the past four years, I have worked on numerous high-impact projects across various industries including banking, retail, and telecom. I have led teams of up to 8 people and consistently received top ratings in my performance reviews. My work has helped clients save millions of dollars and improve their operational efficiency.

In today's rapidly evolving business landscape, an MBA from a world-renowned institution is essential for anyone looking to make a real impact. London Business School is one of the top business schools in the world and its prestigious program will equip me with the skills and knowledge I need to take the next step in my career. The world-class faculty and global alumni network will undoubtedly provide me with unparalleled opportunities.

My short-term goal is to transition into a leadership role at a top consulting firm or investment bank. In the long term, I want to give back to society by starting my own venture that creates jobs and contributes to India's growth story. I want to change the world and make a meaningful difference.

It would be a great honor to be part of your esteemed institution. I am confident that my diverse experience, strong work ethic, and unwavering passion for business will make me a valuable addition to the LBS community. In conclusion, I believe that LBS is the perfect place for me to achieve my dreams and become the leader I have always aspired to be.`,
    expectedScores: {
      opening_hook: 2,
      why_program: 2,
      technical_specificity: 3,
      narrative_arc: 3,
      voice: 3,
      structure: 5,
    },
    scoreTolerance: 2,
    expectedClicheCount: { min: 7, max: 14 },
    expectedFlagCount: { min: 7, max: 14 },
    criticalIssuesShouldCatch: [
      "Childhood-passion opening ('Ever since I was a child')",
      "Buzzword opener ('In today's rapidly evolving business landscape')",
      "Generic flattery ('world-renowned', 'prestigious', 'world-class', 'esteemed institution')",
      "Vague ambition ('change the world', 'make a meaningful difference', 'give back to society')",
      "'In conclusion' weak structure",
      "Obsequious framing ('It would be a great honor')",
      "No LBS-specific club, elective, or course",
    ],
    shouldNotFlag: [],
  },
];

// Sample SOPs for the demo. One per program, deliberately varied in quality
// so reviewers can see Leap Review produce meaningfully different reports.

import type { ProgramId } from "./review-types";

export interface SampleSop {
  id: string;
  label: string;
  programId: ProgramId;
  qualityHint: "weak" | "mediocre" | "strong";
  text: string;
}

export const sampleSops: SampleSop[] = [
  {
    id: "cmu-strong",
    label: "Strong \u2014 CMU MSCS",
    programId: "cmu-mscs",
    qualityHint: "strong",
    text: `When our recommendation model at Flipkart started returning the same five categories to every user in Tier-3 cities, the obvious answer was to add more features. I spent three weeks doing exactly that and the metric barely moved. The actual problem, I eventually realized, was that the embedding space had collapsed for users with sparse interaction histories \u2014 a failure mode I had read about in a Salakhutdinov paper but had never expected to debug at 11pm on a Thursday.

Solving it taught me more about machine learning than my undergraduate degree did. I ended up implementing a contrastive pretraining step on the user-item graph, which lifted top-5 category diversity by 31% and click-through rate by 4.2% for the cold-start segment. The work shipped in production and is now serving about 18 million users.

I want to do my MSCS at Carnegie Mellon because the questions I keep running into at work are the questions the Machine Learning Department was built around. I have followed Zico Kolter's work on robust learning since his 2017 paper on provable defenses, and the practical limitations of the methods we use at Flipkart \u2014 fragile to distribution shift, expensive to retrain, hard to audit \u2014 are exactly the failure modes his group studies. I would also want to take 10-708 (Probabilistic Graphical Models) because the structured prediction problems I face daily get hand-waved in most online courses and I want to learn them properly.

My undergraduate work at IIT Bombay was in algorithms, not ML, which I think is actually an asset. I built strong foundations in convex optimization and graph theory through 15-451-style coursework, and I have used both in industry in ways my CS-major peers often have not. My final-year project on approximation algorithms for influence maximization was published at COMSNETS 2024.

After CMU, I want to join an industrial research lab \u2014 likely FAIR or Google Research \u2014 working on the boundary between large-scale recommender systems and reliable ML. Five years out, I want to lead a team that ships ML systems whose failure modes are understood before deployment, not discovered in production at 11pm on a Thursday.

I am applying to CMU because it is the only program where I can take 10-708, work with Zico Kolter, and have access to a research community that takes both theory and deployment seriously. I do not want to spend two years rederiving things I already know; I want to spend them on the things I currently get wrong.`,
  },
  {
    id: "tum-mediocre",
    label: "Mediocre \u2014 TUM Informatics",
    programId: "tum-mscs",
    qualityHint: "mediocre",
    text: `From a young age, I have been fascinated by computers and how they work. This fascination led me to pursue a Bachelor's degree in Computer Science from VIT Vellore, where I graduated with a CGPA of 8.7.

During my undergraduate studies, I took courses in data structures, algorithms, operating systems, computer networks, and machine learning. I particularly enjoyed the machine learning course, where I learned about supervised and unsupervised learning techniques. For my final year project, I built a deep learning model to classify medical images, achieving an accuracy of 92%.

I have also completed two internships. The first was at a startup in Bangalore where I worked on a web application using React and Node.js. The second was at TCS where I was part of a team building a data pipeline. Both internships taught me a lot about working in a professional environment and gave me exposure to industry best practices.

I am applying to TUM because it is one of the top universities in Europe and Germany has a strong reputation in engineering. The MSc Informatics program offers a wide range of courses and I am sure it will help me grow as a computer scientist. I am also attracted to Germany because of the affordable education and the strong job market for engineers.

After completing my Master's, I want to work as a software engineer at a top tech company in Germany or eventually start my own company. I am also interested in research and may consider a PhD in the future. I believe that studying at TUM will provide me with the skills and knowledge I need to make a meaningful contribution to the field of computer science.

I am currently learning German and plan to reach B1 level by the time I start the program. I am confident that I will be able to adapt to life in Munich and make the most of this opportunity.`,
  },
  {
    id: "lbs-weak",
    label: "Weak \u2014 LBS MBA",
    programId: "lbs-mba",
    qualityHint: "weak",
    text: `Ever since I was a child, I have been passionate about business and leadership. I would watch my father run his small textile business in Surat and dream of one day building something of my own. This passion has only grown stronger over the years and has shaped every decision I have made.

After completing my B.Tech from a prestigious institution, I joined Deloitte as a consultant. Over the past four years, I have worked on numerous high-impact projects across various industries including banking, retail, and telecom. I have led teams of up to 8 people and consistently received top ratings in my performance reviews. My work has helped clients save millions of dollars and improve their operational efficiency.

In today's rapidly evolving business landscape, an MBA from a world-renowned institution is essential for anyone looking to make a real impact. London Business School is one of the top business schools in the world and its prestigious program will equip me with the skills and knowledge I need to take the next step in my career. The world-class faculty and global alumni network will undoubtedly provide me with unparalleled opportunities.

My short-term goal is to transition into a leadership role at a top consulting firm or investment bank. In the long term, I want to give back to society by starting my own venture that creates jobs and contributes to India's growth story. I want to change the world and make a meaningful difference.

It would be a great honor to be part of your esteemed institution. I am confident that my diverse experience, strong work ethic, and unwavering passion for business will make me a valuable addition to the LBS community. In conclusion, I believe that LBS is the perfect place for me to achieve my dreams and become the leader I have always aspired to be.`,
  },
];

export function getSampleSop(id: string): SampleSop | undefined {
  return sampleSops.find((s) => s.id === id);
}

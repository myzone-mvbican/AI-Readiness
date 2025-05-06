export interface SurveyQuestion {
  id: number;
  category: string;
  summary: string;
  details: string;
  answer?: string; // For storing user's answer
}

export interface SurveySection {
  category: string;
  questions: SurveyQuestion[];
}

export type SurveyFormData = {
  [key: string]: string; // key is question.id, value is the answer
};

// CSV data converted to survey sections
export const surveyData: SurveySection[] = [
  {
    category: "Strategy & Vision",
    questions: [
      {
        id: 1,
        category: "Strategy & Vision",
        summary: "Our Vision / 3-year picture / 1-year plan explicitly considers an AGI future.",
        details: "A forward-looking vision isn't just a slogan—it sets the mental horizon that informs every budget, hire, and product decision. Explicitly acknowledging the possibility of Artificial General Intelligence forces a small business to think beyond today's tools and imagine scenarios where creative reasoning, not just task automation, is widely available."
      },
      {
        id: 2,
        category: "Strategy & Vision",
        summary: "The company sets at least one corporate AI Rock each quarter, with a measurable outcome.",
        details: "Rocks (in EOS parlance) create focus and accountability. A single, high-impact AI Rock every quarter—e.g., 'Automate invoice coding to recover 15 hours/month'—prevents the common pitfall of spreading effort across too many pilots. The measurable outcome forces clarity on scope, owner, timeline, and success metric."
      },
      {
        id: 3,
        category: "Strategy & Vision",
        summary: "Every team member sets one personal AI Rock each quarter, tailored to role and proficiency.",
        details: "Individual Rocks democratise innovation. A bookkeeper might adopt AI reconciliations, while a marketer experiments with image-generation for ad variants. Tailoring to proficiency levels ensures stretch without overwhelm, and distributed ownership prevents the 'AI is someone else's job' mindset."
      },
      {
        id: 4,
        category: "Strategy & Vision",
        summary: "Our Ideal Customer Profile (ICP) is reviewed annually for AI alignment.",
        details: "Markets move when technology does. Reviewing the ICP with an AI lens asks questions like: 'Will our customers' pain points stay the same once they adopt automation?' or 'Could AI unlock a new sub-segment we're ignoring?'"
      },
      {
        id: 5,
        category: "Strategy & Vision",
        summary: "We benchmark our AI ambitions against competitors at least once a year and are progressing toward real-time insights.",
        details: "Benchmarking transforms gut feel into data: Are we ahead or behind in chatbots, workflow automation, or AI-driven upsell? Annual formal checks give a snapshot, while building toward real-time signals creates an 'early-warning radar'."
      },
      {
        id: 6,
        category: "Strategy & Vision",
        summary: "Specific AI Key Performance Indicators (KPIs) appear on the company Scorecard.",
        details: "If it's not on the Scorecard, it rarely gets managed. AI KPIs could include hours saved, percentage of support tickets handled by bots, or revenue from AI-enhanced upsells. Placing them alongside financial and operational metrics keeps AI accountable to real business value."
      }
    ]
  },
  {
    category: "Culture & Change-Readiness",
    questions: [
      {
        id: 7,
        category: "Culture & Change-Readiness",
        summary: "Staff feel safe proposing automation ideas.",
        details: "Psychological safety determines whether innovation surfaces or stays hidden. In smaller firms every employee is a sensor in the business, spotting repetitive pain points that could be automated—but only if they trust leadership won't equate 'my job can be automated' with redundancy."
      },
      {
        id: 8,
        category: "Culture & Change-Readiness",
        summary: "AI-related wins are celebrated publicly (Slack, all-hands, etc.).",
        details: "Celebration turns isolated success into shared momentum. When an employee demo shows they shaved two hours off payroll processing with an AI template, public praise does three jobs: it rewards the innovator, educates peers, and brands the company as forward-thinking."
      },
      {
        id: 9,
        category: "Culture & Change-Readiness",
        summary: "We follow a simple communication plan for any tech change.",
        details: "Even beneficial tools fail without clear, consistent messaging. A lightweight communication plan answers: What's changing? Why now? What's expected of me? Where do I get help?—delivered via the channels people already watch. Clarity reduces rumor-mill anxiety."
      },
      {
        id: 10,
        category: "Culture & Change-Readiness",
        summary: "Automated feedback loops collect team & customer input.",
        details: "Readiness isn't just policies; it's the listening infrastructure that flags friction before it festers. Automated loops—weekly pulse surveys, NPS triggers, post-support CSAT forms—produce structured data a small team can review in minutes."
      },
      {
        id: 11,
        category: "Culture & Change-Readiness",
        summary: "Core values and the People-Tracker include at least one AI-aligned metric.",
        details: "Aligning culture statements with scorecards closes the 'say–do' gap. If 'Continuous Improvement' is a core value, tracking whether each employee shipped or documented an AI efficiency gain this quarter makes it real."
      }
    ]
  },
  {
    category: "Skills & Literacy",
    questions: [
      {
        id: 12,
        category: "Skills & Literacy",
        summary: "Every team member sets an AI-Educational Rock each quarter, tailored to role and proficiency.",
        details: "Personal Rocks turn abstract 'learn AI' goals into concrete, time-boxed commitments. A junior CSR might master chat-assist prompts, while a senior analyst pilots Python notebooks. Tailoring to current skill prevents overwhelm and ensures relevance."
      },
      {
        id: 13,
        category: "Skills & Literacy",
        summary: "We assess digital/AI literacy for every team member twice a year and tailor follow-up training plans.",
        details: "A baseline test exposes uneven knowledge—maybe marketing knows prompt engineering but ops doesn't grasp data privacy. Semi-annual cadence captures improvement but respects bandwidth. Using simple quizzes or self-rating surveys, results feed individual learning plans."
      },
      {
        id: 14,
        category: "Skills & Literacy",
        summary: "AI literacy is built into new-hire onboarding.",
        details: "First impressions set cultural tone. Embedding a 30-minute AI orientation—tool stack overview, policy primer, best-practice demos—tells newcomers: 'We are an AI-forward company; continuous improvement is part of the job.'"
      },
      {
        id: 15,
        category: "Skills & Literacy",
        summary: "Each department names an AI Champion.",
        details: "Champions are the local heartbeat of innovation—translating global strategy into department-specific experiments. Their duties: gather pain-points, mentor peers, liaise with the central AI advisor, report weekly wins and blockers."
      },
      {
        id: 16,
        category: "Skills & Literacy",
        summary: "A senior AI advisor (in-house or fractional) is available for guidance.",
        details: "Even the best champions hit architectural or ethical questions beyond their expertise. A fractional Chief AI Officer, consultant, or seasoned staffer provides that escalation point—reviewing data strategy, vetting vendors, or drafting policies."
      }
    ]
  },
  {
    category: "Data & Information",
    questions: [
      {
        id: 17,
        category: "Data & Information",
        summary: "A single Data Champion owns company-wide data practices.",
        details: "In small firms data ownership is often 'everyone and no-one,' leading to inconsistent naming, access headaches, and stalled projects. Nominating a Data Champion—typically someone in ops, finance, or IT—creates a clear go-to for questions, approvals, and standards."
      },
      {
        id: 18,
        category: "Data & Information",
        summary: "A one-page data strategy is reviewed each quarter.",
        details: "Lengthy data roadmaps gather dust; a concise one-pager forces clarity on purpose ('Why collect this data?'), priorities (phase-in timelines), and guardrails (privacy, quality). Quarterly review slots naturally into EOS seasonal planning."
      },
      {
        id: 19,
        category: "Data & Information",
        summary: "Key customer and operations data live in one CRM/ERP or shared platform.",
        details: "AI thrives on context. If sales, support, inventory, and billing data sit in separate apps with no common key, small firms face expensive integration later. Consolidating core records delivers an authoritative customer and operations view."
      },
      {
        id: 20,
        category: "Data & Information",
        summary: "A simple data-flow diagram shows how data moves between systems.",
        details: "You can't automate what you can't see. Even a PowerPoint box-and-arrow map illuminates bottlenecks—manual CSV uploads, double entry, unencrypted transfers—that sabotage efficiency or compliance."
      },
      {
        id: 21,
        category: "Data & Information",
        summary: "We enrich first-party data whenever possible.",
        details: "Raw data rarely tells the full story. Augmenting customer records with revenue bands, tech stack, or engagement scores multiplies the predictive power of AI models while improving segmentation and personalisation."
      },
      {
        id: 22,
        category: "Data & Information",
        summary: "Files and records carry consistent metadata/tags for easy search.",
        details: "Tags and naming conventions turn chaotic file shares into a mineable knowledge base. When meeting transcripts, invoices, and design docs follow the same tagging schema, AI retrieval tools can instantly assemble context for chatbots or RAG systems."
      },
      {
        id: 23,
        category: "Data & Information",
        summary: "Our main systems expose APIs or connect via Make / n8n web-hooks.",
        details: "APIs are the on-ramps for automation. If core apps can't push or pull data programmatically, every future AI project hits a wall of manual export-import. Verifying API access during vendor selection saves later migration pain."
      }
    ]
  },
  {
    category: "Technology & Integration",
    questions: [
      {
        id: 24,
        category: "Technology & Integration",
        summary: "Core tools are cloud-based and 'AI-ready' (modern, open APIs).",
        details: "When apps live in the cloud and expose well-documented REST or GraphQL endpoints, a small business gains 'plug-and-play' flexibility. New AI services can bolt on without servers, VPN headaches, or custom middleware."
      },
      {
        id: 25,
        category: "Technology & Integration",
        summary: "An integration platform (Make or n8n) already handles simple hand-offs.",
        details: "Integration platforms act as digital glue, letting non-developers connect apps through drag-and-drop 'recipes.' Having Make or n8n in production proves the company can automate without waiting for scarce coding talent."
      }
    ]
  }
];

// Defined answer options
export const answerOptions = [
  { value: "stronglyDisagree", label: "Strongly Disagree" },
  { value: "disagree", label: "Disagree" },
  { value: "neutral", label: "Neutral" },
  { value: "agree", label: "Agree" },
  { value: "stronglyAgree", label: "Strongly Agree" }
];
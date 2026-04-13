// ─────────────────────────────────────────────────────────────
// L2 Department Assessment — Types & Constants
// ─────────────────────────────────────────────────────────────

/** Departments available for L2 assessment */
export const L2_DEPARTMENTS = [
  'marketing',
  'sales',
  'finance',
  'hr',
  'it',
  'operations',
  'customer_support',
  'legal',
  'product',
  'executive',
  'design',
  'procurement',
] as const;

export type L2Department = (typeof L2_DEPARTMENTS)[number];

export interface DepartmentMeta {
  id: L2Department;
  label: string;
  description: string;
  icon: string; // lucide-react icon name
}

/**
 * A single best practice within a department.
 *
 * Each practice has 5 adoption tiers (0%, 25%, 50%, 75%, 100%)
 * with custom descriptions that explain what each level looks like.
 *
 * `target` is the expected full-adoption percentage. Most are 100,
 * but some may be lower (e.g., 90 for AI-generated social posts
 * where some human-only content is expected).
 *
 * Score for a practice = min(selectedTierValue / target * 100, 100)
 */
export interface Practice {
  id: string;
  department: L2Department;
  category: string;
  title: string;
  description: string;
  target: number;
  tools: string[];
  tiers: [string, string, string, string, string];
  sortOrder: number;
}

/** User's response to a single practice */
export interface PracticeResponse {
  practiceId: string;
  tierValue: 0 | 25 | 50 | 75 | 100;
}

/** Scoring result for L2 */
export interface L2PracticeResult {
  department: L2Department;
  departmentLabel: string;
  overallScore: number;
  categoryScores: {
    category: string;
    score: number;
    practiceCount: number;
  }[];
  practiceScores: {
    practiceId: string;
    title: string;
    category: string;
    tierValue: number;
    target: number;
    score: number;
    tools: string[];
  }[];
  maturityStage: 'Crawl' | 'Walk' | 'Run' | 'Fly';
  gapPractices: string[];
  strengthPractices: string[];
}

// ─────────────────────────────────────────────────────────────
// Tier constants
// ─────────────────────────────────────────────────────────────

export const TIER_VALUES = [0, 25, 50, 75, 100] as const;
export type TierValue = (typeof TIER_VALUES)[number];

export const TIER_LABELS: Record<TierValue, string> = {
  0: '0%',
  25: '25%',
  50: '50%',
  75: '75%',
  100: '100%',
};

export const TIER_COLORS: Record<TierValue, string> = {
  0: 'bg-red-500 hover:bg-red-600 text-white',
  25: 'bg-orange-500 hover:bg-orange-600 text-white',
  50: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  75: 'bg-green-500 hover:bg-green-600 text-white',
  100: 'bg-blue-500 hover:bg-blue-600 text-white',
};

export const TIER_COLORS_SELECTED: Record<TierValue, string> = {
  0: 'bg-red-600 ring-2 ring-red-300 text-white',
  25: 'bg-orange-600 ring-2 ring-orange-300 text-white',
  50: 'bg-yellow-600 ring-2 ring-yellow-300 text-white',
  75: 'bg-green-600 ring-2 ring-green-300 text-white',
  100: 'bg-blue-600 ring-2 ring-blue-300 text-white',
};

export const TIER_COLORS_MUTED: Record<TierValue, string> = {
  0: 'bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/30',
  25: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 hover:bg-orange-500/30',
  50: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/30',
  75: 'bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-500/30',
  100: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30',
};

// ─────────────────────────────────────────────────────────────
// Maturity stage helpers
// ─────────────────────────────────────────────────────────────

export type MaturityStage = 'Crawl' | 'Walk' | 'Run' | 'Fly';

export const MATURITY_THRESHOLDS: { stage: MaturityStage; min: number; label: string; description: string; color: string }[] = [
  { stage: 'Crawl', min: 0, label: 'Crawl', description: 'Just getting started with AI adoption', color: 'text-red-500' },
  { stage: 'Walk', min: 25, label: 'Walk', description: 'Building foundational AI practices', color: 'text-orange-500' },
  { stage: 'Run', min: 50, label: 'Run', description: 'AI is integrated into key workflows', color: 'text-green-500' },
  { stage: 'Fly', min: 75, label: 'Fly', description: 'AI is a strategic advantage across the department', color: 'text-blue-500' },
];

export function getMaturityStage(score: number): MaturityStage {
  if (score < 25) return 'Crawl';
  if (score < 50) return 'Walk';
  if (score < 75) return 'Run';
  return 'Fly';
}

export function getMaturityInfo(stage: MaturityStage) {
  return MATURITY_THRESHOLDS.find((t) => t.stage === stage) ?? MATURITY_THRESHOLDS[0];
}

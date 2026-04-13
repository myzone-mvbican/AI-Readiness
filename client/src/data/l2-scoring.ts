// ─────────────────────────────────────────────────────────────
// L2 Department Assessment — Scoring Logic
// ─────────────────────────────────────────────────────────────

import {
  Practice,
  PracticeResponse,
  L2PracticeResult,
  L2Department,
  getMaturityStage,
} from './l2-types';
import { ALL_PRACTICES, DEPARTMENT_META } from './l2-departments';

/**
 * Return all practices for a given department, sorted by `sortOrder`.
 */
export function getPracticesForDepartment(dept: L2Department): Practice[] {
  return ALL_PRACTICES.filter((p) => p.department === dept).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

/**
 * Return category names in the order they first appear for a department.
 */
export function getCategoriesForDepartment(dept: L2Department): string[] {
  const practices = getPracticesForDepartment(dept);
  const seen = new Set<string>();
  return practices.reduce<string[]>((acc, p) => {
    if (!seen.has(p.category)) {
      seen.add(p.category);
      acc.push(p.category);
    }
    return acc;
  }, []);
}

/**
 * Calculate the full L2 scoring result for a department.
 *
 * Score per practice = min((tierValue / target) * 100, 100)
 * Category score     = average of practice scores in that category
 * Overall score      = average of all practice scores
 */
export function calculateL2PracticeScores(
  dept: L2Department,
  responses: PracticeResponse[],
): L2PracticeResult {
  const practices = getPracticesForDepartment(dept);
  const meta = getDepartmentMeta(dept);
  const responseMap = new Map(responses.map((r) => [r.practiceId, r.tierValue]));

  // -- Per-practice scores ------------------------------------------------
  const practiceScores = practices.map((p) => {
    const tierValue = responseMap.get(p.id) ?? 0;
    const score = Math.min((tierValue / p.target) * 100, 100);
    return {
      practiceId: p.id,
      title: p.title,
      category: p.category,
      tierValue,
      target: p.target,
      score,
      tools: p.tools,
    };
  });

  // -- Category scores ----------------------------------------------------
  const categoryMap = new Map<string, { total: number; count: number }>();
  const orderedCategories = getCategoriesForDepartment(dept);

  for (const ps of practiceScores) {
    const entry = categoryMap.get(ps.category) ?? { total: 0, count: 0 };
    entry.total += ps.score;
    entry.count += 1;
    categoryMap.set(ps.category, entry);
  }

  const categoryScores = orderedCategories.map((cat) => {
    const entry = categoryMap.get(cat)!;
    return {
      category: cat,
      score: entry.count > 0 ? entry.total / entry.count : 0,
      practiceCount: entry.count,
    };
  });

  // -- Overall score ------------------------------------------------------
  const overallScore =
    practiceScores.length > 0
      ? practiceScores.reduce((sum, ps) => sum + ps.score, 0) / practiceScores.length
      : 0;

  // -- Maturity stage -----------------------------------------------------
  const maturityStage = getMaturityStage(overallScore);

  // -- Gaps (bottom 5) & strengths (top 5) --------------------------------
  const sorted = [...practiceScores].sort((a, b) => a.score - b.score);
  const gapPractices = sorted.slice(0, 5).map((ps) => ps.practiceId);
  const strengthPractices = sorted
    .slice()
    .reverse()
    .slice(0, 5)
    .map((ps) => ps.practiceId);

  return {
    department: dept,
    departmentLabel: meta?.label ?? dept,
    overallScore,
    categoryScores,
    practiceScores,
    maturityStage,
    gapPractices,
    strengthPractices,
  };
}

/**
 * Look up department metadata by id.
 */
export function getDepartmentMeta(dept: L2Department) {
  return DEPARTMENT_META.find((d) => d.id === dept);
}

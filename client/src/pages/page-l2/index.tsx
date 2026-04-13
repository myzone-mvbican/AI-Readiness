import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  Handshake,
  Calculator,
  Users,
  Code,
  Settings,
  Headphones,
  Shield,
  Box,
  Crown,
  Palette,
  Truck,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  RotateCcw,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  L2Department,
  PracticeResponse,
  TierValue,
  TIER_VALUES,
  TIER_LABELS,
  TIER_COLORS,
  TIER_COLORS_SELECTED,
  TIER_COLORS_MUTED,
  L2PracticeResult,
  getMaturityStage,
  getMaturityInfo,
  MATURITY_THRESHOLDS,
} from '@/data/l2-types';
import { DEPARTMENT_META } from '@/data/l2-departments';
import {
  getPracticesForDepartment,
  getCategoriesForDepartment,
  calculateL2PracticeScores,
  getDepartmentMeta,
} from '@/data/l2-scoring';

// ── Icon map ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Megaphone,
  Handshake,
  Calculator,
  Users,
  Code,
  Settings,
  Headphones,
  Shield,
  Box,
  Crown,
  Palette,
  Truck,
};

function DeptIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

// ── Types ───────────────────────────────────────────────────────────────

type View = 'intro' | 'select' | 'assess' | 'results';

const STORAGE_KEY = 'l2-assessment-draft';

interface DraftState {
  department: L2Department;
  responses: PracticeResponse[];
  currentIndex: number;
}

// ── Score Ring ──────────────────────────────────────────────────────────

function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const stage = getMaturityStage(score);
  const info = getMaturityInfo(stage);

  const strokeColor =
    stage === 'Fly'
      ? 'text-blue-500'
      : stage === 'Run'
        ? 'text-green-500'
        : stage === 'Walk'
          ? 'text-orange-500'
          : 'text-red-500';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={strokeColor}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${strokeColor}`}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">out of 100</span>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function getBarColor(score: number): string {
  if (score >= 75) return 'bg-blue-500';
  if (score >= 50) return 'bg-green-500';
  if (score >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-blue-600 dark:text-blue-400';
  if (score >= 50) return 'text-green-600 dark:text-green-400';
  if (score >= 25) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

// ── Main Component ──────────────────────────────────────────────────────

export default function PageL2() {
  const [view, setView] = useState<View>('intro');
  const [selectedDept, setSelectedDept] = useState<L2Department | null>(null);
  const [responses, setResponses] = useState<PracticeResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<L2PracticeResult | null>(null);

  // ── Practices for current department ──────────────────────────────

  const practices = useMemo(
    () => (selectedDept ? getPracticesForDepartment(selectedDept) : []),
    [selectedDept],
  );

  const categories = useMemo(
    () => (selectedDept ? getCategoriesForDepartment(selectedDept) : []),
    [selectedDept],
  );

  const currentPractice = practices[currentIndex] ?? null;
  const totalPractices = practices.length;

  // Current response for the active practice
  const currentResponse = useMemo(
    () =>
      currentPractice
        ? responses.find((r) => r.practiceId === currentPractice.id)
        : undefined,
    [responses, currentPractice],
  );

  // ── Draft persistence (sessionStorage) ────────────────────────────

  const saveDraft = useCallback(
    (dept: L2Department, resps: PracticeResponse[], idx: number) => {
      try {
        const draft: DraftState = { department: dept, responses: resps, currentIndex: idx };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        /* silently ignore storage errors */
      }
    },
    [],
  );

  const loadDraft = useCallback((): DraftState | null => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as DraftState;
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-save on every response / index change during assessment
  useEffect(() => {
    if (view === 'assess' && selectedDept) {
      saveDraft(selectedDept, responses, currentIndex);
    }
  }, [view, selectedDept, responses, currentIndex, saveDraft]);

  // ── Restore draft on mount ────────────────────────────────────────

  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.department && draft.responses.length > 0) {
      setSelectedDept(draft.department);
      setResponses(draft.responses);
      setCurrentIndex(draft.currentIndex);
      setView('assess');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSelectDept = (dept: L2Department) => {
    setSelectedDept(dept);
    setResponses([]);
    setCurrentIndex(0);
    setResult(null);
    clearDraft();
    setView('assess');
  };

  const handleTierSelect = (tierValue: TierValue) => {
    if (!currentPractice) return;
    setResponses((prev) => {
      const filtered = prev.filter((r) => r.practiceId !== currentPractice.id);
      return [...filtered, { practiceId: currentPractice.id, tierValue }];
    });
  };

  const handleNext = () => {
    if (currentIndex < totalPractices - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Finished -- calculate results
      finishAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSkip = () => {
    // Move forward without recording a response (leave as unanswered / 0)
    if (currentIndex < totalPractices - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = () => {
    if (!selectedDept) return;
    const scored = calculateL2PracticeScores(selectedDept, responses);
    setResult(scored);
    clearDraft();
    setView('results');
  };

  const handleTryAnother = () => {
    setSelectedDept(null);
    setResponses([]);
    setCurrentIndex(0);
    setResult(null);
    clearDraft();
    setView('select');
  };

  // ── VIEW: Intro ───────────────────────────────────────────────────

  if (view === 'intro') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">
          {/* Hero icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Target className="w-8 h-8 text-primary" />
          </div>

          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-2">
            Layer 2 -- Department Assessment
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Department AI Readiness Assessment
          </h1>

          <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
            Evaluate your department's AI adoption across dozens of concrete
            practices. Select a department, rate each practice on a 5-tier
            maturity scale, and get an instant scorecard with actionable
            insights.
          </p>

          {/* Key highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5">
              <Box className="w-4 h-4" />
              12 Departments
            </span>
            <span className="w-px h-4 bg-border" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Practice-Level Scoring
            </span>
            <span className="w-px h-4 bg-border" />
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Maturity Stages
            </span>
          </div>

          {/* Maturity stages preview */}
          <Card className="mb-8 text-left">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Maturity stages
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {MATURITY_THRESHOLDS.map((t) => (
                  <div key={t.stage} className="flex items-start gap-2">
                    <span className={`text-sm font-bold ${t.color}`}>
                      {t.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button size="lg" onClick={() => setView('select')}>
            Get Started
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── VIEW: Select Department ───────────────────────────────────────

  if (view === 'select') {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Choose a Department
            </h2>
            <p className="text-muted-foreground">
              Select the department you want to assess for AI readiness.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DEPARTMENT_META.map((dept) => (
              <Card
                key={dept.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => handleSelectDept(dept.id)}
              >
                <CardContent className="flex flex-col items-center text-center pt-6 pb-5 px-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <DeptIcon name={dept.icon} className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {dept.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {dept.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="ghost" onClick={() => setView('intro')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: Assess ──────────────────────────────────────────────────

  if (view === 'assess' && currentPractice && selectedDept) {
    const progressPercent =
      totalPractices > 0 ? ((currentIndex + 1) / totalPractices) * 100 : 0;
    const deptMeta = getDepartmentMeta(selectedDept);
    const answeredCount = responses.length;
    const isLastPractice = currentIndex === totalPractices - 1;

    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header with department name */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {deptMeta && (
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DeptIcon name={deptMeta.icon} className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {deptMeta?.label ?? selectedDept}
                </p>
                <p className="text-xs text-muted-foreground">
                  Practice {currentIndex + 1} of {totalPractices}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {answeredCount} answered
            </Badge>
          </div>

          {/* Progress bar */}
          <Progress value={progressPercent} className="h-2 mb-8" />

          {/* Category heading */}
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            {currentPractice.category}
          </p>

          {/* Practice card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{currentPractice.title}</CardTitle>
              <CardDescription className="leading-relaxed">
                {currentPractice.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Tier buttons */}
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Select your current adoption level:
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {TIER_VALUES.map((tv) => {
                  const isSelected = currentResponse?.tierValue === tv;
                  const colorClass = isSelected
                    ? TIER_COLORS_SELECTED[tv]
                    : TIER_COLORS_MUTED[tv];

                  return (
                    <button
                      key={tv}
                      type="button"
                      onClick={() => handleTierSelect(tv)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${colorClass}
                        ${isSelected ? 'scale-105 shadow-md' : 'hover:scale-[1.02]'}
                      `}
                    >
                      {TIER_LABELS[tv]}
                    </button>
                  );
                })}
              </div>

              {/* Selected tier description */}
              {currentResponse != null && (
                <div className="rounded-lg border bg-muted/50 p-3 text-sm text-foreground leading-relaxed">
                  <span className="font-medium">
                    {TIER_LABELS[currentResponse.tierValue]}:
                  </span>{' '}
                  {currentPractice.tiers[
                    TIER_VALUES.indexOf(currentResponse.tierValue)
                  ]}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All tier descriptions (collapsed reference) */}
          <details className="mb-6 text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              View all tier descriptions
            </summary>
            <div className="mt-3 space-y-2">
              {TIER_VALUES.map((tv, idx) => (
                <div
                  key={tv}
                  className="flex gap-2 rounded-lg border p-2.5 bg-card"
                >
                  <Badge
                    className={`flex-shrink-0 text-xs ${TIER_COLORS[tv]}`}
                  >
                    {TIER_LABELS[tv]}
                  </Badge>
                  <span className="text-muted-foreground">
                    {currentPractice.tiers[idx]}
                  </span>
                </div>
              ))}
            </div>
          </details>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={handleSkip}
            >
              Skip
            </Button>

            <Button onClick={handleNext}>
              {isLastPractice ? 'Finish' : 'Next'}
              {!isLastPractice && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: Results ─────────────────────────────────────────────────

  if (view === 'results' && result) {
    const maturityInfo = getMaturityInfo(result.maturityStage);

    // Resolve gap & strength practice details
    const gapDetails = result.gapPractices
      .map((id) => result.practiceScores.find((ps) => ps.practiceId === id))
      .filter(Boolean);
    const strengthDetails = result.strengthPractices
      .map((id) => result.practiceScores.find((ps) => ps.practiceId === id))
      .filter(Boolean);

    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Assessment Complete
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Here are the AI readiness results for{' '}
              <span className="font-medium text-foreground">
                {result.departmentLabel}
              </span>
              .
            </p>
          </div>

          {/* Score ring + maturity */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10">
            <ScoreRing score={result.overallScore} />
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground mb-1">
                Maturity Stage
              </p>
              <Badge
                className={`text-lg px-4 py-1.5 border-0 ${maturityInfo.color} bg-opacity-20`}
              >
                {maturityInfo.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                {maturityInfo.description}
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Category Breakdown
              </CardTitle>
              <CardDescription>
                Average scores across {result.categoryScores.length} categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.categoryScores.map((cs) => (
                <div key={cs.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {cs.category}
                    </span>
                    <span
                      className={`text-sm font-bold ${getScoreColor(cs.score)}`}
                    >
                      {Math.round(cs.score)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(cs.score)}`}
                      style={{ width: `${cs.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cs.practiceCount} practice{cs.practiceCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gaps & Strengths */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Top 5 Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Top 5 Gaps
                </CardTitle>
                <CardDescription>
                  Practices with the lowest scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {gapDetails.map((ps) =>
                    ps ? (
                      <li
                        key={ps.practiceId}
                        className="flex items-start gap-2 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">
                            {ps.title}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            — {Math.round(ps.score)}%
                          </span>
                          {ps.tools.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Tools: {ps.tools.join(', ')}
                            </p>
                          )}
                        </div>
                      </li>
                    ) : null,
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Top 5 Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Top 5 Strengths
                </CardTitle>
                <CardDescription>
                  Practices with the highest scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {strengthDetails.map((ps) =>
                    ps ? (
                      <li
                        key={ps.practiceId}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">
                            {ps.title}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            — {Math.round(ps.score)}%
                          </span>
                        </div>
                      </li>
                    ) : null,
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Try another department */}
          <div className="text-center">
            <Button variant="outline" size="lg" onClick={handleTryAnother}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Department
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should not reach here)
  return null;
}

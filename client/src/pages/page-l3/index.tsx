import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Clock,
  Brain,
  Send,
  Bot,
  User,
  CheckCircle2,
  Trophy,
  Target,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Loader2,
  Mic,
  MicOff,
  Star,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────

const API_BASE = "https://myzone-mike-readiness-l3.crhq.ai";

const DEPARTMENTS = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "customer_success", label: "Customer Success" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "legal", label: "Legal" },
  { value: "executive", label: "Executive" },
  { value: "data", label: "Data & Analytics" },
  { value: "it", label: "IT" },
  { value: "other", label: "Other" },
] as const;

const ROLE_LEVELS = [
  { value: "individual", label: "Individual Contributor" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c-suite", label: "C-Suite" },
] as const;

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Media",
  "Government",
  "Non-profit",
  "Professional Services",
  "Other",
] as const;

const SECTIONS = [
  { id: 1, title: "Getting to Know You", dimension: "context" },
  { id: 2, title: "Prompt Mastery", dimension: "promptMastery" },
  { id: 3, title: "Technical Understanding", dimension: "technicalUnderstanding" },
  { id: 4, title: "Critical Evaluation", dimension: "criticalEvaluation" },
  { id: 5, title: "Workflow Design", dimension: "workflowDesign" },
  { id: 6, title: "Advanced Techniques", dimension: "advancedTechniques" },
] as const;

const DIMENSION_LABELS: Record<string, string> = {
  context: "Getting to Know You",
  promptMastery: "Prompt Mastery",
  technicalUnderstanding: "Technical Understanding",
  criticalEvaluation: "Critical Evaluation",
  workflowDesign: "Workflow Design",
  advancedTechniques: "Advanced Techniques",
};

// ── Types ────────────────────────────────────────────────────────────

type Phase = "intake" | "chat" | "complete";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SectionResult {
  section: number;
  title: string;
  score: number;
  summary: string;
  keyInsights?: string;
  strengths?: string[];
  areasForDevelopment?: string[];
}

interface AssessmentResult {
  overallScore: number;
  sections: SectionResult[];
  overallSummary: string;
  topStrengths: string[];
  topAreasForDevelopment: string[];
  learningRecommendations: string[];
  // Mapped aliases for flexibility
  dimensions?: SectionResult[];
  maturityStage?: string;
  strengths?: string[];
  areasForImprovement?: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function cleanContent(content: string): string {
  return content
    .replace(/---SECTION_COMPLETE---[\s\S]*?---END_SECTION---/g, "")
    .replace(/---ASSESSMENT_COMPLETE---[\s\S]*?---END_ASSESSMENT---/g, "")
    .trim();
}

function getMaturityStage(score: number): { label: string; color: string } {
  if (score >= 8.5) return { label: "Fly", color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30" };
  if (score >= 6.5) return { label: "Run", color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" };
  if (score >= 4) return { label: "Walk", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" };
  return { label: "Crawl", color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30" };
}

function getScoreColor(score: number): string {
  if (score >= 8) return "text-purple-600 dark:text-purple-400";
  if (score >= 6) return "text-green-600 dark:text-green-400";
  if (score >= 4) return "text-blue-600 dark:text-blue-400";
  return "text-amber-600 dark:text-amber-400";
}

function getBarColor(score: number): string {
  if (score >= 8) return "bg-purple-500";
  if (score >= 6) return "bg-green-500";
  if (score >= 4) return "bg-blue-500";
  return "bg-amber-500";
}

// ── Score Ring Component ─────────────────────────────────────────────

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const maturity = getMaturityStage(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
          className={getScoreColor(score)}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">out of 10</span>
      </div>
    </div>
  );
}

// ── Confetti Overlay ─────────────────────────────────────────────────

function ConfettiOverlay() {
  const pieces = Array.from({ length: 40 });
  const colors = ["#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#06b6d4"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        const rotation = Math.random() * 360;

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: "-20px",
              width: `${size}px`,
              height: `${size * 0.6}px`,
              backgroundColor: color,
              borderRadius: "2px",
              transform: `rotate(${rotation}deg)`,
              animation: `l3-confetti-fall ${duration}s ease-in ${delay}s forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes l3-confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function PageL3() {
  const [phase, setPhase] = useState<Phase>("intake");

  // Intake state
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [roleLevel, setRoleLevel] = useState("");
  const [industry, setIndustry] = useState("");
  const [formError, setFormError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  // Chat state
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [currentSection, setCurrentSection] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Complete state
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // ── Auto-resize textarea ─────────────────────────────────────────

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  // ── Parse markers from streamed text ─────────────────────────────

  const parseStreamMarkers = useCallback(
    (fullText: string) => {
      // Parse section markers
      const sectionRegex = /---SECTION_COMPLETE---([\s\S]*?)---END_SECTION---/g;
      let match;
      const newResults: SectionResult[] = [];
      while ((match = sectionRegex.exec(fullText)) !== null) {
        try {
          newResults.push(JSON.parse(match[1].trim()) as SectionResult);
        } catch {
          /* skip malformed */
        }
      }
      if (newResults.length > 0) {
        setSectionResults((prev) => {
          const existing = new Set(prev.map((r) => r.section));
          const merged = [...prev];
          for (const r of newResults) {
            if (!existing.has(r.section)) {
              merged.push(r);
              setCurrentSection(r.section + 1);
            }
          }
          return merged;
        });
      }

      // Parse final assessment
      const finalMatch = fullText.match(
        /---ASSESSMENT_COMPLETE---([\s\S]*?)---END_ASSESSMENT---/
      );
      if (finalMatch) {
        try {
          const finalData = JSON.parse(finalMatch[1].trim()) as AssessmentResult;
          setResult(finalData);
          setPhase("complete");
          setShowConfetti(true);
        } catch {
          /* skip malformed */
        }
      }
    },
    []
  );

  // ── Start assessment ─────────────────────────────────────────────

  const handleStart = async () => {
    if (!name.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (!department) {
      setFormError("Please select your department.");
      return;
    }
    if (!roleLevel) {
      setFormError("Please select your role level.");
      return;
    }

    setFormError("");
    setIsStarting(true);

    try {
      const res = await fetch(`${API_BASE}/api/assess/l3/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          department,
          roleLevel,
          industry: industry || undefined,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      // The API returns { assessmentId, initialMessage }
      const sid = data.assessmentId || data.sessionId;
      const opening = data.initialMessage || data.message;

      setSessionId(sid);
      setMessages([{ role: "assistant", content: opening }]);
      setCurrentSection(1);
      setSectionResults([]);
      setPhase("chat");
    } catch (err: any) {
      console.error("Start error:", err);
      setFormError(err.message || "Failed to start assessment. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // ── Send message (SSE streaming) ─────────────────────────────────

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch(`${API_BASE}/api/assess/l3/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: sessionId, message: text }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream available");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split("\n\n");
        // Keep the last incomplete part in the buffer
        buffer = parts.pop() || "";

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "chunk" && parsed.content) {
                accumulated += parsed.content;
                setStreamingContent(accumulated);
              } else if (parsed.type === "section_complete" && parsed.section) {
                setSectionResults((prev) => {
                  const existing = new Set(prev.map((r) => r.section));
                  if (existing.has(parsed.section.section)) return prev;
                  setCurrentSection(parsed.section.section + 1);
                  return [...prev, parsed.section];
                });
              } else if (parsed.type === "assessment_complete" && parsed.result) {
                setResult(parsed.result);
                // Don't switch phase yet -- let the message finish
              } else if (parsed.type === "error") {
                console.error("Stream error:", parsed.error);
              }
            } catch {
              /* skip unparseable lines */
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        for (const line of buffer.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "chunk" && parsed.content) {
              accumulated += parsed.content;
            } else if (parsed.type === "section_complete" && parsed.section) {
              setSectionResults((prev) => {
                const existing = new Set(prev.map((r) => r.section));
                if (existing.has(parsed.section.section)) return prev;
                setCurrentSection(parsed.section.section + 1);
                return [...prev, parsed.section];
              });
            } else if (parsed.type === "assessment_complete" && parsed.result) {
              setResult(parsed.result);
            }
          } catch {
            /* skip */
          }
        }
      }

      // Also parse markers from the raw accumulated text (fallback)
      if (accumulated) {
        parseStreamMarkers(accumulated);
        setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
      }

      // If we got a final result, switch to complete phase
      if (result) {
        setPhase("complete");
        setShowConfetti(true);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error processing your response. Please try sending your message again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  // Check result after streaming completes (handles race condition)
  useEffect(() => {
    if (!isStreaming && result && phase === "chat") {
      setPhase("complete");
      setShowConfetti(true);
    }
  }, [isStreaming, result, phase]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Speech recognition ───────────────────────────────────────────

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // ── INTAKE PHASE ─────────────────────────────────────────────────

  if (phase === "intake") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-2">
              Layer 3 -- Personal Assessment
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Personal AI Proficiency Assessment
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
              A conversational assessment powered by AI. We'll have a real conversation about
              how you use AI, then score your fluency across 6 dimensions.
            </p>
          </div>

          {/* Time estimate */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              25-30 minutes
            </span>
            <span className="w-px h-3 bg-border" />
            <span>6 Sections</span>
            <span className="w-px h-3 bg-border" />
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              AI-Powered
            </span>
          </div>

          {/* What it measures */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                What it measures
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {DIMENSION_LABELS[s.dimension]}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="l3-name" className="block text-sm font-medium text-foreground mb-1.5">
                  Your Name
                </label>
                <Input
                  id="l3-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFormError(""); }}
                  placeholder="Jane Smith"
                  maxLength={100}
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Department
                </label>
                <Select value={department} onValueChange={(v) => { setDepartment(v); setFormError(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Level */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Role Level
                </label>
                <Select value={roleLevel} onValueChange={(v) => { setRoleLevel(v); setFormError(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role level" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_LEVELS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Industry <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Select value={industry} onValueChange={(v) => { setIndustry(v); setFormError(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <Button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="w-full"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── CHAT PHASE ───────────────────────────────────────────────────

  if (phase === "chat") {
    const sectionProgress = Math.min(currentSection, 6);
    const currentSectionInfo = SECTIONS.find((s) => s.id === sectionProgress) ?? SECTIONS[0];

    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Section progress header */}
        <div className="flex-shrink-0 border-b bg-card">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  Section {sectionProgress} of 6
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {currentSectionInfo.title}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">{name}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${(sectionProgress / 6) * 100}%` }}
              />
            </div>

            {/* Section dots */}
            <div className="flex items-center gap-1.5 mt-2">
              {SECTIONS.map((s) => (
                <div
                  key={s.id}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s.id < sectionProgress
                      ? "bg-primary"
                      : s.id === sectionProgress
                        ? "bg-primary/50"
                        : "bg-muted"
                  }`}
                  title={s.title}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((msg, idx) => {
              const cleaned = cleanContent(msg.content);
              if (!cleaned) return null;

              const isUser = msg.role === "user";

              return (
                <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {cleaned}
                    </div>
                  </div>
                  {isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-3 mt-1">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-5 py-3.5 bg-muted text-foreground">
                  {streamingContent ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {cleanContent(streamingContent)}
                      <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t bg-card">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isStreaming ? "Waiting for response..." : "Type your response..."}
                  aria-label="Type your message"
                  disabled={isStreaming}
                  maxLength={5000}
                  rows={1}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background resize-none disabled:opacity-50 text-sm leading-relaxed"
                />
              </div>

              {/* Microphone button */}
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={toggleListening}
                className="flex-shrink-0 h-11 w-11 rounded-xl"
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>

              {/* Send button */}
              <Button
                type="submit"
                disabled={!inputValue.trim() || isStreaming}
                size="icon"
                className="flex-shrink-0 h-11 w-11 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs mt-2 text-center">
              Press Enter to send / Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── COMPLETE PHASE ───────────────────────────────────────────────

  if (!result) return null;

  const maturity = getMaturityStage(result.overallScore);
  const sections = result.sections || result.dimensions || [];
  const strengths = result.topStrengths || result.strengths || [];
  const improvements = result.topAreasForDevelopment || result.areasForImprovement || [];
  const recommendations = result.learningRecommendations || [];

  return (
    <div className="min-h-screen bg-background">
      {showConfetti && <ConfettiOverlay />}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Assessment Complete
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Here are your AI proficiency results across all 6 dimensions.
          </p>
        </div>

        {/* Score + Maturity */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10">
          <ScoreRing score={result.overallScore} />
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground mb-1">Maturity Stage</p>
            <Badge className={`text-lg px-4 py-1.5 ${maturity.color} border-0`}>
              {maturity.label}
            </Badge>
            {result.overallSummary && (
              <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">
                {result.overallSummary}
              </p>
            )}
          </div>
        </div>

        {/* Dimension Scores */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Dimension Scores
            </CardTitle>
            <CardDescription>
              Your proficiency across 6 assessment dimensions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section) => (
              <div key={section.section}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {section.title}
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(section.score)}`}>
                    {section.score}/10
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(section.score)}`}
                    style={{ width: `${(section.score / 10) * 100}%` }}
                  />
                </div>
                {section.summary && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {section.summary}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-green-500" />
                Top Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Areas for Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {improvements.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Target className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Learning Recommendations */}
        {recommendations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Learning Recommendations
              </CardTitle>
              <CardDescription>
                Personalized next steps to improve your AI proficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Retake */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              setPhase("intake");
              setResult(null);
              setShowConfetti(false);
              setMessages([]);
              setSectionResults([]);
              setCurrentSection(1);
              setSessionId("");
            }}
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Take Again
          </Button>
        </div>
      </div>
    </div>
  );
}

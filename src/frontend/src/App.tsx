import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Operator = "+" | "−" | "×" | "÷";

interface Question {
  a: number;
  b: number;
  operator: Operator;
  answer: number;
  display: string;
}

type GamePhase = "answering" | "correct" | "exhausted";

// ─── Question Generator ───────────────────────────────────────────────────────

function generateQuestion(): Question {
  const operators: Operator[] = ["+", "−", "×", "÷"];
  const op = operators[Math.floor(Math.random() * operators.length)];

  let a: number;
  let b: number;
  let answer: number;

  switch (op) {
    case "+": {
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    }
    case "−": {
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * a) + 1; // ensure non-negative
      answer = a - b;
      break;
    }
    case "×": {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
    }
    case "÷": {
      // Pick b first, then pick a divisible number
      b = Math.floor(Math.random() * 9) + 2; // 2–10
      const multiplier = Math.floor(Math.random() * 10) + 1; // 1–10
      a = b * multiplier;
      answer = multiplier;
      break;
    }
  }

  return {
    a,
    b,
    operator: op,
    answer,
    display: `${a} ${op} ${b}`,
  };
}

// ─── Star configs ─────────────────────────────────────────────────────────────

interface StarConfig {
  stars: number;
  label: string;
}

function getStarConfig(attemptNumber: number): StarConfig {
  // attemptNumber = which attempt was correct (1, 2, or 3)
  switch (attemptNumber) {
    case 1:
      return { stars: 5, label: "Excellent!" };
    case 2:
      return { stars: 3, label: "Brilliant!" };
    case 3:
      return { stars: 2, label: "Good job!" };
    default:
      return { stars: 1, label: "Wonderful!" };
  }
}

// ─── Heart SVG ───────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-9 h-9 transition-all duration-300 ${filled ? "heart-full scale-100" : "heart-empty scale-90 opacity-40"}`}
      aria-hidden="true"
    >
      {filled ? (
        <path
          fill="currentColor"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      )}
    </svg>
  );
}

// ─── Star SVG ────────────────────────────────────────────────────────────────

function StarIcon({
  position,
  earned,
  delay,
}: {
  position: number;
  earned: boolean;
  delay: number;
}) {
  // Odd positions = yellow, even positions = white (1-indexed)
  const isYellow = position % 2 === 1;

  const starStyle = earned
    ? ({
        color: isYellow ? "#FFD700" : "#FFFFFF",
        filter: isYellow
          ? "drop-shadow(0 0 4px #FFD700aa)"
          : "drop-shadow(0 0 4px #FFD70066) drop-shadow(0 1px 2px #00000040)",
        animationDelay: `${delay}ms`,
      } as React.CSSProperties)
    : ({
        color: "oklch(0.82 0.025 55)",
      } as React.CSSProperties);

  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-10 h-10 ${earned ? "animate-star-pop" : ""}`}
      style={starStyle}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  );
}

// ─── Decorative floating hearts ───────────────────────────────────────────────

function FloatingHeart({
  style,
  size,
}: {
  style: React.CSSProperties;
  size: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size, ...style }}
      className="absolute pointer-events-none select-none"
      aria-hidden="true"
    >
      <path
        fill="oklch(0.75 0.12 15 / 0.18)"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [question, setQuestion] = useState<Question>(() => generateQuestion());
  const [answer, setAnswer] = useState("");
  const [attemptsUsed, setAttemptsUsed] = useState(0); // 0-3
  const [phase, setPhase] = useState<GamePhase>("answering");
  const [showWrong, setShowWrong] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);
  const [correctAttempt, setCorrectAttempt] = useState(1);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const heartsRemaining = Math.max(0, 3 - attemptsUsed);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setAnswer("");
    setAttemptsUsed(0);
    setPhase("answering");
    setShowWrong(false);
    setQuestionKey((k) => k + 1);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Auto-advance after correct or exhausted
  useEffect(() => {
    if (phase === "correct") {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 2200);
      return () => clearTimeout(timer);
    }
    if (phase === "exhausted") {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [phase, nextQuestion]);

  const handleSubmit = useCallback(() => {
    if (phase !== "answering") return;
    const parsed = Number.parseFloat(answer.trim());
    if (Number.isNaN(parsed)) return;

    const newAttempts = attemptsUsed + 1;
    setAttemptsUsed(newAttempts);

    if (parsed === question.answer) {
      // Correct!
      setCorrectAttempt(newAttempts);
      setScore((s) => s + (4 - newAttempts)); // More points for fewer attempts
      setTotalAnswered((t) => t + 1);
      setPhase("correct");
      setShowWrong(false);
    } else {
      // Wrong
      setShakeKey((k) => k + 1);
      if (newAttempts >= 3) {
        setShowWrong(false);
        setTotalAnswered((t) => t + 1);
        setPhase("exhausted");
      } else {
        setShowWrong(true);
        setAnswer("");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [phase, answer, attemptsUsed, question.answer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit],
  );

  const starConfig = getStarConfig(correctAttempt);

  return (
    <div className="quiz-bg min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center px-4 py-8">
      {/* Decorative floating hearts background */}
      <FloatingHeart
        style={{
          top: "8%",
          left: "6%",
          animation: "float 5s ease-in-out infinite",
        }}
        size={48}
      />
      <FloatingHeart
        style={{
          top: "15%",
          right: "8%",
          animation: "float 6s ease-in-out infinite 1s",
        }}
        size={32}
      />
      <FloatingHeart
        style={{
          bottom: "12%",
          left: "10%",
          animation: "float 7s ease-in-out infinite 2s",
        }}
        size={56}
      />
      <FloatingHeart
        style={{
          bottom: "20%",
          right: "5%",
          animation: "float 5.5s ease-in-out infinite 0.5s",
        }}
        size={40}
      />
      <FloatingHeart
        style={{
          top: "45%",
          left: "3%",
          animation: "float 8s ease-in-out infinite 3s",
        }}
        size={28}
      />
      <FloatingHeart
        style={{
          top: "60%",
          right: "3%",
          animation: "float 6.5s ease-in-out infinite 1.5s",
        }}
        size={36}
      />

      {/* Fixed top-right love text */}
      <div className="fixed top-4 right-5 z-50 pointer-events-none select-none">
        <p
          className="love-text text-lg sm:text-xl italic leading-tight text-right"
          style={{ fontStyle: "italic" }}
        >
          I love you Tayeba
        </p>
        <div className="flex justify-end mt-0.5">
          <span style={{ color: "oklch(0.62 0.17 12)", fontSize: "0.85rem" }}>
            ♥
          </span>
        </div>
      </div>

      {/* App Header — Logo + Title */}
      <header className="flex flex-col items-center gap-3 mb-8 animate-fade-in-down">
        <img
          src="/assets/generated/brilliant-math-logo-transparent.dim_200x200.png"
          alt="Brilliant Mathematics logo"
          width={96}
          height={96}
          className="select-none drop-shadow-lg"
          style={{
            filter: "drop-shadow(0 4px 12px oklch(0.55 0.18 15 / 0.30))",
          }}
        />
        <h1 className="app-title text-4xl sm:text-5xl font-bold text-center leading-tight">
          Brilliant Mathematics
        </h1>
      </header>

      {/* Score strip */}
      <div className="mb-6 flex items-center gap-6 animate-fade-in-down">
        <div className="flex flex-col items-center">
          <span
            className="text-2xl font-bold font-display"
            style={{ color: "oklch(0.50 0.18 15)" }}
          >
            {score}
          </span>
          <span
            className="text-xs uppercase tracking-widest font-sans"
            style={{ color: "oklch(0.52 0.05 40)" }}
          >
            Points
          </span>
        </div>
        <div
          className="w-px h-8 rounded-full"
          style={{ background: "oklch(0.82 0.04 50)" }}
        />
        <div className="flex flex-col items-center">
          <span
            className="text-2xl font-bold font-display"
            style={{ color: "oklch(0.50 0.18 15)" }}
          >
            {totalAnswered}
          </span>
          <span
            className="text-xs uppercase tracking-widest font-sans"
            style={{ color: "oklch(0.52 0.05 40)" }}
          >
            Solved
          </span>
        </div>
      </div>

      {/* Quiz Card */}
      <div
        key={questionKey}
        className="quiz-card rounded-3xl w-full max-w-md px-8 py-10 flex flex-col items-center gap-6 animate-slide-up"
      >
        {/* Hearts */}
        <div
          className="flex items-center gap-3"
          data-ocid="quiz.hearts"
          aria-label={`${heartsRemaining} chances remaining`}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={i <= heartsRemaining ? "animate-heartbeat" : ""}
              style={
                i <= heartsRemaining
                  ? { animationDelay: `${(i - 1) * 0.2}s` }
                  : {}
              }
            >
              <HeartIcon filled={i <= heartsRemaining} />
            </div>
          ))}
        </div>

        {/* Question */}
        <div
          className="flex flex-col items-center gap-1"
          data-ocid="quiz.question"
        >
          <p
            className="text-xs uppercase tracking-[0.2em] font-sans font-semibold"
            style={{ color: "oklch(0.60 0.07 40)" }}
          >
            What is
          </p>
          <div
            key={`q-${questionKey}-${shakeKey}`}
            className={`question-text text-5xl sm:text-6xl font-bold leading-none py-2 ${shakeKey > 0 ? "animate-shake" : ""}`}
          >
            {question.display} = ?
          </div>
        </div>

        {/* Input */}
        <div className="w-full">
          <input
            ref={inputRef}
            data-ocid="quiz.input"
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={phase !== "answering"}
            placeholder="Your answer…"
            className="quiz-input w-full text-center text-2xl font-bold font-display rounded-2xl border-2 py-4 px-4 transition-all duration-200 bg-white/70 placeholder:text-muted-foreground/50"
            style={{
              borderColor: showWrong
                ? "oklch(0.57 0.22 27)"
                : "oklch(0.88 0.04 50)",
              color: "oklch(0.22 0.03 30)",
            }}
            aria-label="Your answer"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          data-ocid="quiz.submit_button"
          onClick={handleSubmit}
          disabled={phase !== "answering" || answer.trim() === ""}
          className="submit-btn w-full rounded-2xl py-4 text-lg font-bold font-sans tracking-wide"
          aria-label="Submit answer"
        >
          Submit Answer
        </button>

        {/* Feedback Area */}
        <div className="w-full min-h-[80px] flex flex-col items-center justify-center">
          {/* Wrong answer feedback */}
          {showWrong && phase === "answering" && (
            <div
              data-ocid="quiz.error_state"
              className="flex flex-col items-center gap-1 animate-fade-in-down"
              role="alert"
              aria-live="assertive"
            >
              <p
                className="text-lg font-bold font-sans"
                style={{ color: "oklch(0.50 0.22 27)" }}
              >
                ✗ Wrong answer, try again!
              </p>
              <p
                className="text-sm font-sans"
                style={{ color: "oklch(0.60 0.12 27)" }}
              >
                {heartsRemaining} chance{heartsRemaining !== 1 ? "s" : ""} left
              </p>
            </div>
          )}

          {/* Exhausted — show correct answer */}
          {phase === "exhausted" && (
            <div
              data-ocid="quiz.error_state"
              className="flex flex-col items-center gap-1 animate-fade-in-down"
              role="alert"
              aria-live="assertive"
            >
              <p
                className="text-lg font-bold font-sans"
                style={{ color: "oklch(0.50 0.22 27)" }}
              >
                ✗ Wrong answer
              </p>
              <p
                className="text-sm font-sans"
                style={{ color: "oklch(0.60 0.12 27)" }}
              >
                The correct answer was{" "}
                <strong style={{ color: "oklch(0.45 0.18 27)" }}>
                  {question.answer}
                </strong>
              </p>
              <p
                className="text-xs mt-1 font-sans"
                style={{ color: "oklch(0.65 0.06 40)" }}
              >
                Next question coming up…
              </p>
            </div>
          )}

          {/* Correct answer success */}
          {phase === "correct" && (
            <output
              data-ocid="quiz.success_state"
              className="flex flex-col items-center gap-3 animate-slide-up"
              aria-live="polite"
            >
              {/* Stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon
                    key={i}
                    position={i}
                    earned={i <= starConfig.stars}
                    delay={(i - 1) * 80}
                  />
                ))}
              </div>

              {/* Label */}
              <p
                className="text-2xl font-bold font-display"
                style={{ color: "oklch(0.50 0.18 15)" }}
              >
                {starConfig.label}
              </p>
              <p
                className="text-xs font-sans"
                style={{ color: "oklch(0.60 0.04 40)" }}
              >
                Next question in a moment…
              </p>
            </output>
          )}
        </div>

        {/* Question counter hint */}
        <p
          className="text-xs font-sans text-center"
          style={{ color: "oklch(0.72 0.03 50)" }}
        >
          Attempt {attemptsUsed + (phase !== "answering" ? 0 : 0)} · Answer in
          the box above
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center">
        <p
          className="text-xs font-sans"
          style={{ color: "oklch(0.65 0.04 40)" }}
        >
          © {new Date().getFullYear()}. Built with{" "}
          <span style={{ color: "oklch(0.62 0.17 12)" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.55 0.10 30)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

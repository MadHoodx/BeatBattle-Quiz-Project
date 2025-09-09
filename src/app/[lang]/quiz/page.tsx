"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import ChoiceButton from "@/components/quiz/ChoiceButton";

interface QuizQuestion {
  videoId: string;
  title: string;
  artist: string;
  choices: string[];
  correctAnswer: number;
  startTime: number;
  endTime: number;
}

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  selected: number | null;
  isPlaying: boolean;
  isRevealing: boolean;
  isFinished: boolean;
  timeLeft: number;
}

// Reusable background atmosphere (same pattern as home/mode/category)
function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#31265a_0%,transparent_60%),radial-gradient(circle_at_80%_30%,#3a1d52_0%,transparent_55%),linear-gradient(160deg,#0b0f1f,#090d18)]" />
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-screen"
        style={{
          backgroundImage:
            'url(/noise.png),linear-gradient(90deg,transparent,#ffffff08 50%,transparent)',
          backgroundSize: '300px 300px, 400% 100%',
          animation: 'shift 18s linear infinite'
        }}
      />
    </div>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const category = searchParams?.get('category') || 'kpop';
  const difficulty = searchParams?.get('difficulty') || 'casual';

  const [quiz, setQuiz] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    selected: null,
    isPlaying: false,
    isRevealing: false,
    isFinished: false,
    timeLeft: 15
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Precompute visualizer heights (must be before any conditional returns to keep hook order stable)
  const visualizerHeights = useMemo(() => Array.from({ length: 24 }, () => 12 + Math.random() * 48), [quiz.currentIndex]);

  // Load quiz questions
  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        const response = await fetch(`/api/youtube/quiz?category=${category}&difficulty=${difficulty}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load quiz');
        }

        setQuiz(prev => ({
          ...prev,
          questions: data.questions || []
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [category, difficulty]);

  // Timer effect
  useEffect(() => {
    if (quiz.isPlaying && quiz.timeLeft > 0 && !quiz.isRevealing) {
      const timer = setTimeout(() => {
        setQuiz(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (quiz.timeLeft === 0 && quiz.selected === null) {
      // Time's up, auto-select wrong answer
      handleTimeUp();
    }
  }, [quiz.isPlaying, quiz.timeLeft, quiz.isRevealing]);

  const currentQuestion = quiz.questions[quiz.currentIndex];
  const hasSelected = quiz.selected !== null;

  const handleTimeUp = () => {
    setQuiz(prev => ({ 
      ...prev, 
      selected: -1, // Wrong answer indicator
      isRevealing: true,
      isPlaying: false
    }));
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleSelect = (choiceIndex: number) => {
    if (quiz.isRevealing || hasSelected) return;
    
    setQuiz(prev => ({ 
      ...prev, 
      selected: choiceIndex,
      isRevealing: true,
      isPlaying: false
    }));

    const isCorrect = choiceIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setQuiz(prev => ({ ...prev, score: prev.score + 1 }));
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    const nextIndex = quiz.currentIndex + 1;
    
    if (nextIndex >= quiz.questions.length) {
      // Quiz finished
      setQuiz(prev => ({ ...prev, isFinished: true }));
    } else {
      // Next question
      setQuiz(prev => ({
        ...prev,
        currentIndex: nextIndex,
        selected: null,
        isRevealing: false,
        isPlaying: true,
        timeLeft: 15
      }));
    }
  };

  const startPlaying = () => {
    setQuiz(prev => ({ 
      ...prev, 
      isPlaying: true, 
      timeLeft: 15 
    }));
  };

  const restartQuiz = () => {
    setQuiz(prev => ({
      ...prev,
      currentIndex: 0,
      score: 0,
      selected: null,
      isRevealing: false,
      isFinished: false,
      isPlaying: false,
      timeLeft: 15
    }));
  };

  const goHome = () => {
    router.push(`/${lang}`);
  };

  const goToCategory = () => {
    router.push(`/${lang}/category?difficulty=${difficulty}`);
  };

  const LoadingScreen = (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white flex items-center justify-center">
      <Atmosphere />
      <div className="relative z-10 text-center animate-[fadeIn_.6s_ease]">
        <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-fuchsia-400/30 border-t-fuchsia-400" />
        </div>
        <h2 className="text-xl font-semibold tracking-wide mb-2">Loading {category.toUpperCase()} Quiz…</h2>
        <p className="text-white/50 text-sm uppercase tracking-widest">Difficulty: {difficulty}</p>
      </div>
    </main>
  );
  if (loading) return LoadingScreen;

  if (error) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white flex items-center justify-center">
        <Atmosphere />
        <div className="relative z-10 w-full max-w-md mx-auto p-8 rounded-3xl border border-red-400/30 bg-gradient-to-br from-red-500/15 via-rose-500/10 to-transparent backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.6)] animate-[fadeIn_.6s_ease] text-center">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-3">❌ Quiz Error</h2>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <button onClick={goToCategory} className="w-full group relative overflow-hidden rounded-xl px-5 py-3 font-semibold bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 text-[#18152e] tracking-wide shadow-lg shadow-fuchsia-500/30 hover:shadow-pink-500/40 transition">
                <span className="relative z-10">← Back to Categories</span>
              </button>
              <button onClick={goHome} className="w-full rounded-xl px-5 py-3 font-semibold bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur text-white/90 hover:text-white transition" >🏠 Home</button>
            </div>
        </div>
      </main>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white flex items-center justify-center">
        <Atmosphere />
        <div className="relative z-10 max-w-md mx-auto p-8 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 via-yellow-500/10 to-transparent backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.6)] animate-[fadeIn_.6s_ease] text-center">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-3">⚠️ No Questions</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6">Could not generate quiz for <span className="font-semibold text-white/80">{category}</span> category.</p>
          <button onClick={goToCategory} className="w-full group relative overflow-hidden rounded-xl px-5 py-3 font-semibold bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 text-[#18152e] tracking-wide shadow-lg shadow-fuchsia-500/30 hover:shadow-pink-500/40 transition">
            <span className="relative z-10">← Try Another Category</span>
          </button>
        </div>
      </main>
    );
  }

  if (quiz.isFinished) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white flex items-center justify-center">
        <Atmosphere />
        <div className="relative z-10 w-full max-w-md mx-auto p-10 rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-indigo-500/10 backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.6)] animate-[fadeIn_.6s_ease] text-center">
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-amber-200 bg-clip-text text-transparent drop-shadow mb-6">🎉 Quiz Complete!</h2>
          <div className="mb-8">
            <p className="text-white/60 text-sm uppercase tracking-wider mb-2">Your Score</p>
            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-pink-300 drop-shadow">
              {quiz.score}<span className="text-white/40 text-3xl">/{quiz.questions.length}</span>
            </div>
            <p className="text-white/50 mt-4 text-sm tracking-wide">{Math.round((quiz.score / quiz.questions.length) * 100)}% Accuracy</p>
          </div>
          <div className="space-y-4">
            <button onClick={restartQuiz} className="w-full group relative overflow-hidden rounded-xl px-6 py-4 font-bold bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 text-[#18152e] tracking-wide shadow-lg shadow-fuchsia-500/30 hover:shadow-pink-500/40 transition text-sm uppercase">
              <span className="relative z-10">🔄 Play Again</span>
            </button>
            <button onClick={goToCategory} className="w-full rounded-xl px-6 py-4 font-semibold bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur text-white/90 hover:text-white transition text-sm">📂 Categories</button>
            <button onClick={goHome} className="w-full rounded-xl px-6 py-4 font-semibold bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur text-white/90 hover:text-white transition text-sm">🏠 Home</button>
          </div>
        </div>
      </main>
    );
  }

  // (visualizerHeights hook moved above to maintain consistent hook order across renders)

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <Atmosphere />
      {/* Top HUD */}
      <div className="relative z-20 w-full px-4 pt-6 flex items-center justify-center">
        <div className="flex items-center gap-6 text-[13px] font-semibold tracking-wide rounded-full px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_4px_18px_rgba(0,0,0,0.4)] animate-[fadeIn_.7s_ease]">
          <span className="text-white/70">Question <span className="text-white">{quiz.currentIndex + 1}</span>/<span className="text-white/40">{quiz.questions.length}</span></span>
          <span className="text-white/30">•</span>
          <span className="text-white/70">Score <span className="text-white">{quiz.score}</span></span>
          <span className="text-white/30">•</span>
          <span className={`${quiz.timeLeft <= 5 ? 'text-rose-300' : 'text-fuchsia-200'} flex items-center gap-1`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M12 22a10 10 0 110-20 10 10 0 010 20z"/></svg>
            {quiz.timeLeft}s
          </span>
        </div>
      </div>

      {/* Core Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-20">
        {!quiz.isPlaying ? (
          <div className="max-w-2xl mx-auto text-center animate-[fadeIn_.7s_ease]">
            <div className="relative overflow-hidden rounded-3xl p-12 border border-white/10 bg-gradient-to-br from-violet-500/25 via-fuchsia-500/10 to-indigo-500/10 backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.55)]">
              <div className="mx-auto mb-8 h-28 w-28 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <svg className="w-14 h-14 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-pink-200 bg-clip-text text-transparent drop-shadow mb-6">{category.toUpperCase()} Quiz</h1>
              <p className="text-white/60 max-w-md mx-auto leading-relaxed mb-10">Listen to each hidden music clip and choose the correct song title from the options below. Ready?</p>
              <button onClick={startPlaying} className="group relative overflow-hidden rounded-2xl px-10 py-5 font-bold text-lg bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 text-[#18152e] tracking-wide shadow-lg shadow-fuchsia-500/30 hover:shadow-pink-500/40 transition">
                <span className="relative z-10 flex items-center gap-2">▶ Start Quiz</span>
                <span className="absolute inset-0 bg-[linear-gradient(95deg,rgba(255,255,255,0),rgba(255,255,255,0.6)_50%,rgba(255,255,255,0))] opacity-0 group-hover:opacity-60 animate-[cardSheen_2.4s_linear_infinite]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 items-start">
            {/* Audio Card */}
            <div className="relative group rounded-3xl p-10 border border-white/10 bg-gradient-to-br from-violet-500/25 via-fuchsia-500/10 to-indigo-500/10 backdrop-blur-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">Listen & Guess</h3>
                    <p className="text-white/50 text-sm">Preview • {quiz.timeLeft}s remaining</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5Zm5 4v6m4-8v10"/></svg>
                  </div>
                  <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-fuchsia-400 to-pink-500" />
                  </div>
                </div>
              </div>
              {/* Visualizer */}
              <div className="flex items-end justify-center gap-1 h-32 mb-8">
                {visualizerHeights.map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-gradient-to-t from-fuchsia-500/30 via-pink-400/60 to-white group-hover:from-fuchsia-500/50 transition-all duration-500"
                    style={{ height: h, animation: `pulseBar 1s ease-in-out ${i * 0.05}s infinite` }}
                  />
                ))}
              </div>
              {/* Progress */}
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-fuchsia-400 via-pink-500 to-violet-500 transition-[width] duration-300" style={{ width: `${((15 - quiz.timeLeft) / 15) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                <span>0s</span><span>15s</span>
              </div>
              {/* Hidden YouTube Player */}
              <div className="hidden">
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${currentQuestion.videoId}?start=${currentQuestion.startTime}&end=${currentQuestion.endTime}&autoplay=1&controls=0&showinfo=0&rel=0&modestbranding=1`}
                  title="Music Clip"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-8 flex justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-wider uppercase text-white/60">
                  {category} • Track {quiz.currentIndex + 1}
                </span>
              </div>
            </div>
            {/* Choices */}
            <div className="space-y-4">
              {currentQuestion.choices.map((choice, index) => (
                <ChoiceButton
                  key={choice}
                  choice={choice}
                  selected={
                    quiz.selected === null
                      ? null
                      : quiz.selected === -1
                        ? 'timeout'
                        : currentQuestion.choices[quiz.selected]
                  }
                  correctAnswer={currentQuestion.choices[currentQuestion.correctAnswer]}
                  onSelect={() => handleSelect(index)}
                  disabled={quiz.isRevealing || hasSelected}
                />
              ))}
              {/* Result */}
              {quiz.isRevealing && (
                <div className="pt-2 animate-[fadeIn_.4s_ease]">
                  {quiz.selected === currentQuestion.correctAnswer ? (
                    <p className="text-emerald-300 font-semibold flex items-center gap-2"><span>🎉</span> Correct!</p>
                  ) : quiz.selected === -1 ? (
                    <p className="text-rose-300 font-semibold flex items-center gap-2"><span>⏰</span> Time's Up!</p>
                  ) : (
                    <p className="text-rose-300 font-semibold flex items-center gap-2"><span>❌</span> Wrong!</p>
                  )}
                  <p className="text-white/60 text-sm mt-2">Answer: <span className="text-white font-semibold">{currentQuestion.choices[currentQuestion.correctAnswer]}</span></p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes pulseBar {0%,100%{transform:scaleY(.4);}50%{transform:scaleY(1);} }
        @keyframes cardSheen {0%{transform:translateX(-120%);}100%{transform:translateX(120%);} }
        @keyframes fadeIn {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
      `}</style>
    </main>
  );
}


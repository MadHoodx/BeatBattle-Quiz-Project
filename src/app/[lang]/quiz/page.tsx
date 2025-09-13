"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import ChoiceButton from "@/components/quiz/ChoiceButton";
import LegalDisclaimer from "@/components/common/LegalDisclaimer";

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
  // Statistics tracking
  correctAnswers: number;
  wrongAnswers: number;
  timeoutAnswers: number;
  totalTime: number;
  questionTimes: number[]; // Time taken for each question
}

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
    timeLeft: 15,
    // Statistics
    correctAnswers: 0,
    wrongAnswers: 0,
    timeoutAnswers: 0,
    totalTime: 0,
    questionTimes: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(75); // Volume state (0-100)
  const [isMuted, setIsMuted] = useState(false); // Mute state
  const [volumeUpdateTimeout, setVolumeUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [smoothTimeLeft, setSmoothTimeLeft] = useState(15); // For ultra-smooth progress
  const [bonusTime, setBonusTime] = useState(0); 
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now()); // Track question start time
  const [iframeKey, setIframeKey] = useState(0); // Force iframe refresh

  // Precompute visualizer heights (must be before any conditional returns to keep hook order stable)
  const visualizerHeights = useMemo(() => Array.from({ length: 24 }, () => 12 + Math.random() * 48), [quiz.currentIndex]);

  // Load quiz questions with Supabase fallback
  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        
        // Try Supabase API first with cache busting
        let response = await fetch(`/api/quiz/supabase?category=${category}&difficulty=${difficulty}&t=${timestamp}`, {
          cache: 'no-store'
        });
        let data = await response.json();
        
        // If Supabase fails, fallback to original API
        if (!response.ok || !data.success) {
          console.log('🔄 Supabase failed, falling back to original API');
          response = await fetch(`/api/youtube/quiz?category=${category}&difficulty=${difficulty}&t=${timestamp}`, {
            cache: 'no-store'
          });
          data = await response.json();
        }
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load quiz');
        }

        console.log(`✅ Quiz loaded from: ${data.source}`);

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

  // Ultra-smooth timer effect with 50ms precision
  useEffect(() => {
    if (quiz.isPlaying && quiz.timeLeft > 0 && !quiz.isRevealing) {
      // Update display timer every 1 second
      const displayTimer = setTimeout(() => {
        setQuiz(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);

      // Update smooth progress every 50ms for ultra-smooth animation
      const smoothTimer = setInterval(() => {
        setSmoothTimeLeft(prev => {
          const newTime = prev - 0.05; // Decrease by 50ms
          return newTime <= 0 ? 0 : newTime;
        });
      }, 50);

      return () => {
        clearTimeout(displayTimer);
        clearInterval(smoothTimer);
      };
    } else if (quiz.timeLeft === 0 && quiz.selected === null) {
      // Time's up, auto-select wrong answer
      handleTimeUp();
    }
  }, [quiz.isPlaying, quiz.timeLeft, quiz.isRevealing]);

  // Bonus time countdown effect
  useEffect(() => {
    if (bonusTime > 0 && quiz.isRevealing) {
      const bonusTimer = setTimeout(() => {
        setBonusTime(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(bonusTimer);
    } else if (bonusTime === 0 && quiz.isRevealing) {
      // Stop the music when bonus time ends
      const iframe = document.querySelector('iframe[title="Music Clip"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {
          // Silently fail if can't control YouTube iframe
        }
      }
    }
  }, [bonusTime, quiz.isRevealing]);

  // Control music playback during reveal
  useEffect(() => {
    const iframe = document.querySelector('iframe[title="Music Clip"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        if (quiz.isRevealing && bonusTime === 0) {
          // Pause music when revealing answer (no bonus time)
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } else if (quiz.isPlaying && !quiz.isRevealing) {
          // Resume music during question time
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
      } catch (e) {
        // Silently fail if can't control YouTube iframe
      }
    }
  }, [quiz.isRevealing, quiz.isPlaying, bonusTime]);

  // Ensure new song starts when question changes
  useEffect(() => {
    if (quiz.isPlaying && !quiz.isRevealing) {
      // Longer delay to ensure iframe is fully ready
      const timer = setTimeout(() => {
        const iframe = document.querySelector('iframe[title="Music Clip"]') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          try {
            // Step 1: Set volume to prevent loud start
            iframe.contentWindow.postMessage(
              `{"event":"command","func":"setVolume","args":[${isMuted ? 0 : volume}]}`,
              '*'
            );
            
            // Step 2: Wait longer for volume to be applied, then play
            setTimeout(() => {
              try {
                iframe.contentWindow!.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
              } catch (e) {
                // Silently fail
              }
            }, 200); // Increased delay for volume setting
          } catch (e) {
            // Silently fail if can't control YouTube iframe
          }
        }
      }, 800); // Increased delay for iframe loading
      
      return () => clearTimeout(timer);
    }
  }, [quiz.currentIndex, quiz.isPlaying, volume, isMuted]);

  // Volume control effect for iframe
  useEffect(() => {
    const iframe = document.querySelector('iframe[title="Music Clip"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      // Set initial volume when iframe loads
      const setInitialVolume = () => {
        try {
          iframe.contentWindow!.postMessage(
            `{"event":"command","func":"setVolume","args":[${isMuted ? 0 : volume}]}`,
            '*'
          );
        } catch (e) {
          // Silently fail if can't control YouTube iframe
        }
      };
      
      // Wait a bit for iframe to load
      setTimeout(setInitialVolume, 1000);
    }
  }, [quiz.currentIndex, volume, isMuted]);

  // Ultra-smooth keyboard shortcuts (like Spotify)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quiz.isPlaying && !quiz.isRevealing) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handleVolumeChange(Math.min(100, volume + 2)); // Very smooth 2% increments
            break;
          case 'ArrowDown':
            e.preventDefault();
            handleVolumeChange(Math.max(0, volume - 2)); // Very smooth 2% decrements
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            toggleMute();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quiz.isPlaying, quiz.isRevealing, volume]);

  // Cleanup volume timeout on unmount
  useEffect(() => {
    return () => {
      if (volumeUpdateTimeout) {
        clearTimeout(volumeUpdateTimeout);
      }
    };
  }, [volumeUpdateTimeout]);

  const currentQuestion = quiz.questions[quiz.currentIndex];
  const hasSelected = quiz.selected !== null;

  const handleTimeUp = () => {
    // Calculate time taken (full 15 seconds)
    const timeTaken = 15;
    
    setQuiz(prev => ({ 
      ...prev, 
      selected: -1, // Wrong answer indicator
      isRevealing: true,
      timeoutAnswers: prev.timeoutAnswers + 1,
      questionTimes: [...prev.questionTimes, timeTaken],
      totalTime: prev.totalTime + timeTaken
      // Keep isPlaying: true to continue music for 6 more seconds
    }));
    
    // Give 6 seconds of additional listening time even when time's up
    setBonusTime(6);
    
    setTimeout(() => {
      nextQuestion();
    }, 8000); // 6s bonus + 2s reveal = 8s total
  };

  const handleSelect = (choiceIndex: number) => {
    if (quiz.isRevealing || hasSelected) return;
    
    // Calculate time taken for this question
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    
    setQuiz(prev => ({ 
      ...prev, 
      selected: choiceIndex,
      isRevealing: true,
      questionTimes: [...prev.questionTimes, timeTaken],
      totalTime: prev.totalTime + timeTaken
      // Keep isPlaying: true to continue music for 6 more seconds
    }));

    const isCorrect = choiceIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setQuiz(prev => ({ 
        ...prev, 
        score: prev.score + 1,
        correctAnswers: prev.correctAnswers + 1
      }));
    } else {
      setQuiz(prev => ({ 
        ...prev, 
        wrongAnswers: prev.wrongAnswers + 1
      }));
    }

    // Always give 6 seconds of additional listening time regardless of answer
    setBonusTime(6);
    
    // Proceed to next question after 6s bonus + 2s reveal = 8s total
    setTimeout(() => {
      nextQuestion();
    }, 8000);
  };

  const nextQuestion = () => {
    // Force stop any playing music
    const iframes = document.querySelectorAll('iframe[title="Music Clip"]');
    iframes.forEach(iframe => {
      if (iframe && (iframe as HTMLIFrameElement).contentWindow) {
        try {
          (iframe as HTMLIFrameElement).contentWindow!.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {
          // Silently fail
        }
      }
    });
    
    const nextIndex = quiz.currentIndex + 1;
    
    if (nextIndex >= quiz.questions.length) {
      // Quiz finished
      setQuiz(prev => ({ ...prev, isFinished: true }));
    } else {
      // Force refresh iframe for clean transition
      setIframeKey(prev => prev + 1);
      
      // Next question - immediate transition
      setQuiz(prev => ({
        ...prev,
        currentIndex: nextIndex,
        selected: null,
        isRevealing: false,
        isPlaying: true,
        timeLeft: 15
      }));
      setSmoothTimeLeft(15); // Reset smooth timer for next question
      setBonusTime(0); // Reset bonus time
      setQuestionStartTime(Date.now()); // Reset question timer
    }
  };

  const startPlaying = () => {
    setQuiz(prev => ({ 
      ...prev, 
      isPlaying: true, 
      timeLeft: 15 
    }));
    setSmoothTimeLeft(15); // Reset smooth timer
    setBonusTime(0); // Reset bonus time
    setQuestionStartTime(Date.now()); // Start timing first question
  };

  const restartQuiz = async () => {
    // Reset state first
    setQuiz(prev => ({
      ...prev,
      currentIndex: 0,
      score: 0,
      selected: null,
      isRevealing: false,
      isFinished: false,
      isPlaying: false,
      timeLeft: 15,
      // Reset statistics
      correctAnswers: 0,
      wrongAnswers: 0,
      timeoutAnswers: 0,
      totalTime: 0,
      questionTimes: []
    }));
    setSmoothTimeLeft(15);
    setBonusTime(0);
    setQuestionStartTime(Date.now());
    
    // Load new questions immediately
    try {
      setLoading(true);
      
      // Add timestamp to prevent caching and force new random songs
      const timestamp = Date.now();
      
      // Try Supabase API first with cache busting
      let response = await fetch(`/api/quiz/supabase?category=${category}&difficulty=${difficulty}&t=${timestamp}`, {
        cache: 'no-store'
      });
      let data = await response.json();
      
      // If Supabase fails, fallback to original API
      if (!response.ok || !data.success) {
        console.log('🔄 Supabase failed, falling back to original API');
        response = await fetch(`/api/youtube/quiz?category=${category}&difficulty=${difficulty}&t=${timestamp}`, {
          cache: 'no-store'
        });
        data = await response.json();
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load new quiz');
      }

      console.log(`✅ New quiz loaded from: ${data.source}`);
      console.log(`🎵 New songs: ${data.questions?.map((q: any) => q.title).join(', ')}`);

      setQuiz(prev => ({
        ...prev,
        questions: data.questions || []
      }));
    } catch (err) {
      console.error('❌ Failed to load new quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to load new quiz');
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    router.push(`/${lang}`);
  };

  const goToCategory = () => {
    router.push(`/${lang}/category?difficulty=${difficulty}`);
  };

  const shareResults = () => {
    const accuracy = Math.round((quiz.score / quiz.questions.length) * 100);
    const avgTime = quiz.questionTimes.length > 0 ? (quiz.totalTime / quiz.questionTimes.length).toFixed(1) : '0';
    
    const shareText = `🎵 I just completed a ${category.toUpperCase()} music quiz!\n\n📊 Score: ${quiz.score}/${quiz.questions.length} (${accuracy}%)\n⏱️ Average time: ${avgTime}s per question\n🎯 ${quiz.correctAnswers} correct • ${quiz.wrongAnswers} wrong • ${quiz.timeoutAnswers} timeout\n\nCan you beat my score? 🏆`;
    
    if (navigator.share) {
      navigator.share({
        title: 'BeatBattle Quiz Results',
        text: shareText,
        url: window.location.origin
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        alert('Results copied to clipboard! 📋');
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Results copied to clipboard! 📋');
      }).catch(() => {
        alert('Unable to share results');
      });
    }
  };

  // Ultra-smooth volume control like Spotify
  const handleVolumeChange = (newVolume: number) => {
    // Use precise decimal values for ultra-smooth control
    const preciseVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(preciseVolume);
    setIsMuted(preciseVolume === 0);
    
    // Instant iframe update with no rounding for smoothness
    updateIframeVolumeInstant(preciseVolume);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Instant mute/unmute response
    const targetVolume = newMutedState ? 0 : volume;
    updateIframeVolumeInstant(targetVolume);
  };

  // Ultra-responsive iframe volume control
  const updateIframeVolumeInstant = (volumeLevel: number) => {
    const iframe = document.querySelector('iframe[title="Music Clip"]') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        // Send volume command immediately
        iframe.contentWindow.postMessage(JSON.stringify({
          event: "command",
          func: "setVolume",
          args: [volumeLevel]
        }), '*');
        
        // Handle mute state separately for instant response
        if (volumeLevel === 0) {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: "command", 
            func: "mute", 
            args: []
          }), '*');
        } else if (isMuted && volumeLevel > 0) {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: "command", 
            func: "unMute", 
            args: []
          }), '*');
        }
      } catch (e) {
      }
    }
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
    const accuracy = Math.round((quiz.score / quiz.questions.length) * 100);
    const avgTimePerQuestion = quiz.questionTimes.length > 0 ? (quiz.totalTime / quiz.questionTimes.length) : 0;
    const totalMinutes = Math.floor(quiz.totalTime / 60);
    const totalSeconds = Math.round(quiz.totalTime % 60);
    const fastestTime = quiz.questionTimes.length > 0 ? Math.min(...quiz.questionTimes) : 0;
    
    const getPerformanceRating = () => {
      if (accuracy === 100) return { emoji: "👑", title: "LEGENDARY!", rank: "S+", color: "from-yellow-200 via-amber-300 to-orange-400", glow: "shadow-amber-400/50" };
      if (accuracy >= 90) return { emoji: "🏆", title: "Excellent!", rank: "A-Rank", color: "from-emerald-300 via-green-400 to-teal-400", glow: "shadow-emerald-400/40" };
      if (accuracy >= 80) return { emoji: "🥇", title: "Great Job!", rank: "B-Rank", color: "from-blue-300 via-cyan-400 to-indigo-400", glow: "shadow-blue-400/40" };
      if (accuracy >= 70) return { emoji: "🥈", title: "Good Work!", rank: "C-Rank", color: "from-purple-300 via-violet-400 to-fuchsia-400", glow: "shadow-purple-400/40" };
      if (accuracy >= 60) return { emoji: "🥉", title: "Not Bad!", rank: "D-Rank", color: "from-orange-300 via-amber-400 to-yellow-400", glow: "shadow-orange-400/40" };
      return { emoji: "📚", title: "Keep Trying!", rank: "E-Rank", color: "from-slate-300 via-gray-400 to-zinc-400", glow: "shadow-gray-400/30" };
    };
    
    const performance = getPerformanceRating();
    
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white flex items-center justify-center py-8">
        <Atmosphere />
        
        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-fuchsia-400/30 to-pink-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
          
          {/* Glassmorphism Result Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-[cardSheen_2s_ease-in-out_infinite,fadeIn_.8s_ease]">
            
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-fuchsia-500/20 via-pink-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-[1px] rounded-[2.4rem] bg-gradient-to-br from-[#070a18]/95 via-[#0d1425]/90 to-[#070a18]/95 backdrop-blur-xl" />
            
            <div className="relative p-8 md:p-12">
              
              {/* Celebration Header */}
              <div className="text-center mb-10 space-y-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-400/30 mb-6 animate-bounce">
                  <span className="text-4xl animate-pulse">🎵</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-amber-200 bg-clip-text text-transparent drop-shadow-lg animate-[fadeIn_1s_ease_.3s_both]">
                  Quiz Complete!
                </h1>
                
                <div className="flex items-center justify-center gap-3 text-lg font-semibold text-white/70 animate-[fadeIn_1s_ease_.5s_both]">
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">{category.toUpperCase()}</span>
                  <span className="text-white/40">•</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">{difficulty}</span>
                </div>
              </div>

              {/* Epic Score Display */}
              <div className="text-center mb-12 p-8 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] animate-[fadeIn_1s_ease_.7s_both]">
                <p className="text-white/50 text-sm uppercase tracking-[0.3em] mb-4 font-bold">YOUR SCORE</p>
                
                {/* Animated Score Counter */}
                <div className="relative mb-6">
                  <div className={`text-8xl md:text-9xl font-black bg-gradient-to-r ${performance.color} bg-clip-text text-transparent drop-shadow-2xl filter ${performance.glow} animate-pulse`}>
                    {quiz.score}<span className="text-white/30 text-6xl md:text-7xl">/{quiz.questions.length}</span>
                  </div>
                  
                  {/* Floating glow effect */}
                  <div className={`absolute inset-0 text-8xl md:text-9xl font-black bg-gradient-to-r ${performance.color} bg-clip-text text-transparent blur-xl opacity-20 animate-pulse`}>
                    {quiz.score}<span className="text-white/10">/{quiz.questions.length}</span>
                  </div>
                </div>
                
                <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent mb-2`}>
                  {accuracy}% Accuracy
                </div>
                
                {/* Progress Bar Animation */}
                <div className="relative w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${performance.color} rounded-full transition-all duration-2000 ease-out shadow-lg ${performance.glow}`}
                    style={{ width: `${accuracy}%` }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${performance.color} opacity-30 animate-pulse rounded-full`} />
                </div>
              </div>

              {/* Premium Statistics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 animate-[fadeIn_1s_ease_.9s_both]">
                
                {/* Time Analysis */}
                <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 border border-blue-400/30 flex items-center justify-center">
                      <span className="text-xl">⏱️</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors">Time Statistics</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-white/70 text-sm">Total Time:</span>
                      <span className="text-white font-semibold">
                        {totalMinutes > 0 ? `${totalMinutes}m ` : ''}{totalSeconds}s
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-white/70 text-sm">Average per Question:</span>
                      <span className="text-blue-300 font-semibold">{avgTimePerQuestion.toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-white/70 text-sm">Fastest Answer:</span>
                      <span className="text-cyan-300 font-semibold">
                        {fastestTime > 0 ? `${fastestTime.toFixed(1)}s` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Answer Breakdown */}
                <div className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border border-emerald-400/20 hover:border-emerald-400/40 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-green-400/20 border border-emerald-400/30 flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition-colors">Answer Breakdown</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-emerald-300 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Correct:
                      </span>
                      <span className="text-emerald-300 font-bold text-lg">{quiz.correctAnswers}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-rose-300 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        Wrong:
                      </span>
                      <span className="text-rose-300 font-bold text-lg">{quiz.wrongAnswers}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-amber-300 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        Timeout:
                      </span>
                      <span className="text-amber-300 font-bold text-lg">{quiz.timeoutAnswers}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Rating */}
                <div className={`group p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)]`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${performance.color.replace('from-', 'from-').replace('via-', 'to-').split(' ')[0]}/20 ${performance.color.replace('from-', 'to-').replace('via-', 'from-').split(' ')[2]}/20 border border-yellow-400/30 flex items-center justify-center`}>
                      <span className="text-xl">{performance.emoji}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-yellow-200 transition-colors">Performance Rating</h3>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-black bg-gradient-to-r ${performance.color} bg-clip-text text-transparent mb-2`}>
                      {performance.title}
                    </div>
                    <div className={`text-xl font-bold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent mb-3`}>
                      {performance.rank}
                    </div>
                    
                    {/* Rating stars */}
                    <div className="flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`text-lg ${i < Math.ceil(accuracy / 20) ? 'text-yellow-400' : 'text-white/20'} transition-colors duration-300`}
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Action Buttons */}
              <div className="space-y-4 animate-[fadeIn_1s_ease_1.1s_both]">
                
                {/* Primary CTA - Play Again */}
                <button 
                  onClick={restartQuiz} 
                  className="w-full group relative overflow-hidden rounded-2xl px-8 py-5 font-bold bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 text-white tracking-wide shadow-[0_20px_40px_-10px_rgba(168,85,247,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(168,85,247,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                    <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    PLAY AGAIN
                  </span>
                </button>
                
                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={shareResults}
                    className="group relative overflow-hidden rounded-xl px-6 py-4 font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_35px_-10px_rgba(16,185,129,0.6)] border border-emerald-400/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share Results
                    </span>
                  </button>
                  
                  <button 
                    onClick={goToCategory} 
                    className="group relative overflow-hidden rounded-xl px-6 py-4 font-semibold bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-slate-500/30 hover:border-slate-400/50 shadow-[0_10px_30px_-10px_rgba(71,85,105,0.4)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      New Category
                    </span>
                  </button>
                </div>
                
                {/* Home Button */}
                <button 
                  onClick={goHome} 
                  className="w-full group relative overflow-hidden rounded-xl px-6 py-4 font-semibold bg-gradient-to-r from-indigo-900/40 to-purple-900/40 hover:from-indigo-800/60 hover:to-purple-800/60 border border-indigo-500/20 hover:border-indigo-400/40 backdrop-blur-xl text-white/80 hover:text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-[0_8px_25px_-8px_rgba(99,102,241,0.3)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }


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
        {quiz.currentIndex === 0 && !quiz.isPlaying && !quiz.isFinished ? (
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
                    <h3 className="font-bold text-xl tracking-tight">
                      {quiz.isRevealing ? 'Answer Revealed' : 'Listen & Guess'}
                    </h3>
                    <p className="text-white/50 text-sm">
                      {quiz.isRevealing ? 'Answer revealed' : `Preview • ${quiz.timeLeft}s remaining`}
                      {!quiz.isRevealing && (
                        <span className="ml-2">• Volume: {isMuted ? 'Muted' : `${Math.round(volume)}%`}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleMute}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    {isMuted ? (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5Zm13.5 3L19 12.5M19 12.5 14.5 17"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5Zm5 4v6m4-8v10"/>
                      </svg>
                    )}
                  </button>
                  {/* Spotify-style volume slider with theme colors */}
                  <div 
                    className="relative w-20 h-1 rounded-full bg-white/15 cursor-pointer group hover:h-1.5 transition-all duration-150"
                    onMouseEnter={(e) => {
                      // Show handle on hover
                      const handle = e.currentTarget.querySelector('.volume-handle') as HTMLElement;
                      if (handle) handle.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      // Hide handle when not dragging
                      const handle = e.currentTarget.querySelector('.volume-handle') as HTMLElement;
                      if (handle && !handle.classList.contains('dragging')) {
                        handle.style.opacity = '0';
                      }
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const newVolume = (x / rect.width) * 100;
                      handleVolumeChange(newVolume);
                    }}
                  >
                    {/* Volume progress fill with smooth animation */}
                    <div 
                      className="h-full bg-gradient-to-r from-fuchsia-400 to-pink-500 rounded-full transition-all duration-100 ease-out relative"
                      style={{ width: `${isMuted ? 0 : volume}%` }}
                    >
                      {/* apply styles for the volume handle */}
                      <div 
                        className="volume-handle absolute top-1/2 right-0 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 transition-all duration-150 cursor-grab active:cursor-grabbing transform -translate-y-1/2 translate-x-1/2 hover:scale-110"
                        style={{ 
                          boxShadow: '0 2px 8px rgba(217, 70, 239, 0.4)',
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const handle = e.currentTarget;
                          handle.classList.add('dragging');
                          handle.style.opacity = '1';
                          
                          const slider = handle.closest('.relative') as HTMLElement;
                          
                          const handleMouseMove = (e: MouseEvent) => {
                            if (slider) {
                              const rect = slider.getBoundingClientRect();
                              const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                              const newVolume = (x / rect.width) * 100;
                              handleVolumeChange(newVolume);
                            }
                          };
                          
                          const handleMouseUp = () => {
                            handle.classList.remove('dragging');
                            handle.style.opacity = '0';
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                            document.body.style.userSelect = '';
                          };
                          
                          document.body.style.userSelect = 'none';
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Visualizer */}
              <div className="flex items-end justify-center gap-1 h-32 mb-8">
                {visualizerHeights.map((h, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full bg-gradient-to-t from-fuchsia-500/30 via-pink-400/60 to-white group-hover:from-fuchsia-500/50 transition-all duration-500 ${quiz.isRevealing ? 'opacity-50' : ''}`}
                    style={{ 
                      height: h, 
                      animation: quiz.isRevealing ? 'none' : `pulseBar 1s ease-in-out ${i * 0.05}s infinite` 
                    }}
                  />
                ))}
              </div>
              {/* Ultra-smooth Progress Bar */}
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-fuchsia-400 via-pink-500 to-violet-500 rounded-full" 
                  style={{ 
                    width: `${((15 - smoothTimeLeft) / 15) * 100}%`,
                    transition: quiz.isRevealing ? 'none' : 'width 50ms linear'
                  }} 
                />
              </div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                <span>0s</span><span>15s</span>
              </div>
              {/* Hidden YouTube Player with Bonus Time Support */}
              <div className="hidden">
                <iframe
                  key={`music-${quiz.currentIndex}-${iframeKey}-${currentQuestion.videoId}`}
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${currentQuestion.videoId}?start=${currentQuestion.startTime}&autoplay=0&controls=0&showinfo=0&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&t=${iframeKey}`}
                  title="Music Clip"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  id={`youtube-player-${quiz.currentIndex}-${iframeKey}`}
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
                  key={`choice-${index}`}
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
      
      {/* Legal Disclaimer - shows only during gameplay */}
      {quiz.isPlaying && !quiz.isFinished && <LegalDisclaimer />}
      
      <style jsx global>{`
        @keyframes pulseBar {0%,100%{transform:scaleY(.4);}50%{transform:scaleY(1);} }
        @keyframes cardSheen {0%{transform:translateX(-120%);}100%{transform:translateX(120%);} }
        @keyframes fadeIn {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
        @keyframes float {0%,100%{transform:translateY(0px);}50%{transform:translateY(-10px);}}
        @keyframes glow {0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.3);}50%{box-shadow:0 0 40px rgba(168,85,247,0.6);}}
        @keyframes sparkle {0%,100%{opacity:0.3;transform:scale(0.8);}50%{opacity:1;transform:scale(1.2);}}
        @keyframes slideInFromLeft {from{opacity:0;transform:translateX(-50px);}to{opacity:1;transform:translateX(0);}}
        @keyframes slideInFromRight {from{opacity:0;transform:translateX(50px);}to{opacity:1;transform:translateX(0);}}
        @keyframes scaleIn {from{opacity:0;transform:scale(0.8);}to{opacity:1;transform:scale(1);}}
        @keyframes bounce {0%,20%,53%,80%,100%{transform:translate3d(0,0,0);}40%,43%{transform:translate3d(0,-30px,0);}70%{transform:translate3d(0,-15px,0);}90%{transform:translate3d(0,-4px,0);}}
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 1.5s ease-in-out infinite; }
        .animate-slideInLeft { animation: slideInFromLeft 0.6s ease-out; }
        .animate-slideInRight { animation: slideInFromRight 0.6s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.5s ease-out; }
        .animate-delayedBounce { animation: bounce 1s ease-out 0.5s; }
      `}</style>
    </main>
  );
}


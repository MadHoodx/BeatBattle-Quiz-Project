
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AudioComponent from "../component/audioComponent";
import ChoiceButton from "../component/ChoiceButton";
import { questions } from "../../data/questions";
import { useQuiz } from "../../hooks/useQuiz";

export default function Home() {
  const router = useRouter();
  const {
    currentIndex,
    selected,
    waiting,
    countdown,
    isFinished,
    score,
    lastAnswer,
    handleClipEnd,
    handleSelect,
    setSelected,
    resetQuiz
  } = useQuiz(questions.length);

  // Add animations when component mounts
  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(el => el.classList.add('opacity-100'));
  }, []);

  const currentQuestion = questions[currentIndex];
  const hasSelected = selected !== null;



  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[length:24px_24px] opacity-5"></div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-900/50 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Menu
          </button>
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-white/70">Score: </span>
              <span className="font-bold text-purple-400">{score}</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-sm">
              <span className="text-white/70">Progress: </span>
              <span className="font-bold text-purple-400">{currentIndex + 1}/{questions.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {!isFinished ? (
        <div className="max-w-4xl mx-auto relative pt-20">
          {/* Progress Bar */}
          <div className="mb-12 fade-in opacity-0 transition-opacity duration-500">
            <div className="flex justify-between text-sm mb-3 text-gray-300">
              {waiting && (
                <span className="animate-pulse text-purple-300 font-medium">
                  Answer in {countdown}s
                </span>
              )}
              {lastAnswer && (
                <span className={`font-medium ${
                  lastAnswer === 'correct' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastAnswer === 'correct' ? '✨ Correct!' : '❌ Wrong!'}
                </span>
              )}
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-slate-700/50">
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-10 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              {currentQuestion.prompt}
            </h1>

            {/* Audio Player */}
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="w-full max-w-md bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
                <AudioComponent
                  src={currentQuestion.audio}
                  start={currentQuestion.start}
                  end={currentQuestion.end}
                  autoPlay
                  onClipEnd={handleClipEnd}
                />
              </div>
            </div>

            {/* Choices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.choices.map((choice: string) => (
                <ChoiceButton
                  key={choice}
                  choice={choice}
                  selected={selected}
                  correctAnswer={currentQuestion.answer}
                  onSelect={(choice) => handleSelect(choice, currentQuestion.answer)}
                  disabled={hasSelected}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen relative">
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-12 shadow-2xl border border-slate-700/50 text-center max-w-2xl w-full mx-auto">
            <div className="mb-8">
              <div className="text-sm font-medium text-purple-400 mb-2 tracking-wider">QUIZ RESULT</div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                Quiz Complete! ✨
              </h1>
              <div className="flex flex-col items-center justify-center mb-6">
                <p className="text-xl text-gray-400 mb-2">Your Score</p>
                <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {score}/{questions.length}
                </div>
                <div className="text-sm text-gray-400">
                  {score === questions.length 
                    ? "Perfect Score! 🎉" 
                    : score >= questions.length / 2 
                      ? "Great job! Keep it up! ✨" 
                      : "Practice makes perfect! 💪"}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto">
              <button
                onClick={resetQuiz}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl 
                hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-102 font-bold shadow-lg
                group flex items-center justify-center gap-2"
              >
                <span>Try Again</span>
                <svg className="w-5 h-5 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-8 py-4 bg-slate-800/50 text-gray-300 rounded-xl border border-slate-700/50
                hover:bg-slate-700/50 transition-all transform hover:scale-102 font-bold
                group flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

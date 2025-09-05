
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
    isPlaying,
    isRevealing,
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
    <div className="min-h-screen bg-[#070B1E] text-white p-6 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[length:32px_32px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20"></div>
      </div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#070B1E]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Menu
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-white/70">Score: </span>
                <span className="font-bold text-purple-400">{score}</span>
              </div>
              <div className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-white/70">Round: </span>
                <span className="font-bold text-purple-400">{currentIndex + 1}/{questions.length}</span>
              </div>
            </div>
            {/* Volume Control in Header */}
            <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
              <AudioComponent
                src={currentQuestion.audio}
                start={currentQuestion.start}
                end={currentQuestion.end}
                autoPlay
                onClipEnd={handleClipEnd}
                minimal
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {!isFinished ? (
          <div className="max-w-4xl mx-auto relative pt-24">
              {/* Progress Bar and Status */}
            <div className="mb-12 fade-in opacity-0 transition-opacity duration-500">
              <div className="flex justify-between items-center text-sm mb-3">
                <div className="flex items-center gap-3">
                  {isPlaying && !selected && (
                    <span className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium animate-pulse">
                      Listening...
                    </span>
                  )}
                  {selected && (
                    <span className={`px-4 py-2 rounded-full font-medium transition-all ${
                      !isRevealing ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' :
                      lastAnswer === 'correct' 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                      {!isRevealing ? 'Selected!' : lastAnswer === 'correct' ? '✨ Correct!' : '❌ Wrong!'}
                    </span>
                  )}
                </div>
                <div className="text-white/60 font-medium">
                  {currentIndex + 1}/{questions.length}
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                />
              </div>
            </div>            {/* Question Card */}
            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/10 overflow-hidden">
              {/* Card Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5"></div>
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
              
              {/* Question Content */}
              <div className="relative">
                <h1 className="text-2xl md:text-3xl font-bold text-center mb-10">
                  <span className="relative inline-block">
                    {currentQuestion.prompt}
                    <span className="absolute inset-x-0 -bottom-2 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></span>
                  </span>
                </h1>

                {/* Audio Player */}
                {/* Visualization Section */}
                <div className="mb-12">
                  <div className="relative w-full max-w-2xl mx-auto aspect-[16/9] bg-black/20 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30"></div>
                    
                    {/* Circular Audio Visualizer */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        {/* Pulsing Circles */}
                        <div className="absolute inset-0 animate-ping-slow opacity-20">
                          <div className="w-full h-full rounded-full border-4 border-purple-400"></div>
                        </div>
                        <div className="absolute inset-0 animate-ping-slower opacity-15">
                          <div className="w-full h-full rounded-full border-4 border-pink-400"></div>
                        </div>
                        
                        {/* Center Circle with Progress */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative w-32 h-32">
                            {/* Background Circle */}
                            <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
                              </div>
                            
                            {/* Center Content */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
                            </div>
                          </div>
                        </div>

                        {/* Rotating Bars */}
                        <div className="absolute inset-0 animate-spin-slow opacity-75">
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-0.5 bg-gradient-to-b from-purple-400 to-pink-400"
                              style={{
                                height: '45%',
                                left: '50%',
                                top: '5%',
                                transform: `rotate(${i * 30}deg)`,
                                transformOrigin: 'bottom center',
                                opacity: 0.3 + Math.random() * 0.7
                              }}
                            />
                          ))}
                        </div>

                        {/* Center Circle */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg 
                            flex items-center justify-center">
                            {isPlaying ? (
                              <div className="w-4 h-4 rounded-full bg-purple-400 animate-pulse"></div>
                            ) : selected ? (
                              <div className={`text-2xl ${isRevealing && lastAnswer === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                {isRevealing && lastAnswer === 'correct' ? '✨' : '❌'}
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-white/20"></div>
                            )}
                          </div>
                        </div>

                        {/* Status Text */}
                        <div className="absolute -bottom-12 left-0 right-0 text-center">
                          <div className="text-sm font-medium text-white/60">
                            {!isPlaying && !selected ? "Getting Ready..." : 
                             isPlaying && !selected ? "Now Playing..." :
                             !isRevealing ? "Selected!" :
                             lastAnswer === 'correct' ? "Correct!" : "Wrong!"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Choices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {currentQuestion.choices.map((choice: string) => (
                    <ChoiceButton
                      key={choice}
                      choice={choice}
                      selected={selected}
                      correctAnswer={isRevealing ? currentQuestion.answer : undefined}
                      onSelect={(choice) => handleSelect(choice, currentQuestion.answer)}
                      disabled={!isPlaying || selected !== null}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] relative">
            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/10 text-center max-w-2xl w-full mx-auto overflow-hidden">
              {/* Result Card Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5"></div>
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
              
              {/* Result Content */}
              <div className="relative">
                <div className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                  QUIZ COMPLETE
                </div>
                <h1 className="text-4xl font-bold mb-8">
                  <span className="relative inline-block">
                    Final Score ✨
                    <span className="absolute inset-x-0 -bottom-2 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></span>
                  </span>
                </h1>
                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="text-7xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    {score}/{questions.length}
                  </div>
                  <div className="text-lg text-white/60">
                    {score === questions.length 
                      ? "Perfect Score! 🎉" 
                      : score >= questions.length / 2 
                        ? "Well Done! ✨" 
                        : "Keep Practicing! 💪"}
                  </div>
                </div>
                <div className="space-y-4 max-w-sm mx-auto">
                  <button
                    onClick={resetQuiz}
                    className="w-full px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium
                      hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 shadow-xl
                      group flex items-center justify-center gap-2"
                  >
                    <span>Try Again</span>
                    <svg className="w-5 h-5 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full px-8 py-3 rounded-xl bg-white/5 text-white/70 border border-white/10
                      hover:bg-white/10 hover:text-white transition-all hover:scale-105
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
          </div>
        )}
      </main>
    </div>
  );
}

type ChoiceButtonProps = {
  choice: string;
  selected: string | null;
  correctAnswer?: string;
  onSelect: (choice: string) => void;
  disabled: boolean;
};

export default function ChoiceButton({ 
  choice, 
  selected, 
  correctAnswer,
  onSelect,
  disabled 
}: ChoiceButtonProps) {
  const isSelected = selected === choice;
  const isCorrect = selected?.trim() === correctAnswer?.trim();
  const isRight = correctAnswer ? choice === correctAnswer : false;
  const isTimeout = selected === "timeout";

  return (
    <button
      onClick={() => onSelect(choice)}
      className={`
        group relative w-full p-5 rounded-2xl text-lg font-medium transition-all duration-300 transform
        ${!selected 
          ? 'bg-white/5 hover:bg-white/10 hover:scale-[1.02] hover:-translate-y-0.5 text-white/90 hover:text-white border border-white/10' 
          : 'border'}
        ${isSelected && isRight 
          ? '!bg-emerald-500/10 border-emerald-400/30 text-emerald-400 scale-[1.02]' 
          : ''}
        ${isSelected && !isCorrect 
          ? '!bg-rose-500/10 border-rose-400/30 text-rose-400 scale-[1.02]' 
          : ''}
        ${isTimeout && isRight 
          ? '!bg-emerald-500/10 border-emerald-400/30 text-emerald-400 scale-[1.02]' 
          : ''}
        ${disabled && !isSelected && !isRight 
          ? 'opacity-40' 
          : ''}
      `}
      disabled={disabled}
    >
      {/* Glow effect */}
      {!selected && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"></div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative">
        {choice}
      </div>

      {/* Status icon */}
      {selected && (isSelected || (isTimeout && isRight)) && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isCorrect ? (
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      )}
    </button>
  );
}

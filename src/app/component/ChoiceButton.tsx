type ChoiceButtonProps = {
  choice: string;
  selected: string | null;
  correctAnswer: string;
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
  const isCorrect = selected?.trim() === correctAnswer.trim();
  const isRight = choice === correctAnswer;
  const isTimeout = selected === "timeout";

  return (
    <button
      onClick={() => onSelect(choice)}
      className={`
        w-full p-4 rounded-xl text-lg font-medium transition-all duration-300 transform
        ${!selected 
          ? 'bg-slate-800/50 hover:bg-slate-700/50 hover:scale-102 text-gray-300 border border-slate-700/50' 
          : 'text-white border border-transparent'}
        ${isSelected && isRight 
          ? '!bg-gradient-to-r from-emerald-500/50 to-emerald-600/50 scale-102 border border-emerald-400/30 text-emerald-200' 
          : ''}
        ${isSelected && !isCorrect 
          ? '!bg-gradient-to-r from-red-500/50 to-red-600/50 scale-102 border border-red-400/30 text-red-200' 
          : ''}
        ${isTimeout && isRight 
          ? '!bg-gradient-to-r from-emerald-500/50 to-emerald-600/50 scale-102 border border-emerald-400/30 text-emerald-200' 
          : ''}
        ${disabled && !isSelected && !isRight 
          ? 'opacity-50' 
          : ''}
      `}
      disabled={disabled}
    >
      {choice}
    </button>
  );
}

"use client";

import { useState } from "react";

type Question = {
  prompt: string;
  choices: string[];
  answer: string;
};

const q: Question = {
    
  prompt: "เพลงนี้เป็น OST ของซีรีส์เรื่องใด?",
  choices: ["Goblin", "Crash Landing on You", "Vincenzo", "Hotel Del Luna"],
  answer: "Crash Landing on You",
};

export default function Home() {
    
const [selected, setSelected] = useState<string | null>(null);
const isCorrect = selected === q.answer;
const hasSelected = selected !== null;

function handleSelect(choice: string) {
  setSelected(choice);
}



  return (
    <main>
        <h1 className="text-center">{q.prompt}</h1>

    {/*Choice Buttons */}
    <div className="
  flex flex-col gap-2            
  md:flex-row md:flex-wrap md:gap-3  
  md:justify-center                
">
    
        {q.choices.map((c) => {
            const isCorrect = selected?.trim() === q.answer.trim();

            const isSelected = selected === c;     
            const isRight   = c === q.answer;

    return (
    <button
      key={c}
      onClick={() => handleSelect(c)}
      className={
        "w-full md:w-[300px] px-4 py-3 rounded-xl bg-white text-slate-900 border transition " +
  (!hasSelected ? " border-slate-200 " : "") +                     
  (isSelected && isRight ? " border-4 !border-green-600 " : "") +     
  (isSelected && !isCorrect ? " border-4 !border-red-600 " : "") 
      }
      
       disabled={hasSelected}
    >
      {c}
        </button>
        );
    })}
        
    </div>



    {/*Feedback */}
    
    {hasSelected && <p>{isCorrect ? "ถูกต้อง!" : "ผิด ลองใหม่น้า" }</p>}
    </main>
  );
}

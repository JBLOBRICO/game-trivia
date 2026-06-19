import { useState } from 'react';

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Trivia Quest! 🌟",
    content: "Let's take a quick tour of how to play. You are looking at the Game Board—a winding isometric 3D track!",
    target: "board"
  },
  {
    title: "The Board Tiles 🎲",
    content: "Each tile corresponds to a Trivia category. Special tiles like Treasure 🎁, Traps 💀, and Challenges ⚖️ will trigger exciting events when you land on them!",
    target: "board"
  },
  {
    title: "Answering Questions ⏱️",
    content: "On your turn, you'll select a difficulty. Easy = 1 step & 5 coins. Hard = 3 steps & 15 coins. Answer correctly before the timer runs out to move forward!",
    target: "turn-panel"
  },
  {
    title: "The Shop 🛍️",
    content: "Use the coins you earn to buy powerful items like Shields or Double Movement! Your Character also has a unique ability you can use once per turn.",
    target: "shop"
  },
  {
    title: "Winning the Game 🏆",
    content: "The first player to reach Tile #39 wins! Watch out for other players and may the best trivia master win!",
    target: "none"
  }
];

export function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const currentStep = TUTORIAL_STEPS[step];

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="glass-panel p-8 max-w-md w-full relative overflow-hidden shadow-2xl scale-in-center">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-400 rounded-full blur-3xl opacity-30"></div>
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-slate-800">{currentStep.title}</h2>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {step + 1} / {TUTORIAL_STEPS.length}
            </span>
          </div>
          
          <p className="text-slate-600 text-lg leading-relaxed">
            {currentStep.content}
          </p>
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleNext}
              className="btn btn-cyan font-bold text-lg px-8 shadow-lg hover:shadow-xl transition-all"
            >
              {step === TUTORIAL_STEPS.length - 1 ? "Let's Play! 🚀" : "Next ➡️"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import { Shield } from 'lucide-react';
import { GameBoard } from './GameBoard';
import { TurnPanel } from './TurnPanel';
import { ShopModal } from './ShopModal';
import { Chat } from '../Chat';
import { TutorialOverlay } from './TutorialOverlay';
import { useState, useEffect } from 'react';

export function GameView({ gameState }: { gameState: any }) {
  const {
    roomState,
    myState,
    handleLeaveGame,
    isMyTurn,
    shopOpen,
    chatEndRef
  } = gameState;

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if they've seen the tutorial before
    const hasSeen = localStorage.getItem('trivia_quest_tutorial_seen');
    if (!hasSeen) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    localStorage.setItem('trivia_quest_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  return (
    <div className="container py-6 flex-1 flex flex-col gap-6">
      {/* Top Info Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLeaveGame}
            className="btn btn-outline border-red text-red hover:bg-red-05 py-1.5 px-3 text-xs"
          >
            Quit Game
          </button>
          <h2 className="text-xl font-black text-white">
            Room: <span className="text-cyan glow-cyan">{roomState.roomCode}</span>
          </h2>
        </div>

        {/* Active Turn banner */}
        <div className="px-4 py-2 bg-purple-glow border border-purple rounded-xl text-center">
          <span className="text-[10px] uppercase font-extrabold text-purple block">Active Turn</span>
          <span className="text-sm font-bold text-white">
            {isMyTurn ? '👉 It is YOUR turn!' : `⏳ Waiting for ${roomState.activePlayerUsername}...`}
          </span>
        </div>

        {/* My Stats Box */}
        <div className="flex gap-4 text-xs font-bold bg-black-20 px-4 py-2 rounded-xl border border-white-05">
          <span className="text-gold">🪙 {myState?.coins} Coins</span>
          <span className="text-cyan">⭐ Pos {myState?.position}/39</span>
          <span className="text-purple">🔥 Streak {myState?.streak}</span>
          {myState?.shield && <span className="text-green flex items-center gap-0.5"><Shield size={12} /> Shield</span>}
        </div>
      </div>

      {/* Board Winding Path */}
      <GameBoard gameState={gameState} />

      {/* Interactive Turn Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action panel (Difficulty select / Question prompt) */}
        <TurnPanel gameState={gameState} />

        {/* Right Side Logs & Chat */}
        <div className="flex flex-col gap-6 max-h-[600px]">
          {/* Event Logs */}
          <div className="glass-panel p-6 flex flex-col gap-4 flex-1 overflow-hidden">
            <h3 className="text-base font-extrabold text-white border-b border-white-05 pb-3">Event Feeds</h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2 bg-black-20 rounded-xl max-h-[220px]">
              {roomState.logs.map((log: string, idx: number) => (
                <p key={idx} className="text-[11px] text-text-muted leading-relaxed border-l-2 border-cyan pl-2 py-0.5">
                  {log}
                </p>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat room */}
          <Chat gameState={gameState} maxHeight="160px" />
        </div>
      </div>

      {/* Shop Modal */}
      {shopOpen && <ShopModal gameState={gameState} />}

      {/* 5. MATCH GAME OVER OVERLAY */}
      {roomState.status === 'gameover' && (
        <div className="victory-overlay flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-8 text-center flex flex-col gap-6 float-animation">
            <div className="flex justify-center">
              <span className="text-6xl">🏆</span>
            </div>

            <div>
              <h2 className="text-3xl font-black text-white bg-gradient-to-r from-gold to-orange bg-clip-text text-transparent">
                MATCH OVER!
              </h2>
              <p className="text-sm text-text-muted mt-2">
                Winner: <b className="text-gold text-lg">{roomState.winnerUsername}</b>
              </p>
            </div>

            <div className="glass-card p-4 flex flex-col gap-3">
              <b className="text-white block border-b border-white-05 pb-2">Final Positions</b>
              {roomState.players.map((p: any, idx: number) => (
                <div key={p.username} className="flex justify-between text-sm">
                  <span className="text-white-85 font-semibold">
                    {idx + 1}. {p.avatar} {p.username}
                  </span>
                  <span className="text-cyan">Space {p.position}/39</span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleLeaveGame}
              className="btn btn-cyan w-full py-3"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Overlay for First-Time Users */}
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
    </div>
  );
}

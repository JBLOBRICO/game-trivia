
import { Play } from 'lucide-react';
import { CHARACTERS } from '../hooks/useGameState';
import { Chat } from './Chat';

export function Lobby({ gameState }: { gameState: any }) {
  const {
    roomState,
    myState,
    user,
    handleSelectCharacter,
    handleToggleReady,
    handleStartGame,
    chatEndRef
  } = gameState;

  return (
    <div className="container py-8 flex-1 flex flex-col md:flex-row gap-6">
      <div className="flex-2 flex flex-col gap-6">
        {/* Room Info */}
        <div className="glass-panel p-6 flex flex-col gap-2">
          <span className="text-xs uppercase font-extrabold text-cyan">Private Room</span>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            Lobby Code: <span className="text-purple glow-purple tracking-widest bg-black-30 px-3 py-1 rounded-xl">{roomState.roomCode}</span>
          </h2>
          <p className="text-sm text-text-muted">
            Game Mode: <b className="text-white">{roomState.gameMode}</b> • Players: <b className="text-white">{roomState.players.length}</b>
          </p>
        </div>

        {/* Character Selection */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white border-b border-white-05 pb-3">Choose Your Character</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHARACTERS.map((char) => {
              const selectedBy = roomState.players.find((p: any) => p.character === char.name);
              const isMeSelected = myState?.character === char.name;

              return (
                <button 
                  key={char.name}
                  onClick={() => handleSelectCharacter(char.name)}
                  disabled={!!selectedBy && !isMeSelected}
                  className={`glass-card text-left p-4 flex gap-4 transition-all relative ${isMeSelected ? 'border-cyan bg-cyan-05' : ''} ${selectedBy && !isMeSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow"
                    style={{ background: char.color }}
                  >
                    {char.emoji}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {char.name}
                      {selectedBy && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple rounded text-white">
                          {selectedBy.username}
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-cyan font-bold block mb-1">{char.abilityName}</span>
                    <p className="text-[11px] text-text-muted leading-tight">{char.abilityDesc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Players Status List */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white border-b border-white-05 pb-3">Lobby Members</h3>
          <div className="flex flex-col gap-3">
            {roomState.players.map((p: any) => (
              <div key={p.username} className="glass-card flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.avatar}</span>
                  <div>
                    <span className="font-bold text-white flex items-center gap-2">
                      {p.username}
                      {p.character && <span className="text-xs text-text-muted">({p.character})</span>}
                    </span>
                    {roomState.gameMode === '2v2' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${p.team === 1 ? 'bg-cyan-10 text-cyan' : 'bg-purple-10 text-purple'}`}>
                        Team {p.team}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {p.username === user.username ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={p.ready}
                        onChange={(e) => handleToggleReady(e.target.checked)}
                        className="w-5 h-5 rounded border-white-10 accent-cyan"
                      />
                      <span className="text-sm font-semibold text-white">Ready</span>
                    </label>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${p.ready ? 'bg-green-10 text-green border border-green' : 'bg-red-10 text-red border border-red'}`}>
                      {p.ready ? 'Ready' : 'Not Ready'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Start game button for Lobby Host (first player) */}
          {roomState.players[0]?.username === user.username && (
            <button 
              onClick={handleStartGame}
              className="btn btn-cyan w-full mt-4 py-3 text-base"
            >
              <Play size={20} /> Launch Match
            </button>
          )}
        </div>
      </div>

      {/* Lobby chat & logs */}
      <div className="flex-1 flex flex-col gap-6 max-h-[600px]">
        <div className="glass-panel p-6 flex flex-col gap-4 flex-1">
          <h3 className="text-lg font-bold text-white border-b border-white-05 pb-3">Room Feed</h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2 bg-black-20 rounded-xl max-h-[300px]">
            {roomState.logs.map((log: string, idx: number) => (
              <p key={idx} className="text-xs text-text-muted leading-tight border-l border-cyan pl-2 py-1">
                {log}
              </p>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Chat Room */}
        <Chat gameState={gameState} maxHeight="200px" />
      </div>
    </div>
  );
}


import { Volume2, VolumeX } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Lobby } from './components/Lobby';
import { GameView } from './components/Game/GameView';

export default function App() {
  const gameState = useGameState();
  const { view, soundEnabled, setSoundEnabled, roomState, user } = gameState;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sound Controller Button */}
      <button 
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="sound-toggle glass-panel flex-center btn-outline"
        title="Toggle Sound Effects"
      >
        {soundEnabled ? <Volume2 size={20} className="text-cyan" /> : <VolumeX size={20} className="text-muted" />}
      </button>

      {view === 'auth' && <Auth gameState={gameState} />}
      {view === 'dashboard' && user && <Dashboard gameState={gameState} />}
      {view === 'lobby' && roomState && <Lobby gameState={gameState} />}
      {view === 'game' && roomState && <GameView gameState={gameState} />}
    </div>
  );
}


import { CHARACTERS } from '../../hooks/useGameState';

export function GameBoard({ gameState }: { gameState: any }) {
  const { roomState } = gameState;

  function getTileGridStyle(index: number) {
    let row = Math.floor(index / 10);
    let col = index % 10;
    if (row % 2 === 1) {
      col = 9 - col;
    }
    return {
      gridRowStart: row + 1,
      gridColumnStart: col + 1
    };
  }

  function getTileDescription(tile: any) {
    switch (tile.type) {
      case 'bonus': return 'Bonus: Move extra steps forward!';
      case 'treasure': return 'Treasure: Earn bonus coins!';
      case 'trap': return 'Trap: Lose coins or get knocked backward!';
      case 'shortcut': return `Shortcut: Teleports you to space ${tile.shortcutDestination || 'ahead'}.`;
      case 'mystery': return 'Mystery: A random event will occur (good or bad)!';
      case 'challenge': return 'Challenge: High-stakes trivia for extra rewards or penalties.';
      case 'wildcard': return 'Wildcard: You get to pick the trivia category!';
      case 'normal': return `Category: ${tile.category}`;
      default: return tile.category;
    }
  }

  const activePlayer = roomState.players[roomState.turnIndex];

  return (
    <div className="glass-panel p-6 flex flex-col gap-2 relative">
      <h3 className="text-base font-extrabold text-white flex justify-between items-center mb-2">
        <span>Race Map</span>
        <span className="text-xs text-text-muted font-normal">Winding Snake Track (Start is 0, Finish is 39)</span>
      </h3>
      
      <div className="board-container">
        <div className="board-path">
          {roomState.board.map((tile: any) => {
            // Find pawns on this tile
            const pawnsHere = roomState.players.filter((p: any) => p.position === tile.index);
            const isShortcutDst = roomState.board.some((t: any) => t.shortcutDestination === tile.index);

            return (
              <div 
                key={tile.index}
                style={getTileGridStyle(tile.index)}
                title={getTileDescription(tile)}
                className={`board-tile ${tile.type}-tile cat-${tile.category.toLowerCase().split(' ')[0]} ${isShortcutDst ? 'border-dashed border-cyan' : ''} hover:scale-110 hover:z-10 transition-transform duration-200 cursor-help`}
              >
                <span className="tile-index">#{tile.index}</span>
                
                {/* Special Space Labels */}
                {tile.type === 'bonus' && <span className="tile-icon">➕</span>}
                {tile.type === 'treasure' && <span className="tile-icon">🎁</span>}
                {tile.type === 'trap' && <span className="tile-icon">💀</span>}
                {tile.type === 'shortcut' && <span className="tile-icon">🚀</span>}
                {tile.type === 'mystery' && <span className="tile-icon">❓</span>}
                {tile.type === 'challenge' && <span className="tile-icon">⚖️</span>}
                {tile.type === 'wildcard' && <span className="tile-icon">🃏</span>}

                {/* Display Category Initials if Normal */}
                {tile.type === 'normal' && (
                  <span className="text-[10px] text-center font-semibold leading-tight px-1 pointer-events-none">
                    {tile.category.split(' ').map((w: string) => w[0]).join('')}
                  </span>
                )}

                {/* Pawns */}
                {pawnsHere.length > 0 && (
                  <div className="pawn-container pointer-events-none">
                    {pawnsHere.map((p: any) => {
                      const charIdx = CHARACTERS.findIndex(c => c.name === p.character);
                      const playerColor = charIdx !== -1 ? CHARACTERS[charIdx].color : 'linear-gradient(135deg, #eee, #999)';
                      const isActivePawn = activePlayer && activePlayer.username === p.username;
                      
                      return (
                        <div 
                          key={p.username} 
                          className={`pawn ${isActivePawn ? 'animate-bounce ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}
                          style={{ background: playerColor }}
                          title={`${p.username} (${p.character || 'No Character'})`}
                        >
                          {p.avatar}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


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

  return (
    <div className="glass-panel p-6 flex flex-col gap-2">
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
                className={`board-tile ${tile.type}-tile cat-${tile.category.toLowerCase().split(' ')[0]} ${isShortcutDst ? 'border-dashed border-cyan' : ''}`}
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
                  <span className="text-[10px] text-center font-semibold leading-tight px-1">
                    {tile.category.split(' ').map((w: string) => w[0]).join('')}
                  </span>
                )}

                {/* Pawns */}
                {pawnsHere.length > 0 && (
                  <div className="pawn-container">
                    {pawnsHere.map((p: any) => {
                      const charIdx = CHARACTERS.findIndex(c => c.name === p.character);
                      const playerColor = charIdx !== -1 ? CHARACTERS[charIdx].color : 'linear-gradient(135deg, #eee, #999)';
                      
                      return (
                        <div 
                          key={p.username} 
                          className="pawn"
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

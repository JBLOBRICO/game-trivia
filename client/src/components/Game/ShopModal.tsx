
import { ShoppingBag } from 'lucide-react';

export function ShopModal({ gameState }: { gameState: any }) {
  const {
    myState, activeQuestion, shopError, setShopOpen, handleBuyPowerup
  } = gameState;

  return (
    <div className="victory-overlay flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-4 relative">
        <button 
          onClick={() => setShopOpen(false)}
          className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-extrabold"
        >
          ✕
        </button>
        
        <h3 className="text-xl font-black text-white flex items-center gap-2 border-b border-white-05 pb-3">
          <ShoppingBag size={22} className="text-gold" /> Power-up Shop
        </h3>

        <p className="text-xs text-text-muted">
          Your Balance: <b className="text-gold">🪙 {myState?.coins} Coins</b>
        </p>

        <div className="flex flex-col gap-3 mt-2">
          {/* 50/50 */}
          <div className="glass-card flex justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1">
                50/50 Hint <span className="text-[10px] text-gold">(15 Coins)</span>
              </h4>
              <p className="text-[10px] text-text-muted">Removes 2 incorrect choices. Can buy during turn.</p>
            </div>
            <button 
              onClick={() => handleBuyPowerup('50/50')}
              disabled={(myState?.coins || 0) < 15 || !activeQuestion}
              className="btn btn-cyan py-1.5 px-3 text-xs"
            >
              Buy
            </button>
          </div>

          {/* Extra Time */}
          <div className="glass-card flex justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1">
                Extra Time <span className="text-[10px] text-gold">(10 Coins)</span>
              </h4>
              <p className="text-[10px] text-text-muted">Adds +15 seconds to countdown timer.</p>
            </div>
            <button 
              onClick={() => handleBuyPowerup('extra_time')}
              disabled={(myState?.coins || 0) < 10 || !activeQuestion}
              className="btn btn-cyan py-1.5 px-3 text-xs"
            >
              Buy
            </button>
          </div>

          {/* Shield */}
          <div className="glass-card flex justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1 flex-wrap">
                Active Shield <span className="text-[10px] text-gold">(20 Coins)</span>
                {myState?.shield && <span className="text-[9px] px-1 bg-green-10 text-green border border-green rounded ml-1">Owned</span>}
              </h4>
              <p className="text-[10px] text-text-muted">Protects from next Trap tile or negative Mystery.</p>
            </div>
            <button 
              onClick={() => handleBuyPowerup('shield')}
              disabled={(myState?.coins || 0) < 20 || myState?.shield}
              className="btn btn-cyan py-1.5 px-3 text-xs"
            >
              Buy
            </button>
          </div>

          {/* Double Move */}
          <div className="glass-card flex justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1 flex-wrap">
                Double Movement <span className="text-[10px] text-gold">(25 Coins)</span>
                {myState?.doubleMove && <span className="text-[9px] px-1 bg-cyan-10 text-cyan border border-cyan rounded ml-1">Active</span>}
              </h4>
              <p className="text-[10px] text-text-muted">Doubles the steps of your next correct answer.</p>
            </div>
            <button 
              onClick={() => handleBuyPowerup('double_move')}
              disabled={(myState?.coins || 0) < 25 || myState?.doubleMove}
              className="btn btn-cyan py-1.5 px-3 text-xs"
            >
              Buy
            </button>
          </div>

          {/* Trap Protect */}
          <div className="glass-card flex justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1 flex-wrap">
                Trap Protection <span className="text-[10px] text-gold">(15 Coins)</span>
                {myState?.trapProtect && <span className="text-[9px] px-1 bg-green-10 text-green border border-green rounded ml-1">Owned</span>}
              </h4>
              <p className="text-[10px] text-text-muted">Shield specifically for Trap tile penalties.</p>
            </div>
            <button 
              onClick={() => handleBuyPowerup('trap_protect')}
              disabled={(myState?.coins || 0) < 15 || myState?.trapProtect}
              className="btn btn-cyan py-1.5 px-3 text-xs"
            >
              Buy
            </button>
          </div>
        </div>

        {shopError && (
          <p className="text-red text-xs font-semibold">{shopError}</p>
        )}
      </div>
    </div>
  );
}

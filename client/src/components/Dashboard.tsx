
import { Trophy, User, Play, BookOpen, LogOut, Plus, HelpCircle } from 'lucide-react';

export function Dashboard({ gameState }: { gameState: any }) {
  const {
    user,
    logout,
    fetchUserProfile,
    gameModeSelect, setGameModeSelect,
    roomCodeInput, setRoomCodeInput,
    handleCreateRoom, handleJoinRoom,
    dashboardError,
    matchHistory,
    leaderboard,
    profileViewUser, setProfileViewUser,
    mechanicsViewOpen, setMechanicsViewOpen
  } = gameState;

  return (
    <div className="container py-8 flex-1 flex flex-col gap-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{user.avatar}</span>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {user.username}
              {user.id && (
                <span className="text-xs px-2 py-0.5 bg-cyan text-black rounded-full font-semibold">
                  Level {Math.floor(user.xp / 1000) + 1}
                </span>
              )}
            </h2>
            <p className="text-sm text-text-muted">
              {user.id ? `XP: ${user.xp} • Coins: ${user.coins}` : 'Guest Session'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setMechanicsViewOpen(true)}
            className="btn btn-outline py-2 px-4 border-gold text-gold hover:bg-gold-05"
          >
            <HelpCircle size={18} /> Mechanics Guide
          </button>
          <button 
            onClick={() => fetchUserProfile(user.username)}
            className="btn btn-outline py-2 px-4"
          >
            <User size={18} /> Profile Stats
          </button>
          <button onClick={logout} className="btn btn-outline border-red text-red hover:bg-red-05 py-2 px-4">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Core Dashboard Grid */}
      <div className="dashboard-grid flex-1">
        {/* Play Actions & Rooms */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white-05 pb-3">
              <Play size={20} className="text-cyan" /> Select Game Mode
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => setGameModeSelect('Training')}
                className={`glass-card p-4 text-left flex flex-col gap-2 ${gameModeSelect === 'Training' ? 'border-cyan bg-cyan-05' : ''}`}
              >
                <span className="text-xs uppercase font-extrabold text-green">Training (Solo)</span>
                <h4 className="text-base font-bold text-white">Practice Mode</h4>
                <p className="text-xs text-text-muted">Play alone to learn the mechanics without tracking stats.</p>
              </button>

              <button 
                onClick={() => setGameModeSelect('1v1')}
                className={`glass-card p-4 text-left flex flex-col gap-2 ${gameModeSelect === '1v1' ? 'border-cyan bg-cyan-05' : ''}`}
              >
                <span className="text-xs uppercase font-extrabold text-cyan">1v1 Duel</span>
                <h4 className="text-base font-bold text-white">Head-to-Head</h4>
                <p className="text-xs text-text-muted">2 players compete individually on a race track.</p>
              </button>

              <button 
                onClick={() => setGameModeSelect('2v2')}
                className={`glass-card p-4 text-left flex flex-col gap-2 ${gameModeSelect === '2v2' ? 'border-cyan bg-cyan-05' : ''}`}
              >
                <span className="text-xs uppercase font-extrabold text-purple">2v2 Team Battle</span>
                <h4 className="text-base font-bold text-white">Cooperative</h4>
                <p className="text-xs text-text-muted">4 players divided into 2 teams sharing one pawn.</p>
              </button>

              <button 
                onClick={() => setGameModeSelect('FFA')}
                className={`glass-card p-4 text-left flex flex-col gap-2 ${gameModeSelect === 'FFA' ? 'border-cyan bg-cyan-05' : ''}`}
              >
                <span className="text-xs uppercase font-extrabold text-gold">Free-for-All</span>
                <h4 className="text-base font-bold text-white">Multiplayer Madness</h4>
                <p className="text-xs text-text-muted">Up to 4 players, each controlling their own pawn.</p>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <button onClick={handleCreateRoom} className="btn btn-cyan flex-1 py-3 text-base">
                <Plus size={20} /> Create New Room
              </button>
              
              <div className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder="Enter Room Code (e.g. AB12CD)"
                  className="form-input text-center font-bold tracking-widest text-white flex-1"
                />
                <button onClick={handleJoinRoom} className="btn btn-purple py-3 px-6">
                  Join Room
                </button>
              </div>
            </div>

            {dashboardError && (
              <p className="text-red text-sm font-semibold">{dashboardError}</p>
            )}
          </div>

          {/* Match History */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white-05 pb-3">
              <BookOpen size={20} className="text-purple" /> Recent Matches
            </h3>
            {matchHistory.length === 0 ? (
              <p className="text-text-muted text-sm py-4">No recent matches found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {matchHistory.map((m: any) => (
                  <div key={m.id} className="glass-card flex justify-between items-center gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-glow border border-purple rounded text-xs text-purple font-semibold">
                          {m.game_mode}
                        </span>
                        <span className="text-white-80">Winner: <b>{m.winner_username}</b></span>
                      </div>
                      <div className="flex gap-2 text-xs text-text-muted mt-1">
                        {m.players.map((p: any) => (
                          <span key={p.username}>{p.username} (rank {p.rank})</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(m.played_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Leaderboard */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white-05 pb-3">
            <Trophy size={20} className="text-gold" /> Global Leaderboard
          </h3>
          
          {leaderboard.length === 0 ? (
            <p className="text-text-muted text-sm py-4">No rankings yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {leaderboard.map((item: any, idx: number) => (
                <div 
                  key={item.id} 
                  onClick={() => fetchUserProfile(item.username)}
                  className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all hover:bg-white-05 border ${idx === 0 ? 'border-gold bg-gold-05' : 'border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-gold w-6 text-center">#{idx + 1}</span>
                    <span className="text-xl">{item.avatar}</span>
                    <span className="text-sm font-bold text-white">{item.username}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-cyan">{item.xp} XP</span>
                    <p className="text-[10px] text-text-muted">Won: {item.games_won || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Statistics Modal */}
      {profileViewUser && (
        <div className="victory-overlay flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setProfileViewUser(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-extrabold"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 border-b border-white-05 pb-4">
              <span className="text-5xl">{profileViewUser.user.avatar}</span>
              <div>
                <h3 className="text-xl font-bold text-white">{profileViewUser.user.username}</h3>
                <p className="text-sm text-text-muted">Joined {new Date(profileViewUser.user.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card text-center">
                <span className="text-xs text-text-muted block">Games Played</span>
                <b className="text-xl text-white">{profileViewUser.stats.games_played}</b>
              </div>
              <div className="glass-card text-center">
                <span className="text-xs text-text-muted block">Games Won</span>
                <b className="text-xl text-gold">{profileViewUser.stats.games_won}</b>
              </div>
              <div className="glass-card text-center">
                <span className="text-xs text-text-muted block">Correct Answers</span>
                <b className="text-xl text-green">{profileViewUser.stats.correct_answers}</b>
              </div>
              <div className="glass-card text-center">
                <span className="text-xs text-text-muted block">Wrong Answers</span>
                <b className="text-xl text-red">{profileViewUser.stats.wrong_answers}</b>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-2">Unlocked Achievements</h4>
              {profileViewUser.achievements.length === 0 ? (
                <p className="text-xs text-text-muted">No achievements unlocked yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileViewUser.achievements.map((ach: any) => (
                    <span 
                      key={ach.type}
                      className="px-2.5 py-1 bg-cyan-10 border border-cyan rounded-full text-xs text-cyan font-bold"
                      title={`Unlocked: ${new Date(ach.unlocked_at).toLocaleDateString()}`}
                    >
                      🏆 {ach.type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mechanics Guide Modal */}
      {mechanicsViewOpen && (
        <div className="victory-overlay flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-2xl p-6 flex flex-col gap-4 relative max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setMechanicsViewOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white text-lg font-extrabold"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gold flex items-center gap-2 mb-4">
              <HelpCircle /> Game Mechanics & Rules
            </h2>
            
            <div className="space-y-6 text-sm text-white-80">
              <section>
                <h3 className="text-lg font-bold text-white mb-2 border-b border-white-05 pb-1">Board Tiles</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><b>Normal (Gray)</b>: A standard trivia question.</li>
                  <li><b>Wildcard (Purple)</b>: Choose your preferred category for the question!</li>
                  <li><b>Trap (Red)</b>: If you land here and fail the question, you lose 5 coins or get pushed back.</li>
                  <li><b>Minigame (Gold)</b>: Triggers a special mini-event for bonus coins (coming soon).</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2 border-b border-white-05 pb-1">Characters & Abilities</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><b>Warrior</b>: "Shield Wall" - Grants immunity to Traps for 1 turn.</li>
                  <li><b>Mage</b>: "Arcane Knowledge" - Reveals the correct category of a hidden tile.</li>
                  <li><b>Rogue</b>: "Swift Step" - Move +1 extra space if you answer correctly.</li>
                  <li><b>Scholar</b>: "Deep Study" - Earn 2x coins on your next correct answer.</li>
                  <li><b>Chronomancer</b>: "Time Distortion" - Reroll the current trivia question once.</li>
                  <li><b>Cleric</b>: "Divine Intervention" - Saves you from losing your streak on a wrong answer.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2 border-b border-white-05 pb-1">Power-ups (Shop)</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><b>Shield (10 coins)</b>: Protects against the next trap.</li>
                  <li><b>Double Move (15 coins)</b>: Moves twice the distance on your next correct answer.</li>
                  <li><b>Trap Protect (5 coins)</b>: Defuses the trap you are currently standing on.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

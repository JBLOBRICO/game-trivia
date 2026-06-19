
import { Trophy, User, Play, BookOpen, LogOut, Plus } from 'lucide-react';

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
    profileViewUser, setProfileViewUser
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
}

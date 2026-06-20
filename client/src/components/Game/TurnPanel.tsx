
import { ShoppingBag, Clock, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../constants';

export function TurnPanel({ gameState }: { gameState: any }) {
  const {
    activeQuestion, turnResult, isMyTurn, roomState, myState,
    chosenCategory, setChosenCategory, handleSelectDifficulty,
    setShopOpen, activeQuestionTimer, activePlayer,
    handleUseAbility, eliminatedChoices, submittedAnswer,
    handleSubmitAnswer, setTurnResult, user
  } = gameState;

  return (
    <div className="lg:col-span-2 flex flex-col gap-6">
      {/* Question Not Active (Choose Difficulty) */}
      {!activeQuestion && !turnResult && (
        <div className="glass-panel p-6 flex flex-col gap-4 flex-1 justify-center">
          <div className="text-center py-4">
            <h3 className="text-xl font-bold text-white mb-2">
              {isMyTurn ? '🎯 Your Turn! Choose Your Risk' : `⏳ Waiting for ${roomState.activePlayerUsername} to select difficulty...`}
            </h3>
            <p className="text-sm text-text-muted">
              Your pawn is currently standing on space <b>#{myState?.position}</b> which is a <b>{roomState.board[myState?.position || 0].category}</b> tile.
            </p>
          </div>

          {isMyTurn && (
            <div className="flex flex-col gap-6">
              {/* Wild Card category selector */}
              {roomState.board[myState?.position || 0].type === 'wildcard' && (
                <div className="glass-card p-4 flex flex-col gap-2">
                  <label className="text-xs uppercase font-extrabold text-cyan">Wild Card! Choose Category</label>
                  <select 
                    value={chosenCategory}
                    onChange={(e) => setChosenCategory(e.target.value)}
                    className="form-input text-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleSelectDifficulty('easy')}
                  className="glass-card p-4 text-center border-green-20 hover:border-green flex flex-col items-center gap-2"
                >
                  <span className="text-xs font-bold text-green uppercase">Easy</span>
                  <span className="text-2xl font-black text-white">1 Step</span>
                  <span className="text-[10px] text-text-muted">Reward: +5 Coins</span>
                </button>

                <button 
                  onClick={() => handleSelectDifficulty('medium')}
                  className="glass-card p-4 text-center border-cyan-20 hover:border-cyan flex flex-col items-center gap-2"
                >
                  <span className="text-xs font-bold text-cyan uppercase">Medium</span>
                  <span className="text-2xl font-black text-white">2 Steps</span>
                  <span className="text-[10px] text-text-muted">Reward: +10 Coins</span>
                </button>

                <button 
                  onClick={() => handleSelectDifficulty('hard')}
                  className="glass-card p-4 text-center border-purple-20 hover:border-purple flex flex-col items-center gap-2"
                >
                  <span className="text-xs font-bold text-purple uppercase">Hard</span>
                  <span className="text-2xl font-black text-white">3 Steps</span>
                  <span className="text-[10px] text-text-muted">Reward: +15 Coins</span>
                </button>
              </div>

              {/* Store Shop Button */}
              <button 
                onClick={() => setShopOpen(true)}
                className="btn btn-outline py-3 flex-center gap-2 text-gold border-gold-20 hover:bg-gold-05"
              >
                <ShoppingBag size={20} /> Open Power-up Shop
              </button>
            </div>
          )}
        </div>
      )}

      {/* Question Is Active Panel */}
      {activeQuestion && (
        <div className="glass-panel p-6 flex flex-col gap-6">
          {/* Timer Header */}
          <div className="flex justify-between items-center">
            <span className="px-3 py-1 bg-cyan-10 border border-cyan rounded-xl text-xs text-cyan font-bold">
              Category: {activeQuestion.category} ({activeQuestion.difficulty.toUpperCase()})
            </span>
            
            <div className="flex items-center gap-2 text-gold font-bold">
              <Clock size={16} />
              <span>{activeQuestionTimer}s Remaining</span>
            </div>
          </div>

          {/* Visual timer bar */}
          <div className="timer-bar">
            <div 
              className={`timer-fill ${activeQuestionTimer <= 5 ? 'danger' : ''}`}
              style={{ width: `${(activeQuestionTimer / (activePlayer?.character === 'The Chronomancer' ? 30 : 20)) * 100}%` }}
            />
          </div>

          {/* Character Abilities / Shop items context during question */}
          {isMyTurn && !submittedAnswer && (
            <div className="flex justify-between items-center bg-black-20 p-3 rounded-xl border border-white-05">
              <span className="text-xs text-text-muted">Available Helpers:</span>
              <div className="flex gap-2">
                {myState?.character === 'The Scholar' && (
                  <button 
                    onClick={handleUseAbility}
                    className="btn btn-purple px-3 py-1 text-xs"
                    title="Removes 2 incorrect choices"
                  >
                    💡 Use Scholar Ability
                  </button>
                )}
                {myState?.character === 'The Chronomancer' && (
                  <button 
                    onClick={handleUseAbility}
                    className="btn btn-purple px-3 py-1 text-xs"
                    title="Rerolls current question"
                  >
                    ⏳ Use Chrono Ability
                  </button>
                )}
                <button 
                  onClick={() => setShopOpen(true)}
                  className="btn btn-outline border-gold text-gold hover:bg-gold-05 px-3 py-1 text-xs"
                >
                  🛒 Shop Power-ups
                </button>
              </div>
            </div>
          )}

          {/* Question Card Front */}
          <div className="question-scene">
            <div className="glass-card p-6 bg-black-30 border-white-05">
              <p className="text-lg font-semibold text-white leading-relaxed text-center">
                {activeQuestion.question_text}
              </p>
            </div>
          </div>

          {/* Choices list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQuestion.choices.map((choice: string) => {
              const isEliminated = eliminatedChoices.includes(choice);
              const isSelected = submittedAnswer === choice;

              return (
                <button
                  key={choice}
                  onClick={() => handleSubmitAnswer(choice)}
                  disabled={!isMyTurn || isEliminated || !!submittedAnswer}
                  className={`btn text-left p-4 rounded-xl text-sm font-medium transition-all ${
                    isSelected 
                      ? 'bg-cyan text-black border-cyan' 
                      : isEliminated 
                        ? 'opacity-20 cursor-not-allowed bg-black-30 border-transparent text-text-muted' 
                        : 'bg-white-05 border border-white-05 text-white hover:border-cyan hover:bg-white-10'
                  }`}
                >
                  <span className="mr-2 font-bold opacity-60">
                    {choice === activeQuestion.choices[0] ? 'A.' : choice === activeQuestion.choices[1] ? 'B.' : choice === activeQuestion.choices[2] ? 'C.' : 'D.'}
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>

          {!isMyTurn && (
            <p className="text-xs text-text-muted text-center italic">
              Waiting for {roomState.activePlayerUsername} to submit their response...
            </p>
          )}
        </div>
      )}

      {/* Turn Result Screen */}
      {turnResult && (
        <div className="glass-panel p-6 flex flex-col gap-6 text-center animate-fade-in">
          <div className="flex justify-center">
            <div className={`p-4 rounded-full border ${turnResult.isCorrect ? 'border-green bg-green-10 glow-green' : 'border-red bg-red-10 glow-red'}`}>
              {turnResult.isCorrect ? <Check size={40} className="text-green" /> : <AlertTriangle size={40} className="text-red" />}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black text-white">
              {turnResult.playerUsername === user.username ? (
                turnResult.isCorrect ? 'Correct Answer!' : 'Incorrect!'
              ) : (
                `${turnResult.playerUsername} answered ${turnResult.isCorrect ? 'CORRECTLY!' : 'INCORRECTLY!'}`
              )}
            </h3>
            <p className="text-sm text-text-muted mt-2">
              Correct Answer was: <b className="text-green">{turnResult.correctAnswer}</b>
            </p>
          </div>

          {turnResult.explanation && (
            <div className="glass-card p-4 text-sm text-text-muted leading-relaxed max-w-lg mx-auto bg-black-20">
              <b className="text-white block mb-1">Explanation</b>
              {turnResult.explanation}
            </div>
          )}

          <div className="flex justify-center gap-4 text-xs font-bold bg-white-05 p-3 rounded-xl max-w-sm mx-auto">
            <span className="text-green">+{turnResult.movement} Steps</span>
            <span className="text-gold">+{turnResult.coinsEarned} Coins</span>
            {turnResult.eventTriggeredText && (
              <span className="text-cyan">{turnResult.eventTriggeredText}</span>
            )}
          </div>

          <button 
            onClick={() => setTurnResult(null)}
            className="btn btn-cyan px-8 py-3 max-w-xs mx-auto text-base"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

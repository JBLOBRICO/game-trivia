
import { AVATARS } from '../hooks/useGameState';

export function Auth({ gameState }: { gameState: any }) {
  const {
    authMode, setAuthMode,
    selectedAvatar, setSelectedAvatar,
    handleAuth,
    usernameInput, setUsernameInput,
    passwordInput, setPasswordInput,
    authError
  } = gameState;

  return (
    <div className="container min-h-screen flex flex-col justify-center items-center">
      <div className="glass-card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          {authMode === 'login' ? 'Login' : authMode === 'register' ? 'Register' : 'Play as Guest'}
        </h2>
        {(authMode === 'register' || authMode === 'guest') && (
          <div className="avatar-select mb-4">
            {AVATARS.map((av) => (
              <div
                key={av}
                className={`avatar-option ${selectedAvatar === av ? 'selected' : ''}`}
                onClick={() => setSelectedAvatar(av)}
              >
                {av}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="form-input"
            required
          />
          {authMode !== 'guest' && (
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="form-input"
              required
            />
          )}
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button type="submit" className="btn btn-cyan w-full">
            {authMode === 'login' ? 'Log In' : authMode === 'register' ? 'Register' : 'Enter'}
          </button>
        </form>
        <div className="flex justify-between mt-4 text-sm text-text-muted">
          {authMode !== 'guest' && (
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="hover:underline"
            >
              {authMode === 'login' ? 'Create account' : 'Already have account?'}
            </button>
          )}
          {authMode !== 'guest' && (
            <button
              type="button"
              onClick={() => setAuthMode('guest')}
              className="hover:underline"
            >
              Play as Guest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

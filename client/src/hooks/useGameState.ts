import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { playCorrect, playIncorrect, playCoin, playMove, playTick, playVictory } from '../utils/sound';
export const API_BASE = "https://game-trivia.onrender.com";

export const AVATARS = ['🐱', '🐶', '🦊', '🦁', '🐸', '🐨', '🐼', '🦄', '🐉', '🦉'];

export const CHARACTERS = [
  {
    name: 'The Scholar',
    emoji: '💡',
    abilityName: 'Scientific Method',
    abilityDesc: 'Active: Once per turn, removes 2 incorrect choices for the current question (3-turn cooldown).',
    color: 'linear-gradient(135deg, #ffe600, #ffaa00)'
  },
  {
    name: 'The Pathfinder',
    emoji: '🧭',
    abilityName: 'Shortcut Master',
    abilityDesc: 'Passive: Correct answers on Medium/Hard questions reward +1 bonus step movement.',
    color: 'linear-gradient(135deg, #00f0ff, #00bbff)'
  },
  {
    name: 'The Chronomancer',
    emoji: '⏳',
    abilityName: 'Time Distortion',
    abilityDesc: 'Passive: Gets +10 seconds on all timers. Active: Rerolls the question once per match.',
    color: 'linear-gradient(135deg, #d000ff, #7700ff)'
  },
  {
    name: 'The Fortune Finder',
    emoji: '🪙',
    abilityName: 'Golden Touch',
    abilityDesc: 'Passive: Earns 50% more coins for all correct answers.',
    color: 'linear-gradient(135deg, #ffaa00, #ff5500)'
  }
];

export function useGameState() {
  // Navigation & User
  const [view, setView] = useState<'auth' | 'dashboard' | 'lobby' | 'game'>('auth');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);

  // Auth Form
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'guest'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐱');
  const [authError, setAuthError] = useState('');

  // Dashboard / Lobby Code
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [gameModeSelect, setGameModeSelect] = useState<'1v1' | '2v2' | 'FFA' | 'Training'>('FFA');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [profileViewUser, setProfileViewUser] = useState<any>(null);
  const [mechanicsViewOpen, setMechanicsViewOpen] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  // Socket & Lobby/Game State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Turn Question States
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [activeQuestionTimer, setActiveQuestionTimer] = useState<number>(0);
  const [chosenCategory, setChosenCategory] = useState<string>('General Knowledge');
  const [eliminatedChoices, setEliminatedChoices] = useState<string[]>([]);
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [turnResult, setTurnResult] = useState<any>(null);

  // Shop
  const [shopOpen, setShopOpen] = useState(false);
  const [shopError, setShopError] = useState('');

  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init User Session
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setView('auth');
    }
    fetchLeaderboard();
    fetchMatches();
  }, [token]);

  // Scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, roomState?.logs]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setView('dashboard');
      } else {
        logout();
      }
    } catch (e) {
      logout();
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats/leaderboard`);
      const data = await res.json();
      if (res.ok) setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats/matches`);
      const data = await res.json();
      if (res.ok) setMatchHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserProfile = async (username: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/stats/profile/${username}`);
      const data = await res.json();
      if (res.ok) {
        setProfileViewUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('auth');
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Connect Socket on Room Join / Create
  const connectSocket = () => {
    if (socket) return socket;
    const s = io(API_BASE);

    s.on('connect', () => {
      console.log('Socket connected');
    });

    s.on('room:state', (state) => {
      setRoomState(state);
      if (state.status === 'playing') {
        setView('game');
      } else if (state.status === 'lobby') {
        setView('lobby');
      } else if (state.status === 'gameover') {
        setView('game');
      }
    });

    s.on('room:error', (err) => {
      alert(err);
    });

    s.on('game:started', (state) => {
      setRoomState(state);
      setView('game');
      setActiveQuestion(null);
      setTurnResult(null);
    });

    s.on('game:question', ({ question, secondsRemaining }) => {
      setActiveQuestion(question);
      setActiveQuestionTimer(secondsRemaining);
      setEliminatedChoices([]);
      setSubmittedAnswer(null);
      setTurnResult(null);

      // Start countdown sound if enabled
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setActiveQuestionTimer(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          if (soundEnabled && prev <= 6) {
            playTick();
          }
          return prev - 1;
        });
      }, 1000);
    });

    s.on('game:timer_update', (sec) => {
      setActiveQuestionTimer(sec);
    });

    s.on('game:ability_used', ({ removedChoices }) => {
      setEliminatedChoices(removedChoices);
    });

    s.on('game:turn_result', ({ playerUsername, isCorrect, correctAnswer, explanation, movement, coinsEarned, eventTriggeredText, isGameOver, cleanRoomState }) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      setRoomState(cleanRoomState);
      setActiveQuestion(null);
      setSubmittedAnswer(null);
      setEliminatedChoices([]);
      setTurnResult({
        playerUsername,
        isCorrect,
        correctAnswer,
        explanation,
        movement,
        coinsEarned,
        eventTriggeredText
      });

      if (soundEnabled) {
        if (isCorrect) {
          playCorrect();
          // Delay playMove to match visuals
          setTimeout(() => {
            playMove();
            if (eventTriggeredText) playCoin();
          }, 600);
        } else {
          playIncorrect();
        }
      }

      if (isGameOver) {
        if (soundEnabled) playVictory();
      }
    });

    s.on('game:chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    setSocket(s);
    return s;
  };

  // Auth operations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'guest') {
      if (!usernameInput.trim()) {
        setAuthError('Guest username is required.');
        return;
      }
      setUser({
        id: null,
        username: usernameInput.trim(),
        avatar: selectedAvatar,
        xp: 0,
        coins: 20
      });
      setView('dashboard');
      return;
    }

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setAuthError('Username and password are required.');
      return;
    }

    try {
      const endpoint = authMode === 'login' ? 'login' : 'register';
      const body = authMode === 'login'
        ? { username: usernameInput, password: passwordInput }
        : { username: usernameInput, password: passwordInput, avatar: selectedAvatar };

      const res = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Failed to contact server.');
    }
  };

  // Lobby operations
  const handleCreateRoom = () => {
    setDashboardError('');
    if (!user) return;
    const s = connectSocket();
    s.emit('room:create', {
      username: user.username,
      userId: user.id,
      avatar: user.avatar,
      gameMode: gameModeSelect
    });
  };

  const handleJoinRoom = () => {
    setDashboardError('');
    if (!roomCodeInput.trim()) {
      setDashboardError('Enter a valid room code.');
      return;
    }
    if (!user) return;
    const s = connectSocket();
    s.emit('room:join', {
      roomCode: roomCodeInput.trim().toUpperCase(),
      username: user.username,
      userId: user.id,
      avatar: user.avatar
    });
  };

  const handleSelectCharacter = (character: string) => {
    if (!socket || !roomState) return;
    socket.emit('room:select_character', { roomCode: roomState.roomCode, character });
  };

  const handleToggleReady = (ready: boolean) => {
    if (!socket || !roomState) return;
    socket.emit('room:ready', { roomCode: roomState.roomCode, ready });
  };

  const handleStartGame = () => {
    if (!socket || !roomState) return;
    socket.emit('room:start', { roomCode: roomState.roomCode });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !roomState || !chatInput.trim()) return;
    socket.emit('game:chat', { roomCode: roomState.roomCode, message: chatInput.trim() });
    setChatInput('');
  };

  // Game operations
  const handleSelectDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    if (!socket || !roomState) return;
    socket.emit('game:select_difficulty', {
      roomCode: roomState.roomCode,
      difficulty: diff,
      chosenCategory: chosenCategory
    });
  };

  const handleUseAbility = () => {
    if (!socket || !roomState) return;
    socket.emit('game:use_ability', { roomCode: roomState.roomCode });
  };

  const handleBuyPowerup = (type: string) => {
    if (!socket || !roomState) return;
    setShopError('');
    socket.emit('game:buy_powerup', { roomCode: roomState.roomCode, powerupType: type });
  };

  const handleSubmitAnswer = (answer: string) => {
    if (!socket || !roomState || submittedAnswer) return;
    setSubmittedAnswer(answer);
    socket.emit('game:submit_answer', { roomCode: roomState.roomCode, answer });
  };

  const handleLeaveGame = () => {
    if (socket && roomState) {
      socket.emit('room:leave', { roomCode: roomState.roomCode });
    }
    setView('dashboard');
    setRoomState(null);
    setActiveQuestion(null);
    setTurnResult(null);
    fetchLeaderboard();
    fetchMatches();
  };

  const activePlayer = roomState?.players?.find((p: any) => p.username === roomState.activePlayerUsername);
  const isMyTurn = roomState?.activePlayerUsername === user?.username;
  const myState = roomState?.players?.find((p: any) => p.username === user?.username);

  return {
    view, setView,
    token, setToken,
    user, setUser,
    authMode, setAuthMode,
    usernameInput, setUsernameInput,
    passwordInput, setPasswordInput,
    selectedAvatar, setSelectedAvatar,
    authError, setAuthError,
    roomCodeInput, setRoomCodeInput,
    gameModeSelect, setGameModeSelect,
    leaderboard, setLeaderboard,
    matchHistory, setMatchHistory,
    profileViewUser, setProfileViewUser,
    mechanicsViewOpen, setMechanicsViewOpen,
    dashboardError, setDashboardError,
    socket, setSocket,
    roomState, setRoomState,
    chatInput, setChatInput,
    chatMessages, setChatMessages,
    soundEnabled, setSoundEnabled,
    selectedDifficulty, setSelectedDifficulty,
    activeQuestion, setActiveQuestion,
    activeQuestionTimer, setActiveQuestionTimer,
    chosenCategory, setChosenCategory,
    eliminatedChoices, setEliminatedChoices,
    submittedAnswer, setSubmittedAnswer,
    turnResult, setTurnResult,
    shopOpen, setShopOpen,
    shopError, setShopError,
    chatEndRef,
    timerIntervalRef,

    // Actions
    fetchUserProfile,
    logout,
    handleAuth,
    handleCreateRoom,
    handleJoinRoom,
    handleSelectCharacter,
    handleToggleReady,
    handleStartGame,
    handleSendChat,
    handleSelectDifficulty,
    handleUseAbility,
    handleBuyPowerup,
    handleSubmitAnswer,
    handleLeaveGame,

    // Computed
    activePlayer,
    isMyTurn,
    myState
  };
}

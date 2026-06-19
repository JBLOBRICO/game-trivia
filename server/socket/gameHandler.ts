import { Server, Socket } from 'socket.io';
import { getDatabase } from '../db/database';
import { updatePlayerMatchStats } from '../routes/stats';

// Interfaces for our game engine
interface Player {
  socketId: string;
  userId: number | null; // null for guest
  username: string;
  avatar: string;
  character: string | null;
  ready: boolean;
  team: 1 | 2; // used in 2v2
  position: number;
  coins: number;
  streak: number;
  shield: boolean;
  doubleMove: boolean;
  trapProtect: boolean;
  lastAnswerCorrect: boolean | null;
}

interface Tile {
  index: number;
  category: string;
  type: 'normal' | 'wildcard' | 'mystery' | 'trap' | 'shortcut' | 'treasure' | 'bonus' | 'challenge';
  shortcutDestination?: number;
}

interface GameRoom {
  roomCode: string;
  gameMode: '1v1' | '2v2' | 'FFA';
  status: 'lobby' | 'playing' | 'gameover';
  players: Player[];
  turnIndex: number;
  board: Tile[];
  currentQuestion: any | null;
  questionTimer: NodeJS.Timeout | null;
  secondsRemaining: number;
  logs: string[];
  winnerUsername?: string;
  usedQuestionIds: Set<number>;
  activeQuestionDifficulty: 'easy' | 'medium' | 'hard' | null;
  characterAbilityUsedThisTurn: boolean;
  activeChronomancerRerolls: Record<string, number>; // username -> rerolls used
}

// In-memory store for game rooms
const rooms: Record<string, GameRoom> = {};

// Categories list
const CATEGORIES = [
  'General Knowledge', 'Science', 'History', 'Geography', 'Technology',
  'Sports', 'Movies', 'Music', 'Gaming', 'Pop Culture'
];

// Generate board path of 40 tiles
function generateBoard(): Tile[] {
  const board: Tile[] = [];
  // Standard categories distributed along the track
  for (let i = 0; i < 40; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    board.push({
      index: i,
      category,
      type: 'normal'
    });
  }

  // Set special tiles
  board[0].type = 'normal'; // Start
  board[39].type = 'normal'; // Finish

  // Interactive tiles distribution
  board[4].type = 'bonus';
  board[8].type = 'wildcard';
  board[12].type = 'trap';
  board[15].type = 'mystery';
  
  // Shortcut: Tile 18 goes to 23 (skips 5 spaces)
  board[18].type = 'shortcut';
  board[18].shortcutDestination = 23;

  board[22].type = 'treasure';
  board[26].type = 'challenge';
  board[29].type = 'trap';
  board[33].type = 'mystery';
  board[36].type = 'bonus';

  return board;
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create a new room
    socket.on('room:create', ({ username, userId, avatar, gameMode }) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPlayer: Player = {
        socketId: socket.id,
        userId: userId || null,
        username,
        avatar,
        character: null,
        ready: false,
        team: 1, // Default, will adjust in 2v2 setup
        position: 0,
        coins: 20, // Start with 20 coins
        streak: 0,
        shield: false,
        doubleMove: false,
        trapProtect: false,
        lastAnswerCorrect: null
      };

      rooms[roomCode] = {
        roomCode,
        gameMode,
        status: 'lobby',
        players: [newPlayer],
        turnIndex: 0,
        board: generateBoard(),
        currentQuestion: null,
        questionTimer: null,
        secondsRemaining: 0,
        logs: [`Room created by ${username} in ${gameMode} mode.`],
        usedQuestionIds: new Set<number>(),
        activeQuestionDifficulty: null,
        characterAbilityUsedThisTurn: false,
        activeChronomancerRerolls: {}
      };

      socket.join(roomCode);
      socket.emit('room:created', { roomCode, gameMode });
      io.to(roomCode).emit('room:state', getCleanRoomState(roomCode));
    });

    // Join room
    socket.on('room:join', ({ roomCode, username, userId, avatar }) => {
      const room = rooms[roomCode];
      if (!room) {
        return socket.emit('room:error', 'Room not found.');
      }
      if (room.status !== 'lobby') {
        return socket.emit('room:error', 'Game already in progress.');
      }
      
      const maxPlayers = room.gameMode === '1v1' ? 2 : 4;
      if (room.players.length >= maxPlayers) {
        return socket.emit('room:error', 'Room is full.');
      }

      // Determine team in 2v2
      // Team 1: Player 1 (index 0) and Player 3 (index 2)
      // Team 2: Player 2 (index 1) and Player 4 (index 3)
      let team: 1 | 2 = 1;
      if (room.gameMode === '2v2') {
        team = (room.players.length % 2 === 0) ? 1 : 2;
      }

      const newPlayer: Player = {
        socketId: socket.id,
        userId: userId || null,
        username,
        avatar,
        character: null,
        ready: false,
        team,
        position: 0,
        coins: 20,
        streak: 0,
        shield: false,
        doubleMove: false,
        trapProtect: false,
        lastAnswerCorrect: null
      };

      room.players.push(newPlayer);
      room.logs.push(`${username} joined the lobby.`);

      socket.join(roomCode);
      io.to(roomCode).emit('room:state', getCleanRoomState(roomCode));
    });

    // Select character
    socket.on('room:select_character', ({ roomCode, character }) => {
      const room = rooms[roomCode];
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.character = character;
        room.logs.push(`${player.username} selected ${character}.`);
        io.to(roomCode).emit('room:state', getCleanRoomState(roomCode));
      }
    });

    // Toggle ready
    socket.on('room:ready', ({ roomCode, ready }) => {
      const room = rooms[roomCode];
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.ready = ready;
        io.to(roomCode).emit('room:state', getCleanRoomState(roomCode));
      }
    });

    // Start match
    socket.on('room:start', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room) return;
      
      const unready = room.players.find(p => !p.ready);
      if (unready) {
        return socket.emit('room:error', 'All players must be ready.');
      }

      const minPlayers = room.gameMode === '1v1' ? 2 : (room.gameMode === '2v2' ? 4 : 2);
      if (room.players.length < minPlayers) {
        return socket.emit('room:error', `Need at least ${minPlayers} players for ${room.gameMode}.`);
      }

      // Initialize game
      room.status = 'playing';
      room.turnIndex = 0;
      room.logs.push('The match has officially started!');
      io.to(roomCode).emit('game:started', getCleanRoomState(roomCode));
    });

    // Request difficulty/category question
    socket.on('game:select_difficulty', async ({ roomCode, difficulty, chosenCategory }) => {
      const room = rooms[roomCode];
      if (!room || room.status !== 'playing') return;

      const activePlayer = room.players[room.turnIndex];
      if (activePlayer.socketId !== socket.id) {
        return socket.emit('room:error', 'It is not your turn.');
      }

      // Determine the category
      let category = room.board[activePlayer.position].category;
      
      // Override if Wild Card
      if (room.board[activePlayer.position].type === 'wildcard' && chosenCategory) {
        category = chosenCategory;
      }

      room.activeQuestionDifficulty = difficulty;
      room.characterAbilityUsedThisTurn = false;

      try {
        const db = await getDatabase();
        
        // Fetch a random question that hasn't been used yet in this match
        let question = await db.get(
          'SELECT * FROM questions WHERE category = ? AND difficulty = ? AND id NOT IN (' + 
          Array.from(room.usedQuestionIds).join(',') + ') ORDER BY RANDOM() LIMIT 1',
          [category, difficulty]
        );

        // Fallback: If all questions used, allow duplicates
        if (!question) {
          question = await db.get(
            'SELECT * FROM questions WHERE category = ? AND difficulty = ? ORDER BY RANDOM() LIMIT 1',
            [category, difficulty]
          );
        }

        if (!question) {
          return socket.emit('room:error', 'No questions available for this category and difficulty.');
        }

        room.usedQuestionIds.add(question.id);
        room.currentQuestion = {
          id: question.id,
          category: question.category,
          difficulty: question.difficulty,
          question_text: question.question_text,
          choices: JSON.parse(question.choices),
          correct_answer: question.correct_answer,
          explanation: question.explanation
        };

        // Determine base timer
        let baseTime = 20;
        if (activePlayer.character === 'The Chronomancer') {
          baseTime += 10; // Chronomancer passive +10 seconds
        }

        room.secondsRemaining = baseTime;

        io.to(roomCode).emit('game:question', {
          question: {
            category: room.currentQuestion.category,
            difficulty: room.currentQuestion.difficulty,
            question_text: room.currentQuestion.question_text,
            choices: room.currentQuestion.choices,
            explanation: room.currentQuestion.explanation
          },
          secondsRemaining: room.secondsRemaining,
          activePlayerUsername: activePlayer.username
        });

        // Start countdown timer
        startQuestionTimer(roomCode, io);
      } catch (err) {
        console.error('Question retrieval error:', err);
        socket.emit('room:error', 'Database error retrieving question.');
      }
    });

    // Character Active Ability Activation
    socket.on('game:use_ability', async ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || room.status !== 'playing' || !room.currentQuestion) return;

      const player = room.players[room.turnIndex];
      if (player.socketId !== socket.id) return;
      if (room.characterAbilityUsedThisTurn) {
        return socket.emit('room:error', 'Already used an ability this turn.');
      }

      if (player.character === 'The Scholar') {
        // Scholar active ability: Eliminate 2 wrong choices
        const correct = room.currentQuestion.correct_answer;
        const wrongChoices = room.currentQuestion.choices.filter((c: string) => c !== correct);
        
        // Randomly pick 2 wrong choices to remove
        const removed = wrongChoices.sort(() => 0.5 - Math.random()).slice(0, 2);
        
        room.characterAbilityUsedThisTurn = true;
        room.logs.push(`${player.username} activated "Scientific Method" and eliminated two wrong choices!`);
        
        io.to(roomCode).emit('game:ability_used', {
          ability: 'Scientific Method',
          removedChoices: removed,
          logs: room.logs
        });
      } else if (player.character === 'The Chronomancer') {
        // Chronomancer reroll question
        const count = room.activeChronomancerRerolls[player.username] || 0;
        if (count >= 1) {
          return socket.emit('room:error', 'Reroll ability can only be used once per match.');
        }

        room.activeChronomancerRerolls[player.username] = count + 1;
        room.characterAbilityUsedThisTurn = true;
        room.logs.push(`${player.username} activated "Time Distortion" and rerolled the trivia question!`);

        // Clear existing timer and fetch new question
        if (room.questionTimer) clearInterval(room.questionTimer);
        
        try {
          const db = await getDatabase();
          const category = room.board[player.position].category;
          const difficulty = room.activeQuestionDifficulty || 'medium';

          const question = await db.get(
            'SELECT * FROM questions WHERE category = ? AND difficulty = ? ORDER BY RANDOM() LIMIT 1',
            [category, difficulty]
          );

          if (question) {
            room.currentQuestion = {
              id: question.id,
              category: question.category,
              difficulty: question.difficulty,
              question_text: question.question_text,
              choices: JSON.parse(question.choices),
              correct_answer: question.correct_answer,
              explanation: question.explanation
            };
            
            room.secondsRemaining = 30; // Chronomancer standard + bonus
            io.to(roomCode).emit('game:question', {
              question: {
                category: room.currentQuestion.category,
                difficulty: room.currentQuestion.difficulty,
                question_text: room.currentQuestion.question_text,
                choices: room.currentQuestion.choices,
                explanation: room.currentQuestion.explanation
              },
              secondsRemaining: room.secondsRemaining,
              activePlayerUsername: player.username
            });
            
            startQuestionTimer(roomCode, io);
            io.to(roomCode).emit('room:state', getCleanRoomState(roomCode));
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    // Buy Power-up
    socket.on('game:buy_powerup', ({ roomCode, powerupType }) => {
      const room = rooms[roomCode];
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      const costs: Record<string, number> = {
        '50/50': 15,
        'extra_time': 10,
        'shield': 20,
        'double_move': 25,
        'trap_protect': 15
      };

      const cost = costs[powerupType];
      if (cost === undefined) return;

      if (player.coins < cost) {
        return socket.emit('room:error', 'Not enough coins.');
      }

      player.coins -= cost;

      if (powerupType === '50/50') {
        if (!room.currentQuestion) {
          player.coins += cost; // refund
          return socket.emit('room:error', 'Can only buy 50/50 during a question.');
        }
        const correct = room.currentQuestion.correct_answer;
        const wrongChoices = room.currentQuestion.choices.filter((c: string) => c !== correct);
        const removed = wrongChoices.sort(() => 0.5 - Math.random()).slice(0, 2);
        
        socket.emit('game:powerup_bought', { powerupType, success: true, coins: player.coins });
        socket.emit('game:ability_used', {
          ability: '50/50 Powerup',
          removedChoices: removed,
          logs: room.logs
        });
      } else if (powerupType === 'extra_time') {
        if (!room.currentQuestion) {
          player.coins += cost;
          return socket.emit('room:error', 'Can only buy extra time during a question.');
        }
        room.secondsRemaining += 15;
        io.to(roomCode).emit('game:timer_update', room.secondsRemaining);
        socket.emit('game:powerup_bought', { powerupType, success: true, coins: player.coins });
      } else if (powerupType === 'shield') {
        player.shield = true;
        socket.emit('game:powerup_bought', { powerupType, success: true, coins: player.coins });
      } else if (powerupType === 'double_move') {
        player.doubleMove = true;
        socket.emit('game:powerup_bought', { powerupType, success: true, coins: player.coins });
      } else if (powerupType === 'trap_protect') {
        player.trapProtect = true;
        socket.emit('game:powerup_bought', { powerupType, success: true, coins: player.coins });
      }

      room.logs.push(`${player.username} bought power-up: ${powerupType}`);
      io.to(roomCode).emit('room:state', getCleanRoomState(roomCode));
    });

    // Submit Answer
    socket.on('game:submit_answer', ({ roomCode, answer }) => {
      const room = rooms[roomCode];
      if (!room || room.status !== 'playing' || !room.currentQuestion) return;

      const player = room.players[room.turnIndex];
      if (player.socketId !== socket.id) return;

      // Stop countdown
      if (room.questionTimer) {
        clearInterval(room.questionTimer);
        room.questionTimer = null;
      }

      processAnswer(roomCode, answer, io);
    });

    // Send Chat Message
    socket.on('game:chat', ({ roomCode, message }) => {
      const room = rooms[roomCode];
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      io.to(roomCode).emit('game:chat_message', {
        username: player.username,
        avatar: player.avatar,
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Leave/Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      handlePlayerExit(socket.id, io);
    });

    socket.on('room:leave', ({ roomCode }) => {
      socket.leave(roomCode);
      handlePlayerExit(socket.id, io);
    });
  });
}

function startQuestionTimer(roomCode: string, io: Server) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.questionTimer) {
    clearInterval(room.questionTimer);
  }

  room.questionTimer = setInterval(() => {
    room.secondsRemaining--;
    io.to(roomCode).emit('game:timer_update', room.secondsRemaining);

    if (room.secondsRemaining <= 0) {
      clearInterval(room.questionTimer!);
      room.questionTimer = null;
      
      // Process as incorrect (time out)
      room.logs.push(`${room.players[room.turnIndex].username} ran out of time!`);
      processAnswer(roomCode, '__TIMEOUT__', io);
    }
  }, 1000);
}

async function processAnswer(roomCode: string, answer: string, io: Server) {
  const room = rooms[roomCode];
  if (!room || !room.currentQuestion) return;

  const player = room.players[room.turnIndex];
  const isCorrect = answer === room.currentQuestion.correct_answer;
  const correctVal = room.currentQuestion.correct_answer;
  const explanation = room.currentQuestion.explanation;

  player.lastAnswerCorrect = isCorrect;

  let movement = 0;
  let coinsEarned = 0;
  let eventTriggeredText = '';

  if (isCorrect) {
    player.streak++;

    // Base movement & coins
    const baseMoves = room.activeQuestionDifficulty === 'easy' ? 1 : (room.activeQuestionDifficulty === 'medium' ? 2 : 3);
    const baseCoins = room.activeQuestionDifficulty === 'easy' ? 5 : (room.activeQuestionDifficulty === 'medium' ? 10 : 15);

    movement = baseMoves;
    coinsEarned = baseCoins;

    // Apply Passive abilities
    // Pathfinder gets +1 movement on medium/hard
    if (player.character === 'The Pathfinder' && (room.activeQuestionDifficulty === 'medium' || room.activeQuestionDifficulty === 'hard')) {
      movement += 1;
      room.logs.push(`${player.username} (Pathfinder) got +1 bonus movement!`);
    }

    // Fortune Finder gets 1.5x coins
    if (player.character === 'The Fortune Finder') {
      coinsEarned = Math.round(coinsEarned * 1.5);
    }

    // Double Move powerup
    if (player.doubleMove) {
      movement *= 2;
      player.doubleMove = false; // consume
      room.logs.push(`${player.username} used Double Movement power-up for 2x steps!`);
    }

    // Combo streak rewards
    if (player.streak >= 3) {
      const streakBonus = Math.floor(player.streak / 3);
      movement += streakBonus;
      coinsEarned += streakBonus * 5;
      room.logs.push(`${player.username} is on a ${player.streak} answer streak! Earned +${streakBonus} steps and +${streakBonus * 5} coins!`);
    }

    player.coins += coinsEarned;
    
    // Move player
    const oldPosition = player.position;
    player.position = Math.min(39, player.position + movement);
    
    room.logs.push(`${player.username} answered CORRECTLY! Moved ${movement} space(s) (from ${oldPosition} to ${player.position}) and earned ${coinsEarned} coins.`);

    // Trigger Tile events
    const currentTile = room.board[player.position];
    if (currentTile.type !== 'normal') {
      const tileOutcome = await handleTileLanding(room, player, currentTile);
      eventTriggeredText = tileOutcome.text;
    }
  } else {
    // Reset streak
    player.streak = 0;
    room.logs.push(`${player.username} answered INCORRECTLY! Their turn ends.`);
  }

  // Check game win condition
  // In 2v2, if any player on Team 1 reaches 39, Team 1 wins.
  let isGameOver = false;
  if (player.position >= 39) {
    isGameOver = true;
    room.status = 'gameover';
    room.winnerUsername = player.username;
    room.logs.push(`🏆 ${player.username} has reached the finish line and won the game!`);
    
    // Save to match history database
    await saveMatchResults(room);
  }

  // Clear current question context
  room.currentQuestion = null;

  // Broadcast results
  io.to(roomCode).emit('game:turn_result', {
    playerUsername: player.username,
    isCorrect,
    correctAnswer: correctVal,
    explanation,
    movement,
    coinsEarned,
    eventTriggeredText,
    isGameOver,
    cleanRoomState: getCleanRoomState(roomCode)
  });

  // Advance turn if game is not over
  if (!isGameOver) {
    advanceTurn(room);
    io.to(roomCode).emit('room:state', getCleanRoomState(roomCode));
  }
}

async function handleTileLanding(room: GameRoom, player: Player, tile: Tile): Promise<{ text: string }> {
  let text = '';
  
  if (tile.type === 'bonus') {
    const bonusSteps = Math.random() < 0.5 ? 1 : 2;
    player.position = Math.min(39, player.position + bonusSteps);
    text = `Bonus Space! Advanced ${bonusSteps} extra step(s).`;
    room.logs.push(`${player.username} landed on a Bonus tile: ${text}`);
  } else if (tile.type === 'treasure') {
    const coinGift = Math.floor(Math.random() * 16) + 15; // 15-30 coins
    player.coins += coinGift;
    text = `Treasure Chest! Unlocked ${coinGift} coins!`;
    room.logs.push(`${player.username} opened a Treasure Chest: ${text}`);
  } else if (tile.type === 'trap') {
    if (player.shield || player.trapProtect) {
      if (player.shield) player.shield = false;
      else player.trapProtect = false;
      text = `Shield blocked the Trap!`;
      room.logs.push(`${player.username} landed on a Trap, but their Shield protected them.`);
    } else {
      const penaltyCoins = 15;
      const penaltySteps = 3;
      // Randomly penalize coins or steps
      if (Math.random() < 0.5) {
        player.coins = Math.max(0, player.coins - penaltyCoins);
        text = `IT'S A TRAP! Lost ${penaltyCoins} coins.`;
      } else {
        player.position = Math.max(0, player.position - penaltySteps);
        text = `IT'S A TRAP! Blown backward ${penaltySteps} spaces.`;
      }
      room.logs.push(`${player.username} triggered a Trap: ${text}`);
    }
  } else if (tile.type === 'shortcut') {
    // If they landed here and successfully answered (meaning they answered this turn's question correctly),
    // they automatically take the shortcut!
    if (tile.shortcutDestination) {
      const oldPos = player.position;
      player.position = tile.shortcutDestination;
      text = `Shortcut taken! Teleported from ${oldPos} to ${player.position}.`;
      room.logs.push(`${player.username} took the shortcut path to space ${player.position}!`);
    }
  } else if (tile.type === 'mystery') {
    const rolls = [
      { t: 'Windfall', act: () => { player.coins += 20; return `Windfall! Received 20 coins.`; } },
      { t: 'Tax', act: () => { 
          if (player.shield) { player.shield = false; return 'Shield blocked the Mystery Tax!'; }
          player.coins = Math.max(0, player.coins - 10); 
          return `Tax! Lost 10 coins.`; 
        } 
      },
      { t: 'Teleport', act: () => { 
          const move = Math.random() < 0.5 ? 2 : -2;
          player.position = Math.max(0, Math.min(39, player.position + move));
          return `Teleport! Moved ${move > 0 ? 'forward' : 'backward'} ${Math.abs(move)} spaces.`;
        } 
      },
      { t: 'Swap', act: () => {
          // Find another player
          const opponents = room.players.filter(p => p.username !== player.username);
          if (opponents.length > 0) {
            const victim = opponents[Math.floor(Math.random() * opponents.length)];
            const temp = player.position;
            player.position = victim.position;
            victim.position = temp;
            return `Position Swap! Swapped spots with ${victim.username}.`;
          }
          return `Swap rolled, but no opponents to swap with.`;
        }
      },
      { t: 'Shield Gift', act: () => { player.shield = true; return `Gift! Awarded a Shield power-up.`; } }
    ];

    const rolled = rolls[Math.floor(Math.random() * rolls.length)];
    text = rolled.act();
    room.logs.push(`${player.username} triggered Mystery Event: ${text}`);
  } else if (tile.type === 'challenge') {
    // Bids standard: wager coins
    const wager = Math.min(player.coins, 15);
    player.coins += wager; // automatically rewarded for landing since they answered correctly
    text = `Challenge Tile! Double coins rewarded (+${wager} coins).`;
    room.logs.push(`${player.username} conquered the Challenge Tile and gained double coins.`);
  }

  return { text };
}

function advanceTurn(room: GameRoom) {
  // If 2v2:
  // Team 1: Player index 0 and 2
  // Team 2: Player index 1 and 3
  // Turn rotation: Player 0 (T1) -> Player 1 (T2) -> Player 2 (T1) -> Player 3 (T2)
  room.turnIndex = (room.turnIndex + 1) % room.players.length;
  room.characterAbilityUsedThisTurn = false;
  
  const activePlayer = room.players[room.turnIndex];
  room.logs.push(`It is now ${activePlayer.username}'s turn.`);
}

async function saveMatchResults(room: GameRoom) {
  // Standings
  const sorted = [...room.players].sort((a, b) => b.position - a.position);
  
  const winner = sorted[0];
  const matchHistoryData = {
    game_mode: room.gameMode,
    winner_username: winner.username,
    players: JSON.stringify(sorted.map((p, idx) => ({
      username: p.username,
      position: p.position,
      rank: idx + 1,
      coins: p.coins
    })))
  };

  try {
    const db = await getDatabase();
    
    // Save to match history
    await db.run(
      'INSERT INTO match_history (game_mode, winner_username, players) VALUES (?, ?, ?)',
      [matchHistoryData.game_mode, matchHistoryData.winner_username, matchHistoryData.players]
    );

    // Save statistics for logged-in players
    for (const p of room.players) {
      if (p.userId) {
        const isWinner = p.username === winner.username;
        // Simple XP formula: 100 XP base, +50 XP for winning, +10 XP per space moved, +5 XP per coin left
        const xpEarned = 100 + (isWinner ? 50 : 0) + (p.position * 10) + (p.coins * 2);
        
        // Sum correct and incorrect answers
        // We can estimate from streak or coins
        const correctCount = p.streak + Math.floor(p.coins / 10);
        const wrongCount = isWinner ? 1 : 3;

        await updatePlayerMatchStats(
          p.userId,
          isWinner,
          correctCount,
          wrongCount,
          p.coins,
          xpEarned
        );
      }
    }
  } catch (err) {
    console.error('Error saving match results to DB:', err);
  }
}

function handlePlayerExit(socketId: string, io: Server) {
  for (const code in rooms) {
    const room = rooms[code];
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);

    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      room.players.splice(playerIndex, 1);
      room.logs.push(`${player.username} left the match.`);

      // If room empty, clean it up
      if (room.players.length === 0) {
        if (room.questionTimer) clearInterval(room.questionTimer);
        delete rooms[code];
        console.log(`Room ${code} destroyed (empty).`);
      } else {
        // If active player left, advance turn
        if (room.status === 'playing' && room.turnIndex >= room.players.length) {
          room.turnIndex = 0;
        }
        
        // If lobby host left and there are players left, they get notified
        io.to(code).emit('room:state', getCleanRoomState(code));
        io.to(code).emit('game:message', `${player.username} has disconnected.`);
      }
      break;
    }
  }
}

function getCleanRoomState(roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return null;

  return {
    roomCode: room.roomCode,
    gameMode: room.gameMode,
    status: room.status,
    players: room.players.map(p => ({
      username: p.username,
      avatar: p.avatar,
      character: p.character,
      ready: p.ready,
      team: p.team,
      position: p.position,
      coins: p.coins,
      streak: p.streak,
      shield: p.shield,
      doubleMove: p.doubleMove,
      trapProtect: p.trapProtect,
      lastAnswerCorrect: p.lastAnswerCorrect
    })),
    turnIndex: room.turnIndex,
    board: room.board,
    logs: room.logs,
    winnerUsername: room.winnerUsername,
    activePlayerUsername: room.players[room.turnIndex] ? room.players[room.turnIndex].username : ''
  };
}

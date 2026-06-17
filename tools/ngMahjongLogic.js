const fs = require('fs');
const path = require('path');

const rooms = new Map();
let wordsDict = [];

// Load words dictionary
function loadWords() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8');
    wordsDict = JSON.parse(data);
    console.log('Words dictionary loaded. Count:', wordsDict.length);
  } catch (err) {
    console.error('Error loading words.json:', err);
    wordsDict = [{ word: "DEFAULT", weight: 1 }];
  }
}
loadWords();

function getRandomWord(excludeWords = []) {
  const filtered = wordsDict.filter(w => !excludeWords.includes(w.word));
  const pool = filtered.length > 0 ? filtered : wordsDict;
  
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;
  
  for (const item of pool) {
    if (rand < item.weight) return item.word;
    rand -= item.weight;
  }
  return pool[pool.length - 1].word;
}

function createRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: [],
      spectators: [],
      state: 'waiting',
      ngWords: {} // socketId -> word
    });
  }
  return rooms.get(roomId);
}

function joinRoom(roomId, socketId, username) {
  let room = rooms.get(roomId);
  if (!room) room = createRoom(roomId);
  
  // Check if player is already in room (prevent duplication)
  const isPlayer = room.players.find(p => p.id === socketId);
  const isSpectator = room.spectators.find(s => s.id === socketId);
  if (isPlayer || isSpectator) return { room, role: isPlayer ? 'player' : 'spectator' };

  if (room.players.length < 4) {
    room.players.push({ id: socketId, name: username || `Player ${room.players.length + 1}` });
    return { room, role: 'player' };
  } else {
    room.spectators.push({ id: socketId, name: username || `Spectator ${room.spectators.length + 1}` });
    return { room, role: 'spectator' };
  }
}

function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.players = room.players.filter(p => p.id !== socketId);
  room.spectators = room.spectators.filter(s => s.id !== socketId);
  delete room.ngWords[socketId];
  
  if (room.players.length === 0 && room.spectators.length === 0) {
    rooms.delete(roomId);
    return null;
  }
  
  // Promote a spectator if a player leaves?
  // For simplicity, we just let players join manually if there's space.
  
  return room;
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.state = 'playing';
  room.ngWords = {};
  
  const assignedWords = [];
  
  for (const p of room.players) {
    const w = getRandomWord(assignedWords);
    room.ngWords[p.id] = w;
    assignedWords.push(w);
  }
  
  return room;
}

function getPlayerView(room, socketId, role) {
  if (room.state !== 'playing') {
    return { state: room.state, words: null };
  }
  
  const wordsView = [];
  for (const p of room.players) {
    // Player sees everyone else's words, but NOT their own.
    // Spectator sees EVERYONE's words.
    if (role === 'spectator' || p.id !== socketId) {
      wordsView.push({ name: p.name, word: room.ngWords[p.id], id: p.id });
    } else {
      wordsView.push({ name: p.name, word: "???", id: p.id, isSelf: true });
    }
  }
  
  return { state: room.state, words: wordsView };
}

module.exports = {
  createRoom, joinRoom, leaveRoom, startGame, getPlayerView, rooms, loadWords
};

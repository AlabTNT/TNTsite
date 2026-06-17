const socket = io();

// DOM Elements
const joinScreen = document.getElementById('join-screen');
const roomScreen = document.getElementById('room-screen');
const joinBtn = document.getElementById('join-btn');
const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('room-id');
const roomDisplay = document.getElementById('room-display');
const roleDisplay = document.getElementById('role-display');
const startBtn = document.getElementById('start-btn');
const playersContainer = document.getElementById('players-container');
const spectatorsList = document.getElementById('spectators-list');

let myRole = null;
let socketId = null;

socket.on('connect', () => {
  socketId = socket.id;
});

joinBtn.addEventListener('click', () => {
  const roomId = roomIdInput.value.trim();
  const name = usernameInput.value.trim();
  
  if (!roomId) {
    alert("Please enter a room ID");
    return;
  }
  
  socket.emit('join_room', { roomId, name }, (res) => {
    if (res.success) {
      myRole = res.role;
      joinScreen.classList.add('hidden');
      roomScreen.classList.remove('hidden');
      roomDisplay.innerText = res.room.id;
      
      roleDisplay.innerText = myRole;
      roleDisplay.className = 'badge ' + myRole;
      
      if (myRole === 'player') {
        startBtn.classList.remove('hidden');
      } else {
        startBtn.classList.add('hidden');
      }
      
      renderRoom(res.room, null);
    }
  });
});

startBtn.addEventListener('click', () => {
  socket.emit('start_game');
});

socket.on('room_update', (data) => {
  renderRoom(data.room, data.view);
});

function renderRoom(room, view) {
  // Render Spectators
  spectatorsList.innerHTML = '';
  room.spectators.forEach(s => {
    const li = document.createElement('li');
    li.innerText = s.name;
    spectatorsList.appendChild(li);
  });
  
  // Render Players & Words
  playersContainer.innerHTML = '';
  
  if (view && view.state === 'playing') {
    // Show words
    view.words.forEach(w => {
      const card = document.createElement('div');
      card.className = 'player-card' + (w.isSelf ? ' self' : '');
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.innerText = w.name;
      
      const wordDiv = document.createElement('div');
      wordDiv.className = 'word';
      wordDiv.innerText = w.word;
      
      card.appendChild(nameDiv);
      card.appendChild(wordDiv);
      playersContainer.appendChild(card);
    });
  } else {
    // Just show names (Waiting state)
    room.players.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player-card';
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.innerText = p.name;
      
      const statusDiv = document.createElement('div');
      statusDiv.className = 'word';
      statusDiv.style.color = '#6b7280';
      statusDiv.style.background = 'transparent';
      statusDiv.style.fontSize = '1rem';
      statusDiv.innerText = "Waiting...";
      
      card.appendChild(nameDiv);
      card.appendChild(statusDiv);
      playersContainer.appendChild(card);
    });
  }
}

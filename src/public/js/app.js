const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true

let roomName

function addMessage(message) {
  const ul = room.querySelector("ul")
  const li = document.createElement("li")
  li.innerText = message
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault()
  const input = room.querySelector("#msg input")
  const value = input.value
  socket.emit("new_message", value, roomName,()=>{
    addMessage(`You : ${value}`)
  })
  input.value = ""
}

function handleNicknameSubmit(event) {
  event.preventDefault()
  const input = room.querySelector("#name input")
  socket.emit("nickname", input.value)
}

function showRoom() {
  welcome.hidden = true
  room.hidden = false;
  const h3 = room.querySelector("h3")
  h3.innerText = `Room ${roomName}`
  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault()
  const input = form.querySelector("input")
  socket.emit("enter_room", input.value, showRoom) 
  roomName = input.value
  input.value = ""
}

form.addEventListener("submit", handleRoomSubmit)


socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`
  addMessage(`${user} joined!`)
})

socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`
  addMessage(`${left} left`)
})

socket.on("new_message", addMessage)

socket.on("room_change", (rooms)=> {
  console.log(rooms)
  const roomList = welcome.querySelector("ul")
  roomList.innerHTML = "" // innerText 할때는 업뎃이 안됐었음 머지
  if(rooms.length === 0) { // 방을 떠났을 때 리스트에 남아있지 않게
    return;
  }
  rooms.forEach ((room) => {
    const li = document.createElement("li")
    li.innerHTML = room
    roomList.append(li)
  })
}) //(msg)=>{console.log(msg)}랑 같음 

// !! ch2.9 두개의 브라우저에서 연결되어 있을 때 브라우저 한개가 리프레시하면
// 리스트에 서버에 연결 되어 있는 다른 한개의 서버 이름이 리스트에 보이지 않는 문제
import express from "express";
import path from 'path';
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
// import WebSocket, { WebSocketServer } from "ws";

const __dirname = path.resolve();


const app = express(); // express app

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
app.use("/public", express.static(__dirname + "/src/public"));

// 홈페이지로 이동시 사용될 템플릿 렌더 
app.get("/", (req,res) => res.render("home")); // home.pug

// catch-all url. redirect to home
app.get("/*",(req, res) => res.redirect("/"));

// 유저가 모든 폴더를 볼수 없게. 보안상의 이유로 특정한 폴더를 지정해 주어야 한다

const handleListen = () => console.log('Listening on http://localhost:3000')
// app.listen(3000, handleListen); // listen port 3000

const httpServer = http.createServer(app); //create server from express application
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});

instrument(wsServer, {
  auth: false
})
// const wss = new WebSocketServer({ server }); // http, websocket in the same server

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = []
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key)
    }
  })
  return publicRooms
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size
} // ? roomName을 못받을 경우

wsServer.on("connection", (socket) => {
  // wsServer.socketsJoin("announcement") // 입장하자마자 
  socket["nickname"] = "anonymous"
  // console.log(socket); // getting ready for connection
  
  socket.onAny((event)=>{
    console.log(wsServer.sockets.adapter)
    console.log(`Socket Event:${event}`)
  })

  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName)
    done()
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName))
    wsServer.sockets.emit("room_change",publicRooms())
  })

  socket.on("disconnecting", () => { // 퇴장하기 직전 leaving
    socket.rooms.forEach(room => {
      socket.to(room).emit("bye", socket.nickname, countRoom(room)-1)
    })
  }) // disconnecting 만 있으면 새로고침 했을 때 서버가 안없어짐

  socket.on("disconnect", ()=> { // 퇴장 후 left
    wsServer.sockets.emit("room_change", publicRooms())
  })

  socket.on("new_message", (msg,  room, done)=>{
    socket.to(room).emit("new_message", `${socket.nickname}:${msg}`);
    done()
  })

  socket.on("nickname", nickname=>socket["nickname"] = nickname)
})


// const sockets = [];

// function onSocketClose() {
//   console.log("Disconnected from the Browser")
// }
// wss.on("connection",(socket) => {
//   sockets.push(socket)
//   socket["nickname"] = "Anon" // 닉네임 설정 안하고 쓰는 경우
//   console.log("Connected to Browser ✅")
//   socket.on("close", onSocketClose)
//   socket.on("message", (message) => {
//     const parsed = JSON.parse(message)
//     switch (parsed.type) {
//       case "new_message":
//         sockets.forEach((aSocket) => 
//           aSocket.send(`${socket.nickname}: ${parsed.payload}`));
//         break
//         // + '나'를 포함한 모든 브라우저에 메시지를 보내고 있으므로 제외시켜주기
//       case "nickname":
//         socket["nickname"] = parsed.payload;
//         break
//     }
//   });  
// });

httpServer.listen(3000, handleListen); // server , wss share same protocol
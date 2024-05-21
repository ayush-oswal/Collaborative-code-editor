import express from 'express'
import { Request, Response } from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import cors from 'cors'

const app = express()
const httpServer = app.listen(8080,()=>{
  console.log("Server listening on port 8080")
})
app.use(cors())
app.use(express.json());

type room = {
  name: string,
  roomId: string,
  users: Array<{
    username: string,
    ws: WebSocket
  }>,
  code: string,
  chats: Array<{
    username: string,
    message: string
  }>,
  language: string,
  result: string
}


const rooms:room[] = []

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data, isBinary) {
    const message = JSON.parse(data.toString());
    console.log("Message received:", message);
    if(message.Title==="User-joined"){
      handleUserJoined(message, ws);
    }
    else if(message.Title==="User-left"){
      handleUserLeft(message)
    }
    // wss.clients.forEach(function each(client) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(data, { binary: isBinary });
    //   }
    // });
  });

  ws.send(JSON.stringify({Title : "Greet" , msg:'Hello! Message From Server!!'}));
});

app.post("/signin",(req:Request,res:Response)=>{

})

app.post("/signup",(req:Request,res:Response)=>{

})

app.post("/create",(req:Request,res:Response)=>{

  const {username, roomName, roomId} = req.body;
  if(!username || !roomName || !roomId){
    res.status(400).json({error : "Some error"})
  }
  
  const newRoom: room = {
    name: roomName,
    roomId: roomId,
    users: [],
    code: "",
    chats: [],
    language: "python",
    result: ""
  };

  rooms.push(newRoom)
  res.status(200).json({ message: 'Room created successfully' });

})


//Controllers

function handleUserJoined(message:any, ws : WebSocket) {
  const { roomId, username } = message;

  // Find the room based on roomId
  const room = rooms.find(room => room.roomId === roomId);
  if (!room) {
    return;
  }

  console.log(room)

  // Check if the user is already in the room
  const existingUserIndex = room.users.findIndex(user => user.username === username);
  if (existingUserIndex !== -1) {
    // Update the existing user's WebSocket connection
    room.users[existingUserIndex].ws = ws;

    // Send room info to the existing user
    const roomInfoMessage = JSON.stringify({
      Title: "Room-Info",
      roomId,
      roomName: room.name,
      users: room.users.map(user => user.username),
      code: room.code,
      chats: room.chats,
      language: room.language,
      result: room.result
    });
    ws.send(roomInfoMessage);
    return;
  }

  // Add the user to the room
  room.users.push({ username, ws });

  // Send a message to all other users in the room about the new user
  const newUserMessage = JSON.stringify({
    Title: "New-User",
    username
  });

  room.users.forEach(user => {
    if (user.ws !== ws && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(newUserMessage);
    }
  });

  // Send room info to the newly joined user
  const roomInfoMessage = JSON.stringify({
    Title: "Room-Info",
    roomId,
    roomName: room.name,
    users: room.users.map(user => user.username),
    code: room.code,
    chats: room.chats,
    language: room.language,
    result: room.result
  });
  ws.send(roomInfoMessage);
}


function handleUserLeft(message: any) {
  const { roomId, username } = message;

  // Find the room based on roomId
  const room = rooms.find(room => room.roomId === roomId);
  if (!room) {
    return;
  }

  // Remove the user from the room
  room.users = room.users.filter(user => user.username !== username);

  // Notify remaining users in the room
  const userLeftMessage = JSON.stringify({
    Title: "User-left",
    username,
    users: room.users.map(user => user.username)
  });

  room.users.forEach(user => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(userLeftMessage);
    }
  });
}
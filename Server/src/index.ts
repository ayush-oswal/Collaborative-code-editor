import express from 'express'
import { Request, Response } from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createClient } from 'redis'
import cors from 'cors'
import ConnectDB from './database'
import bcrypt from 'bcrypt'
import User from "./database/models/User"

const app = express()
const httpServer = app.listen(8080,()=>{
  console.log("Server listening on port 8080")
})
app.use(cors())
app.use(express.json());


//connect to redis after launching it from docker

const redisClient = createClient({
  url: process.env.REDIS_URL
});

const redisClientSubscribing = createClient({
  url: process.env.REDIS_URL
});


redisClient.connect().catch(err=>{console.log(err)})
redisClientSubscribing.connect().catch(err=>{console.log(err)})

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
    else if(message.Title==="New-chat"){
      handleNewChat(message)
    }
    else if(message.Title==="lang-change"){
      handleLangChange(message)
    }
    else if(message.Title==="Code-change"){
      handleCodeChange(message)
    }
    else if(message.Title==="Submitted"){
      handleSubmitted(message)
    }
  });

  ws.send(JSON.stringify({Title : "Greet" , msg:'Hello! Message From Server!!'}));
});

app.post("/signin",async(req:Request,res:Response)=>{
  await ConnectDB();
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'user not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})

app.post("/signup",async(req:Request,res:Response)=>{
  await ConnectDB();
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})

app.post("/create",(req:Request,res:Response)=>{

  const {username, roomName, roomId} = req.body;
  if(!username || !roomName || !roomId){
    res.status(400).json({error : "Some error"})
    return;
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
    const notFoundMessage = JSON.stringify({
      Title : "Not-found"
    })
    ws.send(notFoundMessage)
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

function handleNewChat(message:any){
  const {roomId, username, chat} = message
  const room = rooms.find(room => room.roomId === roomId);
  if (!room) {
    return;
  }
  room.chats.push({username,message:chat})
  const newChatMessage = JSON.stringify({
    Title: "New-chat",
    username,
    chat
  })
  room.users.forEach(user => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(newChatMessage);
    }
  });
}

function handleLangChange(message:any){
  const { roomId, lang } = message
  const room = rooms.find(room => room.roomId === roomId);
  if (!room) {
    return;
  }
  room.language = lang;
  const langChangeMessage = {
    Title:"lang-change",
    lang
  }
  room.users.forEach(user => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify(langChangeMessage));
    }
  });
}

function handleCodeChange(message:any){
  const { roomId, code } = message
  const room = rooms.find(room => room.roomId === roomId);
  if (!room) {
    return;
  }
  room.code=code
  const CodeChangeMessage = {
    Title:"Code-change",
    code
  }
  room.users.forEach(user => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify(CodeChangeMessage));
    }
  });
}

async function handleSubmitted(message:any){
  const {roomId} = message
  const room = rooms.find(room => room.roomId === roomId);
  if (!room) {
    return;
  }

  const SubmitClickedMessage = {
    Title:"Submit-clicked"
  }

  room.users.forEach(user => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify(SubmitClickedMessage));
    }
  });

  if(process.env.REDIS_URL === "" || !process.env.REDIS_URL){
    const resultMessage = {
      Title: "No-worker"
    }
    room.users.forEach(user => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(resultMessage));
      }
    });
    return;
  }
  
  //push the message into submissions queue
  await redisClient.lPush("submissions",JSON.stringify(message))


  //subscribe to the roomId
  redisClientSubscribing.subscribe(roomId, (result) => {
    console.log(`Result for ${roomId}: ${result}`);
    
    // Parse the result received from the subscription
    const parsedResult = JSON.parse(result);
    
    // Create a new JSON object containing the required fields
    const resultMessage = {
        Title: "Result",
        stdout: parsedResult.stdout,
        stderr: parsedResult.stderr,
        status: parsedResult.status.description,
        compile_output: parsedResult.compile_output
    };

    // Send the resultMessageString to each user in the room
    room.users.forEach(user => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(resultMessage));
      }
    });
  });
}
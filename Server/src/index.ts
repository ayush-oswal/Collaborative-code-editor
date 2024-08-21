import express from 'express'
import { Request, Response } from 'express'
import { WebSocketServer } from 'ws'
import { createClient } from 'redis'
import cors from 'cors'
import ConnectDB from './database'
import bcrypt from 'bcrypt'
import User from "./database/models/User"
import { RoomManager } from './utils/roomManager'

const app = express()
const httpServer = app.listen(8080,()=>{
  console.log("Server listening on port 8080")
})
app.use(cors())
app.use(express.json());


//connect to redis after launching it from docker

const redis_url = process.env.REDIS_URL === "No-Url-provided" ? "" : process.env.REDIS_URL

const redisClient = createClient({
  url: redis_url
});

const redisClientSubscribing = createClient({
  url: redis_url
});


redisClient.connect().catch(err=>{console.log(err)})
redisClientSubscribing.connect().catch(err=>{console.log(err)})


const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data, isBinary) {
    const message = JSON.parse(data.toString());
    if(message.Title==="User-joined"){
      RoomManager.getInstance().handleUserJoined(message, ws);
    }
    else if(message.Title==="User-left"){
      RoomManager.getInstance().handleUserLeft(message)
    }
    else if(message.Title==="New-chat"){
      RoomManager.getInstance().handleNewChat(message)
    }
    else if(message.Title==="lang-change"){
      RoomManager.getInstance().handleLangChange(message)
    }
    else if(message.Title==="Code-change"){
      RoomManager.getInstance().handleCodeChange(message)
    }
    else if(message.Title==="Submitted"){
      RoomManager.getInstance().handleSubmitted(message)
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

  try{
    RoomManager.getInstance().create(req.body)
    res.status(200).json({ message: 'Room created successfully' });
  }
  catch(e){
    res.status(500).json({ message: 'Server error' });
  }
  
})
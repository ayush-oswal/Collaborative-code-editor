import express from 'express'
import { createServer } from 'http';
import { Request, Response } from 'express'
import { WebSocketServer } from 'ws'
import { createClient } from 'redis'
import cors from 'cors'
import { RoomManager } from './utils/roomManager'
import dotenv from "dotenv";

dotenv.config(); 

const app = express()
const httpServer = createServer(app);

app.use(cors())
app.use(express.json());

httpServer.listen(8080, () => {
  console.log(`Server listening on port 8080`);
});

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
      RoomManager.getInstance().handleSubmitted(message,ws)
    }
  });

  ws.send(JSON.stringify({Title : "Greet" , msg:'Hello! Message From Server!!'}));
});

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
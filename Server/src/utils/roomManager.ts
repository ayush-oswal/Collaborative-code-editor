import { WebSocket } from 'ws'

interface room {
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

import { createClient } from 'redis'

export class RoomManager {
    private static instance : RoomManager;
    private rooms : room[] = [];

    private constructor(){

    }

    public static getInstance(): RoomManager {
        if (!RoomManager.instance) {
            RoomManager.instance = new RoomManager();
        }
        return RoomManager.instance;
    }

    public create(roomData : any){

        const {username, roomName, roomId} = roomData

        const newRoom: room = {
            name: roomName,
            roomId: roomId,
            users: [],
            code: "",
            chats: [],
            language: "python",
            result: ""
          };
        
        this.rooms.push(newRoom)
    
    }

    public handleUserJoined(message:any, ws : WebSocket) {
      const { roomId, username } = message;
      // Find the room based on roomId
      const room = this.rooms.find(room => room.roomId === roomId);
      if (!room) {
        const notFoundMessage = JSON.stringify({
          Title : "Not-found"
        })
        ws.send(notFoundMessage)
        return;
      }
    
      // console.log(room)
    
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

    public handleUserLeft(message: any) {
      const { roomId, username } = message;
    
      // Find the room based on roomId
      const room = this.rooms.find(room => room.roomId === roomId);
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

    public handleNewChat(message:any){
      const {roomId, username, chat} = message
      const room = this.rooms.find(room => room.roomId === roomId);
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

    public handleLangChange(message:any){
      const { roomId, lang } = message
      const room = this.rooms.find(room => room.roomId === roomId);
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

    public handleCodeChange(message:any){
      const { roomId, code } = message
      const room = this.rooms.find(room => room.roomId === roomId);
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

    public async handleSubmitted(message:any) {
      const redis_url = process.env.REDIS_URL === "No-Url-provided" ? "" : process.env.REDIS_URL

      const redisClient = createClient({
        url: redis_url
      });

      const redisClientSubscribing = createClient({
        url: redis_url
      });


      redisClient.connect().catch(err=>{console.log(err)})
      redisClientSubscribing.connect().catch(err=>{console.log(err)})
      
        const {roomId} = message
        const room = this.rooms.find(room => room.roomId === roomId);
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
      
        if(process.env.REDIS_URL === "No-Url-provided" || !process.env.REDIS_URL){
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
          // console.log(`Result for ${roomId}: ${result}`);
          redisClientSubscribing.unsubscribe(roomId)
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

}
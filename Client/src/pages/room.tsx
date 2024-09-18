import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {useUserStore} from '../store'
import { Box, Button, Flex, IconButton, Select, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useBreakpointValue, Spinner } from '@chakra-ui/react';
import { HamburgerIcon, ChatIcon } from '@chakra-ui/icons';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import Members from '../components/members';
import Chats from '../components/chats';
import ResultModal from '../components/result';
import toast, { Toaster } from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';


type chat = 
  {
    username:string,
    message:string
  }

const Room: React.FC = () => {
  const {roomId} = useParams();
  const Navigate = useNavigate()
  const { setRoomID } = useUserStore();
  const {user} = useUser();
  const username = user?.username
  const [roomName,setRoomName] = useState("")
  const [users, setUsers] = useState<string[]>([])
  const [chats,setChats] = useState<chat[]>([])
  const [result,setResult] = useState(null)
  const [language,setLanguage] = useState("")
  const [code,setCode] = useState("")
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [submitClicked, setSubmitClicked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  //fire socket events on lang change, chat , code change, new user is done, add button leave user and copy room id

  useEffect(()=>{
    if(username==''){
      Navigate("/auth")
    }
    let ws_url = ""
    if(import.meta.env.VITE_REACT_APP_SERVER_URL === "://localhost:8080"){
      ws_url = `ws${import.meta.env.VITE_REACT_APP_SERVER_URL}`
    } 
    else{
      ws_url = `wss${import.meta.env.VITE_REACT_APP_SERVER_URL}`
    }
    const newSocket = new WebSocket(ws_url);
    newSocket.onopen = () => {
      console.log('Connection established');
      const msg = {
        Title : "User-joined",
        roomId,
        username
      }
      newSocket.send(JSON.stringify(msg))
    }
    newSocket.onmessage = (message) => {
      const parsedMessage = JSON.parse(message.data);
      if (parsedMessage.Title === "Room-Info") {
        setUsers(parsedMessage.users);
        setCode(parsedMessage.code);
        setLanguage(parsedMessage.language);
        setResult(parsedMessage.result);
        setChats(parsedMessage.chats);
        setRoomName(parsedMessage.roomName)
      } 
      else if(parsedMessage.Title === "Not-found"){
        alert("No room found")
        Navigate("/join")
      }
      else if (parsedMessage.Title === "New-User") {
        toast.success(`${parsedMessage.username} joined` )
        setUsers(prevUsers => [...prevUsers, parsedMessage.username]);
      }
      else if(parsedMessage.Title === "User-left"){
        toast.error(`${parsedMessage.username} left`)
        setUsers(parsedMessage.users)
      }
      else if(parsedMessage.Title === "New-chat"){
        const {username, chat} = parsedMessage
        setChats((prevChats) => {
          // Create a new chat object
          const newChat = { username, message:chat };
  
          // Return the updated chats array
          return [...prevChats, newChat];
      });
      }
      else if(parsedMessage.Title === "lang-change"){
        const { lang } = parsedMessage
        setLanguage(lang)
      }
      else if(parsedMessage.Title === "Code-change"){
        const { code } = parsedMessage
        setCode(code)
      }
      else if(parsedMessage.Title === "Submit-clicked"){
        setSubmitClicked(true);
      }
      else if(parsedMessage.Title === "Result"){
        setResult(parsedMessage)
        setSubmitClicked(false)
        setIsModalOpen(true);
      }
      else if(parsedMessage.Title === "No-worker"){
        setSubmitClicked(false)
        alert("Code cannot be processed now cause it requires a continiously running worker service whcih is expensive 😅😅, if you want to, you can clone the repo and run worker process locally!!")
      }
      else if(parsedMessage.Title === "error"){
        setSubmitClicked(false)
        alert("Error processing code as of now, retry or check code for errors!")
      }
    }
    setSocket(newSocket)
    return () => newSocket.close();
  },[])

  const { isOpen: isLeftOpen, onOpen: onLeftOpen, onClose: onLeftClose } = useDisclosure();
  const { isOpen: isRightOpen, onOpen: onRightOpen, onClose: onRightClose } = useDisclosure();
  const isLargeScreen = useBreakpointValue({ base: false, md: true });




  const getLanguageExtension = (lang:string) => {
    switch (lang) {
      case 'javascript':
        return javascript({ jsx: true });
      case 'java':
        return java();
      case 'cpp':
        return cpp();
      case 'python':
        return python();
      default:
        return javascript({ jsx: true });
    }
  };

  const onLeave = () => {
    //fire websocket event
    const msg = {
      Title : "User-left",
      roomId,
      username
    }
    socket?.send(JSON.stringify(msg))
    setRoomID("")
    Navigate("/join")
  }

  const handleCodeChange = (val:string) => {
    //fire websocket event
    const msg = {
      Title: "Code-change",
      roomId,
      code:val
    }
    socket?.send(JSON.stringify(msg))
    setCode(val)
  }

  const handleLangChange = (val:string) => {
    //fire websocket event
    const msg = {
      Title: "lang-change",
      roomId,
      lang:val
    }
    socket?.send(JSON.stringify(msg))
  }

  const onSubmit = () => {
    //make a ws req to server, send the code there, subscribe to the roomid on pub-sub
    const msg = {
      Title : "Submitted",
      roomId,
      language,
      code
    }
    socket?.send(JSON.stringify(msg))
  }

  function addChat(message:string){
    //fire websocket event
    const msg = {
      Title : "New-chat",
      roomId,
      username,
      chat:message
    }
    socket?.send(JSON.stringify(msg))
  }


  return (
    <Flex h="100vh" color="blue.200">
      <Toaster />
      {/* Left Sidebar for large screens */}
      {isLargeScreen && (
        <Flex direction="column" gap="30px" bg="blue.900" w="20%" h="full">
          <Box p="4"><div className='text-4xl text-center'>Members</div></Box>
          <Members users={users} onLeave={onLeave} roomId={roomId || ""} />
        </Flex>
      )}
      {/* Left Sidebar Drawer */}
      {!isLargeScreen && (
        <Drawer placement="left" onClose={onLeftClose} isOpen={isLeftOpen}>
          <DrawerOverlay />
          <DrawerContent bg="blue.900">
            <DrawerCloseButton />
            <DrawerHeader><div className='text-white text-4xl text-center'>Members</div></DrawerHeader>
            <DrawerBody>
            <Members users={users} onLeave={onLeave} roomId={roomId || ""} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Content */}
      <Flex direction="column" bg="gray.900" flex="1" width={useBreakpointValue({ base: '100vh', md: '80vh', sm: '60vh' })} >
        {/* Header Bar */}
        <Flex bg="gray.800" p="4" justify="center" align="center" position="relative" direction="column">

          <Flex align="center" justify="center">

          {result && <Button onClick={()=>setIsModalOpen(true)} bg="blue.500" _hover={{ bg: 'blue.600' }} color="blue.100" fontWeight="semibold" px="4" py="2" rounded="md">Result</Button> }

          { result && <ResultModal isOpen={isModalOpen} onClose={()=>{setIsModalOpen(false)}} resultMessage={result}/> }


            <Select value={language} onChange={(e) => handleLangChange(e.target.value)} bg="blue.900" color="blue.200" borderBottom="1px" borderColor="blue.400" rounded="md" px="2" py="1">
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">Cpp</option>
              <option value="python">Python</option>
            </Select>
            <>
              {submitClicked ? (
                <Spinner size="md" thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />) : 
                (<Button onClick={onSubmit} bg="blue.500" _hover={{ bg: 'blue.600' }} color="blue.100" fontWeight="semibold" px="4" py="2" rounded="md">Submit</Button>
              )}
            </>
          </Flex>
          <Flex align="center" justify="center">
            <Box color="blue.200" fontWeight="semibold" ml="4">
              {roomName}
            </Box>
          </Flex>
          {/* Sidebar Icons */}
          {!isLargeScreen && (
            <>
              <IconButton
                icon={<HamburgerIcon />}
                aria-label="Members"
                display={{ base: 'block', md: 'none' }}
                position="absolute"
                left="4"
                onClick={onLeftOpen}
              />
              <IconButton
                icon={<ChatIcon />}
                aria-label="Chats"
                display={{ base: 'block', md: 'none' }}
                position="absolute"
                right="4"
                onClick={onRightOpen}
              />
            </>
          )}
        </Flex>
        <Flex flex="1" p="2" align="center" justify="center">
            {/* editor here */}
            <CodeMirror 
              value={code} 
              onChange={(val)=>{handleCodeChange(val)}} 
              height={useBreakpointValue({ base: '80vh', lg:"70vh", md: '60vh', sm: '50vh' })} 
              width={useBreakpointValue({ base: '100vh', lg:"90vh", md: '80vh', sm: '70vh' })} 
              extensions={[getLanguageExtension(language)]} 
              theme={"dark"}
              />
        </Flex>
      </Flex>

      {/* Right Sidebar Drawer */}
      {!isLargeScreen && (
        <Drawer placement="right" onClose={onRightClose} isOpen={isRightOpen}>
          <DrawerOverlay />
          <DrawerContent bg="blue.900">
            <DrawerCloseButton />
            <DrawerHeader><div className='text-white text-4xl text-center'>Chats</div></DrawerHeader>
            <DrawerBody>
              <Chats chats={chats} addChat={addChat} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {/* Right Sidebar for large screens */}
      {isLargeScreen && (
        <Flex direction="column" gap="30px" bg="blue.900" w="20%" h="full">
          <Box p="4"><div className='text-4xl text-center'>Chats</div></Box>
          <Chats chats={chats} addChat={addChat} />
        </Flex>
      )}
    </Flex>
  );
}

export default Room
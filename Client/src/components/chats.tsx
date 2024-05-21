import React, { useState } from "react";
import { Box, Flex, Input, IconButton } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";

type chat = {
  username: string;
  message: string;
};

interface chatProps {
  chats: chat[];
  addChat: (msg: string) => void;
}

const Chats: React.FC<chatProps> = ({ chats, addChat }) => {
  const [msg, setMsg] = useState("");

  const handleSendMessage = () => {
    if (msg.trim()) {
      addChat(msg);
      setMsg("");
    }
  };

  return (
    <Flex direction="column" p="4" bg="blue.900" gap='40px' color="blue.200" h="80vh">
      <Box flex="1" overflowY="auto" css={{
          "&::-webkit-scrollbar": {
            display: "none"
          },
          "-ms-overflow-style": "none",
          scrollbarWidth: "none"
        }}>
        {chats.map((chat, index) => (
          <Box key={index} p="3" bg="gray.800" borderRadius="md" mb="3">
            <strong>{chat.username}</strong>
            <Box>{chat.message}</Box>
          </Box>
        ))}
      </Box>
      <Flex>
        <Input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type a message..."
          bg="gray.700"
          color="blue.200"
          border="none"
          _placeholder={{ color: "blue.400" }}
          flex="1"
        />
        <IconButton
          aria-label="Send message"
          icon={<ArrowForwardIcon />}
          onClick={handleSendMessage}
          ml="2"
          bg="blue.500"
          _hover={{ bg: "blue.600" }}
        />
      </Flex>
    </Flex>
  );
};

export default Chats;

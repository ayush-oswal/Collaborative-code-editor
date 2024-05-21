import React from 'react';
import { Box, Button } from '@chakra-ui/react';

interface MembersProps {
  users: string[];
  roomId: string;
  onLeave: () => void;
}

const Members: React.FC<MembersProps> = ({ users, roomId, onLeave }) => {
  const copyRoomIdToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box
        display="flex"
        flex="1"
        flexDirection="column"
        overflowY="auto"
        justifyContent="top"
        alignItems="center"
        gap="10px"
        css={{
          "&::-webkit-scrollbar": {
            display: "none"
          },
          "-ms-overflow-style": "none",
          scrollbarWidth: "none"
        }}
      >
        {users.map((user, index) => (
          <Box className="p-2 w-fit px-4 border border-emerald-500 rounded-sm" key={index}>{user}</Box>
        ))}
      </Box>
      <Box display="flex" flexDirection="column" gap="3" p="4" bg="blue.900">
        <Button onClick={copyRoomIdToClipboard} colorScheme="blue">Copy Room ID</Button>
        <Button onClick={onLeave} colorScheme="red">Leave Room</Button>
      </Box>
    </Box>
  );
};

export default Members;

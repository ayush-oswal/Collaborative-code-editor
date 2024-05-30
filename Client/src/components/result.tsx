import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text
} from '@chakra-ui/react';

interface ResultMessage {
  Title: string;
  stdout: string;
  stderr: string | null;
  status: string;
}

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultMessage: ResultMessage;
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, resultMessage }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{resultMessage.Title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text><strong>Status:</strong> {resultMessage.status}</Text>
          <Text><strong>Output:</strong> {resultMessage.stdout}</Text>
          {resultMessage.stderr && <Text><strong>Error:</strong> {resultMessage.stderr}</Text>}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ResultModal;

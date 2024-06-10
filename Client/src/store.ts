// store.ts
import {create} from 'zustand';

interface UserStore {
  username: string;
  roomID: string;
  setUsername: (username: string) => void;
  setRoomID: (roomID:string)=> void;
}

export const useUserStore = create<UserStore>((set) => ({
  username: '',
  roomID: '',
  setUsername: (username: string) => set({ username }),
  setRoomID: (roomID : string) => set({roomID})
}));

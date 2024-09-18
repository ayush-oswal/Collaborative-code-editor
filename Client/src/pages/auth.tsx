import React, { useEffect } from 'react';
import { SignInButton, SignedOut, useUser } from '@clerk/clerk-react';
import { useUserStore } from '../store';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const { user } = useUser();
  const { setUsername } = useUserStore()
  const Navigate = useNavigate();
 
  useEffect(() => {
    if (user) {
      const clerkUsername = user.username || user.firstName || user.emailAddresses[0].emailAddress;
      setUsername(clerkUsername); 
      Navigate("/join")
    }
  }, [user, setUsername]);

  return (
    <div className="min-h-screen bg-gray-900 text-blue-200 flex flex-col justify-center items-center">

      <SignedOut>
        <div className='p-2 bg-black rounded-md border-2 border-white text-blue-500'>
        <SignInButton />
        </div>
      </SignedOut>

    </div>
  );
};

export default Auth;

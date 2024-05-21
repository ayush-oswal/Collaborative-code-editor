import React, { useState } from 'react';
import {useUserStore} from '../../store'
import { useNavigate } from 'react-router-dom';


const Auth: React.FC = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { setUsername } = useUserStore();
  const Navigate = useNavigate()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Call your API endpoint based on isSignIn state and name/password
    if (isSignIn) {
      // Sign in API call
    } else {
      // Sign up API call
    }

    
    //check

    //if successfull submit only then

    setUsername(name)
    Navigate("/join")

  };

  const toggleAuthMode = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-blue-200 flex flex-col justify-center items-center">
      <h2 className="text-3xl mb-4">
        {isSignIn ? 'Sign In' : 'Sign Up'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          type="text"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-blue-900 w-60 text-blue-200 border-b border-blue-400 rounded mb-4 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-blue-900 w-60 text-blue-200 border-b border-blue-400 rounded mb-4 px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-blue-100 font-semibold px-4 py-2 rounded"
        >
          {isSignIn ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      <p className="mt-4">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{' '}
        <button
          onClick={toggleAuthMode}
          className="text-blue-400 hover:text-blue-200 focus:outline-none"
        >
          {isSignIn ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  );
};

export default Auth;

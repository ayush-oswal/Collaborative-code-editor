import React, { useState } from 'react';
import { useUserStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Spinner } from '@chakra-ui/react'; // Import Chakra UI Spinner

const Auth: React.FC = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false); // State for submitting
  const { setUsername } = useUserStore();
  const Navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !password) {
      toast.error("Enter name and password");
      return;
    }

    setSubmitting(true); // Set submitting state to true

    const url = isSignIn
      ? `${import.meta.env.VITE_REACT_APP_SERVER_URL}/signin`
      : `${import.meta.env.VITE_REACT_APP_SERVER_URL}/signup`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ username: name, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
        setUsername(name);
        Navigate("/join");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false); // Reset submitting state
    }
  };

  const toggleAuthMode = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-blue-200 flex flex-col justify-center items-center">
      <Toaster />
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
          className="bg-blue-500 hover:bg-blue-600 text-blue-100 font-semibold px-4 py-2 rounded flex items-center justify-center"
          disabled={submitting} // Disable button while submitting
        >
          {submitting ? <Spinner size="sm" color="white" /> : (isSignIn ? 'Sign In' : 'Sign Up')}
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

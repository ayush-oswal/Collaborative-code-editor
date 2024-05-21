import React from 'react';
import { useNavigate } from 'react-router-dom';


const Home: React.FC = () => {
  const Navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-900 text-blue-200 flex flex-col justify-center items-center">
      <h2 className="text-3xl mb-4">Welcome to CodeCollab</h2>
      <p className="text-lg mb-4">
        CodeCollab is a collaborative code editor where you can create or join rooms, chat, write code together, and even run it in real-time.
      </p>
      <button
        onClick={()=>{Navigate("/auth")}}
        className="bg-blue-500 hover:bg-blue-600 text-blue-100 font-semibold px-4 py-2 rounded"
      >
        Get Started
      </button>
    </div>
  );
};

export default Home;

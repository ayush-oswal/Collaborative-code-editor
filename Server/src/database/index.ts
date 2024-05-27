import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); 

let isConnected = false;

const ConnectDB = async () => {
  if (isConnected) return;

  const url = process.env.MONGO_URL || "";

  if (!url) {
    console.error("MONGO_URL environment variable is not set");
    return;
  }

  try {
    await mongoose.connect(url)
    console.log("DB connected!");
    isConnected = true;
  } catch (e) {
    console.error("Error connecting to the database:", e);
  }
};

export default ConnectDB;

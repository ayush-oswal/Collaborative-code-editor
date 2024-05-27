import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    }
},{ timestamps: true })

const User = mongoose.model("User",UserSchema)

export default User
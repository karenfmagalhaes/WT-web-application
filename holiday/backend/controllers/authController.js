import mongoose from "mongoose";
import { UserSchema } from "../models/User.js";

const User = mongoose.model("User", UserSchema);

export const addNewUser = async (req, res) => {
    let newUser = new User(req.body);

    try {
        const user = await newUser.save();
        res.json(user);
    } catch (error) {
        res.send(error);
    }
};
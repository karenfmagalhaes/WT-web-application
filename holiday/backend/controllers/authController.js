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

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.send(error);
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        res.json(user);
    } catch (error) {
        res.send(error);
    }
};

export const updateUser = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate({ _id: req.params.userId }, req.body, { new: true });
        res.json(user);
    } catch (error) {
        res.send(error);
    }
};

export const deleteUser = async (req, res) => {
    try {
        await User.deleteOne({ _id: req.params.userId });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.send(error);
    }
};
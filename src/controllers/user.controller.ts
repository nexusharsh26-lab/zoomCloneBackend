import { User } from "../models/user.model.ts";
import { Meeting } from "../models/meeting.model.ts";
import httpStatus from "http-status";
import crypto from "crypto";

import bcrypt, { hash } from "bcrypt";

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please Provide all Details" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }
    let token = crypto.randomBytes(20).toString("hex");

    user.token = token;
    await user.save();
    return res.status(httpStatus.OK).json({ token: token });
  } catch {
    return res
      .status(500)
      .json({ message: "Something Went Wrong in DataBase" });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;
  console.log(name, username, password, "-------");
  if (!name || !username || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Name, username and password are required",
    });
  }
  try {
    const existingUser = await User.findOne({ username });
    console.log(existingUser, "here ");

    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); //salt 10

    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });
    console.log(newUser, "new user");
    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (e) {
    res.json({ message: "something went wrong" });
  }
};

const getUserHistory = async (req, res) => {
  const token = req.query.token;
  (console.log("token"), token);
  try {
    const user = await User.findOne({ token: token });
    const meetings = await Meeting.find({ user_id: user?.username });
    res.json(meetings);
  } catch (e) {
    res.json({ message: `something went wrong ${e}` });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;
  try {
    const user = await User.findOne({ token: token });
    const newMeeting = new Meeting({
      user_id: user?.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();
    res
      .status(httpStatus.CREATED)
      .json({ message: "Added Meeting  successfully" });
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

export { login, register, getUserHistory, addToHistory };

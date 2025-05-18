const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const { JWT_SECRET } = process.env;

const signup = async (req, res) => {
  const { email, password } = req.body;
  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(409).json({ message: "Email in use" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword });
  res.status(201).json({ user: { email, subscription: user.subscription } });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Email or password is wrong" });
  }
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
  await User.findByIdAndUpdate(user._id, { token });
  res.json({ token, user: { email, subscription: user.subscription } });
};

const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { token: null });
  res.status(204).send();
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({ email, subscription });
};

const allowedSubscriptions = ["starter", "pro", "business"];
const subscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (!allowedSubscriptions.includes(subscription)) {
      return res.status(400).json({ message: "Invalid subscription value" });
    }

    
    const userId = req.user._id; 

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { subscription },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ subscription: updatedUser.subscription });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, logout, getCurrent, subscription };

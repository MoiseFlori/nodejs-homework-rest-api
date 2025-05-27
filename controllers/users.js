const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");

// console.log("Jimp:", Jimp);
// console.log("Jimp.default:", Jimp.default);

const { JWT_SECRET } = process.env;
const signup = async (req, res) => {
  const { email, password } = req.body;

  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(409).json({ message: "Email in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const avatarURL = gravatar.url(email, { s: "250", d: "retro" }, true);

  const user = await User.create({
    email,
    password: hashedPassword,
    avatarURL,
  });

  res.status(201).json({
    user: {
      email,
      subscription: user.subscription,
      avatarURL: user.avatarURL,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Email or password is wrong" });
  }
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
  await User.findByIdAndUpdate(user._id, { token });
  res
    .status(200)
    .json({ token, user: { email, subscription: user.subscription } });
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

const avatarsDir = path.join(__dirname, "../public/avatars");

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempPath, originalname } = req.file;
  const filename = `${_id}-${originalname}`;
  const finalPath = path.join(avatarsDir, filename);


  const image = await Jimp.read(tempPath);
  image.resize(250, 250); 
  await image.writeAsync(tempPath);



  await fs.rename(tempPath, finalPath);

  const avatarURL = `/avatars/${filename}`;
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.status(200).json({ avatarURL });
};

module.exports = {
  signup,
  login,
  logout,
  getCurrent,
  subscription,
  updateAvatar,
};

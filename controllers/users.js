const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");
const sgMail = require("@sendgrid/mail");

const { JWT_SECRET } = process.env;
const BASE_URL = process.env.BASE_URL;
sgMail.setApiKey(process.env.EMAIL_API);

const signup = async (req, res) => {
  const { email, password } = req.body;

  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(409).json({ message: "Email in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const avatarURL = gravatar.url(email, { s: "250", d: "retro" }, true);
  const verificationToken = nanoid();

  const user = await User.create({
    email,
    password: hashedPassword,
    avatarURL,
    verificationToken,
    verify: false,
  });

  const msg = {
    to: email,
    from: process.env.SENDGRID_SENDER_EMAIL,
    subject: "Please verify your email",
    html: `<p>Hello,</p>
          <p>Please verify your email by clicking on the link below:</p>
    <a href="${BASE_URL}/users/verify/${verificationToken}">Verifică email-ul tău</a>`,
  };

  await sgMail.send(msg);

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

  if (!user.verify) {
    return res.status(401).json({ message: "Email not verified" });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });

  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token,
    user: {
      email,
      subscription: user.subscription,
    },
  });
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

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;

  const user = await User.findOne({ verificationToken });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.verify = true;
  user.verificationToken = null;
  await user.save();

  res.status(200).json({ message: "Verification successful" });
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.verify) {
    return res
      .status(400)
      .json({ message: "Verification has already been passed" });
  }
  
  const verificationToken = user.verificationToken; 
  const msg = {
    to: email,
    from: process.env.SENDGRID_SENDER_EMAIL,
    subject: "Please verify your email",
    html: `<p>Hello,</p>
          <p>Please verify your email by clicking on the link below:</p>
    <a href="${BASE_URL}/users/verify/${verificationToken}">Verifică email-ul tău</a>`,
  };
  try {
    await sgMail.send(msg);
    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res
      .status(500)
      .json({ message: "Error sending verification email" });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrent,
  subscription,
  updateAvatar,
  verifyEmail,
  resendVerificationEmail,
};

const jwt = require("jsonwebtoken");
const User = require("../models/user");

const { JWT_SECRET } = process.env;

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [bearer, token] = authHeader.split(" ");

  if (bearer !== "Bearer" || !token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(id);
    if (!user || user.token !== token) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = auth;

const Joi = require("joi");

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const validateSignup = (req, res, next) => {
  const { error } = signupSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  next();
};

const validateLogin = validateSignup;

module.exports = { validateSignup, validateLogin };

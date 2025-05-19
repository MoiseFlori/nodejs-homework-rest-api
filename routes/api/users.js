const express = require("express");
const ctrl = require("../../controllers/users");
const {
  validateSignup,
  validateLogin,
} = require("../../validation/userValidation");
const auth = require("../../middlewares/auth");

const router = express.Router();

router.post("/signup", validateSignup, ctrl.signup);
router.post("/login", validateLogin, ctrl.login);
router.get("/logout", auth, ctrl.logout);
router.get("/current", auth, ctrl.getCurrent);
router.patch("/", auth, ctrl.subscription);

module.exports = router;

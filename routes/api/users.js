const express = require("express");
const ctrl = require("../../controllers/users");
const {
  validateSignup,
  validateLogin,
} = require("../../validation/userValidation");
const auth = require("../../middlewares/auth");
const upload = require("../../middlewares/upload");

const router = express.Router();

router.post("/signup", validateSignup, ctrl.signup);
router.post("/login", validateLogin, ctrl.login);
router.get("/logout", auth, ctrl.logout);
router.get("/current", auth, ctrl.getCurrent);
router.patch("/", auth, ctrl.subscription);
router.patch("/avatars", auth, upload.single("avatar"), ctrl.updateAvatar);

module.exports = router;

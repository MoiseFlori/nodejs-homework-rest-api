const authController = require("../controllers/users");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Login controller", () => {
  it("should respond with status 200, return token and user with email and subscription", async () => {
    const fakeUser = {
      _id: "123",
      email: "test@example.com",
      password: "hashedpassword",
      subscription: "pro",
    };

 
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("testtoken");
    User.findByIdAndUpdate.mockResolvedValue();

    const req = {
      body: { email: "test@example.com", password: "123456" },
    };

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };

    await authController.login(req, res);

 
    expect(status).toHaveBeenCalledWith(200);

  
    expect(json).toHaveBeenCalledWith({
      token: "testtoken",
      user: { email: "test@example.com", subscription: "pro" },
    });
  });
});

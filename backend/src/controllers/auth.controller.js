const bcrypt = require("bcrypt");
const { UserSchema } = require("../schemas");
const { publicUser, setAuthCookie } = require("../middleware/auth");

function createAuthController(collections) {
  return {
    signup: async (req, res) => {
      try {
        const parsed = UserSchema.safeParse(req.body);
        if (!parsed.success)
          return res.status(400).json({ errors: parsed.error.flatten() });
        const { email, password, ...profile } = parsed.data;
        const normalizedEmail = email.toLowerCase();
        if (await collections.users.findOne({ email: normalizedEmail }))
          return res
            .status(409)
            .json({ message: "An account already exists for this email" });
        const result = await collections.users.insertOne({
          ...profile,
          email: normalizedEmail,
          password: await bcrypt.hash(password, 10),
        });
        const user = {
          ...profile,
          email: normalizedEmail,
          _id: result.insertedId,
        };
        setAuthCookie(res, user);
        res.status(201).json({ user: publicUser(user) });
      } catch (error) {
        res.status(500).json({ message: "Unable to create account" });
      }
    },
    login: async (req, res, next) => {
      try {
        const user = await collections.users.findOne({
          email: req.body.email.toLowerCase(),
        });
        if (!user) return res.status(400).json({ message: "Incorrect email" });
        if (!(await bcrypt.compare(req.body.password, user.password)))
          return res.status(400).json({ message: "Incorrect password" });
        setAuthCookie(res, user);
        res.json({ user: publicUser(user) });
      } catch (error) {
        next(error);
      }
    },
    logout: (req, res) => {
      res.setHeader(
        "Set-Cookie",
        "auth_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
      );
      res.json({ message: "Logged out" });
    },
    me: (req, res) => res.json({ user: publicUser(req.user) }),
  };
}

module.exports = { createAuthController };

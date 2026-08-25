const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const config = require("../config/env");

function getToken(req) {
  const cookies = req.headers.cookie || "";
  const cookie = cookies.split(";").find((item) => item.trim().startsWith("auth_token="));
  return cookie ? cookie.trim().slice("auth_token=".length) : null;
}

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: "7d" });
  const parts = [`auth_token=${token}`, `Max-Age=${7 * 24 * 60 * 60}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function publicUser(user) {
  return { id: user._id.toString(), firstName: user.firstName, lastName: user.lastName || "", profileImage: user.profileImage || "", email: user.email };
}

function requireAuth(collections) {
  return async (req, res, next) => {
    try {
      const token = getToken(req);
      if (!token) return res.status(401).json({ message: "Authentication required" });
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await collections.users.findOne({ _id: new ObjectId(payload.sub) });
      if (!user) return res.status(401).json({ message: "Authentication required" });
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Authentication required" });
    }
  };
}

module.exports = { publicUser, requireAuth, setAuthCookie };

const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // 1. read the Authorization header
  const authHeader = req.header("authorization");

  // check if it exists and shaped like "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "no token provided" });
  }

  // split off the token part (everything after "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    //4. verify it
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 5. genuine - remember who they are
    req.user = payload;
    next();
  } catch (error) {
    // 6. jwt.verify THREW → token is fake, tampered, or expired → block
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

module.exports = verifyToken;

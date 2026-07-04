function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(401).json({ error: "admin access required" });
  }

  next();
}

function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== "student") {
    return res.status(401).json({ error: "student access required" });
  }

  next();
}
module.exports = { requireAdmin, requireStudent };

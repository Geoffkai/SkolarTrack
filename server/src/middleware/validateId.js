const { parseId } = require("../utils/validation");

// Registered with router.param("id", ...), so it runs once for every route that has :id
// in its path — before auth and before the controller. A junk id (/scholarships/abc)
// gets a clean 400 here instead of reaching Postgres and coming back as a 500.
function validateIdParam(req, res, next, value) {
  if (parseId(value) === null) {
    return res.status(400).json({ error: "invalid id" });
  }
  next();
}

module.exports = validateIdParam;

// The two last stops in the middleware chain. Mounted after every route in app.js.

// Nothing matched the path. Without this Express answers with an HTML page,
// which the frontend's response.json() cannot read.
function notFound(req, res) {
  res.status(404).json({ error: "route not found" });
}

// Four arguments is what marks a function as an ERROR handler to Express — it only
// runs when something upstream threw or called next(err).
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Thrown by express.json() before any controller runs.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "request body is not valid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "request body is too large" });
  }
  if (err.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: "bad request" });
  }

  // Log the detail for us; send the client nothing it could learn from.
  console.error("unhandled error: ", err);
  return res.status(500).json({ error: "something went wrong" });
}

module.exports = { notFound, errorHandler };

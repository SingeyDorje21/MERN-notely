// Last-resort error handler: JSON responses with fixed messages, so parser
// errors and crashes never leak stack traces or the raw request body.
// Express recognises error handlers by their four parameters, so `next` must stay.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error("Unhandled error:", err);
  res.status(status).json({ message: status === 500 ? "Internal server error" : "Bad request" });
};

export default errorHandler;

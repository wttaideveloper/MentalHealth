function notFoundMiddleware(req, res) {
  return res.status(404).json({ success: false, message: "Route not found" });
}

function errorMiddleware(err, req, res, next) {
  const statusCodeValue = err.statusCode || 500;
  const messageText = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") console.error(err);
  return res.status(statusCodeValue).json({ success: false, message: messageText });
}

module.exports = { notFoundMiddleware, errorMiddleware };

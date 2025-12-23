function ok(res, messageText, payload) {
  return res.json({ success: true, message: messageText, data: payload ?? null });
}
function created(res, messageText, payload) {
  return res.status(201).json({ success: true, message: messageText, data: payload ?? null });
}
module.exports = { ok, created };

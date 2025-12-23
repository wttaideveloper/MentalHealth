function validateBody(schema) {
  return function validator(req, res, next) {
    const result = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.details.map((d) => d.message)
      });
    }
    req.body = result.value;
    next();
  };
}

module.exports = { validateBody };

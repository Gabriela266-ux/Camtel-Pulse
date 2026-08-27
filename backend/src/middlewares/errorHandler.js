function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    ok: false,
    message: err.message || 'Erreur interne du serveur',
    errors: err.errors || undefined,
    references: err.references || undefined
  });
}

module.exports = { errorHandler };

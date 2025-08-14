import { httpCode } from "./httpCode.js";

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || httpCode.INTERNAL_SERVER_ERROR;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
     Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandaler = (err, req, res, next) => {  
  const statusCode = err.statusCode || httpCode.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

return  res.status(statusCode).json({
    status: false,
    message,
  });
};

export default AppError
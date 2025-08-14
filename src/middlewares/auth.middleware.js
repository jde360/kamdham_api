import AppError from "../utils/error.js";
import { httpCode } from "../utils/httpCode.js";
import { verifyToken } from "../utils/token.config.js";

const authMiddleware = (role) => {
    try {
        return (req, res, next) => {
              const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                throw new AppError("No token provided", httpCode.UNAUTHORIZED);
            }
            const decoded = verifyToken(token);
            if (!role.includes(decoded.userType)) {
                throw new AppError("Unauthorized access", httpCode.UNAUTHORIZED);
            }
            req.user = decoded;
            next();
        }
    } catch (error) {
        next(error);
    }
}
export default authMiddleware;

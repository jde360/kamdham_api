import nodemailer from "nodemailer";
import AppError from "./error.js";
import { httpCode } from "./httpCode.js";
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

const MailService = {
    send: (to, subject, body) => {
        try {
            transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: to,
                subject: subject,
                html: body
            })
        } catch (error) {
            throw new AppError("Error sending email: " + error.message, httpCode.INTERNAL_SERVER_ERROR);
        }
    }
};
export default MailService;
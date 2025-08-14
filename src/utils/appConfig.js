import dotenv from 'dotenv'
dotenv.config(
    {
        path: './dev.env'
    }
)
export const appConfig = Object.freeze({
    'PORT': process.env.PORT,
    'DB_URL': process.env.DBURI,
    'APP_KEY': process.env.APPKEY,
    'EXPIRETIME': `${process.env.EXPIRETIME}d`
});
import dotenv from "dotenv";
const flavour = "development"; //production
dotenv.config({
  path: flavour === "production" ? "./prod.env" : "./dev.env",
});
export const appConfig = Object.freeze({
  PORT: process.env.PORT,
  DB_URL: process.env.DBURI,
  APP_KEY: process.env.APPKEY,
  EXPIRETIME: `${process.env.EXPIRETIME}d`,
  FLAVOUR: flavour,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKITPK,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKITPVT,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
});

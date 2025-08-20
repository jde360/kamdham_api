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
});

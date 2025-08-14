import express from "express";
import cors from "cors";
import { appConfig } from "./src/utils/appConfig.js";
import connectDB from "./src/utils/db.js";
import { errorHandaler } from "./src/utils/error.js";
import router from "./src/routes/router.js";
const startServer = async () => {
    try {
        await connectDB(appConfig.DB_URL);
        const app = express();
        app.use(cors());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use("/api/v1", router);
        app.use(errorHandaler);
        app.listen(appConfig.PORT, () => {
            console.log(`Server started on port ${appConfig.PORT}`);
        })


    } catch (error) {
        console.log("Error in starting server");
        process.exit(1);
    }
}
startServer();
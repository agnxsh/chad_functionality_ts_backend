require("dotenv").config();
import express, { Response } from "express";
import config from "config";
import validateEnv from "./utils/validateEnv";
import { AppDataSource } from "./utils/data-source";
import redisClient from "./utils/connectRedis";

AppDataSource.initialize()
  .then(async () => {
    validateEnv();

    const app = express();

    //MIDDLEWARE
    //BODY PARSER
    //LOGGER
    //COOKIE PARSER
    //CORS
    //ROUTES
    //HEALTH CHECKER

    app.get("/api/healthchecker", async (_, res: Response) => {
      const message = await redisClient.get("try");
      res.status(200).json({
        status: "success",
        message,
      });
    });

    //UNHANDLED ROUTE
    //GLOBAL ERROR HANDLER

    const port = config.get<number>("port");
    app.listen(port);
    console.log(`Server started on port: ${port}`);
  })
  .catch((err: any) => console.log(err));

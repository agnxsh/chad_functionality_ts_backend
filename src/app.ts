require("dotenv").config();
import cors from "cors";
import express, { NextFunction, Response } from "express";
import config from "config";
import validateEnv from "./utils/validateEnv";
import { AppDataSource } from "./utils/data-source";
import redisClient from "./utils/connectRedis";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import AppError from "./utils/appError";

AppDataSource.initialize()
  .then(async () => {
    validateEnv();

    const app = express();
    //TEMPLATE ENGINE

    //MIDDLEWARE

    //1. Body Parser
    app.use(express.json({ limit: "10kb" }));
    //2. Logger
    if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
    //3. Cookie Parser
    app.use(cookieParser());
    //4. Cors
    app.use(
      cors({
        origin: config.get<string>("origin"),
        credentials: true,
      })
    );
    //5.Routes
    app.use("/api/auth", authRouter);
    app.use("/api/users", userRouter);
    //6.Health Checker
    app.get("/api/healthchecker", async (_, res: Response) => {
      const message = await redisClient.get("try");
      res.status(200).json({
        status: "success",
        message,
      });
    });
    //7.Unhandled Route

    const port = config.get<number>("port");
    app.listen(port);
    console.log(`Server started on port: ${port}`);
  })
  .catch((err: any) => console.log(err));

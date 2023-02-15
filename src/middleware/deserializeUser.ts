import { NextFunction, Request, Response } from "express";
import { findUserById } from "../services/user.services";
import AppError from "../utils/appError";
import redisClient from "../utils/connectRedis";
import { verifyJwt } from "../utils/jwt";

export const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let access_token;
  } catch (err: any) {}
};

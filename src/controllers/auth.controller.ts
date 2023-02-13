import { CookieOptions, NextFunction, Request, Response } from "express";
import config from "config";
import { CreateUserInput, LoginUserInput } from "../schemas/user.schema";
import {
  createUser,
  findUserByEmail,
  findUserById,
  signTokens,
} from "../services/user.services";
import AppError from "../utils/appError";
import redisClient from "../utils/connectRedis";
import { signJwt, verifyJwt } from "../utils/jwt";
import { User } from "../entities/user.entity";

//Cookie Options here
export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, password, email } = req.body;
    const user = await createUser({
      name,
      email: email.toLowerCase(),
      password,
    });
    res.status(201).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({
        status: "fail",
        message: "User with that email already exist",
      });
    }
    next(err);
  }
};

//Register User Controller
export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  // try {
  //     const { email, password } = req.body;
  //     const user = await findUserByEmail({ email });
  //     //1.Checking if the user exists and password is valid
  //     if (!user || !(await User.comparePasswords(password, user.password))) {
  //         return next(new AppError(400, "Invalid email or password"));
  //     }
  // }
};

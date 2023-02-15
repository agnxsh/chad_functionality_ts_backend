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
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
};

if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
  ...cookieOptions,
  expires: new Date(
    Date.now() + config.get<number>("accessTokenExpiresIn") * 60 * 1000
  ),
  maxAge: config.get<number>("accessTokenExpiresIn") * 60 * 1000,
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookieOptions,
  expires: new Date(
    Date.now() + config.get<number>("refreshTokenExpiresIn") * 60 * 1000
  ),
  maxAge: config.get<number>("refreshTokenExpiresIn") * 60 * 1000,
};

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
// ? Cookie Options Here

// ? Register User Controller

export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail({ email });

    //1. Check if user exists and password is valid
    if (!user || !(await User.comparePasswords(password, user.password))) {
      return next(new AppError(400, "Invalid email or password"));
    }

    // 2. Sign Access and Refresh Tokens
    const { access_tokens, refresh_tokens } = await signTokens(user);

    // 3. Add Cookies
    res.cookie("access_token", access_tokens, accessTokenCookieOptions);
    res.cookie("refresh_token", refresh_tokens, refreshTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 4. Send response
    res.status(200).json({
      status: "success",
      access_tokens,
    });
  } catch (err: any) {
    next(err);
  }
};

export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    const message = "Could not refresh access token";

    if (!refresh_token) {
      return next(new AppError(403, message));
    }

    //Validate refresh token
    const decoded = verifyJwt<{ sub: string }>(
      refresh_token,
      "refreshTokenPublicKey"
    );

    if (!decoded) {
      return next(new AppError(403, message));
    }

    //check if the user has a valid session
    const session = await redisClient.get(decoded.sub);

    if (!session) {
      return next(new AppError(403, message));
    }

    //Check if user still exists in the cache
    const user = await findUserById(JSON.parse(session).id);
    if (!user) {
      return next(new AppError(403, message));
    }

    //Sign new access token
    const access_token = signJwt({ sub: user.id }, "accessTokenPrivateKey", {
      expiresIn: `${config.get<number>("accessTokenExpiresIn")}m`,
    });

    //Add cookies
    res.cookie("access_token", access_token, accessTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    //Sending success response
    res.status(200).json({
      status: "success",
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

// We need a way to clear the cookies from the user’s browser if they log out. The best option is to send the same cookies with empty string values and a max-age -1.

// Also, we need to delete the user’s session from the Redis database when they log out.

const logout = (res: Response) => {
  res.cookie("access_token", "", { maxAge: -1 });
  res.cookie("refresh_token", "", { maxAge: -1 });
  res.cookie("logged_in", "", { maxAge: -1 });
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    await redisClient.del(user.id);
    logout(res);

    res.status(200).json({
      status: "success",
    });
  } catch (err: any) {
    next(err);
  }
};

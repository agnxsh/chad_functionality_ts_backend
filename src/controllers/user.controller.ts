import { Request, Response, NextFunction } from "express";

export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
    console.log("User added successfully");
  } catch (err: any) {
    next(err);
  }
};

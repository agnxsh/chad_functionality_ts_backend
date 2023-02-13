import { User } from "../entities/user.entity";
import { CreateUserInput } from "../schemas/user.schema";
import redisClient from "../utils/connectRedis";
import { AppDataSource } from "../utils/data-source";
import config from "config";
import { signJwt } from "../utils/jwt";

const userRepository = AppDataSource.getRepository(User);

export const createUser = async (input: CreateUserInput) => {
  return (await AppDataSource.manager.save(
    AppDataSource.manager.create(User, input)
  )) as User;
};

export const findUserByEmail = async ({ email }: { email: string }) => {
  return await userRepository.findOneBy({ email });
};

export const findUserById = async (userId: string) => {
  return await userRepository.findOneBy({ id: userId });
};

export const findUser = async (query: Object) => {
  return await userRepository.findOneBy(query);
};
//Enabling access and refresh token
export const signTokens = async (user: User) => {
  //1. Create Session
  redisClient.set(user.id, JSON.stringify(user), {
    EX: config.get<number>("redisCacheExpiresIn") * 60,
  });
  //2. Create Access Tokens
  const access_tokens = signJwt({ sub: user.id }, "accessTokenPrivateKey", {
    expiresIn: `${config.get<number>("accessTokenExpiresIn")}m`,
  });
  //3. Manage Refesh Tokens
  const refresh_tokens = signJwt({ sub: user.id }, "refreshTokenPrivateKey", {
    expiresIn: `${config.get<number>("refreshTokenExpiresIn")}m`,
  });
  return { access_tokens, refresh_tokens };
};

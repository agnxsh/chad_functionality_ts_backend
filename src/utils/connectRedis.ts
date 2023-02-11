import { createClient } from "redis";
const redisUrl = "redis://default:redispw@localhost:55000";

const redisClient = createClient({
  url: redisUrl,
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis client connected successfully");
    redisClient.set("try", "Hello welcome to express with TypeORM");
  } catch (error) {
    console.log(error);
    setTimeout(connectRedis, 5000);
  }
};

connectRedis();
export default redisClient;

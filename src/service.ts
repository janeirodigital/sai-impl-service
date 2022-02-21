import express, { Request, Response } from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import bodyParser from "body-parser";
import morgan from "morgan";
import authRouter from "./auth";
import sessionGuard from "./session";
import usersRouter from "./agents";
import apiRouter from "./api";

export class Service {
  private server: express.Application;

  constructor() {
    this.server = express();
  }

  public startService(): void {
    this.server.use(cors());

    this.server.use(
      cookieSession({
        name: "session",
        // TODO (angel) ensure all required env parameters are set before starting the application
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        keys: [process.env.COOKIE_KEY_1!, process.env.COOKIE_KEY_2!],
      })
    );

    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: true }));
    this.server.use(morgan(process.env.NODE_ENV === "production" ? "common" : "dev"));

    this.server.use("/auth", authRouter);
    this.server.use(sessionGuard);
    this.server.use("/users", usersRouter);
    this.server.use("/api", apiRouter);

    this.server.all("*", (req: Request, res: Response) => {
      res.status(404).send();
    });

    this.server.all("*", (req, res) => {
      res.status(200).send("OK");
    });

    this.server.listen(4000, () => {
      console.log("Service started at port 4000");
    });
  }
}

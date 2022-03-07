import { NextFunction, Request, Response } from "express";
import SaiSessionStorage from "./sai-session-storage";


const sessionGuard = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.webId) return rejectNoSessionProvided(res);

  try {
    const sai = await SaiSessionStorage.get(req.session.webId);
    if (!sai) {
      return rejectNoSessionFound(res);
    } else req.sai = sai;

    next();
  } catch (e) {
    // TODO (angel) log and better error message
    res.status(500).json(JSON.stringify(e));
  }
};

const rejectNoSessionProvided = (res: Response) => {
  res.status(401).json({
    message: `No session provided`,
  });
};

const rejectNoSessionFound = (res: Response) => {
  res.status(401).json({
    message: `No session found`,
  });
};
export default sessionGuard;

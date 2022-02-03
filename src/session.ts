import {NextFunction, Request, Response} from "express";
import SessionStorage from "./session-storage";

const handler = (req: Request, res: Response, next: NextFunction) => {
    console.log('[LOG][SESSION] Request to', req.url);
    try {
        req.sessionId = JSON.parse(atob(req.cookies['session']))['sessionId'];
    } catch (e) {
        // res.redirect(401, `${process.env.BASE_URL}/login`);
        // @ts-ignore
        req.sessionId = undefined;
    } finally {
        // TODO (angel) remove
        for (const session of SessionStorage.entries()) {
            console.log('[LOG][SESSION] Session Listing', session[0], session[1].solidSession.info.sessionId);
        }
        next();
    }
}

export default handler;
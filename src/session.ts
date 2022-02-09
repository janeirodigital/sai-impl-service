import {NextFunction, Request, Response} from "express";
import SessionStorage from "./session-storage";
import {getSessionFromStorage} from "@inrupt/solid-client-authn-node";
import {RedisStorage} from "./redis-storage";
import {AuthorizationAgent} from "../../sai-js/packages/authorization-agent";
import {randomUUID} from "crypto";

const sessionGuard = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.cookies['session']) return rejectNoSessionProvided(res);

    try {
        const cookieValue = Buffer.from(req.cookies['session'], 'base64').toString('utf-8');
        const sessionId = JSON.parse(cookieValue)['sessionId'];
        if (!sessionId) return rejectNoSessionProvided(res);

        const session = await getSessionFromStorage(sessionId, RedisStorage.instance);
        if (!session || !session.info.isLoggedIn) return rejectNoSessionFound(res);

        req.sai = SessionStorage.get(sessionId)!;
        req.webid = session.info.webId!;

        if (!req.sai) {
            req.sai = await AuthorizationAgent.build(session.info.webId!, process.env.AGENT_ID!, {
                fetch: session.fetch,
                randomUUID,
            });
        }
        next();
    } catch (e) {
        // TODO (angel) log and better error message
        res.status(500).json(JSON.stringify(e));
    }
}

const rejectNoSessionProvided = (res: Response) => {
    res.status(401).json({
        message: `No session provided`
    });
}

const rejectNoSessionFound = (res: Response) => {
    res.status(401).json({
        message: `No session found`
    });
}
export default sessionGuard;
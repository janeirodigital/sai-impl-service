import {NextFunction, Request, Response} from "express";
import SessionStorage from "./session-storage";
import {getSessionFromStorage} from "@inrupt/solid-client-authn-node";
import {RedisStorage} from "./redis-storage";
import {AuthorizationAgent} from "../../sai-js/packages/authorization-agent";
import {randomUUID} from "crypto";

const sessionGuard = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[SESSION GUARD] Handling request for ${req.url}`);

    if(!req.cookies['session']) return rejectNoSessionProvided(res);

    try {
        const cookieValue = Buffer.from(req.cookies['session'], 'base64').toString('utf-8');
        const sessionId = JSON.parse(cookieValue)['sessionId'];
        if (!sessionId) return rejectNoSessionProvided(res);

        req.solidSession = await getSessionFromStorage(sessionId, RedisStorage.instance);
        if (!req.solidSession) return rejectNoSessionFound(res);

        req.saiSession = SessionStorage.get(sessionId);

        if (!req.saiSession) {
            req.saiSession = await AuthorizationAgent.build(req.solidSession.info.webId!, process.env.AGENT_ID!, {
                fetch: req.solidSession.fetch,
                randomUUID,
            });
        }

        next();
    } catch (e) {
        console.log(e);
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
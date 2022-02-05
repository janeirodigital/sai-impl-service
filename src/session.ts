import {NextFunction, Request, Response} from "express";
import SessionStorage from "./session-storage";
import {getSessionFromStorage} from "@inrupt/solid-client-authn-node";
import {RedisStorage} from "./redis-storage";
import {AuthorizationAgent} from "../../sai-js/packages/authorization-agent";
import {randomUUID} from "crypto";

const sessionGuard = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[SESSION GUARD] Handling request for ${req.url}`);
    try {
        req.sessionId = JSON.parse(atob(req.cookies['session']))['sessionId'];
        req.solidSession = await getSessionFromStorage(req.sessionId!, RedisStorage.instance);

        if (!req.solidSession) {
            res.status(401).send();
            return;
        }

        req.saiSession = SessionStorage.get(req.sessionId!);

        if (!req.saiSession) {
            req.saiSession = await AuthorizationAgent.build(req.solidSession.info.webId!, process.env.AGENT_ID!, {
                fetch: req.solidSession.fetch,
                randomUUID,
            });
        }
    } catch (e) {
        res.status(500).json(JSON.stringify(e));
    } finally {
        next();
    }
}

export default sessionGuard;
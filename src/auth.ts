import express, { Response, Request } from 'express';
import { getSessionFromStorage, Session } from '@inrupt/solid-client-authn-node';
import { AuthorizationAgent } from '@janeirodigital/authorization-agent';
import { randomUUID } from 'crypto';

import SessionStorage from './session-storage.js';

const router = express.Router({ caseSensitive: false });

router.get('/login', async (req: Request, res: Response) => {
    const session = new Session();
    req.session!['sessionId'] = session.info.sessionId;

    const redirectToIdp = (url: string) => {
        res.redirect(url);
    }
    await session.login({
        redirectUrl: `${process.env.BASE_URL}/auth/handleLoginRedirect`,
        oidcIssuer: process.env.DEFAULT_SOLID_OIDC_PROVIDER,
        clientName: process.env.APP_NAME,
        handleRedirect: redirectToIdp,
    })
});

router.get('/handleLoginRedirect', async (req: Request, res: Response) => {
    const solidSession = await getSessionFromStorage(req.session!['sessionId']);

    if (!solidSession) {
        // @ts-ignore
        res.redirect(401, process.env.BASE_URL + '/login');
        return;
    }

    await solidSession.handleIncomingRedirect(process.env.BASE_URL + '/auth' + req.url);

    // TODO (angel) check if instead of using the .cookies accessor it is possible to use the .session.sessionId
    //              accessor. That might be enough to remove the cookie-parser dependency
    const sessionCookie = req.cookies['session'];
    if (solidSession.info.isLoggedIn && solidSession.info.webId) {
        // @ts-ignore
        const saiSession = await AuthorizationAgent.build(solidSession.info.webId, process.env.AGENT_ID, {
            fetch: solidSession.fetch,
            randomUUID,
        });

        SessionStorage.set(solidSession.info.sessionId, {solidSession, saiSession});

        res.cookie('session', sessionCookie, { httpOnly: true });
        // @ts-ignore
        res.redirect(200, process.env.BASE_URL + '/dashboard');
    }
});

export default router;
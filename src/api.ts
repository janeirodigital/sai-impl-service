

import {Router, Request, Response, NextFunction} from 'express';
import SessionStore from './session-storage';
import {ReadableApplicationRegistration} from '@janeirodigital/interop-data-model';

const router = Router({ caseSensitive: false });

router.use((req: Request, res: Response, next: NextFunction) => {
    console.log('[LOG][API] Session check')
    if (!req.sessionId) {
        res.status(401).send();
        return;
    }

    const session = SessionStore.get(req.sessionId!);

    if (!session || !session.solidSession) {
        res.status(401).send();
        return;
    }

    // TODO (angel) if saiSession does not exist a new one can be instantiated.
    req.solidSession = session.solidSession;
    req.saiSession = session.saiSession;
    req.webId = session.solidSession.info.webId;

    next();
});

router.get('/id', (req: Request, res: Response) => {
    console.log('[LOG][API] /id handler')
    res.status(200).json({ webId: req.webId });
});

router.get('/applications', async (req: Request, res: Response) => {
    console.log('[LOG][API] /applications handler')
    const registrations: ReadableApplicationRegistration[] = [];
    for await (const registration of req.saiSession!.applicationRegistrations) {
        registrations.push(registration);
    }

    const ids: string[] = [];
    for (const registration of registrations) {
        ids.push(registration.registeredAgent);
    }

    res.status(200).json({ids});
});

router.get('/data', async(req: Request, res: Response) => {
    console.log('[LOG][API] /data handler')
    const data = []
    const dataRegistries = req.saiSession!.registrySet.hasDataRegistry;
    for (const registry of dataRegistries) {
       for await (const registration of registry.registrations) {
           data.push({
               shapeTree: registration.registeredShapeTree,
               dataInstances: await (registration.contains),
           })
       }
    }

    res.json(data);
});

export default router;
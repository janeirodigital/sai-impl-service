

import {Router, Request, Response, NextFunction} from 'express';
import SessionStore from './session-storage';
import {ReadableApplicationRegistration, ReadableDataConsent} from '@janeirodigital/interop-data-model';
import {getApplicationProfile, parseRdf} from "./utils/rdf-parser";
import {DataFactory} from "n3";
import {AccessGrant, ApplicationProfile, IRI} from "./sai-api";

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
    res.status(200).send(req.webId);
});

/**
 * Returns an array of all the application registrations found
 * in the agent registration
 */
router.get('/applications', async (req: Request, res: Response) => {
    console.log('[LOG][API] /applications handler')
    const registrations: ReadableApplicationRegistration[] = [];
    for await (const registration of req.saiSession!.applicationRegistrations) {
        registrations.push(registration);
    }

    const registrationsData: {profile: ApplicationProfile, accessGrant: IRI }[] = [];
    for (const registration of registrations) {
        console.log('[Registrations list]', registration.iri);
        const documentResponse = await req.solidSession!.fetch(registration.registeredAgent);
        const applicationSet = await parseRdf(await documentResponse.text(), registration.iri);
        const applicationProfile = getApplicationProfile(applicationSet);
        const accessGrant = registration.hasAccessGrant.iri;
        registrationsData.push({profile:applicationProfile, accessGrant: accessGrant});
    }

    res.status(200).json(registrationsData);
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
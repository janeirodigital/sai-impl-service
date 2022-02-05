

import {Router, Request, Response, NextFunction} from 'express';
import SessionStore from './session-storage';
import {ReadableApplicationRegistration, ReadableDataConsent} from '@janeirodigital/interop-data-model';
import {getApplicationProfile, parseRdf} from "./utils/rdf-parser";
import {DataFactory} from "n3";
import {AccessGrant, ApplicationProfile, IRI} from "./sai-api";

const router = Router({ caseSensitive: false });

router.get('/id', (req: Request, res: Response) => {
    console.log('[LOG][API] /id handler')
    res.status(200).send(req.solidSession?.info.webId);
});

router.get('/application-profiles', async (req: Request, res: Response) => {
    console.log('[LOG][API] /applications handler')
    const registrations: ReadableApplicationRegistration[] = [];
    for await (const registration of req.saiSession!.applicationRegistrations) {
        registrations.push(registration);
    }

    const profiles: ApplicationProfile[] = [];
    for (const registration of registrations) {
        console.log('[Registrations list]', registration.iri);
        const documentResponse = await req.solidSession!.fetch(registration.registeredAgent);
        const applicationSet = await parseRdf(await documentResponse.text(), registration.iri);
        const applicationProfile = getApplicationProfile(applicationSet);
        profiles.push(applicationProfile);
    }

    res.status(200).json(profiles);
});

router.get('/consents', async (req: Request, res: Response) => {
    console.log('[API] /consents handler');

   for await (const consent of req.saiSession!.accessConsents) {
       console.log('Found consent for agent', consent.registeredAgent);
   }

   res.send();
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
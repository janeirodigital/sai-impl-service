
import {Router, Request, Response} from 'express';
import {getAllObjects} from "./utils/rdf-parser";

import {AccessConsent, ACL, ApplicationProfile, ConsentScope, DataConsent, IRI} from "./sai-api";
import {getApplications} from "./services";
import {getDescriptions} from "./services/descriptions";

const router = Router({ caseSensitive: false });

router.get('/id', (req: Request, res: Response) => {
    res.send(req.webid);
});

router.get('/applications', async (req: Request, res: Response) => {
    const profiles = await getApplications(req.sai);
    res.json(profiles);
});

router.get('/descriptions/:applicationId/:lang', async (req: Request, res: Response) => {
    const { applicationId, lang } = req.params;

    console.log(applicationId, lang);
    const descriptions = await getDescriptions(req.sai, applicationId, lang);
    res.json(descriptions);
});

router.get('/data-consents', async (req: Request, res: Response) => {
    // console.log('[API] /data-consents handler');
    // req.saiSession = req.saiSession!;
    //
    // const dataConsents: DataConsent[] = [];
    // for await (const consent of req.saiSession!.accessConsents) {
    //     for await (const dataConsent of consent.dataConsents) {
    //         dataConsents.push({
    //             id: dataConsent.iri,
    //             dataOwner: dataConsent.dataOwner,
    //             grantee: dataConsent.grantee,
    //             shapeTree: dataConsent.registeredShapeTree,
    //             accessModes: dataConsent.accessMode as ACL[],
    //             // TODO (angel) add creator access modes from ??
    //             scope: dataConsent.scopeOfConsent as ConsentScope,
    //             dataRegistration: dataConsent.hasDataRegistration,
    //             dataInstance: dataConsent.hasDataInstance,
    //         })
    //     }
    // }
    //
    // res.send(dataConsents);
    res.send();
});

export default router;
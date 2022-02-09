
import {Router, Request, Response} from 'express';
import {getAccessNeeds, getApplications, getDescriptions} from "./services";

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

    const descriptions = await getDescriptions(req.sai, applicationId, lang);
    res.json(descriptions);
});

router.get('/needs/:applicationId', async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const needs = await getAccessNeeds(req.sai, applicationId)
    res.json(needs);
});

export default router;
import { Router, Request, Response } from "express";
import { getAccessConsents, getAccessNeeds, getApplications, getDescriptions } from "./services";

const router = Router({ caseSensitive: false });

router.get("/id", (req: Request, res: Response) => {

  // TODO sai-js make sai.webId public
  // @ts-ignore
  res.send(req.sai.webId);
});

router.get("/applications", async (req: Request, res: Response) => {
  const profiles = await getApplications(req.sai);
  res.json(profiles);
});

router.get("/descriptions/:applicationId/:lang", async (req: Request, res: Response) => {
  const { applicationId, lang } = req.params;

  const descriptions = await getDescriptions(req.sai, applicationId, lang);
  res.json(descriptions);
});

router.get("/needs/:applicationId", async (req: Request, res: Response) => {
  const { applicationId } = req.params;
  const needs = await getAccessNeeds(req.sai, applicationId);
  res.json(needs);
});

router.get("/consents/:applicationId", async (req: Request, res: Response) => {
  const { applicationId } = req.params;

  const consents = await getAccessConsents(req.sai, applicationId);
  res.json(consents);
});

export default router;

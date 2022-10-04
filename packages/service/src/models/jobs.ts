import { IRI } from "@janeirodigital/sai-api-messages";

export interface IReciprocalRegistrationsJobData {
  webId: IRI,
  registeredAgent: IRI
}
export interface IReciprocalRegistrationsJob {
  data: IReciprocalRegistrationsJobData
}

import 'dotenv/config';

export const baseUrl: string = process.env.BASE_URL!

export const frontendUrl: string = process.env.FRONTEND_URL!

export function agentUrl(uuid: string): string {
  return `${baseUrl}/agents/${uuid}`
}

export function agentRedirectUrl(uuid: string): string {
  return `${baseUrl}/agents/${uuid}/redirect`
}

import 'dotenv/config';

export const baseUrl: string = process.env.BASE_URL!

export const frontendUrl: string = process.env.FRONTEND_URL!

export function uuid2agentUrl(uuid: string): string {
  return `${baseUrl}/agents/${uuid}`
}

export function agentUuid(url: string): string {
  return url.split('/').at(-1)!
}

export function agentRedirectUrl(url: string): string {
  const uuid = url.split('/').at(-1)!
  return `${baseUrl}/agents/${uuid}/redirect`
}

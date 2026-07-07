import { verifyKey } from 'discord-interactions';

/**
 * Verifies the signature of an incoming Discord interaction request.
 * Returns the raw request body as a string if valid.
 */
export async function verifyDiscordRequest(
  request: Request,
  publicKey: string
): Promise<{ isValid: boolean; rawBody: string }> {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');

  if (!signature || !timestamp) {
    return { isValid: false, rawBody: '' };
  }

  try {
    const rawBody = await request.text();
    const isValid = await verifyKey(rawBody, signature, timestamp, publicKey);
    return { isValid, rawBody };
  } catch (error) {
    console.error('Error during signature verification:', error);
    return { isValid: false, rawBody: '' };
  }
}

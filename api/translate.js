// api/translate.js
import { TranslationServiceClient } from '@google-cloud/translate';

const PROJECT_ID = process.env.GCLOUD_PROJECT_ID || '';
const CREDS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '';

const client = new TranslationServiceClient(
  CREDS_JSON
    ? { credentials: JSON.parse(CREDS_JSON), projectId: PROJECT_ID }
    : {}
);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { q, source = 'en', target = 'vi' } = req.body || {};
    if (!Array.isArray(q) || q.length === 0) {
      return res.status(400).json({ error: 'Body must include q: string[]' });
    }
    if (!PROJECT_ID || !CREDS_JSON) {
      return res.status(500).json({ error: 'Missing Google credentials env vars' });
    }

    const [resp] = await client.translateText({
      parent: `projects/${PROJECT_ID}/locations/global`,
      contents: q,
      mimeType: 'text/plain',
      sourceLanguageCode: source,
      targetLanguageCode: target,
    });

    const translations = (resp.translations || []).map(t => t.translatedText || '');
    return res.status(200).json({ translations });
  } catch (e) {
    console.error('Translate error:', e);
    return res.status(502).json({ error: 'Translation failed' });
  }
}

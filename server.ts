import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { validateScorePlausibility } from './src/game/rules.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SIGNING_SECRET = process.env.SCORE_SIGNING_SECRET || 'escapell-last-horizon-server-key';

function signValidatedRun(payload: {
  uid: string;
  score: number;
  distance: number;
  coins: number;
  timestamp: number;
}): string {
  const canonical = `${payload.uid}:${Math.round(payload.score)}:${Math.round(payload.distance)}:${Math.round(payload.coins)}:${payload.timestamp}`;
  return crypto.createHmac('sha256', SIGNING_SECRET).update(canonical).digest('hex').slice(0, 32);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'esCApeLL', timestamp: Date.now() });
  });

  app.post('/api/score/validate', (req, res) => {
    const body = req.body ?? {};
    const uid = typeof body.uid === 'string' ? body.uid.trim() : '';
    const distance = Number(body.distance);
    const score = Number(body.score);
    const coins = Number(body.coins);
    const durationSec = Number(body.durationSec);

    if (!uid || uid.length > 128) {
      res.status(400).json({ valid: false, reason: 'invalid_uid' });
      return;
    }

    const check = validateScorePlausibility({ distance, score, coins, durationSec });
    if (!check.valid) {
      res.status(422).json({ valid: false, reason: check.reason });
      return;
    }

    const timestamp = Date.now();
    const validationSig = signValidatedRun({ uid, score, distance, coins, timestamp });
    res.json({
      valid: true,
      validationSig,
      verifiedAt: timestamp,
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`esCApeLL server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start esCApeLL server:', err);
  process.exit(1);
});

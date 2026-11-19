import crypto from 'node:crypto';
import { validateScorePlausibility } from '../../src/game/rules';

const SIGNING_SECRET = process.env.SCORE_SIGNING_SECRET || 'escapell-last-horizon-server-key';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ valid: false, reason: 'method_not_allowed' });
    return;
  }

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
  const canonical = `${uid}:${Math.round(score)}:${Math.round(distance)}:${Math.round(coins)}:${timestamp}`;
  const validationSig = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(canonical)
    .digest('hex')
    .slice(0, 32);

  res.status(200).json({
    valid: true,
    validationSig,
    verifiedAt: timestamp,
  });
}

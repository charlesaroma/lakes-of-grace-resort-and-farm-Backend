import crypto from 'node:crypto';
import { Media } from './media.model.js';
import { env } from '../../../config/env.js';

// ─── Helpers ───
function verifySignature(rawBody, signature) {
  const hmac = crypto.createHmac('sha256', env.IMAGEKIT_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expected = hmac.digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ─── Handler ───
export const handleWebhook = async (req, res) => {
  const signature = req.headers['x-ik-signature'];
  if (!signature || !verifySignature(req.body, signature)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const payload = JSON.parse(req.body.toString());
  const { event, data } = payload;

  switch (event) {
    case 'file.upload': {
      const tag = data.tags?.[0] || 'gallery';
      const existing = await Media.findOne({ fileId: data.fileId });
      if (!existing) {
        await Media.create({
          url: data.url,
          fileId: data.fileId,
          tag,
          size: `${(data.size / 1024).toFixed(0)} KB`,
          alt: data.name.replace(/\.[^/.]+$/, ''),
        });
      }
      break;
    }

    case 'file.delete': {
      await Media.findOneAndDelete({ fileId: data.fileId });
      break;
    }

    default:
      console.log('Unhandled ImageKit webhook event:', event);
  }

  res.status(200).json({ received: true });
};

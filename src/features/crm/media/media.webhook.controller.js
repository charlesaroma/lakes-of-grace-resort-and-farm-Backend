import crypto from 'node:crypto';
import { prisma } from '../../../lib/prisma.js';
import { env } from '../../../config/env.js';

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
      const existing = await prisma.media.findUnique({ where: { fileId: data.fileId } });
      if (!existing) {
        await prisma.media.create({
          data: {
            url: data.url,
            fileId: data.fileId,
            tag,
            size: `${(data.size / 1024).toFixed(0)} KB`,
            alt: data.name.replace(/\.[^/.]+$/, ''),
          },
        });
      }
      break;
    }

    case 'file.delete': {
      await prisma.media.deleteMany({ where: { fileId: data.fileId } });
      break;
    }

    default:
      console.log('Unhandled ImageKit webhook event:', event);
  }

  res.status(200).json({ received: true });
};

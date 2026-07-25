import express from 'express';
import { handlePesapalIPN } from './payment.webhook.js';

// ─── Router ───
const router = express.Router();

// Pesapal IPN endpoint
router.get('/ipn', handlePesapalIPN);
router.post('/ipn', handlePesapalIPN);

// ─── Initiate Payment (commented — uncomment when Pesapal is live) ───
// import { env } from '../../config/env.js';
//
// const PESAPAL_AUTH_URL = env.PESAPAL_ENV === 'live'
//   ? 'https://pay.pesapal.com/v3'
//   : 'https://cybqa.pesapal.com/pesapalv3';
//
// async function getPesapalToken() {
//   const res = await fetch(`${PESAPAL_AUTH_URL}/api/Auth/RequestToken`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
//     body: JSON.stringify({
//       consumer_key: env.PESAPAL_CONSUMER_KEY,
//       consumer_secret: env.PESAPAL_CONSUMER_SECRET,
//     }),
//   });
//   const data = await res.json();
//   if (!data.token) throw new Error('Failed to get Pesapal token');
//   return data.token;
// }
//
// router.post('/initiate', async (req, res) => {
//   try {
//     const { bookingId, amount, email, phone, guestName } = req.body;
//     const token = await getPesapalToken();
//     const callbackUrl = `${env.FRONTEND_URL}/booking-success?bookingId=${bookingId}`;
//     const ipnUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/api/payments/ipn`;
//
//     const payload = {
//       id: bookingId,
//       currency: 'KES',
//       amount,
//       description: `Lakes of Grace Resort - Booking ${bookingId}`,
//       callback_url: callbackUrl,
//       notification_id: '', // Will be set after registering IPN URL
//       billing_address: {
//         email_address: email,
//         phone_number: phone,
//         first_name: guestName.split(' ')[0] || guestName,
//         last_name: guestName.split(' ').slice(1).join(' ') || '',
//       },
//     };
//
//     const resPesapal = await fetch(`${PESAPAL_AUTH_URL}/api/Transactions/SubmitOrderRequest`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//       body: JSON.stringify(payload),
//     });
//     const data = await resPesapal.json();
//     res.json(data);
//   } catch (err) {
//     console.error('Pesapal initiate error:', err.message);
//     res.status(500).json({ error: 'Failed to initiate payment' });
//   }
// });

export default router;

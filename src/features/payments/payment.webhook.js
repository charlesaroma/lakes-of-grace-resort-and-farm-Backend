// ─── Pesapal IPN Handler ───
// Handles Pesapal Instant Payment Notifications (IPN).
// Pesapal calls this URL when a payment status changes.

// import { env } from '../../config/env.js';
// import prisma from '../../lib/prisma.js';

// const PESAPAL_AUTH_URL = env.PESAPAL_ENV === 'live'
//   ? 'https://pay.pesapal.com/v3'
//   : 'https://cybqa.pesapal.com/pesapalv3';

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

// async function queryTransactionStatus(orderTrackingId) {
//   const token = await getPesapalToken();
//   const res = await fetch(
//     `${PESAPAL_AUTH_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
//     {
//       headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
//     },
//   );
//   return res.json();
// }

export const handlePesapalIPN = async (req, res) => {
  try {
    const { OrderTrackingId, OrderNotificationType } = req.query.OrderTrackingId ? req.query : req.body;

    if (!OrderTrackingId) {
      return res.status(400).json({ error: 'Missing OrderTrackingId' });
    }

    console.log(`Received Pesapal IPN for order: ${OrderTrackingId}, Type: ${OrderNotificationType}`);

    // TODO — uncomment when Pesapal is live:
    //
    // 1. Query the real transaction status from Pesapal
    // const statusData = await queryTransactionStatus(OrderTrackingId);
    //
    // 2. Map Pesapal status to your booking status and update DB
    // const pesapalStatus = statusData.status_code; // 0=INV, 1=COMPLETED, 2=FAILED, 3=REVERSED
    // const bookingStatus = pesapalStatus === 1 ? 'Confirmed' : 'Pending';
    // await prisma.booking.update({
    //   where: { pesapalTrackingId: OrderTrackingId },
    //   data: { status: bookingStatus, paymentMethod: 'Pesapal' },
    // });
    //
    // 3. Send confirmation email if payment succeeded
    // if (pesapalStatus === 1) {
    //   const { sendConfirmationEmail } = await import('../email/email.service.js');
    //   await sendConfirmationEmail(booking);
    // }

    res.status(200).json({ status: 'success', message: 'IPN received' });
  } catch (err) {
    console.error(`Pesapal IPN Error:`, err.message);
    res.status(500).json({ error: 'Internal Server Error processing IPN' });
  }
};

import { env } from '../../config/env.js';

/**
 * Handles Pesapal Instant Payment Notifications (IPN).
 * Pesapal calls this URL when a payment status changes.
 */
export const handlePesapalIPN = async (req, res) => {
  try {
    // Pesapal typically sends OrderTrackingId and OrderNotificationType
    // This can be via query parameters or body depending on the webhook setup
    const { OrderTrackingId, OrderNotificationType } = req.query.OrderTrackingId ? req.query : req.body;

    if (!OrderTrackingId) {
      return res.status(400).json({ error: 'Missing OrderTrackingId' });
    }

    console.log(`Received Pesapal IPN for order: ${OrderTrackingId}, Type: ${OrderNotificationType}`);

    // TODO: 
    // 1. Obtain a Pesapal OAuth Access Token using your Consumer Key and Secret
    // 2. Make a request to Pesapal's API to query the transaction status using OrderTrackingId
    // 3. Update the Booking/Payment record in your database based on the true status returned by Pesapal
    
    // Respond quickly to acknowledge receipt, otherwise Pesapal will keep retrying
    res.status(200).json({ status: 'success', message: 'IPN received' });
    
  } catch (err) {
    console.error(`⚠️  Pesapal IPN Error:`, err.message);
    res.status(500).json({ error: 'Internal Server Error processing IPN' });
  }
};

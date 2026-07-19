import express from 'express';
import { handlePesapalIPN } from './payment.webhook.js';

const router = express.Router();

// Pesapal IPN endpoint
// Unlike Stripe, Pesapal doesn't require a raw body parser for signature verification.
// Standard express.json() works fine if they send POST with JSON, or standard query params for GET.
router.get('/ipn', handlePesapalIPN);
router.post('/ipn', handlePesapalIPN);

export default router;

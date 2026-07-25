// ─── Email Service (commented — requires nodemailer and SMTP env vars) ───
// import nodemailer from 'nodemailer';
// import { env } from '../../config/env.js';
//
// const transporter = nodemailer.createTransport({
//   host: env.SMTP_HOST,
//   port: env.SMTP_PORT,
//   auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
// });
//
// export async function sendConfirmationEmail(booking) {
//   const { guestName, guestEmail, areaOfStay, boardType, occupancy, checkIn, checkOut, totalAmount } = booking;
//
//   const html = `
//     <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;">
//       <h1 style="color: #b8860b;">Lakes of Grace Resort</h1>
//       <p>Dear ${guestName},</p>
//       <p>Your booking has been confirmed!</p>
//       <table style="width: 100%; border-collapse: collapse;">
//         <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Area of Stay</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${areaOfStay}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Board Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${boardType}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Occupancy</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${occupancy}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-In</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkIn.toLocaleDateString()}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Check-Out</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkOut.toLocaleDateString()}</td></tr>
//         <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #ddd;">KES ${totalAmount.toLocaleString()}</td></tr>
//       </table>
//       <p style="margin-top: 24px;">We look forward to hosting you.</p>
//       <p>Warm regards,<br/>Lakes of Grace Team</p>
//     </div>
//   `;
//
//   await transporter.sendMail({
//     from: env.EMAIL_FROM,
//     to: guestEmail,
//     subject: `Booking Confirmed — Lakes of Grace Resort`,
//     html,
//   });
// }

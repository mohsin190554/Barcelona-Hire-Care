const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const b = req.body;

        const vehicleNames = {
            eclass: 'Mercedes E Class',
            vclass: 'Mercedes V Class',
            vito: 'Mercedes Vito',
            lexus: 'Lexus ES300h (Standard)',
            toyota: 'Toyota Corolla (Economy)'
        };

        const vehicleLabel = vehicleNames[b.vehicle] || b.vehicle || 'N/A';

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #0096C7; color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section h2 { font-size: 16px; color: #0096C7; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; margin-bottom: 15px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: 600; color: #1a1a1a; text-align: right; max-width: 60%; }
    .total { background: #f8f8f8; border-radius: 8px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
    .total span:first-child { font-size: 16px; font-weight: 600; }
    .total span:last-child { font-size: 22px; font-weight: 700; color: #0096C7; }
    .footer { background: #1a1a1a; color: rgba(255,255,255,0.7); text-align: center; padding: 20px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Booking Received</h1>
      <p>Barcelona Hire Car — Admin Notification</p>
    </div>
    <div class="body">

      <div class="section">
        <h2>Customer Details</h2>
        <div class="row"><span class="label">Name</span><span class="value">${b.customer_name || 'N/A'}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${b.customer_email || 'N/A'}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${b.customer_phone || 'N/A'}</span></div>
      </div>

      <div class="section">
        <h2>Trip Details</h2>
        <div class="row"><span class="label">Date</span><span class="value">${b.pickup_date || 'N/A'}</span></div>
        <div class="row"><span class="label">Time</span><span class="value">${b.pickup_time || 'N/A'}</span></div>
        <div class="row"><span class="label">Pickup</span><span class="value">${b.pickup_location || 'N/A'}</span></div>
        <div class="row"><span class="label">Dropoff</span><span class="value">${b.dropoff_location || 'N/A'}</span></div>
        <div class="row"><span class="label">Distance</span><span class="value">${b.distance ? b.distance + ' km' : 'N/A'}</span></div>
        <div class="row"><span class="label">Transfer Type</span><span class="value">${b.transfer_type || 'Regular'}</span></div>
        <div class="row"><span class="label">Vehicle</span><span class="value">${vehicleLabel}</span></div>
        <div class="row"><span class="label">Passengers</span><span class="value">${b.passengers || 1}</span></div>
      </div>

      <div class="section">
        <h2>Extras</h2>
        <div class="row"><span class="label">Flight Number</span><span class="value">${b.flight_number || 'None'}</span></div>
        <div class="row"><span class="label">Meet &amp; Greet</span><span class="value">${b.meet_greet ? 'Yes' : 'No'}</span></div>
        <div class="row"><span class="label">Child Seats</span><span class="value">${b.child_seats || 0}</span></div>
        <div class="row"><span class="label">Booster Seats</span><span class="value">${b.booster_seats || 0}</span></div>
        <div class="row"><span class="label">Waiting Time</span><span class="value">${b.waiting_time && b.waiting_time !== '0' ? b.waiting_time + ' hr(s)' : 'None'}</span></div>
        ${b.special_requests ? `<div class="row"><span class="label">Special Requests</span><span class="value">${b.special_requests}</span></div>` : ''}
      </div>

      <div class="section">
        <h2>Payment</h2>
        <div class="row"><span class="label">Payment ID</span><span class="value">${b.payment_id || 'N/A'}</span></div>
        <div class="row"><span class="label">Status</span><span class="value">${b.status || 'confirmed'}</span></div>
        <div class="total">
          <span>Total Charged</span>
          <span>€${parseFloat(b.total_price || 0).toFixed(2)}</span>
        </div>
      </div>

    </div>
    <div class="footer">
      Barcelona Hire Car &bull; barcelonahirecar@gmail.com &bull; +34 656 269 013
    </div>
  </div>
</body>
</html>`;

        const { data, error } = await resend.emails.send({
            from: 'Barcelona Hire Car <onboarding@resend.dev>',
            to: ['barcelonahirecar@gmail.com'],
            subject: `New Booking — ${b.customer_name} | ${vehicleLabel} | €${parseFloat(b.total_price || 0).toFixed(2)}`,
            html
        });

        if (error) return res.status(500).json({ error: error.message });

        return res.status(200).json({ success: true, messageId: data.id });

    } catch (err) {
        console.error('Send email error:', err);
        return res.status(500).json({ error: err.message || 'Failed to send email' });
    }
};

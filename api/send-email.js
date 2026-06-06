const { Resend } = require('resend');
const PDFDocument = require('pdfkit');

const resend = new Resend(process.env.RESEND_API_KEY);

const vehicleNames = {
    eclass: 'Mercedes E Class',
    vclass: 'Mercedes V Class',
    vito:   'Mercedes Vito',
    lexus:  'Lexus ES300h (Standard)',
    toyota: 'Toyota Corolla (Economy)'
};

function generateBookingPDF(booking) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const bookingId = `BHC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
        const bookingDate = new Date().toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const vehicleLabel = vehicleNames[booking.vehicle] || booking.vehicle || 'N/A';
        const totalAmount    = parseFloat(booking.total_price || booking.total_amount || 0).toFixed(2);
        const amountPaid     = parseFloat(booking.amount_paid     || 0).toFixed(2);
        const amountRemaining = parseFloat(booking.amount_remaining || 0).toFixed(2);

        // Header
        doc.fontSize(26).fillColor('#0096C7').font('Helvetica-Bold')
            .text('BARCELONA HIRE CAR', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(18).fillColor('#000000').font('Helvetica-Bold')
            .text('BOOKING CONFIRMATION', { align: 'center' });
        doc.moveDown(1.2);

        // Booking Information
        doc.fontSize(13).fillColor('#000000').font('Helvetica-Bold')
            .text('BOOKING INFORMATION', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Booking ID: ${bookingId}`);
        doc.text(`Booking Date: ${bookingDate}`);
        doc.text(`Status: ${booking.status === 'pending_payment' ? 'PENDING PAYMENT' : 'CONFIRMED'}`);
        doc.moveDown(1);

        // Customer Details
        doc.fontSize(13).font('Helvetica-Bold').text('CUSTOMER DETAILS', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Full Name: ${booking.customer_name || 'N/A'}`);
        doc.text(`Email: ${booking.customer_email || 'N/A'}`);
        doc.text(`Phone: ${booking.customer_phone || 'N/A'}`);
        doc.moveDown(1);

        // Trip Details
        doc.fontSize(13).font('Helvetica-Bold').text('TRIP DETAILS', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Pickup Location: ${booking.pickup_location || 'N/A'}`);
        doc.text(`Dropoff Location: ${booking.dropoff_location || 'N/A'}`);
        doc.text(`Pickup Date: ${booking.pickup_date || 'N/A'}`);
        doc.text(`Pickup Time: ${booking.pickup_time || 'N/A'}`);
        doc.moveDown(1);

        // Vehicle & Passengers
        doc.fontSize(13).font('Helvetica-Bold').text('VEHICLE & PASSENGERS', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Selected Vehicle: ${vehicleLabel}`);
        doc.text(`Passengers: ${booking.passengers || 'N/A'}`);
        if (booking.child_seats   > 0) doc.text(`Child Seats: ${booking.child_seats}`);
        if (booking.booster_seats > 0) doc.text(`Booster Seats: ${booking.booster_seats}`);
        if (booking.meet_greet)        doc.text('Meet & Greet: Yes');
        if (booking.flight_number)     doc.text(`Flight Number: ${booking.flight_number}`);
        doc.moveDown(1);

        // Special Requests
        if (booking.special_requests) {
            doc.fontSize(13).font('Helvetica-Bold').text('SPECIAL REQUESTS', { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(11).font('Helvetica').text(booking.special_requests, { width: 500 });
            doc.moveDown(1);
        }

        // Payment Details — dynamic per method
        doc.fontSize(13).font('Helvetica-Bold').text('PAYMENT DETAILS', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');

        if (booking.payment_method === 'partial_20') {
            doc.text(`Total Amount: EUR ${totalAmount}`);
            doc.text(`Advance Paid (20%): EUR ${amountPaid}`);
            doc.text(`Remaining (80%): EUR ${amountRemaining}`);
            doc.font('Helvetica-Bold').text(`Status: 20% PAID — EUR ${amountRemaining} due on pickup/dropoff`);
            doc.font('Helvetica').fontSize(10).text('(Remaining amount can be paid in cash or card to driver)');
        } else if (booking.payment_method === 'pay_later') {
            doc.text(`Total Amount: EUR ${totalAmount}`);
            doc.text('Amount Paid: EUR 0.00');
            doc.font('Helvetica-Bold').text('Status: PAY ON PICKUP/DROPOFF');
            doc.font('Helvetica').fontSize(10)
                .text(`Full amount EUR ${totalAmount} to be paid during ride (cash or card to driver)`);
        } else {
            doc.text(`Total Amount: EUR ${totalAmount}`);
            doc.text(`Amount Paid: EUR ${amountPaid} (PAID IN FULL)`);
            doc.font('Helvetica-Bold').text('Status: PAID IN FULL');
        }
        doc.moveDown(1);

        // Contact
        doc.fontSize(13).font('Helvetica-Bold').text('CONTACT US', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text('Phone: +34 656 269 013');
        doc.text('Email: barcelonahirecar@gmail.com');
        doc.text('Website: www.barcelonahirecar.com');
        doc.moveDown(1.5);

        // Footer
        doc.fontSize(11).fillColor('#0096C7').font('Helvetica-Bold')
            .text('Thank you for choosing Barcelona Hire Car!', { align: 'center' });
        doc.fontSize(10).fillColor('#666666').font('Helvetica')
            .text('Your Premium Transportation Partner', { align: 'center' });

        doc.end();
    });
}

function generateEmailHTML(booking, isCustomer) {
    const vehicleLabel    = vehicleNames[booking.vehicle] || booking.vehicle || 'N/A';
    const totalAmount     = parseFloat(booking.total_price || booking.total_amount || 0).toFixed(2);
    const amountPaid      = parseFloat(booking.amount_paid     || 0).toFixed(2);
    const amountRemaining = parseFloat(booking.amount_remaining || 0).toFixed(2);

    let paymentSection = '';
    if (booking.payment_method === 'partial_20') {
        paymentSection = `
            <div style="background:#fff3cd;padding:20px;border-radius:8px;margin:20px 0;">
                <h3 style="color:#1E293B;margin-top:0;">Payment Status</h3>
                <p><strong>Total Amount:</strong> EUR ${totalAmount}</p>
                <p><strong>Advance Paid (20%):</strong> EUR ${amountPaid}</p>
                <p><strong>Remaining (80%):</strong> EUR ${amountRemaining}</p>
                <p style="color:#856404;margin-top:10px;"><strong>⚠️ Pay EUR ${amountRemaining} on pickup/dropoff (cash or card to driver)</strong></p>
            </div>`;
    } else if (booking.payment_method === 'pay_later') {
        paymentSection = `
            <div style="background:#f8d7da;padding:20px;border-radius:8px;margin:20px 0;">
                <h3 style="color:#1E293B;margin-top:0;">Payment Status</h3>
                <p><strong>Total Amount:</strong> EUR ${totalAmount}</p>
                <p><strong>Status:</strong> <span style="color:#dc3545;font-weight:bold;">PAY ON PICKUP/DROPOFF</span></p>
                <p style="color:#721c24;margin-top:10px;"><strong>💵 Pay EUR ${totalAmount} during ride (cash or card to driver)</strong></p>
            </div>`;
    } else {
        paymentSection = `
            <div style="background:#d4edda;padding:20px;border-radius:8px;margin:20px 0;">
                <h3 style="color:#1E293B;margin-top:0;">Payment Status</h3>
                <p><strong>Total Amount:</strong> EUR ${totalAmount}</p>
                <p><strong>Status:</strong> <span style="color:#10B981;font-weight:bold;">✓ PAID IN FULL</span></p>
            </div>`;
    }

    const greeting = isCustomer
        ? `<h2 style="color:#0096C7;">Thank you for your booking, ${booking.customer_name}!</h2>`
        : `<h2 style="color:#0096C7;border-bottom:2px solid #0096C7;padding-bottom:10px;">🚗 NEW BOOKING RECEIVED</h2>`;

    const intro = isCustomer
        ? `<p style="font-size:16px;">Your booking has been confirmed. Please find your booking details below and the full confirmation attached as PDF.</p>`
        : '';

    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    ${greeting}
    ${intro}
    <div style="background:#f9f9f9;padding:20px;border-radius:8px;margin:20px 0;">
        <h3 style="color:#1E293B;margin-top:0;">${isCustomer ? 'Your Details' : 'Customer Details'}</h3>
        <p><strong>Name:</strong> ${booking.customer_name || 'N/A'}</p>
        <p><strong>Email:</strong> ${booking.customer_email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${booking.customer_phone || 'N/A'}</p>
    </div>
    <div style="background:#f9f9f9;padding:20px;border-radius:8px;margin:20px 0;">
        <h3 style="color:#1E293B;margin-top:0;">Trip Details</h3>
        <p><strong>From:</strong> ${booking.pickup_location || 'N/A'}</p>
        <p><strong>To:</strong> ${booking.dropoff_location || 'N/A'}</p>
        <p><strong>Date:</strong> ${booking.pickup_date || 'N/A'} at ${booking.pickup_time || 'N/A'}</p>
        <p><strong>Vehicle:</strong> ${vehicleLabel}</p>
        <p><strong>Passengers:</strong> ${booking.passengers || 'N/A'}</p>
    </div>
    ${paymentSection}
    <div style="background:#e0f4ff;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #0096C7;">
        <p style="margin:0;"><strong>📎 Complete booking details attached as PDF</strong></p>
    </div>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #ddd;text-align:center;color:#666;">
        <p><strong>Barcelona Hire Car</strong></p>
        <p style="font-size:12px;">Phone: +34 656 269 013 | Email: barcelonahirecar@gmail.com</p>
    </div>
</div>`;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const booking = req.body;
        const bookingId = `BHC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
        const pdfBuffer = await generateBookingPDF(booking);
        const vehicleLabel = vehicleNames[booking.vehicle] || booking.vehicle || 'N/A';
        const totalAmount  = parseFloat(booking.total_price || booking.total_amount || 0).toFixed(2);

        // Admin email
        const adminResult = await resend.emails.send({
            from: 'Barcelona Hire Car <onboarding@resend.dev>',
            to: ['barcelonahirecar@gmail.com'],
            subject: `New Booking — ${booking.customer_name} | ${vehicleLabel} | €${totalAmount}`,
            html: generateEmailHTML(booking, false),
            attachments: [{ filename: `booking-${bookingId}.pdf`, content: pdfBuffer }]
        });

        // Customer email
        const customerResult = await resend.emails.send({
            from: 'Barcelona Hire Car <onboarding@resend.dev>',
            to: [booking.customer_email],
            subject: 'Your Barcelona Hire Car Booking Confirmation',
            html: generateEmailHTML(booking, true),
            attachments: [{ filename: 'booking-confirmation.pdf', content: pdfBuffer }]
        });

        if (adminResult.error || customerResult.error) {
            console.error('Resend error:', adminResult.error || customerResult.error);
            return res.status(500).json({ error: 'Email sending failed' });
        }

        return res.status(200).json({
            success: true,
            adminMessageId: adminResult.data?.id,
            customerMessageId: customerResult.data?.id,
            message: 'Both emails sent successfully'
        });

    } catch (err) {
        console.error('Send email error:', err);
        return res.status(500).json({ error: err.message || 'Failed to send email' });
    }
};

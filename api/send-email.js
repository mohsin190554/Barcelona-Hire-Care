const { Resend } = require('resend');
const PDFDocument = require('pdfkit');

const resend = new Resend(process.env.RESEND_API_KEY);

// Function to generate PDF
function generateBookingPDF(booking) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(26).fillColor('#0096C7').text('BARCELONA HIRE CAR', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(18).fillColor('#000000').text('BOOKING CONFIRMATION', { align: 'center' });
        doc.moveDown(1.2);

        // Booking ID and Date
        const bookingId = `BHC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
        const bookingDate = new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        doc.fontSize(13).fillColor('#000000').text('BOOKING INFORMATION', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11);
        doc.text(`Booking ID: ${bookingId}`);
        doc.text(`Booking Date: ${bookingDate}`);
        doc.text(`Status: CONFIRMED`);
        doc.moveDown(1);

        // Customer Details
        doc.fontSize(13).text('CUSTOMER DETAILS', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11);
        doc.text(`Full Name: ${booking.customer_name || 'N/A'}`);
        doc.text(`Email: ${booking.customer_email || 'N/A'}`);
        doc.text(`Phone: ${booking.customer_phone || 'N/A'}`);
        doc.moveDown(1);

        // Trip Details
        doc.fontSize(13).text('TRIP DETAILS', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11);
        doc.text(`Pickup Location: ${booking.pickup_location || 'N/A'}`);
        doc.text(`Dropoff Location: ${booking.dropoff_location || 'N/A'}`);
        doc.text(`Pickup Date: ${booking.pickup_date || 'N/A'}`);
        doc.text(`Pickup Time: ${booking.pickup_time || 'N/A'}`);
        doc.moveDown(1);

        // Vehicle & Passengers
        doc.fontSize(13).text('VEHICLE & PASSENGERS', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11);
        doc.text(`Selected Vehicle: ${booking.vehicle || 'N/A'}`);
        doc.text(`Passengers: ${booking.passengers || 'N/A'}`);
        
        if (booking.child_seats && booking.child_seats > 0) {
            doc.text(`Child Seats: ${booking.child_seats}`);
        }
        if (booking.booster_seats && booking.booster_seats > 0) {
            doc.text(`Booster Seats: ${booking.booster_seats}`);
        }
        if (booking.meet_greet) {
            doc.text(`Meet & Greet: Yes`);
        }
        if (booking.flight_number) {
            doc.text(`Flight Number: ${booking.flight_number}`);
        }
        doc.moveDown(1);

        // Special Requests
        if (booking.special_requests) {
            doc.fontSize(13).text('SPECIAL REQUESTS', { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(11);
            doc.text(booking.special_requests, { width: 500 });
            doc.moveDown(1);
        }

        // Contact Information
        doc.fontSize(13).text('CONTACT US', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11);
        doc.text('Phone: +34 656 269 013');
        doc.text('Email: barcelonahirecar@gmail.com');
        doc.text('Website: www.barcelonahirecar.com');
        doc.moveDown(1.5);

        // Footer
        doc.fontSize(11).fillColor('#0096C7').text('Thank you for choosing Barcelona Hire Car!', { align: 'center' });
        doc.fontSize(10).fillColor('#666666').text('Your Premium Transportation Partner', { align: 'center' });

        doc.end();
    });
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const booking = req.body;

        // Generate PDF
        const pdfBuffer = await generateBookingPDF(booking);
        const bookingId = `BHC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

        // Send email with PDF attachment
        const { data, error } = await resend.emails.send({
            from: 'Barcelona Hire Car <onboarding@resend.dev>',
            to: ['barcelonahirecar@gmail.com'],
            subject: `New Booking - ${booking.customer_name} - ${booking.vehicle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0096C7; border-bottom: 2px solid #0096C7; padding-bottom: 10px;">
                        🚗 NEW BOOKING RECEIVED
                    </h2>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1E293B; margin-top: 0;">Customer Details</h3>
                        <p><strong>Name:</strong> ${booking.customer_name}</p>
                        <p><strong>Email:</strong> ${booking.customer_email}</p>
                        <p><strong>Phone:</strong> ${booking.customer_phone}</p>
                    </div>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1E293B; margin-top: 0;">Trip Summary</h3>
                        <p><strong>From:</strong> ${booking.pickup_location}</p>
                        <p><strong>To:</strong> ${booking.dropoff_location}</p>
                        <p><strong>Date:</strong> ${booking.pickup_date} at ${booking.pickup_time}</p>
                        <p><strong>Vehicle:</strong> ${booking.vehicle}</p>
                        <p><strong>Passengers:</strong> ${booking.passengers}</p>
                    </div>
                    
                    <div style="background: #e0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1E293B; margin-top: 0;">Payment</h3>
                        <p><strong>Total:</strong> €${booking.total_amount || booking.total_price}</p>
                        <p><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">✓ PAID</span></p>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0;"><strong>📎 Complete booking details attached as PDF</strong></p>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
                        <p>Barcelona Hire Car - Admin Notification</p>
                        <p style="font-size: 12px;">Phone: +34 656 269 013 | Email: barcelonahirecar@gmail.com</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `booking-${bookingId}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ 
            success: true, 
            messageId: data.id,
            message: 'Email sent successfully with PDF attachment'
        });

    } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to send email'
        });
    }
};

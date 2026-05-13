// server.js - Backend payment handler for Barcelona Hire Car
// This file needs to be deployed on your server to handle Stripe payments

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY_HERE'); // Replace with your actual secret key

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://yourdomain.com' // Replace with your actual domain
}));

// Create payment intent endpoint
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, bookingData } = req.body;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: 'eur',
            metadata: {
                bookingId: `BCH-${Date.now()}`,
                customerName: `${bookingData.firstName} ${bookingData.lastName}`,
                customerEmail: bookingData.email,
                customerPhone: bookingData.phone,
                pickupLocation: bookingData.pickupLocation,
                dropoffLocation: bookingData.dropoffLocation,
                pickupDate: bookingData.pickupDate,
                pickupTime: bookingData.pickupTime,
                vehicle: bookingData.vehicle,
                distance: bookingData.distance,
                transferType: bookingData.transferType,
                passengers: bookingData.passengers
            },
        });

        // Here you would typically save the booking to your database
        // await saveBookingToDatabase(bookingData);

        // Send email confirmation to customer
        // await sendConfirmationEmail(bookingData);

        res.json({
            clientSecret: paymentIntent.client_secret,
            bookingId: `BCH-${Date.now()}`
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint to handle Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'YOUR_WEBHOOK_SECRET'; // Get this from Stripe Dashboard

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id);
            
            // Update booking status in database
            // await updateBookingStatus(paymentIntent.metadata.bookingId, 'paid');
            
            // Send confirmation email
            // await sendBookingConfirmation(paymentIntent.metadata);
            
            break;
        
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.id);
            
            // Handle failed payment
            // await updateBookingStatus(failedPayment.metadata.bookingId, 'failed');
            
            break;
        
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Barcelona Hire Car Payment API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Barcelona Hire Car payment server running on port ${PORT}`);
});

module.exports = app;
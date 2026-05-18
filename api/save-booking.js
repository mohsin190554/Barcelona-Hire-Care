const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const b = req.body;

        if (!b.customer_name || !b.customer_email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                customer_name:    b.customer_name,
                customer_email:   b.customer_email,
                customer_phone:   b.customer_phone   || null,
                pickup_location:  b.pickup_location,
                dropoff_location: b.dropoff_location,
                pickup_date:      b.pickup_date,
                pickup_time:      b.pickup_time,
                distance:         b.distance          || null,
                vehicle:          b.vehicle,
                passengers:       parseInt(b.passengers) || 1,
                transfer_type:    b.transfer_type     || 'regular',
                flight_number:    b.flight_number     || null,
                meet_greet:       b.meet_greet        || false,
                child_seats:      parseInt(b.child_seats)   || 0,
                booster_seats:    parseInt(b.booster_seats) || 0,
                waiting_time:     b.waiting_time      || '0',
                special_requests: b.special_requests  || null,
                total_price:      b.total_price,
                payment_id:       b.payment_id        || null,
                status:           b.status            || 'confirmed',
            }])
            .select();

        if (error) throw error;

        return res.status(200).json({ success: true, booking: data[0] });

    } catch (err) {
        console.error('Save booking error:', err);
        return res.status(500).json({ error: err.message || 'Failed to save booking' });
    }
};

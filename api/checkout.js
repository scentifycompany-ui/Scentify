const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { items, email, shipping } = req.body;
    const line_items = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `${item.note || '2ml Fragrance Sample'} · Sample/Tester Size`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: email || undefined,
      success_url: `https://scentify-ten.vercel.app/?order=success`,
      cancel_url: `https://scentify-ten.vercel.app`,
      shipping_address_collection: { allowed_countries: ['US'] },
      billing_address_collection: 'auto',
      metadata: { order_source: 'Scentify', customer_name: shipping?.name || '' },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}

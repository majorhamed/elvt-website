import Stripe from 'stripe';

export const config = { api: { bodyParser: true } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log("Stripe key:", process.env.STRIPE_SECRET_KEY ? "FOUND" : "MISSING");

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { cartItems } = req.body;

    console.log("Cart received:", cartItems);

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart' });
    }

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.name}${item.size ? ` (${item.size})` : ''}`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      metadata: { cart: JSON.stringify(cartItems) },
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cart.html`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

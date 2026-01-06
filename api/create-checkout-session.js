import Stripe from 'stripe';

export const config = { api: { bodyParser: true } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log("Request method:", req.method);
  console.log("Body received:", req.body);
  console.log("Stripe key exists:", !!process.env.STRIPE_SECRET_KEY);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems)) {
      console.error("Cart items invalid:", cartItems);
      return res.status(400).json({ error: 'Invalid cartItems' });
    }

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name, images: item.image ? [item.image] : [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    console.log("Line items:", line_items);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      metadata: { cart: JSON.stringify(cartItems) },
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cart.html`,
    });

    console.log("Session created:", session.id);
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe API error:", error);
    return res.status(500).json({ error: error.message });
  }
}

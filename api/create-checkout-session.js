import Stripe from 'stripe';

/**
 * Ensure Vercel parses JSON bodies
 */
export const config = {
  api: {
    bodyParser: true,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1️⃣ Read cart data from frontend
    const { cartItems } = req.body;

    // 2️⃣ Validate cart
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart' });
    }

    // 3️⃣ Convert cart items to Stripe line items
    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.name}${item.size ? ` (${item.size})` : ''}`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // dollars → cents
      },
      quantity: item.qty,
    }));

    // 4️⃣ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,

      // Store cart for webhook use later
      metadata: {
        cart: JSON.stringify(cartItems),
      },

      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cart.html`,
    });

    // 5️⃣ Send Stripe Checkout URL back to frontend
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

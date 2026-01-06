import Stripe from 'stripe';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  console.log("Function invoked");

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe key missing!");
      return res.status(500).json({ error: "Stripe key missing in environment" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { cartItems } = req.body;
    console.log("Received cart:", cartItems);

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Invalid cart items" });
    }

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name, images: item.image ? [item.image] : [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      metadata: { cart: JSON.stringify(cartItems) },
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cart.html`,
    });

    console.log("Session created:", session.id);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Function crashed:", err);
    return res.status(500).json({ error: err.message });
  }
}

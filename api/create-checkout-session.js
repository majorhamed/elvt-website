import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { cartItems } = req.body;

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
          metadata: { size: item.size }
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.qty
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: "https://elvt-website.vercel.app/success.html",
      cancel_url: "https://elvt-website.vercel.app/cart.html"
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

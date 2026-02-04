import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid." });
    }

    // 1) Product line items
    const line_items = cartItems.map((item) => {
      const unit_amount = Math.round(Number(item.price) * 100); // cents
      const quantity = Number(item.qty);

      if (!unit_amount || unit_amount < 0 || !quantity || quantity < 1) {
        throw new Error("Invalid item price or quantity.");
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            metadata: { size: item.size || "" }
          },
          unit_amount
        },
        quantity
      };
    });

    // 2) Calculate subtotal (server-side)
    const subtotalCents = cartItems.reduce((sum, item) => {
      const unit = Math.round(Number(item.price) * 100);
      const qty = Number(item.qty);
      return sum + unit * qty;
    }, 0);

    // 3) Tax = 6% (server-side)
    const taxCents = Math.round(subtotalCents * 0.06);

    // 4) Add tax as its own line item
    if (taxCents > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Sales Tax (6%)"
          },
          unit_amount: taxCents
        },
        quantity: 1
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: "https://www.elvtbyadam.com/success.html",
      cancel_url: "https://www.elvtbyadam.com/cart.html"
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

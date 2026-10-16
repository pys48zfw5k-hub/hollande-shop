const CATALOG = {
  1: { name: "Sac Héritage", price: 28500 },
  2: { name: "Chemise Lin Signature", price: 18000 },
  3: { name: "Sneakers Élégance", price: 32500 },
  4: { name: "Sac Ambre", price: 22000 }
};

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB || !env.GENIUSPAY_API_KEY || !env.GENIUSPAY_API_SECRET) {
      return json({ error: "Le paiement n'est pas encore configuré côté serveur." }, 503);
    }
    const body = await request.json();
    const customer = body.customer || {};
    if (!String(customer.name || "").trim() || !/^\+?[0-9 ()-]{8,20}$/.test(String(customer.phone || "")) || !String(customer.city || "").trim()) {
      return json({ error: "Nom, téléphone et ville sont obligatoires." }, 400);
    }
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) {
      return json({ error: "Panier invalide." }, 400);
    }

    // Prix et noms sont toujours recalculés côté serveur; ne jamais faire confiance au navigateur.
    const lines = [];
    let amount = 0;
    for (const item of body.items) {
      const product = CATALOG[Number(item.id)];
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return json({ error: "Un article ou une quantité du panier est invalide." }, 400);
      }
      lines.push({ id: Number(item.id), name: product.name, price: product.price, quantity });
      amount += product.price * quantity;
    }
    if (amount < 200 || amount > 2000000) return json({ error: "Montant de commande invalide." }, 400);

    const orderId = "HS-" + crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO orders (id, customer_name, phone, city, address, items_json, amount_xof, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
    ).bind(orderId, String(customer.name).trim().slice(0,120), String(customer.phone).trim().slice(0,30),
      String(customer.city).trim().slice(0,120), String(customer.address || "").trim().slice(0,500),
      JSON.stringify(lines), amount, new Date().toISOString()).run();

    const apiResponse = await fetch("https://geniuspay.ci/api/v1/merchant/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.GENIUSPAY_API_KEY,
        "X-API-Secret": env.GENIUSPAY_API_SECRET
      },
      body: JSON.stringify({
        amount, currency: "XOF",
        description: `Hollande Shop ${orderId}`,
        customer: { name: String(customer.name).trim(), phone: String(customer.phone).trim(), country: "CI" },
        success_url: `${new URL(request.url).origin}/?payment=return`,
        error_url: `${new URL(request.url).origin}/?payment=cancelled`,
        metadata: { order_id: orderId }
      })
    });
    const payment = await apiResponse.json().catch(() => ({}));
    const checkoutUrl = payment?.data?.checkout_url || payment?.data?.payment_url;
    if (!apiResponse.ok || !checkoutUrl || !checkoutUrl.startsWith("https://")) {
      await env.DB.prepare("UPDATE orders SET payment_status='init_failed' WHERE id=?").bind(orderId).run();
      return json({ error: "Le prestataire n'a pas pu initialiser le paiement. Vérifiez votre compte marchand et réessayez." }, 502);
    }
    await env.DB.prepare("UPDATE orders SET payment_reference=? WHERE id=?")
      .bind(String(payment.data.reference || ""), orderId).run();
    return json({ checkoutUrl, orderId });
  } catch (err) {
    return json({ error: "Erreur serveur lors de la préparation de la commande." }, 500);
  }
}
function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

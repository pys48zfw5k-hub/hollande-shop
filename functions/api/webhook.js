export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.GENIUSPAY_WEBHOOK_SECRET) {
    return new Response("Webhook not configured", { status: 503 });
  }
  const rawBody = await request.text();
  const timestamp = request.headers.get("X-Webhook-Timestamp") || "";
  const signature = request.headers.get("X-Webhook-Signature") || "";
  const eventHeader = request.headers.get("X-Webhook-Event") || "";
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) {
    return new Response("Invalid timestamp", { status: 400 });
  }
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.GENIUSPAY_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signed = new TextEncoder().encode(`${timestamp}.${rawBody}`);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, signed));
  const expected = [...digest].map(b => b.toString(16).padStart(2, "0")).join("");
  if (!constantTimeEqual(expected, signature)) return new Response("Invalid signature", { status: 401 });

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const event = payload.event || eventHeader;
  const tx = payload.data || {};
  const orderId = tx.metadata?.order_id;
  if (!orderId || typeof orderId !== "string") return new Response("Missing order id", { status: 400 });

  // Ne marquer payé que si le webhook signé annonce un succès et que montant/devise correspondent à la commande.
  if (event === "payment.success" && tx.status === "completed") {
    const order = await env.DB.prepare("SELECT amount_xof FROM orders WHERE id=?").bind(orderId).first();
    if (!order || Number(tx.amount) !== Number(order.amount_xof) || tx.currency !== "XOF") {
      return new Response("Order/amount mismatch", { status: 400 });
    }
    await env.DB.prepare("UPDATE orders SET payment_status='paid', paid_at=? WHERE id=? AND payment_status='pending'")
      .bind(new Date().toISOString(), orderId).run();
  } else if (["payment.failed", "payment.cancelled", "payment.expired"].includes(event)) {
    await env.DB.prepare("UPDATE orders SET payment_status=? WHERE id=? AND payment_status='pending'")
      .bind(event.replace("payment.", ""), orderId).run();
  }
  return new Response("ok", { status: 200 });
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * SHIKSHA SAHAYAK OS — PRODUCTION PAYMENT PLATFORM & GST INVOICE API
 * Endpoint: /api/v1/national/payments
 */

import { prepareRazorpayOrder, createItemizedGSTInvoice, verifyPaymentSignature } from '../../../../functions/lib/razorpayPaymentService';

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = await context.request.json() as any;
    const action = body.action || 'create_order';

    if (action === 'create_order') {
      const amountINR = body.amountINR || 499;
      const receiptId = `rcpt_${Date.now()}`;
      const order = prepareRazorpayOrder({
        amountINR,
        receiptId,
        notes: { userId: body.userId || 'guest_user', item: body.itemDescription || 'Course Subscription' }
      });

      const invoice = createItemizedGSTInvoice(
        body.userId || 'guest_user',
        body.customerName || 'ShikshaSahayak Student',
        amountINR,
        body.itemDescription || 'ShikshaSahayak OS EdTech Subscription',
        body.isInterState || false,
        body.customerGSTIN
      );

      return new Response(JSON.stringify({
        success: true,
        order,
        invoice,
        razorpayKeyId: (context.env as any).RAZORPAY_KEY_ID || 'rzp_live_shikshasahayak_key'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'verify_signature') {
      const isValid = await verifyPaymentSignature(
        body.razorpayOrderId,
        body.razorpayPaymentId,
        body.razorpaySignature,
        (context.env as any).RAZORPAY_SECRET_KEY || ''
      );

      return new Response(JSON.stringify({ success: isValid, verified: isValid }), {
        status: isValid ? 200 : 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid payment action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

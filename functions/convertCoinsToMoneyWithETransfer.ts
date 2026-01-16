import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.15.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { coins } = body;

    if (!coins || coins <= 0) {
      return Response.json({ error: 'Invalid coin amount' }, { status: 400 });
    }

    // Check if user has enough coins
    if ((user.currency_balance || 0) < coins) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Check if user has bank account linked
    if (!user.bank_account_holder || !user.bank_account_number) {
      return Response.json({ 
        error: 'No bank account linked. Please add one in Settings.' 
      }, { status: 400 });
    }

    // Convert coins to USD (100 coins = $1)
    const amountInCents = Math.round((coins / 100) * 100);
    const amountInDollars = amountInCents / 100;

    if (amountInCents < 100) { // Minimum $1
      return Response.json({ error: 'Minimum $1 required for conversion' }, { status: 400 });
    }

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { base44_user_id: user.id },
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Create bank account token (you would typically get this from Stripe's bank account verification)
    // For now, we'll store the hashed bank info and create a payout
    let bankAccountToken = user.stripe_bank_account_token;

    if (!bankAccountToken) {
      // Create bank account token for the customer
      // NOTE: In production, you'd want to use Stripe's ACH verification flow
      const bankAccount = await stripe.customers.createSource(customerId, {
        source: {
          object: 'bank_account',
          country: 'US',
          currency: 'usd',
          account_holder_name: user.bank_account_holder,
          account_number: user.bank_account_number,
          routing_number: user.bank_routing_number,
          account_holder_type: 'individual',
        },
      });

      bankAccountToken = bankAccount.id;
      
      // Store the token
      await base44.auth.updateMe({ stripe_bank_account_token: bankAccountToken });
    }

    // Create a payout to the bank account
    const payout = await stripe.payouts.create({
      amount: amountInCents,
      currency: 'usd',
      destination: bankAccountToken,
      statement_descriptor: 'KinkCoin Conversion',
      metadata: { base44_user_id: user.id, coins_converted: coins },
    });

    // Deduct coins from user
    const newBalance = (user.currency_balance || 0) - coins;
    await base44.auth.updateMe({ currency_balance: newBalance });

    return Response.json({
      success: true,
      message: `Conversion initiated! $${amountInDollars.toFixed(2)} will be transferred to your bank account.`,
      payout_id: payout.id,
      amount: amountInDollars,
      coins_converted: coins,
      new_balance: newBalance,
      status: payout.status, // 'in_transit', 'paid', etc.
    });
  } catch (error) {
    console.error('Conversion error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return Response.json({ 
        error: 'Bank account error: ' + error.message 
      }, { status: 400 });
    }

    return Response.json({ 
      error: error.message || 'Conversion failed' 
    }, { status: 500 });
  }
});
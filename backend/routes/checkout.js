/**
 * Checkout Route
 * 
 * POST /api/checkout — Place an order from the active cart.
 * 
 * Flow:
 * 1. Validate cart exists and has items
 * 2. Validate stock availability (lock rows)
 * 3. Create Order
 * 4. Create Order Items (snapshot price/name)
 * 5. Decrement Stock
 * 6. Mark Cart as CONVERTED
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../lib/auth');
const {
    isConfigured: isHealthiConfigured,
    getMode: getHealthiMode,
    callHealthiValidation,
} = require('../lib/healthiEntitlements');

router.post('/', requireAuth, async (req, res) => {
    const {
        shippingAddress,
        walletAmount = 0,
        rewardsAmount = 0,
        beneficiary = 'Self',
        paymentMethod = 'COD' // Default to COD for any remaining amount
    } = req.body;
    const userId = req.user.id;

    if (!shippingAddress) {
        return res.status(400).json({ error: 'Shipping address is required.' });
    }

    let client;

    try {
        client = await db.getClient();
        await client.query('BEGIN');

        // 1. Get active cart
        const cartRes = await client.query(
            `SELECT id FROM carts WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
            [userId]
        );

        if (cartRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No active cart found.' });
        }
        const cartId = cartRes.rows[0].id;

        // 2. Get User Balances (Lock for update)
        const userRes = await client.query(
            'SELECT wallet_balance, rewards_balance, employer_id, employer_name FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );
        const user = userRes.rows[0];

        // 3. Get Cart Items & Products (Lock rows for update)
        const itemsRes = await client.query(
            `
            SELECT 
                ci.product_id, 
                ci.quantity,
                p.name,
                p.price,
                p.category,
                p.stock_quantity,
                p.wallet_eligible,
                p.rewards_eligible,
                p.flex_collection_id
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = $1
            FOR UPDATE OF p
            `,
            [cartId]
        );

        const items = itemsRes.rows;
        if (items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cart is empty.' });
        }

        // 4. Validate Stock & Calculate Totals/Eligibility
        let totalAmount = 0;
        let walletIneligibleAmount = 0;
        let rewardsIneligibleAmount = 0;
        const stockErrors = [];

        for (const item of items) {
            const itemTotal = parseFloat(item.price) * item.quantity;
            totalAmount += itemTotal;

            if (item.stock_quantity < item.quantity) {
                stockErrors.push(`Insufficient stock for "${item.name}". Available: ${item.stock_quantity}`);
            }

            if (!item.wallet_eligible) walletIneligibleAmount += itemTotal;
            if (!item.rewards_eligible) rewardsIneligibleAmount += itemTotal;
        }

        if (stockErrors.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Stock validation failed', details: stockErrors });
        }

        // 5. Payment Logic & Validation
        const useWallet = parseFloat(walletAmount);
        const useRewards = parseFloat(rewardsAmount);

        // Max possible wallet usage (total minus items not eligible for wallet)
        const maxWalletAllowed = totalAmount - walletIneligibleAmount;
        if (useWallet > maxWalletAllowed) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Only ₹${maxWalletAllowed} of this order is wallet-eligible.` });
        }

        // Max possible rewards usage (total minus items not eligible for rewards)
        const maxRewardsAllowed = totalAmount - rewardsIneligibleAmount;
        if (useRewards > maxRewardsAllowed) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Only ₹${maxRewardsAllowed} of this order is rewards-eligible.` });
        }

        if (useWallet > parseFloat(user.wallet_balance)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient wallet balance.' });
        }

        if (useRewards > parseFloat(user.rewards_balance)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient rewards balance.' });
        }

        const localCashAmount = totalAmount - useWallet - useRewards;
        if (localCashAmount < 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Payment credits exceed order total.' });
        }

        let finalWalletAmount = useWallet;
        let finalRewardsAmount = useRewards;
        let finalCashAmount = localCashAmount;

        // 5b. External Healthi validation (optional, authoritative when configured)
        if (isHealthiConfigured()) {
            try {
                const healthiPayload = {
                    userId,
                    employerId: user.employer_id || null,
                    employerName: user.employer_name || null,
                    totals: {
                        orderTotal: totalAmount,
                        requestedWallet: useWallet,
                        requestedRewards: useRewards,
                    },
                    items: items.map((item) => ({
                        productId: item.product_id,
                        name: item.name,
                        category: item.category,
                        quantity: item.quantity,
                        unitPrice: parseFloat(item.price),
                        walletEligible: item.wallet_eligible,
                        rewardsEligible: item.rewards_eligible,
                        flexCollectionId: item.flex_collection_id || null,
                    })),
                };

                const decision = await callHealthiValidation(healthiPayload);
                const approvedWallet = Number(decision.approvedWalletAmount ?? useWallet);
                const approvedRewards = Number(decision.approvedRewardsAmount ?? useRewards);
                const approvedCash = Number(
                    decision.approvedCashAmount ??
                    Math.max(0, totalAmount - approvedWallet - approvedRewards)
                );

                if (!Number.isFinite(approvedWallet) || !Number.isFinite(approvedRewards) || !Number.isFinite(approvedCash)) {
                    throw new Error('Healthi response contains non-numeric approved amounts');
                }

                if (approvedWallet < 0 || approvedRewards < 0 || approvedCash < 0) {
                    throw new Error('Healthi response contains negative approved amounts');
                }

                const approvedTotal = approvedWallet + approvedRewards + approvedCash;
                if (Math.abs(approvedTotal - totalAmount) > 0.01) {
                    throw new Error('Healthi approved split does not match order total');
                }

                finalWalletAmount = approvedWallet;
                finalRewardsAmount = approvedRewards;
                finalCashAmount = approvedCash;
            } catch (err) {
                const mode = getHealthiMode();
                if (mode === 'strict') {
                    await client.query('ROLLBACK');
                    return res.status(503).json({
                        error: 'Benefit validation service unavailable. Please try again.',
                        details: err.message,
                    });
                }
                console.warn('Healthi validation failed in permissive mode, using local rules:', err.message);
            }
        }

        // 6. Deduct Balances
        if (finalWalletAmount > 0 || finalRewardsAmount > 0) {
            await client.query(
                'UPDATE users SET wallet_balance = wallet_balance - $1, rewards_balance = rewards_balance - $2 WHERE id = $3',
                [finalWalletAmount, finalRewardsAmount, userId]
            );
        }

        // 7. Create Order with Payment Split
        const orderRes = await client.query(
            `
            INSERT INTO orders (
                user_id, total_amount, wallet_amount, rewards_amount, cash_amount, 
                status, shipping_address, payment_method, beneficiary_name
            )
            VALUES ($1, $2, $3, $4, $5, 'PAID', $6, $7, $8)
            RETURNING id
            `,
            [userId, totalAmount, finalWalletAmount, finalRewardsAmount, finalCashAmount, shippingAddress, paymentMethod, beneficiary]
        );
        const orderId = orderRes.rows[0].id;

        // 8. Create Order Items & Decrement Stock
        for (const item of items) {
            await client.query(
                `
                INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, product_name_snapshot)
                VALUES ($1, $2, $3, $4, $5)
                `,
                [orderId, item.product_id, item.quantity, item.price, item.name]
            );

            await client.query(
                `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // 9. Mark Cart as Converted
        await client.query(
            `UPDATE carts SET status = 'CONVERTED' WHERE id = $1`,
            [cartId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            orderId,
            message: 'Order placed successfully!',
            split: { wallet: finalWalletAmount, rewards: finalRewardsAmount, cash: finalCashAmount }
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Checkout Error:', err);
        res.status(500).json({ error: 'Checkout failed. Please try again.' });
    } finally {
        if (client) client.release();
    }
});

module.exports = router;

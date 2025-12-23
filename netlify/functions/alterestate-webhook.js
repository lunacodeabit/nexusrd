// Webhook to receive leads from AlterEstate via Gmail parsing
// This endpoint receives parsed email data from Google Apps Script

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');

        // Validate required fields
        const { name, email, phone, source, campaign, notes, secret, advisorEmail } = body;

        // Simple security check - you should set this in Netlify env vars
        const expectedSecret = process.env.ALTERESTATE_WEBHOOK_SECRET || 'nexus-alterestate-2024';
        if (secret !== expectedSecret) {
            console.log('❌ Invalid secret provided');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        if (!name || (!email && !phone)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: name and (email or phone)' }),
            };
        }

        console.log('📥 Received lead from AlterEstate:', { name, email, phone, campaign, advisorEmail });

        // Initialize Supabase
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Server configuration error' }),
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Find the user (advisor) by their email
        let userId = null;
        if (advisorEmail) {
            // Look up the user in auth.users by email
            const { data: users } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('email', advisorEmail)
                .single();

            if (users) {
                userId = users.id;
                console.log('👤 Found advisor:', advisorEmail, 'User ID:', userId);
            } else {
                console.log('⚠️ Advisor not found in Nexus:', advisorEmail);
            }
        }

        // Check if lead already exists (by email or phone) for THIS user
        let existingLead = null;

        if (email) {
            const query = supabase
                .from('leads')
                .select('id, name')
                .eq('email', email);

            // If we have a user_id, only check their leads
            if (userId) {
                query.eq('user_id', userId);
            }

            const { data } = await query.single();
            existingLead = data;
        }

        if (!existingLead && phone) {
            // Normalize phone number for comparison
            const normalizedPhone = phone.replace(/\D/g, '');
            const query = supabase
                .from('leads')
                .select('id, name')
                .or(`phone.eq.${phone},phone.eq.${normalizedPhone}`);

            if (userId) {
                query.eq('user_id', userId);
            }

            const { data } = await query.single();
            existingLead = data;
        }

        if (existingLead) {
            console.log('⚠️ Lead already exists:', existingLead.name);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Lead already exists',
                    leadId: existingLead.id,
                    duplicate: true
                }),
            };
        }

        // Create new lead
        const newLead = {
            name: name,
            email: email || null,
            phone: phone || '',
            source: source || 'AlterEstate',
            status: 'NUEVO',
            created_at: new Date().toISOString(),
            notes: notes || `Importado automáticamente desde AlterEstate. Campaña: ${campaign || 'No especificada'}`,
            user_id: userId, // Assign to the advisor who sent the lead
        };

        const { data: insertedLead, error: insertError } = await supabase
            .from('leads')
            .insert([newLead])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting lead:', insertError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to create lead', details: insertError.message }),
            };
        }

        console.log('✅ Lead created successfully:', insertedLead.id);

        // Send Telegram notification to the advisor
        if (userId) {
            try {
                // Get user's Telegram chat ID from their profile
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('telegram_chat_id, enable_telegram_alerts')
                    .eq('id', userId)
                    .single();

                if (profile?.telegram_chat_id && profile?.enable_telegram_alerts) {
                    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

                    if (TELEGRAM_BOT_TOKEN) {
                        const message = `🆕 <b>Nuevo Lead!</b>

👤 <b>${name}</b>
📞 ${phone || 'Sin teléfono'}
📧 ${email || 'Sin email'}
📍 Fuente: ${source || 'AlterEstate'}
🏷️ Campaña: ${campaign || 'No especificada'}

<a href="https://alvearecrm.netlify.app/">Abrir CRM →</a>`;

                        const telegramResponse = await fetch(
                            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: profile.telegram_chat_id,
                                    text: message,
                                    parse_mode: 'HTML',
                                }),
                            }
                        );

                        const telegramResult = await telegramResponse.json();
                        if (telegramResult.ok) {
                            console.log('📱 Telegram notification sent to:', profile.telegram_chat_id);
                        } else {
                            console.log('⚠️ Telegram notification failed:', telegramResult.description);
                        }
                    }
                }
            } catch (telegramError) {
                console.log('⚠️ Error sending Telegram notification:', telegramError.message);
                // Don't fail the whole request if Telegram fails
            }
        }

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Lead created successfully',
                leadId: insertedLead.id,
                duplicate: false
            }),
        };

    } catch (err) {
        console.error('Error processing webhook:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: err.message }),
        };
    }
};

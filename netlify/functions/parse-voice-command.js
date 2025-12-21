// Gemini API endpoint - using gemini-3-flash-preview
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const SYSTEM_PROMPT = `Eres un asistente de CRM inmobiliario. Extrae información estructurada de comandos de voz en español.

FECHA Y HORA ACTUAL (Santo Domingo, RD): {TODAY} {CURRENT_TIME}

⚠️ REGLA FUNDAMENTAL: NUNCA agendar algo en el pasado.
- Si la hora mencionada YA PASÓ hoy, agenda para MAÑANA a esa hora.
- Ejemplo: Si son las 10:47 AM y dicen "a las 10", agenda para MAÑANA a las 10 AM.
- Ejemplo: Si son las 10:47 AM y dicen "a las 11", agenda para HOY a las 11 AM.

REGLAS DE TIEMPO:
- "dentro de una hora" = HOY a {HOUR_PLUS_1}
- "dentro de X horas" = HOY + X horas desde ahora
- "ahora" o "ahorita" = HOY a la hora actual ({CURRENT_TIME})
- "mañana" = un día después de hoy
- "hoy" = la fecha de hoy (solo si la hora aún no ha pasado)
- Si dicen una hora sin AM/PM y es 1-7, asume PM (ejem: "a las 3" = 3:00 PM)
- Si dicen una hora sin AM/PM y es 8-12, asume AM por la mañana o PM por la tarde
- Para "time", usa formato 24 horas (ej: "15:00" para 3 PM, "09:30" para 9:30 AM)

Responde ÚNICAMENTE con este JSON, sin texto adicional:
{
  "action": "create_appointment",
  "lead_name": "nombre" o null,
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "appointment_type": "virtual" o "in_person",
  "task_type": "visit",
  "notes": "detalles",
  "confidence": 0.95
}`;

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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
        const { transcript } = JSON.parse(event.body || '{}');

        if (!transcript || typeof transcript !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing transcript in request body' }),
            };
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // Log API key status (never log the actual key!)
        console.log('🔑 API Key status:', apiKey ? `Configured (${apiKey.length} chars)` : 'MISSING');

        if (!apiKey) {
            console.error('GEMINI_API_KEY not configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' }),
            };
        }

        // Get today's date and time in Santo Domingo timezone (UTC-4)
        const now = new Date();
        const sdOptions = { timeZone: 'America/Santo_Domingo' };

        // Get date parts in Santo Domingo timezone
        const sdFormatter = new Intl.DateTimeFormat('es-DO', {
            ...sdOptions,
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const dateParts = sdFormatter.formatToParts(now);
        const todayStr = `${dateParts.find(p => p.type === 'year').value}-${dateParts.find(p => p.type === 'month').value}-${dateParts.find(p => p.type === 'day').value}`;

        const dayOfWeek = new Intl.DateTimeFormat('es-DO', { ...sdOptions, weekday: 'long' }).format(now);

        // Get current time in 12h format (Santo Domingo)
        const timeFormatter = new Intl.DateTimeFormat('es-DO', {
            ...sdOptions,
            hour: 'numeric', minute: '2-digit', hour12: true
        });
        const currentTime = timeFormatter.format(now);

        // Get time + 1 hour in 12h format
        const nowPlus1 = new Date(now.getTime() + 60 * 60 * 1000);
        const hourPlus1 = timeFormatter.format(nowPlus1);

        const prompt = SYSTEM_PROMPT
            .replace(/{TODAY}/g, `${todayStr} (${dayOfWeek})`)
            .replace(/{CURRENT_TIME}/g, currentTime)
            .replace(/{HOUR_PLUS_1}/g, hourPlus1);

        console.log('📤 Calling Gemini API for transcript:', transcript.substring(0, 50) + '...');

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { text: `Comando del usuario: "${transcript}"` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 4096,
                }
            }),
        });

        console.log('📥 Gemini API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Failed to process command',
                    details: `Gemini API returned ${response.status}`,
                    hint: response.status === 400 ? 'API Key may be invalid' : 'Check Gemini API status'
                }),
            };
        }

        const data = await response.json();

        // Extract the text response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log('📥 Raw Gemini response:', textResponse?.substring(0, 200) || 'NO RESPONSE');

        if (!textResponse) {
            console.error('No text response from Gemini:', JSON.stringify(data));
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'No response from AI', rawData: JSON.stringify(data).substring(0, 500) }),
            };
        }

        console.log('✅ Gemini response received, parsing JSON...');
        console.log('📝 Full response:', textResponse);

        // Parse JSON from response (handle markdown code blocks)
        let parsed;
        try {
            // Remove markdown code blocks if present
            let jsonStr = textResponse
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Try to find JSON object in the response if it's wrapped in text
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            parsed = JSON.parse(jsonStr);
            console.log('✅ Parsed JSON:', JSON.stringify(parsed));
        } catch (parseError) {
            console.error('Failed to parse AI response:', textResponse);
            console.error('Parse error:', parseError.message);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    action: 'unknown',
                    lead_name: null,
                    date: null,
                    time: null,
                    appointment_type: null,
                    task_type: 'other',
                    notes: transcript,
                    confidence: 0,
                    error: 'No se pudo entender el comando. Intenta ser más específico.',
                    debug_response: textResponse?.substring(0, 200),
                }),
            };
        }

        console.log('✅ Command parsed successfully:', parsed.action);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(parsed),
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message || 'Unknown error'
            }),
        };
    }
};

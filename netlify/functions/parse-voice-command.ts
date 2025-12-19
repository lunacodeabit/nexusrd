import { Handler } from '@netlify/functions';

// Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface ParsedCommand {
    action: 'create_appointment' | 'create_task' | 'search_lead' | 'unknown';
    lead_name: string | null;
    date: string | null;
    time: string | null;
    appointment_type: 'virtual' | 'in_person' | null;
    task_type: 'call' | 'whatsapp' | 'visit' | 'email' | 'other';
    notes: string | null;
    confidence: number;
    error?: string;
}

const SYSTEM_PROMPT = `Eres un asistente de CRM inmobiliario. Tu tarea es extraer información estructurada de comandos de voz en español.

El usuario puede decir cosas como:
- "Agéndame una cita para mañana a las 9am con Juan, visita presencial"
- "Programa llamada con María el viernes a las 3 de la tarde"
- "Recuérdame enviar WhatsApp a Pedro López mañana"
- "Cita virtual con la clienta nueva hoy a las 2pm"

IMPORTANTE:
- Hoy es: {TODAY}
- "mañana" = un día después de hoy
- "pasado mañana" = dos días después de hoy
- "el viernes" = el próximo viernes desde hoy
- Si no se especifica AM/PM y la hora es entre 1-7, asume PM (horario laboral)
- Si no se especifica tipo de cita, asume "in_person" para visitas

Responde SOLO con JSON válido, sin explicaciones:
{
  "action": "create_appointment" | "create_task" | "search_lead" | "unknown",
  "lead_name": "nombre del cliente" | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM" (24h format) | null,
  "appointment_type": "virtual" | "in_person" | null,
  "task_type": "call" | "whatsapp" | "visit" | "email" | "other",
  "notes": "cualquier detalle adicional" | null,
  "confidence": 0.0-1.0
}`;

const handler: Handler = async (event) => {
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

        // Validate API key format (should start with "AI" and be ~39 chars)
        if (apiKey.length < 30 || apiKey.length > 50) {
            console.error('GEMINI_API_KEY appears malformed, length:', apiKey.length);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key appears malformed' }),
            };
        }

        // Get today's date for context
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const dayOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][today.getDay()];

        const prompt = SYSTEM_PROMPT
            .replace('{TODAY}', `${todayStr} (${dayOfWeek})`);

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
                    maxOutputTokens: 500,
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

        if (!textResponse) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'No response from AI' }),
            };
        }

        // Parse JSON from response (handle markdown code blocks)
        let parsed: ParsedCommand;
        try {
            // Remove markdown code blocks if present
            const jsonStr = textResponse
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Failed to parse AI response:', textResponse);
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
                }),
            };
        }

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
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};

export { handler };

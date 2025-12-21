// Test script to call Gemini API directly and see what it returns
// Run with: node test-gemini.js

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const SYSTEM_PROMPT = `Eres un asistente de CRM inmobiliario. Tu tarea es extraer información estructurada de comandos de voz en español.

El usuario puede decir cosas como:
- "Agéndame una cita para mañana a las 9am con Juan, visita presencial"
- "Programa llamada con María el viernes a las 3 de la tarde"
- "Recuérdame enviar WhatsApp a Pedro López mañana"
- "Cita virtual con la clienta nueva hoy a las 2pm"

IMPORTANTE:
- Hoy es: ${new Date().toISOString().split('T')[0]}
- "mañana" = un día después de hoy
- Si no se especifica AM/PM y la hora es entre 1-7, asume PM (horario laboral)

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

async function testGemini() {
    // Get API key from environment or use placeholder
    const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

    if (apiKey === 'YOUR_API_KEY_HERE') {
        console.log('❌ Please set GEMINI_API_KEY environment variable');
        console.log('   Example: set GEMINI_API_KEY=your_key_here && node test-gemini.js');
        return;
    }

    const testTranscript = "agenda una cita para mañana a las 9 con Juan presencial";

    console.log('🎤 Testing transcript:', testTranscript);
    console.log('🔑 API Key:', apiKey.substring(0, 8) + '...');
    console.log('📤 Calling Gemini API...\n');

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: SYSTEM_PROMPT },
                            { text: `Comando del usuario: "${testTranscript}"` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048,
                }
            }),
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error from Gemini:', errorText);
            return;
        }

        const data = await response.json();
        console.log('\n📦 Raw API Response:');
        console.log(JSON.stringify(data, null, 2));

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('\n📝 Text Response:', textResponse);

        if (textResponse) {
            // Try to parse JSON
            let jsonStr = textResponse
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            try {
                const parsed = JSON.parse(jsonStr);
                console.log('\n✅ Parsed JSON:');
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log('\n❌ Failed to parse JSON:', e.message);
            }
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testGemini();

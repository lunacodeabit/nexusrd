// Test script to call Gemini API directly and see what it returns
// Run with: $env:GEMINI_API_KEY="your_key"; node test-gemini.js

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

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

const SYSTEM_PROMPT = `Eres un asistente de CRM inmobiliario. Extrae información estructurada de comandos de voz en español.

FECHA Y HORA ACTUAL (Santo Domingo): ${todayStr} (${dayOfWeek}) ${currentTime}

REGLAS CRÍTICAS:
- "dentro de una hora" = HOY a ${hourPlus1}
- "dentro de X horas" = HOY + X horas desde ahora
- "ahora" o "ahorita" = HOY a la hora actual (${currentTime})
- "mañana" = un día después de hoy
- "hoy" = la fecha de hoy (${todayStr})
- Si dicen una hora sin AM/PM y es 1-7, asume PM
- Para el campo "time", usa formato 12 horas con AM/PM (ej: "9:30 PM")

Responde ÚNICAMENTE con este JSON, sin texto adicional:
{
  "action": "create_appointment",
  "lead_name": "nombre" o null,
  "date": "YYYY-MM-DD",
  "time": "H:MM AM/PM",
  "appointment_type": "virtual" o "in_person",
  "task_type": "visit",
  "notes": "detalles",
  "confidence": 0.95
}`;

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

    if (apiKey === 'YOUR_API_KEY_HERE') {
        console.log('❌ Please set GEMINI_API_KEY environment variable');
        return;
    }

    const testTranscript = "agenda una cita con Isaías para dentro de una hora presencial";

    console.log('🎤 Testing transcript:', testTranscript);
    console.log('📅 Today (Santo Domingo):', todayStr, '(' + dayOfWeek + ')');
    console.log('🕐 Current time:', currentTime);
    console.log('🕑 Hour + 1:', hourPlus1);
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
                    maxOutputTokens: 4096,
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

        console.log('📊 Token usage:');
        console.log('   Prompt tokens:', data.usageMetadata?.promptTokenCount);
        console.log('   Response tokens:', data.usageMetadata?.candidatesTokenCount);
        console.log('   Thinking tokens:', data.usageMetadata?.thoughtsTokenCount);
        console.log('   Finish reason:', data.candidates?.[0]?.finishReason);

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('\n📝 Text Response:', textResponse);

        if (textResponse) {
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

                // Verify the date
                if (parsed.date === todayStr) {
                    console.log('\n✅ Date is TODAY - correct!');
                } else {
                    console.log('\n⚠️ Date is', parsed.date, '- expected', todayStr);
                }

                // Check time format
                if (parsed.time && (parsed.time.includes('AM') || parsed.time.includes('PM') || parsed.time.includes('a.') || parsed.time.includes('p.'))) {
                    console.log('✅ Time is in 12h format - correct!');
                } else {
                    console.log('⚠️ Time format:', parsed.time);
                }
            } catch (e) {
                console.log('\n❌ Failed to parse JSON:', e.message);
            }
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testGemini();

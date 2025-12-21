// Test AlterEstate API connection
// Uses native fetch - no dependencies needed

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    try {
        // Get API key from query param for testing
        const apiKey = event.queryStringParameters?.key;

        if (!apiKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'API key required',
                    usage: '/.netlify/functions/test-alterestate?key=YOUR_PRIVATE_API_KEY'
                }),
            };
        }

        // Try different authentication methods
        const testEndpoints = [
            {
                name: 'Leads with api_key param',
                url: `https://secure.alterestate.com/api/v1/leads/?api_key=${apiKey}`,
                headers: {}
            },
            {
                name: 'Leads with Authorization Bearer',
                url: 'https://secure.alterestate.com/api/v1/leads/',
                headers: { 'Authorization': `Bearer ${apiKey}` }
            },
            {
                name: 'Leads with Token header',
                url: 'https://secure.alterestate.com/api/v1/leads/',
                headers: { 'Token': apiKey }
            },
            {
                name: 'Agents endpoint',
                url: `https://secure.alterestate.com/api/v1/agents/?api_key=${apiKey}`,
                headers: {}
            }
        ];

        const results = [];

        for (const test of testEndpoints) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(test.url, {
                    method: 'GET',
                    headers: test.headers,
                    signal: controller.signal
                });

                clearTimeout(timeout);

                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text.substring(0, 500);
                }

                results.push({
                    name: test.name,
                    status: response.status,
                    success: response.ok,
                    data: typeof data === 'object' ?
                        JSON.stringify(data).substring(0, 500) :
                        String(data).substring(0, 500)
                });
            } catch (err) {
                results.push({
                    name: test.name,
                    status: 'ERROR',
                    success: false,
                    error: err.message
                });
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ results }, null, 2),
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message }),
        };
    }
};

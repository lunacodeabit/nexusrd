/**
 * NEXUS CRM - Servidor de Webhook para Pruebas
 * 
 * Este servidor recibe webhooks y los muestra en consola.
 * También sirve los datos para que el frontend los consuma.
 * 
 * USO:
 *   1. Abre una terminal y ejecuta: node webhook-server.js
 *   2. El servidor escuchará en http://localhost:3001
 *   3. Configura tu CRM/portal para enviar webhooks a: http://TU_IP:3001/webhook
 *   4. Para pruebas locales usa: http://localhost:3001/webhook
 * 
 * ENDPOINTS:
 *   POST /webhook        - Recibe leads de cualquier fuente
 *   GET  /leads          - Obtiene todos los leads recibidos
 *   GET  /leads/latest   - Obtiene el último lead
 *   POST /test           - Envía un lead de prueba manualmente
 */

const http = require('http');
const url = require('url');

// Almacenamiento temporal de leads (en memoria)
let receivedLeads = [];

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatLead(data, source) {
  // Intentar normalizar el lead independientemente del formato
  return {
    id: `webhook-${Date.now()}`,
    receivedAt: new Date().toISOString(),
    source: source || data.source || 'Webhook',
    rawData: data,
    // Campos normalizados (intentar extraer de varios formatos comunes)
    name: data.name || data.nombre || data.full_name || data.lead_name || 'Sin nombre',
    email: data.email || data.correo || data.mail || '',
    phone: data.phone || data.telefono || data.tel || data.mobile || data.celular || '',
    message: data.message || data.mensaje || data.comments || data.comentarios || '',
    property: data.property || data.propiedad || data.listing || data.inmueble || '',
    budget: data.budget || data.presupuesto || data.price_range || 0
  };
}

const server = http.createServer((req, res) => {
  // CORS headers para permitir requests desde el frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ============================================
  // POST /webhook - Recibir leads externos
  // ============================================
  if (req.method === 'POST' && pathname === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const lead = formatLead(data, req.headers['x-source'] || 'External Webhook');
        receivedLeads.push(lead);
        
        // Log bonito en consola
        console.log('\n' + '='.repeat(60));
        log(colors.green + colors.bright, '🚀 ¡NUEVO LEAD RECIBIDO VIA WEBHOOK!');
        console.log('='.repeat(60));
        log(colors.cyan, `📅 Fecha: ${lead.receivedAt}`);
        log(colors.yellow, `👤 Nombre: ${lead.name}`);
        log(colors.yellow, `📧 Email: ${lead.email}`);
        log(colors.yellow, `📱 Teléfono: ${lead.phone}`);
        log(colors.yellow, `🏠 Propiedad: ${lead.property}`);
        log(colors.yellow, `💬 Mensaje: ${lead.message}`);
        log(colors.magenta, `📡 Fuente: ${lead.source}`);
        console.log('-'.repeat(60));
        log(colors.blue, '📦 Datos RAW:');
        console.log(JSON.stringify(data, null, 2));
        console.log('='.repeat(60) + '\n');
        
        // Notificación de sonido en Windows
        process.stdout.write('\x07');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Lead recibido correctamente',
          leadId: lead.id 
        }));
        
      } catch (error) {
        log(colors.red, `❌ Error parseando webhook: ${error.message}`);
        log(colors.yellow, `📦 Body recibido: ${body}`);
        
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON' 
        }));
      }
    });
    return;
  }

  // ============================================
  // GET /leads - Obtener todos los leads
  // ============================================
  if (req.method === 'GET' && pathname === '/leads') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(receivedLeads));
    return;
  }

  // ============================================
  // GET /leads/latest - Obtener último lead
  // ============================================
  if (req.method === 'GET' && pathname === '/leads/latest') {
    const latest = receivedLeads[receivedLeads.length - 1] || null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latest));
    return;
  }

  // ============================================
  // POST /test - Enviar lead de prueba manual
  // ============================================
  if (req.method === 'POST' && pathname === '/test') {
    const testLead = formatLead({
      name: 'Lead de Prueba',
      email: 'test@ejemplo.com',
      phone: '+1 809 555 1234',
      message: 'Estoy interesado en propiedades en Punta Cana',
      property: 'Apartamento 2 habitaciones',
      budget: 150000
    }, 'Test Manual');
    
    receivedLeads.push(testLead);
    
    log(colors.green, '\n✅ Lead de prueba creado exitosamente!\n');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, lead: testLead }));
    return;
  }

  // ============================================
  // GET / - Página de información
  // ============================================
  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NEXUS CRM - Webhook Server</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a192f; 
            color: #e6f1ff; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { color: #FF851B; }
          code { 
            background: #001f3f; 
            padding: 4px 8px; 
            border-radius: 4px;
            color: #64ffda;
          }
          pre { 
            background: #001f3f; 
            padding: 20px; 
            border-radius: 8px;
            overflow-x: auto;
          }
          .endpoint { 
            background: #112240; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 10px 0;
            border-left: 3px solid #FF851B;
          }
          .method { 
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            margin-right: 10px;
          }
          .post { background: #2ecc71; color: #000; }
          .get { background: #3498db; color: #fff; }
          button {
            background: #FF851B;
            color: #001f3f;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
          }
          button:hover { background: #e67e00; }
          #result { 
            margin-top: 20px; 
            padding: 15px; 
            background: #112240; 
            border-radius: 8px;
            display: none;
          }
          .stats { 
            display: flex; 
            gap: 20px; 
            margin: 20px 0;
          }
          .stat-card {
            background: #112240;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            flex: 1;
          }
          .stat-number { font-size: 36px; color: #FF851B; }
        </style>
      </head>
      <body>
        <h1>🚀 NEXUS CRM - Webhook Server</h1>
        <p>Servidor de webhooks activo y escuchando...</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number" id="leadCount">${receivedLeads.length}</div>
            <div>Leads Recibidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">✓</div>
            <div>Servidor Activo</div>
          </div>
        </div>
        
        <h2>📡 Endpoints Disponibles</h2>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/webhook</code>
          <p>Recibe leads de fuentes externas (SuperCasas, Facebook, etc.)</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/leads</code>
          <p>Obtiene todos los leads recibidos</p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/test</code>
          <p>Crea un lead de prueba</p>
        </div>
        
        <h2>🧪 Probar Webhook</h2>
        <button onclick="sendTestLead()">Enviar Lead de Prueba</button>
        <button onclick="sendCustomLead()">Enviar Lead Personalizado</button>
        <button onclick="viewLeads()">Ver Leads Recibidos</button>
        
        <div id="result"></div>
        
        <h2>📋 Ejemplo con cURL</h2>
        <pre>curl -X POST http://localhost:3001/webhook \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Juan Pérez","email":"juan@email.com","phone":"+1809555123","message":"Interesado en apartamento"}'</pre>
        
        <h2>🔗 Para exponer a Internet (ngrok)</h2>
        <pre>npx ngrok http 3001</pre>
        <p>Esto te dará una URL pública como <code>https://abc123.ngrok.io</code> que puedes usar en tus portales.</p>
        
        <script>
          async function sendTestLead() {
            const res = await fetch('/test', { method: 'POST' });
            const data = await res.json();
            showResult(data);
            updateCount();
          }
          
          async function sendCustomLead() {
            const name = prompt('Nombre del lead:', 'María García');
            const phone = prompt('Teléfono:', '+1 809 555 9999');
            const email = prompt('Email:', 'maria@test.com');
            
            const res = await fetch('/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, phone, email, source: 'Test Manual' })
            });
            const data = await res.json();
            showResult(data);
            updateCount();
          }
          
          async function viewLeads() {
            const res = await fetch('/leads');
            const data = await res.json();
            showResult(data);
          }
          
          function showResult(data) {
            const el = document.getElementById('result');
            el.style.display = 'block';
            el.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          }
          
          async function updateCount() {
            const res = await fetch('/leads');
            const data = await res.json();
            document.getElementById('leadCount').textContent = data.length;
          }
        </script>
      </body>
      </html>
    `);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  log(colors.green + colors.bright, '🚀 NEXUS CRM - Webhook Server Iniciado');
  console.log('='.repeat(60));
  log(colors.cyan, `📡 Servidor escuchando en: http://localhost:${PORT}`);
  log(colors.yellow, `🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  log(colors.magenta, `🌐 Panel web: http://localhost:${PORT}`);
  console.log('-'.repeat(60));
  log(colors.blue, 'Endpoints:');
  console.log('  POST /webhook     - Recibir leads');
  console.log('  GET  /leads       - Ver todos los leads');
  console.log('  POST /test        - Crear lead de prueba');
  console.log('-'.repeat(60));
  log(colors.yellow, '💡 Para exponer a internet: npx ngrok http 3001');
  console.log('='.repeat(60) + '\n');
});

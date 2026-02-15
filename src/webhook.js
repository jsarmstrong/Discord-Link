const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Post a plain-text message to a Discord webhook.
 * Returns a promise that resolves when the request completes.
 */
function postToWebhook(webhookUrl, text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ content: text });
    const parsed = new URL(webhookUrl);
    const transport = parsed.protocol === 'https:' ? https : http;

    const req = transport.request(
      parsed,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(
              new Error(
                `Webhook responded ${res.statusCode}: ${body}`,
              ),
            );
          }
        });
      },
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { postToWebhook };

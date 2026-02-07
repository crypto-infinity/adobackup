require('dotenv').config();

const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Middleware di autenticazione JWT (Entra ID)
function getJwtAuthMiddleware() {
  const tenantId = process.env.AZURE_TENANT_ID; // Inserisci il tuo tenant ID
  const audience = process.env.AZURE_API_AUDIENCE; // Application ID URI della tua API (es: api://<client-id>)
  const issuerV2 = `https://login.microsoftonline.com/${tenantId}/v2.0`;
  const issuerV1 = `https://sts.windows.net/${tenantId}/`;

  return jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
    }),
    audience: audience,
    issuer: [issuerV2, issuerV1],
    algorithms: ['RS256'],
  });
}

module.exports = { getJwtAuthMiddleware };

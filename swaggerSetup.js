const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backup API',
      version: '1.2.0',
      description: 'API per il backup di repository su Azure Blob Storage',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Autenticazione tramite JWT Bearer token (OAuth2, Entra ID)',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerSpec }
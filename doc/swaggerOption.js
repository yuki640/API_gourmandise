const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Votre API",
      version: "1.0.0",
      description: "Description de votre API",
    },
  },
  apis: ["./endpoints.js"], // Chemin vers vos fichiers contenant des commentaires JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

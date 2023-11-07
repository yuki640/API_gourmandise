const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Votre API",
      version: "1.0.0",
      description: "Routes de l'api-Gourmandise",
    },
    tags: [
      { name: "Produits", description: "Opérations liées aux produits" },
      { name: "Panier", description: "Opérations liées au panier" },
      { name: "Commandes", description: "Opérations liées aux commandes" },
      {
        name: "Utilisateurs",
        description: "Opérations liées aux utilisateurs",
      },
    ],
  },
  apis: ["./endpoints.js"], // Chemin vers vos fichiers contenant des commentaires JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { type Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bank Management API",
      version: "1.0.0",
      description: "API documentation for the Bank Management System",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/controllers/*.ts", "./src/server.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger Docs available at http://localhost:3000/api-docs");
};

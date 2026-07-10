import fs from "fs";
import path from "path";
import { pool } from ".";

const initializeDatabase = async () => {
  try {
    console.log("Initializing database...");

    const schemaPath = path.join(__dirname, "../../database/schema/schema.sql");
    const triggerPath = path.join(__dirname, "../../database/trigger.sql");
    const viewPath = path.join(__dirname, "../../database/view.sql");
    const seedPath = path.join(__dirname, "../../database/seed.sql");

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    const triggerSql = fs.readFileSync(triggerPath, "utf8");
    const viewSql = fs.readFileSync(viewPath, "utf8");
    const seedSql = fs.readFileSync(seedPath, "utf8");

    console.log("Creating tables...");
    await pool.query(schemaSql);

    console.log("Creating triggers...");
    await pool.query(triggerSql);

    console.log("Creating views...");
    await pool.query(viewSql);

    console.log("Creating seed data...");
    await pool.query(seedSql);

    console.log("✅ Database initialized and updated successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  } finally {
    await pool.end();
    process.exit();
  }
};

initializeDatabase();

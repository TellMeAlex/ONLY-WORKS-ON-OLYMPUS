import { readFileSync } from "fs";
import { join } from "path";
import { success, error as errorColor, dim, info } from "../src/utils/colors.js";

function validateSchema() {
  const schemaPath = join(process.cwd(), "assets", "olimpus.schema.json");

  try {
    const content = readFileSync(schemaPath, "utf-8");
    const schema = JSON.parse(content);

    if (!schema.$schema || !schema.$id) {
      throw new Error("Schema missing $schema or $id properties");
    }

    if (!schema.title || !schema.description) {
      throw new Error("Schema missing title or description");
    }

    if (!schema.definitions) {
      throw new Error("Schema missing definitions");
    }

    const requiredDefs = [
      "MetaAgent",
      "RoutingRule",
      "Matcher",
      "KeywordMatcher",
      "ComplexityMatcher",
      "RegexMatcher",
      "ProjectContextMatcher",
      "AlwaysMatcher",
      "ConfigOverrides",
      "OlimpusSettings",
      "BuiltinAgentName",
    ];

    for (const def of requiredDefs) {
      if (!schema.definitions[def]) {
        throw new Error(`Missing definition: ${def}`);
      }
    }

    console.log(success("✅ Schema validation passed"));
    console.log(`   ${dim("-")} ${dim("$id:")} ${dim(schema.$id)}`);
    console.log(`   ${dim("-")} ${dim("Definitions:")} ${info(String(Object.keys(schema.definitions).length))}`);
    console.log(`   ${dim("-")} ${dim("Extends:")} ${dim("oh-my-opencode schema via allOf")}`);
  } catch (error) {
    console.error(`${errorColor("❌ Schema validation failed:")} ${dim(error instanceof Error ? error.message : String(error))}`);
    process.exit(1);
  }
}

validateSchema();

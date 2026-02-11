import { readFileSync } from "fs";
import { join } from "path";

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

    console.log("✅ Schema validation passed");
    console.log(`   - $id: ${schema.$id}`);
    console.log(`   - Definitions: ${Object.keys(schema.definitions).length}`);
    console.log(`   - Extends: oh-my-opencode schema via allOf`);
  } catch (error) {
    console.error(`❌ Schema validation failed:`, error);
    process.exit(1);
  }
}

validateSchema();

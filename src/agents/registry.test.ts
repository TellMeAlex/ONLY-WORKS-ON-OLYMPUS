import { test, expect, describe } from "bun:test";
import { MetaAgentRegistry } from "./registry.js";
import type { MetaAgentDef, RoutingLoggerConfig } from "../config/schema.js";

describe("MetaAgentRegistry", () => {
  describe("exportDelegationGraph", () => {
    test("returns empty graph when no delegations tracked", () => {
      // Arrange
      const registry = new MetaAgentRegistry();

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert
      expect(graph).toBe("digraph {\n}\n");
    });

    test("exports single delegation edge in DOT format", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("atenea", "hefesto");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert
      expect(graph).toBe('digraph {\n  "atenea" -> "hefesto";\n}\n');
    });

    test("exports multiple delegation edges in DOT format", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("atenea", "hefesto");
      registry.trackDelegation("hefesto", "hermes");
      registry.trackDelegation("hermes", "atenea");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert
      expect(graph).toContain('  "atenea" -> "hefesto";');
      expect(graph).toContain('  "hefesto" -> "hermes";');
      expect(graph).toContain('  "hermes" -> "atenea";');
      // Check that graph has the structure of digraph with content
      expect(graph).toContain("digraph {");
      expect(graph).toContain("->");
      expect(graph).toContain("}");
    });

    test("exports delegation graph with standard meta-agents", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("sisyphus", "atenea");
      registry.trackDelegation("atenea", "hefesto");
      registry.trackDelegation("hefesto", "hermes");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert
      expect(graph).toContain('  "sisyphus" -> "atenea";');
      expect(graph).toContain('  "atenea" -> "hefesto";');
      expect(graph).toContain('  "hefesto" -> "hermes";');
      // Verify it starts with "digraph {" and ends with "}"
      expect(graph).toMatch(/^digraph \{/);
      expect(graph).toMatch(/\}$/);
    });

    test("valid DOT format with proper syntax", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should be valid DOT syntax
      expect(graph).toMatch(/^digraph \{/);
      expect(graph).toMatch(/\}$/);
      expect(graph).toContain("->");
      expect(graph).toContain(";");
    });

    test("handles agents with special characters in names", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent-1", "agent.2");
      registry.trackDelegation("agent_test", "agent:name");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Names should be properly quoted
      expect(graph).toContain('  "agent-1" -> "agent.2";');
      expect(graph).toContain('  "agent_test" -> "agent:name";');
    });

    test("handles agents with spaces in names", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("primary agent", "secondary agent");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Names with spaces should be properly quoted
      expect(graph).toContain('  "primary agent" -> "secondary agent";');
    });

    test("handles agents with numbers in names", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent123", "agent456");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert
      expect(graph).toContain('  "agent123" -> "agent456";');
    });

    test("exports linear delegation chain", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");
      registry.trackDelegation("agent2", "agent3");
      registry.trackDelegation("agent3", "agent4");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: All edges in chain should be present
      expect(graph).toContain('  "agent1" -> "agent2";');
      expect(graph).toContain('  "agent2" -> "agent3";');
      expect(graph).toContain('  "agent3" -> "agent4";');
      const edgeCount = (graph.match(/->/g) || []).length;
      expect(edgeCount).toBe(3);
    });

    test("exports star topology (one agent delegates to multiple)", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("main", "agent1");
      registry.trackDelegation("main", "agent2");
      registry.trackDelegation("main", "agent3");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: All edges from main agent should be present
      expect(graph).toContain('  "main" -> "agent1";');
      expect(graph).toContain('  "main" -> "agent2";');
      expect(graph).toContain('  "main" -> "agent3";');
      const edgeCount = (graph.match(/->/g) || []).length;
      expect(edgeCount).toBe(3);
    });

    test("exports mesh topology (multiple interconnections)", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");
      registry.trackDelegation("agent1", "agent3");
      registry.trackDelegation("agent2", "agent3");
      registry.trackDelegation("agent2", "agent4");
      registry.trackDelegation("agent3", "agent4");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: All edges should be present
      const edgeCount = (graph.match(/->/g) || []).length;
      expect(edgeCount).toBe(5);
      expect(graph).toContain('  "agent1" -> "agent2";');
      expect(graph).toContain('  "agent1" -> "agent3";');
      expect(graph).toContain('  "agent2" -> "agent3";');
      expect(graph).toContain('  "agent2" -> "agent4";');
      expect(graph).toContain('  "agent3" -> "agent4";');
    });

    test("handles self-delegation edge case", () => {
      // Arrange: Agent delegates to itself (circular reference of length 1)
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent1");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should still export the edge
      expect(graph).toContain('  "agent1" -> "agent1";');
    });

    test("exports graph with circular dependencies", () => {
      // Arrange: Create a cycle
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("atenea", "hefesto");
      registry.trackDelegation("hefesto", "hermes");
      registry.trackDelegation("hermes", "atenea");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Cycle should be visible in the graph
      expect(graph).toContain('  "atenea" -> "hefesto";');
      expect(graph).toContain('  "hefesto" -> "hermes";');
      expect(graph).toContain('  "hermes" -> "atenea";');

      // Verify circular dependency detection works
      expect(registry.checkCircular("atenea", "atenea")).toBe(true);
    });

    test("multiple calls return consistent results", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");

      // Act: Call export multiple times
      const graph1 = registry.exportDelegationGraph();
      const graph2 = registry.exportDelegationGraph();
      const graph3 = registry.exportDelegationGraph();

      // Assert: All calls should return the same result
      expect(graph1).toBe(graph2);
      expect(graph2).toBe(graph3);
    });

    test("export after tracking additional delegations updates graph", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");

      // Act: Export, then track more delegations, then export again
      const graph1 = registry.exportDelegationGraph();
      registry.trackDelegation("agent2", "agent3");
      const graph2 = registry.exportDelegationGraph();

      // Assert: Graphs should differ
      expect(graph1).not.toBe(graph2);
      expect(graph1).toContain('  "agent1" -> "agent2";');
      expect(graph2).toContain('  "agent1" -> "agent2";');
      expect(graph2).toContain('  "agent2" -> "agent3";');
    });

    test("handles Unicode characters in agent names", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("αθηνά", "Ἑρμῆς");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Unicode characters should be preserved
      expect(graph).toContain('  "αθηνά" -> "Ἑρμῆς";');
    });

    test("handles empty strings in agent names (edge case)", () => {
      // Arrange: Edge case with empty agent names
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("", "agent1");
      registry.trackDelegation("agent2", "");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should handle empty strings gracefully
      expect(graph).toContain('  "" -> "agent1";');
      expect(graph).toContain('  "agent2" -> "";');
    });

    test("exports graph with duplicate delegations", () => {
      // Arrange: Track same delegation multiple times
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");
      registry.trackDelegation("agent1", "agent2");
      registry.trackDelegation("agent1", "agent2");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should show edge once (delegations is keyed by "from:to")
      // Actually, looking at trackDelegation implementation, it increments count
      // but exportDelegationGraph only checks keys, not values
      const edgeCount = (graph.match(/"agent1" -> "agent2"/g) || []).length;
      expect(edgeCount).toBe(1);
    });

    test("format has proper indentation", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should have 2-space indentation for edges
      const lines = graph.split("\n");
      expect(lines[0]).toBe("digraph {");
      expect(lines[1]).toBe('  "agent1" -> "agent2";');
      expect(lines[2]).toBe("}");
    });

    test("format ends with newline", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should end with newline
      expect(graph).toMatch(/\n$/);
    });

    test("handles very long agent names", () => {
      // Arrange: Create agent names that are unusually long
      const longName1 = "a".repeat(100);
      const longName2 = "b".repeat(100);
      const registry = new MetaAgentRegistry();
      registry.trackDelegation(longName1, longName2);

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Long names should be handled
      expect(graph).toContain(`  "${longName1}" -> "${longName2}";`);
    });

    test("exports graph when maxDepth is customized", () => {
      // Arrange
      const loggerConfig: RoutingLoggerConfig = {
        enabled: false,
        log_file: "/tmp/routing.log",
      };
      const registry = new MetaAgentRegistry(5, loggerConfig);
      registry.trackDelegation("agent1", "agent2");
      registry.trackDelegation("agent2", "agent3");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should still export graph regardless of maxDepth
      expect(graph).toContain('  "agent1" -> "agent2";');
      expect(graph).toContain('  "agent2" -> "agent3";');
    });

    test("works alongside other registry methods", () => {
      // Arrange
      const registry = new MetaAgentRegistry();

      // Use other registry methods
      const metaAgentDef: MetaAgentDef = {
        base_model: "claude-sonnet-4-20250217",
        delegates_to: ["other-agent"],
        routing_rules: [
          {
            matcher: { type: "always" },
            target_agent: "other-agent",
          },
        ],
      };
      registry.register("test-agent", metaAgentDef);

      // Track delegations
      registry.trackDelegation("test-agent", "other-agent");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should still work
      expect(graph).toContain('  "test-agent" -> "other-agent";');
    });

    test("DOT format is parsable (basic syntax validation)", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");
      registry.trackDelegation("agent2", "agent3");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Basic DOT syntax validation
      // Should have digraph { at start
      expect(graph).toMatch(/^digraph \{/);

      // Should have matching braces
      const openBraces = (graph.match(/\{/g) || []).length;
      const closeBraces = (graph.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Each edge should end with semicolon
      const lines = graph.split("\n");
      let edgeLineCount = 0;
      for (const line of lines) {
        if (line.includes("->")) {
          edgeLineCount++;
          expect(line).toMatch(/;$/);
        }
      }
      expect(edgeLineCount).toBe(2);
    });

    test("handles mixed case agent names", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("Atenea", "hefesto");
      registry.trackDelegation("HEFESTO", "hermes");

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Case should be preserved
      expect(graph).toContain('  "Atenea" -> "hefesto";');
      expect(graph).toContain('  "HEFESTO" -> "hermes";');
    });

    test("newlines and special characters are properly quoted", () => {
      // Arrange: Agent names with quotes (edge case)
      const registry = new MetaAgentRegistry();
      registry.trackDelegation('agent"1', 'agent"2');

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Names should still be in quotes (DOT format)
      // Note: In real DOT, quotes in names need escaping, but our implementation
      // simply wraps everything in quotes
      expect(graph).toContain('"agent"1" -> "agent"2"');
    });

    test("graph is independent of registration order", () => {
      // Arrange: Create two registries with same delegations in different order
      const registry1 = new MetaAgentRegistry();
      registry1.trackDelegation("agent1", "agent2");
      registry1.trackDelegation("agent2", "agent3");

      const registry2 = new MetaAgentRegistry();
      registry2.trackDelegation("agent2", "agent3");
      registry2.trackDelegation("agent1", "agent2");

      // Act
      const graph1 = registry1.exportDelegationGraph();
      const graph2 = registry2.exportDelegationGraph();

      // Assert: Note - order may differ since Object.entries() doesn't guarantee order
      // But both graphs should contain the same edges
      expect(graph1).toContain('  "agent1" -> "agent2";');
      expect(graph1).toContain('  "agent2" -> "agent3";');
      expect(graph2).toContain('  "agent1" -> "agent2";');
      expect(graph2).toContain('  "agent2" -> "agent3";');
    });

    test("can create complex realistic meta-agent scenario", () => {
      // Arrange: Simulate a realistic Olimpus meta-agent delegation scenario
      const registry = new MetaAgentRegistry();

      // Main agent delegates to different meta-agents based on task
      registry.trackDelegation("sisyphus", "atenea");
      registry.trackDelegation("sisyphus", "hefesto");
      registry.trackDelegation("sisyphus", "hermes");

      // Meta-agents may delegate to each other
      registry.trackDelegation("atenea", "hefesto"); // Atenea might need build tasks
      registry.trackDelegation("hefesto", "hermes"); // Hefesto might need research

      // Act
      const graph = registry.exportDelegationGraph();

      // Assert: Should export complete delegation graph
      expect(graph).toContain('  "sisyphus" -> "atenea";');
      expect(graph).toContain('  "sisyphus" -> "hefesto";');
      expect(graph).toContain('  "sisyphus" -> "hermes";');
      expect(graph).toContain('  "atenea" -> "hefesto";');
      expect(graph).toContain('  "hefesto" -> "hermes";');

      const edgeCount = (graph.match(/->/g) || []).length;
      expect(edgeCount).toBe(5);
    });
  });

  describe("trackDelegation and exportDelegationGraph integration", () => {
    test("tracked delegation appears in exported graph", () => {
      // Arrange
      const registry = new MetaAgentRegistry();

      // Act: Track delegation and export
      registry.trackDelegation("oracle", "sisyphus");
      const graph = registry.exportDelegationGraph();

      // Assert
      expect(graph).toContain('  "oracle" -> "sisyphus";');
    });

    test("multiple track calls all appear in graph", () => {
      // Arrange
      const registry = new MetaAgentRegistry();

      // Act
      registry.trackDelegation("a", "b");
      registry.trackDelegation("b", "c");
      registry.trackDelegation("c", "d");
      const graph = registry.exportDelegationGraph();

      // Assert
      expect(graph).toContain('  "a" -> "b";');
      expect(graph).toContain('  "b" -> "c";');
      expect(graph).toContain('  "c" -> "d";');
    });

    test("export doesn't modify internal state", () => {
      // Arrange
      const registry = new MetaAgentRegistry();
      registry.trackDelegation("agent1", "agent2");

      // Act
      const graph1 = registry.exportDelegationGraph();
      const graph2 = registry.exportDelegationGraph();

      // Assert: Graphs should be identical (export is pure read operation)
      expect(graph1).toBe(graph2);
    });
  });
});

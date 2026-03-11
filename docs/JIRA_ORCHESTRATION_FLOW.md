# Jira Orchestration Flow (Prometheus -> Atlas)

This flow reflects the actual persisted paths used in this environment:

- Plans: `.sisyphus/plans/*.md`
- Active session state: `.sisyphus/boulder.json`
- Working notes: `.sisyphus/notepads/**`

```mermaid
flowchart TD
    A["User: Work on JIRA-123"] --> B["Prometheus: Intent gate and classification"]
    B --> C{"Task type"}
    C -->|Needs external context| D["Hermes or Librarian fetches Jira details"]
    C -->|Clear implementation scope| E["Prometheus creates executable plan"]
    D --> E

    E --> F["Persist plan to .sisyphus/plans/JIRA-123.md"]
    F --> G["Update or create .sisyphus/boulder.json"]
    G --> H["Atlas starts work via start-work command"]

    H --> I["Atlas reads active plan and executes tasks"]
    I --> J{"What is needed now?"}

    J -->|Codebase discovery| K["Explore"]
    J -->|External docs or APIs| L["Librarian"]
    J -->|Architecture-level decision| M["Oracle"]
    J -->|Deep implementation| N["Hephaestus or Sisyphus"]
    J -->|Safe structural refactor| O["Refactor command with LSP/AST"]
    J -->|Browser/UI validation| P["Playwright or Dev-Browser"]
    J -->|Docs update| Q["Writing"]

    K --> I
    L --> I
    M --> I
    N --> I
    O --> I
    P --> I
    Q --> I

    I --> R["Mandatory verification: diagnostics + typecheck + tests"]
    R --> S{"Verification result"}
    S -->|Fail| T["Fix root cause and retry"]
    T --> I
    S -->|Pass| U["Write progress and decisions to .sisyphus/notepads/**"]

    U --> V["Prometheus reviews closure criteria"]
    V --> W{"Ready for PR or release?"}
    W -->|Yes| X["Create PR package: summary, evidence, risks"]
    W -->|No| Y["Create next iteration in .sisyphus/plans"]
```

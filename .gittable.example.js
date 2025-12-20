module.exports = {
    types: [
      { value: "feat", name: "New Feature" },
      { value: "fix", name: "Bug Fix" },
      { value: "docs", name: "Documentation" },
      { value: "style", name: "Code Style" },
      { value: "refactor", name: "Code Refactoring" },
      { value: "perf", name: "Performance Improvement" },
      { value: "test", name: "Adding Tests" },
      { value: "build", name: "Build System Changes" },
      { value: "ci", name: "CI Configuration" },
      { value: "chore", name: "Maintenance Tasks" },
      { value: "revert", name: "Revert Commit" },
      { value: "wip", name: "Work In Progress" },
    ],
  
    scopes: [
      // Application Structure
      { name: "app" },
      { name: "routing" },
      { name: "layout" },
  
      // Rendering / Next.js Runtime
      { name: "rsc" },
      { name: "client" },
      { name: "server" },
      { name: "middleware" },
  
      // UI & Shared Logic
      { name: "components" },
      { name: "styles" },
      { name: "hooks" },
      { name: "utils" },
      { name: "types" },
  
      // Data, API & Auth
      { name: "api" },
      { name: "auth" },
      { name: "db" },
      { name: "cache" },
  
      // Tooling & Development
      { name: "config" },
      { name: "logging" },
      { name: "test" },
  
      // Infrastructure & Deployment
      { name: "infra" },
      { name: "env" },
    ],
  
    allowTicketNumber: false,
    isTicketNumberRequired: false,
    ticketNumberPrefix: "TICKET-",
    ticketNumberSuffix: "",
    ticketNumberRegExp: "\\d{1,5}",
  
    allowCustomScopes: true,
    allowBreakingChanges: ["feat", "fix"],
  
    skipQuestions: ["body"],
  
    subjectLimit: 100,
    subjectSeparator: ": ",
    breaklineChar: "|",
  
    upperCaseSubject: false,
    usePreparedCommit: false,
    askForBreakingChangeFirst: false,
  };
  
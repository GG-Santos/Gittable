declare module 'gittable' {
  export interface CommitType {
    value: string;
    name: string;
  }

  export interface Scope {
    name: string;
  }

  export interface Config {
    types: CommitType[];
    scopes?: Scope[];
    scopeOverrides?: Record<string, Scope[]>;

    allowTicketNumber?: boolean;
    isTicketNumberRequired?: boolean;
    ticketNumberPrefix?: string;
    ticketNumberSuffix?: string;
    ticketNumberRegExp?: string;
    fallbackTicketNumber?: string;
    prependTicketToHead?: boolean;

    allowCustomScopes?: boolean;
    allowBreakingChanges?: string[];
    skipQuestions?: string[];
    skipEmptyScopes?: boolean;

    subjectLimit?: number;
    subjectSeparator?: string;
    typePrefix?: string;
    typeSuffix?: string;
    upperCaseSubject?: boolean;

    breaklineChar?: string;
    breakingPrefix?: string;
    footerPrefix?: string;

    usePreparedCommit?: boolean;
    askForBreakingChangeFirst?: boolean;
  }

  export interface Answers {
    type: string;
    scope: string | null;
    ticketNumber?: string;
    subject: string;
    body?: string;
    breaking?: string;
    footer?: string;
  }

  export type Prompter = (cz: unknown, commit: (message: string) => void) => Promise<void>;

  export const prompter: Prompter;
}

// Re-export for backward compatibility
export { prompter } from '../core/commit/flow';

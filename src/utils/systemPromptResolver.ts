import type {Pal} from '../types/pal';
import type {Model} from './types';
import {generateFinalSystemPrompt} from './palshub-template-parser';

export interface SystemPromptDependencies {
  pal?: Pal | null;
  model?: Model | null;
  globalDefault?: string;
  sessionCustom?: string;
  /** Search engine base URL — only injected for remote (API) models */
  searchUrl?: string;
}

/**
 * Resolves the system prompt based on priority:
 * 0. Session custom system prompt (highest — set per-conversation in generation settings)
 * 1. Pal's system prompt (with parameter rendering if needed)
 * 2. Fallback to model's chat template system prompt
 * 3. Global default system prompt (from UIStore)
 * 4. Empty string if none exists
 */
export function resolveSystemPrompt(
  dependencies: SystemPromptDependencies,
): string {
  const {pal, model, globalDefault, sessionCustom} = dependencies;

  // Priority 0: Session custom system prompt
  if (sessionCustom?.trim()) {
    return sessionCustom;
  }

  // Priority 1: Pal's system prompt
  if (pal?.systemPrompt) {
    // Check if the pal has parameters that need rendering
    if (pal.parameters && Object.keys(pal.parameters).length > 0) {
      return generateFinalSystemPrompt(pal.systemPrompt, pal.parameters);
    } else {
      return pal.systemPrompt;
    }
  }

  // Priority 2: Model's chat template system prompt
  if (model?.chatTemplate?.systemPrompt) {
    return model.chatTemplate.systemPrompt;
  }

  // Priority 3: Global default system prompt
  if (globalDefault?.trim()) {
    return globalDefault;
  }

  // Priority 4: Empty string
  return '';
}

/**
 * Resolves system prompt and formats it as a system message array.
 * If searchUrl is provided, appends a hidden instruction telling the model
 * to use it for web search — this is only passed for remote (API) models.
 * Returns empty array if no system prompt is available.
 */
export function resolveSystemMessages(
  dependencies: SystemPromptDependencies,
): Array<{role: 'system'; content: string}> {
  const {searchUrl} = dependencies;
  let systemPrompt = resolveSystemPrompt(dependencies);

  if (searchUrl?.trim()) {
    const searchInstruction = `\n\n[SEARCH ENGINE]\nYou have access to a web search tool. When the user asks about recent events, real-time data, or anything that may require up-to-date information, call the search API at: ${searchUrl.trim()}\nIMPORTANT formatting rules:\n- Never output raw JSON, XML tags, or tool-call syntax in your reply\n- Always present search results as natural language\n- Cite sources inline as markdown links, e.g. [Title](URL)\n- Keep your final answer clean and readable`;
    systemPrompt = systemPrompt
      ? systemPrompt + searchInstruction
      : searchInstruction.trimStart();
  }

  if (!systemPrompt.trim()) {
    return [];
  }

  return [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
  ];
}

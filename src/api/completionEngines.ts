import {LlamaContext} from 'llama.rn';
import * as RNFS from '@dr.pogodin/react-native-fs';

import {streamChatCompletion, OpenAIChatMessage} from './openai';
import {
  ApiCompletionParams,
  CompletionEngine,
  CompletionResult,
  CompletionStreamData,
} from '../utils/completionTypes';

/**
 * Convert a local file:// URI to a base64 data URL for remote API consumption.
 * Remote APIs (OpenAI, etc.) cannot access device-local file paths.
 */
async function fileUriToDataUrl(uri: string): Promise<string> {
  // Already a data URL or remote URL — pass through
  if (uri.startsWith('data:') || uri.startsWith('http')) {
    return uri;
  }
  const filePath = uri.startsWith('file://') ? uri.slice(7) : uri;
  const ext = filePath.split('.').pop()?.toLowerCase() ?? 'jpeg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const mime = mimeMap[ext] ?? 'image/jpeg';
  const base64 = await RNFS.readFile(filePath, 'base64');
  return `data:${mime};base64,${base64}`;
}

/**
 * Rewrite image_url entries in messages from file:// URIs to base64 data URLs.
 */
async function rewriteImageUris(
  messages: OpenAIChatMessage[],
): Promise<OpenAIChatMessage[]> {
  return Promise.all(
    messages.map(async msg => {
      if (!Array.isArray(msg.content)) {
        return msg;
      }
      const newContent = await Promise.all(
        msg.content.map(async part => {
          if (part.type === 'image_url' && part.image_url?.url) {
            return {
              ...part,
              image_url: {url: await fileUriToDataUrl(part.image_url.url)},
            };
          }
          return part;
        }),
      );
      return {...msg, content: newContent};
    }),
  );
}

/**
 * LocalCompletionEngine wraps LlamaContext conforming to the CompletionEngine interface.
 * Thin wrapper that delegates all calls 1:1 to the native context.
 */
export class LocalCompletionEngine implements CompletionEngine {
  constructor(private context: LlamaContext) {}

  async completion(
    params: ApiCompletionParams,
    callback?: (data: CompletionStreamData) => void,
  ): Promise<CompletionResult> {
    const result = await this.context.completion(
      params,
      callback
        ? data => {
            callback({
              token: data.token,
              content: data.content,
              reasoning_content: data.reasoning_content,
            });
          }
        : undefined,
    );
    return {
      text: result.text,
      content: result.content,
      reasoning_content: result.reasoning_content,
      timings: result.timings,
      tokens_predicted: result.tokens_predicted,
      tokens_evaluated: result.tokens_evaluated,
      truncated: result.truncated,
      stopped_eos: result.stopped_eos,
      stopped_limit: result.stopped_limit,
      stopped_word: result.stopped_word,
      stopping_word: result.stopping_word,
      context_full: result.context_full,
      interrupted: result.interrupted,
    };
  }

  async stopCompletion(): Promise<void> {
    await this.context.stopCompletion();
  }
}

/**
 * OpenAICompletionEngine implements the CompletionEngine interface
 * using fetch + SSE parsing for OpenAI-compatible servers.
 */
export class OpenAICompletionEngine implements CompletionEngine {
  private abortController: AbortController | null = null;

  constructor(
    private serverUrl: string,
    private modelId: string,
    private apiKey?: string,
  ) {}

  async completion(
    params: ApiCompletionParams,
    callback?: (data: CompletionStreamData) => void,
  ): Promise<CompletionResult> {
    this.abortController = new AbortController();

    const messages = await rewriteImageUris(
      (params.messages || []) as OpenAIChatMessage[],
    );

    return streamChatCompletion(
      {
        messages,
        model: this.modelId,
        temperature: params.temperature,
        top_p: params.top_p,
        max_tokens: params.n_predict,
        stop: params.stop,
        stream: true,
      },
      this.serverUrl,
      this.apiKey,
      this.abortController.signal,
      callback,
    );
  }

  async stopCompletion(): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
  }
}

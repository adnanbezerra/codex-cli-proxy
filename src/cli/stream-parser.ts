import { Readable } from 'node:stream';
import type { CliEvent } from '../protocol/cli-types.js';
import { logger } from '../util/logger.js';

export async function* parseCliStream(stdout: Readable): AsyncGenerator<CliEvent> {
  let buffer = '';

  for await (const chunk of stdout) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        yield JSON.parse(trimmed) as CliEvent;
      } catch (err) {
        logger.warn('Failed to parse CLI output line', {
          line: trimmed.slice(0, 200),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // Process any remaining data in the buffer
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim()) as CliEvent;
    } catch (err) {
      logger.warn('Failed to parse final CLI buffer', {
        buffer: buffer.trim().slice(0, 200),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

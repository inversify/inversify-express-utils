import { Readable, Writable } from 'node:stream';

import { describe, expect, it } from '@jest/globals';

import { StreamContent } from '../../content/streamContent';

describe('StreamContent', () => {
  it('should have text/plain as the set media type', () => {
    const stream: Readable = new Readable();

    const content: StreamContent = new StreamContent(stream, 'text/plain');

    expect(content.headers['content-type']).toEqual('text/plain');
  });

  it('should be able to pipe stream which was given to it', async () => {
    const stream: Readable = new Readable({
      read() {
        this.push(Buffer.from('test'));
        this.push(null);
      },
    });

    const readable: Readable = await new StreamContent(
      stream,
      'text/plain',
    ).readAsync();

    const chunks: Array<Buffer> = [];

    let buffer: Buffer | null = null;

    return new Promise<void>((resolve: () => void) => {
      readable.on('end', () => {
        buffer = Buffer.concat(chunks);

        expect(buffer.toString()).toEqual('test');

        resolve();
      });

      const writableStream: Writable = new Writable({
        write(chunk: unknown) {
          chunks.push(chunk as Buffer);
        },
      });

      readable.pipe(writableStream);
    });
  });
});

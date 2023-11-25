import { Readable, Writable } from 'stream';
import { StreamContent } from '../../src/content/streamContent';

describe('StreamContent', () => {
  it('should have text/plain as the set media type', () => {
    const stream = new Readable();

    const content = new StreamContent(stream, 'text/plain');

    expect(content.headers['content-type']).toEqual('text/plain');
  });

  it('should be able to pipe stream which was given to it', done => {
    const stream = new Readable({
      read() {
        this.push(Buffer.from('test'));
        this.push(null);
      },
    });

    const content = new StreamContent(stream, 'text/plain');

    void content.readAsync().then((readable: Readable) => {
      const chunks: Array<Buffer> = [];

      let buffer: Buffer | null = null;

      readable.on('end', () => {
        buffer = Buffer.concat(chunks);

        expect(buffer.toString()).toEqual('test');

        done();
      });

      const writableStream = new Writable({
        write(chunk) {
          chunks.push(chunk as Buffer);
        },
      });

      readable.pipe(writableStream);
    });
  });
});

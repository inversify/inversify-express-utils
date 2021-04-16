import { expect } from "chai";
import { StreamContent } from "../../src/content/streamContent";
import { Readable, Writable } from "stream";

describe("StreamContent", () => {
    it("should have text/plain as the set media type", () => {
        const stream = new Readable();

        const content = new StreamContent(stream, "text/plain");

        expect(content.headers["content-type"]).to.equal("text/plain");
    });

    it("should have streamed response flag", () => {
        const stream = new Readable();

        const content = new StreamContent(stream, "text/plain");

        expect(content.isStreamedResponse).to.equal(true);
    });

    it("should be able to pipe stream which was given to it", (done) => {
        const stream = new Readable({
            read() {
                this.push(Buffer.from("test"));
                this.push(null);
            }
        });

        const content = new StreamContent(stream, "text/plain");


        content.readAsStreamAsync().then((readable ) => {
            const chunks: Buffer[] = [];

            let buffer: Buffer | null = null;

            readable.on("end", () => {
                buffer = Buffer.concat(chunks);

                expect(buffer.toString()).to.equal("test");

                done();
            });

            const writableStream = new Writable({
                write(chunk) {
                    chunks.push(chunk as Buffer);
                }
            });

            readable.pipe(writableStream);
        });
    });
});

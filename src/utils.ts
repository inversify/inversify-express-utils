import { METADATA_KEY } from "./constants";

export function cleanUpMetadata() {
    Reflect.defineMetadata(
        METADATA_KEY.controller,
        [],
        Reflect
    );
}

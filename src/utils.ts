import { METADATA_KEY, CONTROLLER_METADATA_TARGET } from "./constants";

export function cleanUpMetadata() {
    Reflect.defineMetadata(
        METADATA_KEY.controller,
        [],
        CONTROLLER_METADATA_TARGET
    );
}

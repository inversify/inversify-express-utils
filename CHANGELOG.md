# Changelog

All notable changes to this project from 6.4.4 forward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

- Added explicit check for when both `genericMetadata` and `methodMetadata` are `undefined` in the `getControllerMethodMetadata` function, preventing potential errors when no metadata is available.

## [6.5.0]

### Added

### Changed

- Updated `BaseMiddleware.handler` to allow async handlers.
- Updated `Middleware` to allow include any `ServiceIdentifier`.
- Updated `JsonContent` with no generic.

### Fixed

- Updated `BaseController.ok` to no longer return `text/plain` responses when non string content is passed.

## [6.4.10]

### Fixed

- Fixed `Controller` without wrong constraints (#417).

## [6.4.9]

### Fixed

- Fixed wrong emited typescript delclaration files (#1668).

## [6.4.8]

### Fixed

- Fixed can't set headers after they are sent (#255 / #412).

## [6.4.7]

### Fixed

- Updated `inversify` and `express` dependencies to be peer dependnecies as stated in the docs.

## [6.4.4]

### Added

### Changed

- Update dependencies (`minimist`, `json5`, `@babel/traverse`, `tough-cookie`, `ansi-regex`, `cookiejar`, `express`, `decode-uri-component`).

### Fixed

- Change JsonContent to return object rather than string (#379 / #378).

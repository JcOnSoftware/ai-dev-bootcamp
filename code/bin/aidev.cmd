@echo off
REM aidev — Windows wrapper around the CLI entrypoint.
bun "%~dp0..\packages\cli\src\index.ts" %*

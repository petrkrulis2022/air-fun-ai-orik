@echo off
cd packages\backend
call npm test -- auth.service.test.ts
cd ..\..

@echo off
cd packages\contracts
call npx hardhat test test/BondingCurve.test.ts
cd ..\..

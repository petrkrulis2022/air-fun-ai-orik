@echo off
echo Deploying contracts to Hedera Testnet...
echo.

wsl bash -c "cd ~/air-fun-ai-kiro/packages/contracts && npm run compile && npm run deploy:air:hedera && npm run deploy:factory:hedera && npm run deploy:pool-factory:hedera"

echo.
echo Hedera Testnet deployment complete!
pause

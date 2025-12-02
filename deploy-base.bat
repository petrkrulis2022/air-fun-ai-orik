@echo off
echo Deploying contracts to Base Sepolia...
echo.

wsl bash -c "cd ~/air-fun-ai-kiro/packages/contracts && npm run compile && npm run deploy:air:base && npm run deploy:factory:base && npm run deploy:pool-factory:base"

echo.
echo Base Sepolia deployment complete!
pause

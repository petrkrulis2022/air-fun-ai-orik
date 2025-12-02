@echo off
echo Starting contract deployment...
echo.

wsl bash -c "cd ~/air-fun-ai-kiro/packages/contracts && npm run compile && npm run deploy:all"

echo.
echo Deployment complete!
pause

#!/bin/bash
cd packages/frontend-streamer && npm run dev &
cd ../frontend-viewer && npm run dev &
wait

#!/bin/bash

set -e

cleanup()
{
    echo ""
    echo "Stopping dahsboard and API..."
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null
    fi
    exit 0
}

echo "________  .__       .__        _____     __________        __   __      __         __         .__     ";
echo "\\______ \\ |__| _____|__| _____/ ____\\____\\______   \\ _____/  |_/  \\    /  \\_____ _/  |_  ____ |  |__  ";
echo " |    |  \\|  |/  ___/  |/    \\   __\\/  _ \\|    |  _//  _ \\   __\\   \\/\\/   /\\__  \\\\   __\\/ ___\\|  |  \\ ";
echo " |    \`   \\  |\\___ \\|  |   |  \\  | (  <_> )    |   (  <_> )  |  \\        /  / __ \\|  | \\  \\___|   Y  \\";
echo "/_______  /__/____  >__|___|  /__|  \\____/|______  /\\____/|__|   \\__/\\  /  (____  /__|  \\___  >___|  /";
echo "        \\/        \\/        \\/                   \\/                   \\/        \\/          \\/     \\/ ";
echo ""
echo ""

if [ ! -d "outputs" ] || [ -z "$(ls -A outputs 2>/dev/null)" ]; then
    echo "No analysis data found!"
    echo "Please run './run_analysis.sh' to generate the required data first"
    echo ""
    exit 1
fi
if [ ! -d "konsta/node_modules" ]; then
    echo "Installing dashboard dependencies"
    cd konsta && npm install && cd ..
    echo ""
fi
echo "Starting DisinfoBotWatch Dashboard..."
echo "Backend API: http://localhost:5000"
echo "Frontend UI: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""
trap cleanup SIGINT SIGTERM EXIT
echo "Starting Flask API..."
uv run python api.py &
API_PID=$!
sleep 3
echo "Starting dashboard..."
cd konsta && npm run dev

#!/bin/bash

set -e
echo "________  .__       .__        _____     __________        __   __      __         __         .__     ";
echo "\\______ \\ |__| _____|__| _____/ ____\\____\\______   \\ _____/  |_/  \\    /  \\_____ _/  |_  ____ |  |__  ";
echo " |    |  \\|  |/  ___/  |/    \\   __\\/  _ \\|    |  _//  _ \\   __\\   \\/\\/   /\\__  \\\\   __\\/ ___\\|  |  \\ ";
echo " |    \`   \\  |\\___ \\|  |   |  \\  | (  <_> )    |   (  <_> )  |  \\        /  / __ \\|  | \\  \\___|   Y  \\";
echo "/_______  /__/____  >__|___|  /__|  \\____/|______  /\\____/|__|   \\__/\\  /  (____  /__|  \\___  >___|  /";
echo "        \\/        \\/        \\/                   \\/                   \\/        \\/          \\/     \\/ ";

if [ ! -d "outputs" ] || [ -z "$(ls -A outputs 2>/dev/null)" ]; then
    echo "[*] No analysis data found. Running analysis first..."
    echo ""
    uv run python main.py
    echo ""
fi

echo "Starting Flask dashboard server..."
echo "Dashboard will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uv run python api.py

#!/bin/bash
# Move to the script's directory
cd "$(dirname "$0")"

echo "Starting Under 40 Report server on http://localhost:8080..."

# Start python web server in the background
if command -v python3 &>/dev/null; then
    python3 -m http.server 8080 &
elif command -v python &>/dev/null; then
    python -m http.server 8080 &
else
    echo "Python is not installed. Opening index.html directly..."
    open index.html
    exit 0
fi

SERVER_PID=$!

# Wait a second for the server to spin up
sleep 1

# Automatically open the browser
open "http://localhost:8080"

echo "Server running (PID: $SERVER_PID)."
echo "Close this window when you are done to stop the server."

# Keep window open and kill server when user closes or hits Ctrl+C
trap "kill $SERVER_PID 2>/dev/null; exit 0" INT TERM EXIT
wait $SERVER_PID

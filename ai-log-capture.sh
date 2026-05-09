#!/bin/bash
# ai-log-capture.sh
# Records your terminal session to a file.
# Usage: bash ai-log-capture.sh my-session.txt
# Press Ctrl+D or type 'exit' to stop recording.

OUTPUT="${1:-ai-session.txt}"
echo "Recording session to $OUTPUT — press Ctrl+D to stop."
script -q "$OUTPUT"
echo "Session saved to $OUTPUT"

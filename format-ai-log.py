#!/usr/bin/env python3
# format-ai-log.py
# Usage: python format-ai-log.py raw.txt > formatted.md

import sys, re

def format_log(text):
    # Split on common AI tool separators
    blocks = re.split(r'\n(?=You:|Human:|User:|Assistant:|AI:)', text)
    out = []
    for block in blocks:
        if re.match(r'^(You:|Human:|User:)', block):
            content = re.sub(r'^(You:|Human:|User:)\s*', '', block).strip()
            out.append(f"## Prompt\n{content}")
        elif re.match(r'^(Assistant:|AI:)', block):
            content = re.sub(r'^(Assistant:|AI:)\s*', '', block).strip()
            out.append(f"## Response\n{content}")
    return "\n\n---\n\n".join(out)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            print(format_log(f.read()))
    else:
        print("Usage: python format-ai-log.py raw.txt > formatted.md")

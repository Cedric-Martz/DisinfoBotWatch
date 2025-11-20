#!/bin/bash

rm -rf ./outputs/network.*
uv run python main.py
./run.sh
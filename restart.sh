#!/bin/bash

# This script remove network files, then, run script run_analysis.sh and run_dashboard.sh
rm -rf ./outputs/network.*
./run_analysis.sh
./run_dashboard.sh

#!/bin/bash

# Setup local development environment for IDE support
echo "Setting up local Python virtual environment for IDE support..."

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

echo "Virtual environment created at .venv/"
echo "To activate: source .venv/bin/activate"
echo "Configure your IDE to use: $(pwd)/.venv/bin/python"

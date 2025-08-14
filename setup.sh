#!/bin/bash

echo "========================================"
echo "Smart Contract CI/CD Pipeline Setup"
echo "========================================"
echo

echo "Installing dependencies..."
npm install

echo
echo "Compiling contracts..."
npx hardhat compile

echo
echo "Running tests..."
npm test

echo
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Copy .env.example to .env"
echo "2. Edit .env with your API keys"
echo "3. Push to GitHub to trigger CI/CD"
echo
echo "Happy coding! 🚀" 
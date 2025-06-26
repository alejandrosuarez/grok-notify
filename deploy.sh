#!/bin/bash
# Install dependencies
echo "Installing dependencies..."
npm install

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  git remote add origin git@github.com:alejandrosuarez/grok-notify.git # Replace with your GitHub repo URL
fi

# Commit changes
echo "Committing changes..."
git add .
git commit -m "Initial deploy to Vercel"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo "Deployment to GitHub complete! Now deploy to Vercel via the Vercel dashboard."
#!/bin/bash
# Quick fix script to generate Prisma client

echo "Generating Prisma client..."
cd prisma
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully!"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

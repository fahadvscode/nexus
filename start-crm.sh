#!/bin/bash

echo "🚀 Starting Shield CRM..."
echo "================================"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the client-shield-crm-main directory"
    echo "💡 Try: cd client-shield-crm-main && ./start-crm.sh"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "💡 Please start Docker Desktop and try again"
    exit 1
fi

echo "🔧 Starting Supabase database..."
npx supabase start

if [ $? -eq 0 ]; then
    echo "✅ Database started successfully"
    echo ""
    echo "🌐 Starting development server..."
    echo "📱 CRM will be available at: http://localhost:8083"
    echo "🗄️  Database admin at: http://localhost:54323"
    echo ""
    echo "💡 For real phone calls, run 'ngrok http 54321' in another terminal"
    echo ""
    echo "🎯 Press Ctrl+C to stop the CRM"
    echo ""
    
    # Start the development server
    npm run dev
else
    echo "❌ Failed to start Supabase database"
    echo "💡 Try running: npx supabase stop && npx supabase start"
    exit 1
fi 
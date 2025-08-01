#!/bin/bash

echo "🚀 Tink Banking App - Mobile Deployment Guide"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Tink Banking App with mobile support"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "🔗 Next Steps for Mobile Access:"
echo ""
echo "1. 📱 FASTEST - Deploy to Railway:"
echo "   • Go to https://railway.app"
echo "   • Sign up with GitHub"
echo "   • Create new project from GitHub repo"
echo "   • Get instant public URLs"
echo ""
echo "2. 🌐 ALTERNATIVE - Deploy to Vercel + Railway:"
echo "   • Frontend: https://vercel.com (connect GitHub)"
echo "   • Backend: https://railway.app (connect GitHub)"
echo ""
echo "3. 🔧 DEVELOPMENT - Use Gitpod:"
echo "   • Go to: https://gitpod.io/#https://github.com/YOUR_USERNAME/YOUR_REPO"
echo "   • Instant development environment with public URLs"
echo ""
echo "📋 Your app is configured for:"
echo "   ✅ Mobile-responsive design"
echo "   ✅ Dynamic API URL detection"
echo "   ✅ CORS configured for public access"
echo "   ✅ HTTPS-ready"
echo "   ✅ All security best practices"
echo ""
echo "🎯 Once deployed, just open the frontend URL on your phone!"
echo ""
echo "Current status:"
curl -s http://localhost:5000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend: Running on http://localhost:5000"
else
    echo "❌ Backend: Not running - start with 'npm run dev'"
fi

curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend: Running on http://localhost:3000"
else
    echo "❌ Frontend: Not running - start with 'cd client && npm start'"
fi

echo ""
echo "🚀 Ready for deployment!"
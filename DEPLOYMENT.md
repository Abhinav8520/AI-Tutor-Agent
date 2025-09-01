# Render.com Deployment Guide

## 🚀 Quick Deploy to Render

### Prerequisites
- GitHub repository with your code
- OpenAI API key
- Firebase configuration

### Step 1: Sign Up for Render
1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account

### Step 2: Deploy Backend (FastAPI)
1. In Render Dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ai-tutor-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m backend.api.main`
   - **Plan**: Free

5. Add Environment Variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `API_HOST`: `0.0.0.0`
   - `API_PORT`: `10000`
   - `DEBUG`: `false`

6. Click "Create Web Service"

### Step 3: Deploy Frontend (React)
1. In Render Dashboard, click "New +"
2. Select "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ai-tutor-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free

5. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-name.onrender.com`
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID
   - `VITE_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID

6. Click "Create Static Site"

### Step 4: Update Backend URL
After backend deploys, copy its URL and update the frontend's `VITE_API_URL` environment variable.

### Step 5: Test Your Deployment
- Backend: `https://your-backend-name.onrender.com/health`
- Frontend: `https://your-frontend-name.onrender.com`

## 🔧 Troubleshooting

### Common Issues:
1. **Build fails**: Check build logs for missing dependencies
2. **CORS errors**: Backend CORS is already configured
3. **Environment variables**: Ensure all required variables are set
4. **File uploads**: Works with Render's ephemeral storage

### File Storage Note:
- Render uses ephemeral storage (files are lost on restart)
- For production, consider using S3 for file storage
- Current setup works for testing and development

## 📊 Free Tier Limits
- **Backend**: 750 hours/month
- **Frontend**: Unlimited
- **Bandwidth**: 100GB/month
- **Perfect for**: Development, testing, small projects

## 🎉 Success!
Your AI Study Tutor will be live at your frontend URL! 
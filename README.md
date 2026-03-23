# 👗 AI Virtual Try-On Studio

A modern, AI-powered virtual try-on application built with React, Tailwind CSS, and the Google Gemini API. This project allows users to upload their photos and virtually "try on" different clothing items using advanced AI image processing.

## 🚀 Quick Start (Local Development)

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd <project-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   - Create a file named `.env` in the root directory.
   - Add your Gemini API Key:
     ```env
     GEMINI_API_KEY=your_api_key_here
     ```
   - *Note: You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).*

4. **Run the app:**
   ```bash
   npm run dev
   ```

## 🌐 Deployment (Making it Live)

When you push this code to GitHub and host it (e.g., on Vercel or Netlify), you must add your API key to the hosting provider's dashboard.

### 📍 Where to add the API Key:

#### **On Vercel:**
1. Go to your **Vercel Dashboard** and select your project.
2. Click the **Settings** tab at the top.
3. Select **Environment Variables** from the left sidebar.
4. In the **Key** field, type: `GEMINI_API_KEY`
5. In the **Value** field, paste your API key from Google AI Studio.
6. Click **Add** and then **Redeploy** your project.

#### **On Netlify:**
1. Go to your **Netlify Dashboard** and select your site.
2. Go to **Site configuration** > **Environment variables**.
3. Click **Add a variable** > **Add a single variable**.
4. Enter `GEMINI_API_KEY` as the key and your API key as the value.
5. Click **Create** and trigger a new deploy.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite
- **Styling:** Tailwind CSS, Framer Motion (Animations)
- **Icons:** Lucide React
- **AI Engine:** Google Gemini 1.5 Flash

## 📝 Project Structure
- `src/App.tsx`: Main application logic and UI.
- `src/services/tryOnService.ts`: AI integration and clothing data.
- `src/index.css`: Custom styling and neon themes.

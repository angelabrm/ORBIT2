# Dashboard Application

This project is a high-performance dashboard built with React 19, Vite 6, and Tailwind CSS 4.

## Deployment on Vercel

To deploy this project on Vercel, follow these steps:

1.  **Push to GitHub/GitLab/Bitbucket**: Ensure your latest changes are committed and pushed to a repository.
2.  **Import to Vercel**:
    - Go to [vercel.com/new](https://vercel.com/new).
    - Connect your git provider and select this repository.
3.  **Configure Environment Variables**:
    - During the import process, add any required environment variables:
        - `GEMINI_API_KEY`: Your Google Gemini API key.
4.  **Build Settings**:
    - Vercel should automatically detect **Vite** as the framework.
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
5.  **Deploy**: Click "Deploy".

## Local Development

```bash
npm install
npm run dev
```

## Features

- **Inline Member Dashboard**: View individual team member details without leaving the page.
- **Role-based Views**: Different perspectives for Leaders, Managers, and Agents.
- **Advanced KPIs**: Average performance, productivity, and adherence tracking.
- **Trend Charts**: Interactive line charts with metric switching.
- **Administrative View**: Track home office rates, attendance, and adherence with calendar integration.

# BreachCheck — Personal Data Exposure Tracker

A privacy-first, highly optimized web application built to check whether your email addresses or passwords have been compromised in known data breaches. 

I designed and developed this project to prioritize both **security** and **user experience (UX)**. By implementing the `k-Anonymity` model, the application securely checks passwords without ever transmitting the full password over the network. The front end is completely custom-built using modern React, featuring zero-dependency micro-animations, glassmorphism UI, and interactive feedback loops.

![Hero Showcase](./docs/hero.png)

## 🚀 Live Demo
**[Launch Data Exposure Tracker](https://jibran-jpeg.github.io/data-exposure-tracker/)**

## ✨ Key Features I Implemented

### 🛡️ Privacy-First Architecture (k-Anonymity)
When checking a password, I made sure the actual password **never leaves the browser**. The application computes a SHA-1 hash locally in the browser and sends only the first 5 characters of the hash to the API. The API returns a list of matching hashes, and the final verification happens locally. Result: Zero trust, zero leakage.

### 🎨 Custom "Vercel-Grade" UI & Micro-interactions
I wanted the frontend to feel extremely premium, so I built a custom design system from scratch using raw CSS and React Hooks:
* **Interactive Spotlight Effect:** A radial gradient glow that precisely tracks mouse movement across the result cards using a custom `onMouseMove` React event tracker.
* **Staggered Animations:** List items and result grid cards enter the view using staggered `animation-delay` calculations, giving a smooth, native iOS-like entrance feel.
* **Glassmorphism:** Leveraging `backdrop-filter: blur()`, semi-transparent backgrounds, and inner glows to give depth to the UI.
* **Smart Placeholders:** Custom React hook to create an auto-typing effect for input fields (e.g., `alex@company.com`, `hello@startup.io`) to make the interface feel alive.

### 🏗️ Complete Responsive Design
The entire DOM structure is designed to behave predictably on any screen. The UI dynamically shifts from a multi-column desktop dashboard to a touch-optimized stacked mobile view, without losing the premium aesthetic.

### 🔐 Built-in Security Tools
Integrated a local password generator with logic that ensures a strict mix of uppercase, lowercase, numbers, and symbols. Added custom hooks to evaluate password strength in real-time.

![Results Showcase](./docs/results.png)

## 💻 Tech Stack

* **Frontend:** React (Vite), Vanilla CSS (Custom Design System), Lucide React (Iconography). No bulky UI libraries (Tailwind, Framer Motion) were used to ensure the lowest bundle size and fastest paint times.
* **Backend:** FastAPI (Python), httpx. Built to act as a secure proxy to securely handle third-party requests and handle rate-limiting.
* **APIs Used:** HaveIBeenPwned (HIBP) REST API, PwnedPasswords API.

## 🛠️ Local Development Setup

If you want to run this project locally, follow these steps:

### 1. Start the Backend Server (FastAPI)
Navigate to the \`/backend\` directory, install the Python requirements, and spin up the server:
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use \`venv\\Scripts\\activate\`
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
\`\`\`

### 2. Start the Frontend Application (React / Vite)
Open a new terminal, navigate to the root directory, install Node dependencies, and start the Vite dev server:
\`\`\`bash
npm install
npm run dev
\`\`\`

The app will become accessible at \`http://localhost:5173\` for remote local testing.

## 🌍 Live Deployment (Production)
The live version of this web app is continuously deployed and available at:

**🔗 [https://jibran-jpeg.github.io/data-exposure-tracker/](https://jibran-jpeg.github.io/data-exposure-tracker/)**

*(Note: In the live demo environment, deterministic local fallback is active to ensure k-Anonymity without exposing backend proxy keys.)*

---

### Reflection and What I Learned
Through this project, I significantly leveled up my understanding of cryptography within the browser (Web Crypto API) and advanced CSS layout architectures. Dealing with asynchronous state while synchronizing complex micro-animations natively taught me a lot about browser performance optimizations.

*Designed & Built by Jibran.*

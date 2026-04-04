# SafeDeliver (Incurion) – AI-Powered Income Protection for Gig Workers

SafeDeliver is an intelligent, full-stack insurtech platform designed to seamlessly protect gig economy workers from lost income due to physical constraints outside of their control.

## Description
Gig workers (delivery drivers, rideshare operators, etc.) suffer direct financial hits when uncontrollable external forces like severe weather or city-wide incidents (lockdowns/curfews) halt operations. 
SafeDeliver solves this by calculating dynamically adjusted insurance premiums using a backend ML service (Random Forest Model) based on personal behavior and real-time physical telemetry. If real-world disruptions are detected, the system bypasses bureaucratic manual reviews and processes automated claim validations to execute immediate payouts.

## Features
- **User Registration:** Captures critical data including city, income, and past behavioral traits.
- **Dynamic Premium Pricing:** Underwriting is scored in Python via Scikit-Learn utilizing tiered ML risk models.
- **Real-time API Integration (Weather + SERP):** Integrates OpenWeatherMap to intercept extreme conditions, and taps into Google News via SerpAPI enforcing real-time phrase-mapping (e.g., "heavy flooding") to validate active disaster declarations.
- **Automated Triggers:** Tri-pronged system mapping external APIs and AI Risk thresholds `> 0.7`.
- **Smart Claim System:** ZERO-TOUCH validation framework bypassing the manual claim button completely upon disaster hits.
- **Interactive Dashboard:** Beautiful React frontend mapping metrics cleanly in real-time.

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **AI Engine:** Python + Flask + Scikit-learn
- **APIs:** OpenWeatherMap API, SERP API

## System Flow
User → Input city → Fetch APIs → AI risk → Premium → Trigger → Claim

## How to Run

### Backend Setup
```bash
cd backend
npm install
# Ensure you copy .env.example to .env and input your API keys
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### AI Setup
```bash
cd aip
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Demo Explanation
*To the Hackathon Judges:*
SafeDeliver completely bypasses manual claims processing. When you type in a city, the Node Engine simultaneously queries weather radars and phrases live Google News algorithms. The Python ML Model synthesizes everything utilizing a Random Forest architecture to securely assign a hyper-accurate premium rate. If an active disaster drops down into the dashboard telemetry via our strict phrase-boundary matchers or extreme bounds crossing, the `disruption` sequence fires immediately and safely triggers a completely autonomous, Zero-Touch claim approval cycle directly to the worker.

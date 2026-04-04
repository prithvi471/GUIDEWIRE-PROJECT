const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const SERP_API_KEY = process.env.SERP_API_KEY;
const PORT = process.env.PORT || 5001;

// Database Simulation Array
const inMemoryDB = {
    users: {}
};

const encodeWeather = (condition) => {
    const conditionStr = condition.toLowerCase();
    if (conditionStr.includes('clear')) return 0;
    if (conditionStr.includes('cloud')) return 1;
    if (conditionStr.includes('rain') || conditionStr.includes('drizzle')) return 2;
    if (conditionStr.includes('snow')) return 3;
    if (conditionStr.includes('storm') || conditionStr.includes('extreme')) return 4;
    return 1;
};

const getLocationRisk = (city) => {
    const cityLower = city.toLowerCase();
    const tier1 = ['new york', 'london', 'tokyo', 'mumbai', 'delhi', 'bangalore'];
    const tier2 = ['seattle', 'singapore', 'berlin', 'chennai', 'hyderabad', 'pune'];
    if (tier1.includes(cityLower)) return 1;
    if (tier2.includes(cityLower)) return 2;
    return 3;
};

// --------------------------------------------------------------------------
// ADVANCED CLAIM VALIDATION ENGINE (WEATHER + SERP NEWS)
// --------------------------------------------------------------------------
async function fetchSignals(city) {
    console.log("City received:", city);
    let temp = 20;
    let weatherStr = 'Clear';
    let weather_alert = 'Normal';
    let serp_status = 'Safe';
    let disruption_weather = 0;
    let disruption_news = 0;

    // Phase 1: Weather API Analysis
    if (WEATHER_API_KEY && WEATHER_API_KEY !== 'your_weather_api_key') {
        try {
            console.log("Calling Weather API for:", city);
            const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
            temp = weatherRes.data.main.temp;
            weatherStr = weatherRes.data.weather[0].main;
        } catch (err) {
            console.warn("Weather API failed, using default Clear conditions.");
        }
    } else {
        console.warn("No Weather API key provided, using default Clear conditions. Random overrides disabled.");
    }

    const weatherCode = encodeWeather(weatherStr);
    
    // Weather Alert Logic
    const riskyWeatherConditions = ['Rain', 'Thunderstorm', 'Extreme'];
    if (riskyWeatherConditions.some(condition => weatherStr.toLowerCase().includes(condition.toLowerCase()))) {
        weather_alert = 'Risky';
        disruption_weather = 1;
    }

    // Phase 2: SERP News/Intel Analysis
    if (SERP_API_KEY && SERP_API_KEY !== 'your_serp_api_key') {
        try {
            console.log("Calling SERP API for:", city);
            const serpRes = await axios.get("https://serpapi.com/search", {
                params: {
                    q: `flood OR curfew OR lockdown OR cyclone OR disaster in ${city}`,
                    api_key: SERP_API_KEY,
                    tbm: 'nws',
                    tbs: 'qdr:w'
                }
            });
            const resultsData = serpRes.data.news_results || serpRes.data.organic_results || [];
            const newsText = resultsData.map(item => `${item.title || ''} ${item.snippet || ''}`).join(" ").toLowerCase();
            
            const phrases = [
                "curfew imposed",
                "curfew in effect",
                "lockdown announced",
                "lockdown imposed",
                "flood warning issued",
                "heavy flooding",
                "cyclone warning",
                "cyclone alert",
                "evacuation ordered",
                "disaster declared"
            ];
            
            let matchCount = 0;
            phrases.forEach(phrase => {
                if (newsText.includes(phrase)) {
                    matchCount++;
                }
            });
            
            if (matchCount >= 1) {
                serp_status = 'Critical Zone';
                disruption_news = 1;
            } else {
                serp_status = 'Safe';
                disruption_news = 0;
            }

            console.log("SERP Text:", newsText.slice(0, 300));
            console.log("Matched Phrases:", matchCount);
            console.log("SERP Status:", serp_status);
        } catch (err) {
            console.warn("SERP API failed, keeping safe status.");
        }
    } else {
        console.warn("No SERP API key provided, skipping news intel validation.");
    }

    // Phase 3: Combine Signals
    const disruption = Math.max(disruption_weather, disruption_news);

    console.log("Weather API:", weatherStr);
    console.log("Final disruption:", disruption);

    // Determine Validation Reason
    let triggerReason = disruption === 1 ? "Disruption detected via weather/news" : "No disruption detected";

    return { city, temp, weatherStr, weatherCode, disruption, triggerReason, weather_alert, serp_status };
}

// --------------------------------------------------------------------------
// SUBSCRIPTION PLATFORM ENDPOINTS
// --------------------------------------------------------------------------

app.post('/register', (req, res) => {
    const { name, city, weekly_income, loan, claims } = req.body;
    const userId = Date.now().toString();

    inMemoryDB.users[userId] = {
        id: userId,
        name,
        city,
        weekly_income: parseFloat(weekly_income),
        loan: loan ? 1 : 0,
        claims: parseInt(claims) || 0,
        wallet_balance: 0,
        transactions: [],
        policy: null,
        claim: null
    };

    res.json({ id: userId });
});

app.post('/calculate', async (req, res) => {
    try {
        const { userId, preview } = req.body;
        let user;
        if (preview) {
             user = { city: preview.city, loan: preview.loan ? 1 : 0, claims: parseInt(preview.claims) || 0, weekly_income: parseFloat(preview.income) || 1000 };
        } else {
             user = inMemoryDB.users[userId];
             if (!user) return res.status(404).json({ error: 'User not found.' });
        }

        const { temp, weatherStr, weatherCode, disruption } = await fetchSignals(user.city);
        const location_risk = getLocationRisk(user.city);

        const aiPayload = {
            weather: weatherCode,
            temperature: temp,
            disruption,
            loan: user.loan,
            claims: user.claims,
            location_risk
        };

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict`, aiPayload);
        const risk_probability = aiResponse.data.risk_probability;

        // -------------------------------------------------------------
        // ML PREMIUM CALCULATION LOGIC
        // -------------------------------------------------------------
        // 1. Base Payout is secured at 50% of the user's weekly income.
        // 2. Premium scales dynamically reacting directly to the ML risk_probability.
        // 3. A 10% base-floor buffer (+0.1) and flat 20% operational margin (*1.2) are applied.
        const payout = user.weekly_income * 0.5;
        const premium = payout * (risk_probability + 0.1) * 1.2;

        user.policy = {
            premium: parseFloat(premium.toFixed(2)),
            risk_probability: parseFloat(risk_probability.toFixed(4)),
            explanation: "Premium dynamically adjusted using ML risk score and real-time environmental signals",
            breakdown: {
                weekly_income: user.weekly_income,
                payout: parseFloat(payout.toFixed(2)),
                weather: weatherStr,
                disruption,
                location_risk
            }
        };

        res.json(user.policy);

    } catch (error) {
        console.error("Calculate Error:", error.message);
        res.status(500).json({ error: 'AI Error or Internal Issue' });
    }
});

app.post('/add-money', (req, res) => {
    const { userId, amount } = req.body;
    const user = inMemoryDB.users[userId];
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.wallet_balance += parseFloat(amount);
    user.transactions.push({
        type: 'CREDIT',
        amount: parseFloat(amount),
        date: new Date().toLocaleDateString(),
        desc: 'Funds Added'
    });

    res.json({ balance: user.wallet_balance });
});

app.get('/dashboard/:id', async (req, res) => {
    const user = inMemoryDB.users[req.params.id];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Live monitor signals for dashboard
    const { weatherStr, disruption, weather_alert, serp_status } = await fetchSignals(user.city);

    let finalDisruption = disruption;
    if (user.policy && user.policy.risk_probability > 0.7) {
        finalDisruption = 1;
    }

    res.json({
        user_summary: {
            name: user.name,
            city: user.city,
            weekly_income: user.weekly_income
        },
        insurance_details: user.policy,
        activity: {
            wallet_balance: user.wallet_balance,
            transactions: user.transactions.slice(-10) // Return last 10
        },
        risk_monitoring: {
            current_weather: weatherStr,
            disruption_status: finalDisruption,
            weather_alert: weather_alert,
            serp_status: serp_status,
            risk_probability: user.policy?.risk_probability || 0
        },
        claim: user.claim
    });
});

app.post('/simulate-week', async (req, res) => {
    const { userId } = req.body;
    const user = inMemoryDB.users[userId];
    if (!user || !user.policy) return res.status(400).json({ error: 'Invalid user or policy' });

    const premiumCost = user.policy.premium;

    // Deduct Weekly Premium
    if (user.wallet_balance >= premiumCost) {
        user.wallet_balance -= premiumCost;
        user.transactions.push({
            type: 'DEBIT',
            amount: premiumCost,
            date: new Date().toLocaleDateString(),
            desc: 'Weekly Premium Auto-Deduction'
        });
    } else {
        user.transactions.push({
            type: 'FAILED',
            amount: premiumCost,
            date: new Date().toLocaleDateString(),
            desc: 'Deduction Failed (Low Funds)'
        });
    }

    res.json({ success: true, user });
});

/**
 * Advanced Claim System Endpoint
 * Validates external criteria via fetchSignals framework logic.
 */
app.post('/claim', async (req, res) => {
    const { userId, city, weekly_income } = req.body;
    let targetCity = city;
    let targetIncome = weekly_income;
    let user = null;

    if (userId && inMemoryDB.users[userId]) {
        user = inMemoryDB.users[userId];
        targetCity = user.city;
        targetIncome = user.weekly_income;
    }

    if (!targetCity || targetIncome === undefined) {
        return res.status(400).json({ error: 'Missing critical information for logic resolution parameters.' });
    }

    // -----------------------------------------------------------------
    // SMART CLAIM VALIDATION LOGIC
    // -----------------------------------------------------------------
    // Phase 1 (Weather): Checks OpenWeatherMap for extreme physical elements (Rain, Storms).
    // Phase 2 (SERP): Validates Google News text for active disruption phrases ("curfew", "flood").
    // Phase 3 (AI ML): Overrides and triggers if Random-Forest location bounds cross > 0.7 risk. 
    // IF any of these 3 phases register extreme volatility (disruption === 1), process payout automatically!
    const { weatherStr, disruption, triggerReason } = await fetchSignals(targetCity);

    let finalDisruption = disruption;
    let baseReason = triggerReason;

    if (user && user.policy && user.policy.risk_probability > 0.7 && finalDisruption === 0) {
        finalDisruption = 1;
        baseReason = "AI Risk Threshold > 0.7";
    }

    let claim_status, payout, reason;

    if (finalDisruption === 1) {
        claim_status = "Approved";
        payout = parseFloat(targetIncome) * 0.5;
        reason = "Auto-validated claim triggered due to detected disruption";
    } else {
        claim_status = "Rejected";
        payout = 0;
        reason = "No disruption detected";
    }

    // If User context, store and manage wallet directly
    if (user) {
        user.claim = { status: claim_status, amount: payout, reason, weather: weatherStr, disruption: finalDisruption };
        if (claim_status === "Approved") {
            user.wallet_balance += payout;
            user.transactions.push({
                type: 'CREDIT',
                amount: payout,
                date: new Date().toLocaleDateString(),
                desc: 'Claim Payout Direct Remittance'
            });
        }
    }

    res.json({
        claim_status,
        payout,
        reason,
        weather: weatherStr,
        disruption
    });
});

app.listen(PORT, () => {
    console.log(`Smart Server running on port ${PORT}`);
});

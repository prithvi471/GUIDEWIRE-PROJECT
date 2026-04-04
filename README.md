Incurion – AI Powered Income Protection System for Gig Workers

Incurion is an intelligent insurance platform designed to protect gig workers from income loss caused by real world disruptions such as adverse weather, city level emergencies, and operational risks.

The system uses machine learning and real time external data to dynamically calculate insurance premiums and automatically validate claims without manual intervention.

---

Problem Statement

Gig workers such as delivery agents and drivers rely on consistent daily earnings. However, their income is highly vulnerable to:

Weather disruptions such as rain, storms, or extreme heat
City level restrictions such as curfews or lockdowns
Operational and behavioral risks

Traditional insurance systems are static, slow, and not tailored to such dynamic conditions.

---

Solution Overview

Incurion introduces a dynamic, AI driven system that:

Calculates personalized premiums based on real time risk
Monitors environmental and contextual signals continuously
Automatically validates claims using data driven triggers
Ensures both user protection and system profitability

---

System Architecture and Workflow

Step 1
User enters details such as city, weekly income, loan status, and past claims

Step 2
Frontend sends this data to backend APIs

Step 3
Backend fetches real time data from external services
Weather API provides current weather condition and temperature
SERP API provides contextual news signals

Step 4
AI model processes structured inputs and predicts a risk probability between 0 and 1

Step 5
Dynamic premium is calculated using a mathematical pricing model

Step 6
System continuously evaluates disruption triggers

Step 7
If disruption is detected, claim is automatically validated and payout is issued

---

Machine Learning Model

The system uses a Random Forest Regression model trained on structured features:

Weather condition
Temperature
Disruption signals
Loan history
Past claims
Location risk category

The model outputs a continuous value:

Risk Probability R such that 0 less than or equal to R less than or equal to 1

This value represents the likelihood of income disruption.

---

Dynamic Premium Calculation (Mathematical Model)

The premium is calculated using a risk adjusted pricing function.

Let:

I be the weekly income
R be the predicted risk probability
Alpha be the safety factor

---

Step 1: Safety Factor Calculation

The safety factor is dynamically adjusted based on risk:

Alpha equals 0.3 plus 0.7 multiplied by R

This ensures that higher risk users contribute higher premiums.

---

Step 2: Premium Formula

The final premium is calculated as:

Premium equals I multiplied by R multiplied by one plus Alpha

Substituting Alpha:

Premium equals I multiplied by R multiplied by one plus 0.3 plus 0.7 multiplied by R

Premium equals I multiplied by R multiplied by 1.3 plus 0.7 multiplied by R

---

Step 3: Interpretation

Low risk users
Lower R leads to lower premium

High risk users
Higher R increases both risk component and safety factor

This creates a non linear pricing system that ensures fairness and profitability.

---

Example Calculation

Let:

Weekly income I equals 5000
Risk probability R equals 0.6

Step 1
Alpha equals 0.3 plus 0.7 multiplied by 0.6
Alpha equals 0.72

Step 2
Premium equals 5000 multiplied by 0.6 multiplied by one plus 0.72
Premium equals 5000 multiplied by 0.6 multiplied by 1.72
Premium equals 5160

---

Payout Model

When disruption is detected, the system provides compensation.

Let Beta be payout ratio:

Beta equals 0.5

Payout equals I multiplied by Beta

Example
If income is 5000
Payout equals 2500

---

Claim Validation Logic

A claim is approved only if disruption is detected.

Disruption is triggered if any of the following conditions are true:

Weather condition is rain, thunderstorm, or extreme
SERP based phrase detection confirms events such as curfew or lockdown
Risk probability exceeds threshold such as 0.7

If disruption equals 1
Claim is approved

If disruption equals 0
Claim is rejected

---

Automated Trigger System

Trigger 1
Weather based detection

Trigger 2
Event detection using phrase analysis such as
curfew imposed
lockdown announced
flood warning issued

Trigger 3
AI based risk threshold

---

Tech Stack

Frontend
React with Vite and Tailwind CSS

Backend
Node.js with Express

AI Service
Python with Flask and Scikit learn

APIs
OpenWeatherMap API for real time weather
SERP API for contextual event detection

---

How to Run the Project

Clone the repository

Setup environment variables in a .env file

Run backend
npm install
node server.js

Run frontend
npm install
npm run dev

Run AI service
python -m venv venv
activate environment
pip install requirements
python app.py

---

Key Innovations

AI driven dynamic pricing instead of fixed premiums
Real time disruption detection using external APIs
Automated claim validation system
Fraud resistant architecture
Scalable microservice based design

---

Future Scope

Integration with real financial systems
Advanced disaster detection APIs
Blockchain based claim verification
Multi region scalability

---

Author

Prithvi Tomar
BTech CSE Big Data Analytics
SRM Institute of Science and Technology

---

Conclusion

Incurion transforms traditional insurance into a dynamic, intelligent, and real time financial protection system tailored for gig workers. It ensures fairness, responsiveness, and sustainability through a combination of AI and real world data.

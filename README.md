# GUIDEWIRE-PROJECT
A PROJECT SOLVING PROBLEM FOR ALL THE GIG WORKER WHO ARE FORCED TO SIT AT HOME DURING UNFORSEEN CIRCUMSTANCES.LET'S MAKE INSURANCE PLATFLORM FOR GIG WORKERS TO SECURE .
# GigShield
### Income protection for E-commerce Platform delivery workers

When a flood or curfew  or any other circumstances like riots etc .hits a delivery zone, the worker loses their entire shift block with zero recourse. GigShield detects the disruption automatically, verifies it, and sends a payout to their UPI — without them doing anything.

## Who we're building for

Ravi — Amazon partner,Chennai.He earns per shift block not per hour. One disrupted zone means one entire block gone — immediately and completely. He uses apps comfortably,reads Tamil,and has no financial safety net.
We chose Amazon Flex because the income loss is binary and verifiable. Unlike food delivery where earnings drop gradually, a blocked zone means the full block is lost — a clean parametric trigger.even it is hard to access them as they are paid on delivery basis meanwhile amazon workers paid on weekly basis so for easy ensurity of data we have choosen ecommerce

Persona scenarios and workflow

**Flood scenario** — Ravi's morning zone gets waterlogged. Our system detects the weather alert, cross-checks platform order volume in that zone, and automatically fires the claim. Money hits his UPI before the shift would have ended.

**Curfew scenario** — A sudden curfew is declared. We pick it up via news monitoring, confirm platform activity in the zone has dropped, and trigger payouts for all policyholders in that area. Ravi does nothing.

**Workflow:**
```
Sign up → choose plan → pay weekly premium
System monitors signals every 30 min
Disruption detected → signals verified → fraud checks run
Clean → instant payout | Uncertain → SMS confirm | Fraud → denied
Trust score updated → affects next week's premium
```
<img width="545" height="658" alt="image" src="https://github.com/user-attachments/assets/11e63184-bed9-4ef5-90bd-26901c43f522" />

---

## What we cover

Income lost when an external event makes delivery impossible. Nothing personal, mechanical, or self-caused.

| Covered | Not covered |
|---|---|
| Floods, heavy rain, cyclones | Road accidents |
| Extreme heat, severe pollution | Bike or vehicle repairs |
| Government curfew, bandh, strikes | Health issues |
| Security lockdown near warehouse | Worker's own choice to stop |
| Platform outage beyond threshold | Platform disputes |

---

## Two plans

**Fixed plan** — same payout every verified disruption, same premium every week. Worker knows exactly what they signed up for. Best for those who want simplicity.

**Dynamic plan** — premium adjusts based on zone risk and how often the worker follows our safety alerts. Lower risk or better compliance means lower cost. Best for workers willing to engage with the system.

Both plans auto-renew weekly and auto-initiate claims — workers never file anything manually for standard events.

---

## Weekly premium model

Base premium is a small flat weekly amount adjusted by two things: the historical disruption frequency of the worker's zone (from weather data) and their compliance score — whether they follow our risk alerts.

Workers who heed our "leave this zone" alerts pay less next week. Workers who repeatedly ignore them pay a bit more. This rewards safe behaviour and keeps premiums honest.

they will be assigne one score like cibil score .like we will ask worker to leave that region and deliver to other region if this continues for long time if he does it well and good and if not his score will be affected which will have impact on it's future claims

---

## Parametric triggers

We don't wait for workers to report problems. Our system polls signals every half hour and fires automatically.

**Auto-trigger (one source enough):** Rainfall or flood threshold, extreme heat index, severe AQI — all from OpenWeatherMap.

**Two-source required:** Curfew or bandh needs news API keyword detection plus platform order volume collapse in the same zone. Either signal alone isn't enough.

**Human-confirmed (fast SLA):** Security lockdowns or terrorism — we detect the anomaly automatically but a team member confirms before releasing payment.

---
<img width="590" height="688" alt="image" src="https://github.com/user-attachments/assets/a9299281-6173-45db-8fde-4b07e88342ff" />


## Web vs mobile — our choice

We built a mobile-optimised web app, not a native app. No download, no storage needed, works on low-end Android via a link sent over SMS.

All critical alerts go via SMS, not push notifications. SMS works on weak data connections — exactly during the floods and curfews we insure against. Alerts are sent in Tamil because that's what gets read.

---
## AI and ML integration

**Premium model** — gradient boosting (scikit-learn) trained on zone risk features and compliance history. We chose this over complex models because every premium change can be explained to the worker in plain language via SMS.

**Fraud detection layer one** — rule engine running in milliseconds. Checks GPS vs cell tower mismatch, phone movement (stationary = suspicious), home WiFi visible in scan, mock location API active, and whether platform order volume in the zone has actually dropped.

**Fraud detection layer two** — isolation forest (scikit-learn) on claim patterns. Detects abnormal claim spikes from one zone in a short window, shared device fingerprints across claimants, and frequency anomalies per worker.

**Trust score** — each worker has a running score. High score means instant payout. Low score means we ask for SMS confirmation first. Builds over time so honest workers get faster, easier claims.

---

## Adversarial defense and anti-spoofing

The realistic attack is workers using GPS spoofing apps to fake being in a disruption zone. We counter this by checking five signals simultaneously — GPS vs cell tower location, phone movement patterns, home WiFi visibility, mock location API status, and actual platform order volume in the zone. A genuine stranded worker passes all five. A fraudster at home fails multiple.

For coordinated rings — mass simultaneous claims from one zone in a short window trigger an automatic pause and review. Real disruptions cause gradual claim increases. Telegram-coordinated fraud causes spikes.

**Three outcomes, never a binary deny** — auto-approve (all clear), soft hold with SMS confirmation in Tamil (mixed signals, pays within a few hours), hard deny with appeal reference (unambiguous fraud). Honest workers caught by network drops during bad weather get the benefit of the doubt based on their trust score.

---

## Tech stack

 Layer     Tool 
 Backend - Flask (Python) 
 Frontend - HTML, CSS, basic JS 
 Database - SQLite 
 ML - using scikit-learn 
 Weather - OpenWeatherMap free tier
 SMS - Twilio free trial 
 Payments - Razorpay test mode 
 Charts - Chart.js 

Runs with `python app.py`.

---

## What's real vs mocked

**Working now** — Flask app, SQLite schema, OpenWeatherMap integration, premium logic, fraud rules, navigable frontend.

**Mocked with real architecture** — platform order volume (JSON fixture), sensor data (synthetic generator), ML models (synthetic training data), payments (Razorpay sandbox).

---

## Development plan

**Phase one** — persona research, architecture design, fraud defense strategy, basic Flask app running locally. This README.

**Phase two** — end-to-end registration and claim flow, live weather triggers, Razorpay sandbox payout, Twilio SMS working in Tamil and English.

**Phase three** — admin dashboard with Chart.js (zone heatmap, claim trends, weekly forecast), full fraud model integrated, trust score live, end-to-end demo video showing automated claim and payout.

---

## Extra things worth mentioning

Tamil/Multiple language support across app and SMS is a core requirement, not a bonus — it directly affects whether workers read and act on safety alerts, which feeds our compliance loop and reduces claims.

The admin dashboard surfaces a weekly disruption forecast by zone, giving insurers a live view of risk exposure before claims happen — not just after.

---


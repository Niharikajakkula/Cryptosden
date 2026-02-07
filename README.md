# Cryptosden

Cryptosden is a **learning-focused full-stack MERN application** built to understand how cryptocurrency platforms are structured internally.  
The project focuses on **backend API design, authentication, algorithmic data processing, and frontend–backend integration**, rather than production deployment.

This repository represents my **hands-on exploration of full-stack development and open-source practices**.

---

## Project Scope & Disclaimer

This project is created **strictly for educational purposes**.

- No real cryptocurrency trading is performed  
- Wallet balances, orders, and transactions are **simulated**
- Market data is fetched from public APIs (CoinGecko)
- No real financial assets or personal data are involved

---

## Overview

The goal of Cryptosden was to move beyond tutorials and build a **complete system end-to-end**:

- Designing REST APIs
- Implementing authentication flows
- Structuring database schemas
- Applying basic mathematical logic to market data
- Connecting frontend and backend in a real project

The focus is on **understanding system design and data flow**, not UI polish or scale.

---

## Key Features

- User authentication using JWT
- Role-based access control (User / Admin)
- Simulated cryptocurrency wallets and transactions
- Portfolio overview and basic analytics
- Community discussion posts and polls
- Periodic market data fetching from CoinGecko

---

## Algorithmic & Mathematical Components

To better understand how cryptocurrency metrics are derived, I implemented **simple rule-based and mathematical scoring logic**.

### Trust Score (Experimental)

A custom scoring function that combines:
- Market capitalization
- 24h trading volume
- Price volatility

The intent was to learn how **multiple indicators can be normalized and combined** into a single metric for comparison.

> This is an experimental learning implementation, not a financial recommendation system.

---

### Emotional Volatility Index (EVI)

A basic metric designed to explore **market sentiment patterns** using:
- Price change percentage
- Volume-to-market-cap ratio

This helped me understand:
- Normalization
- Threshold-based logic
- Interpreting numerical signals from real-world data

---

## Tech Stack

### Frontend
- React
- JavaScript
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

---

## Project Structure


  cryptosden/
├── server/
│ ├── routes/
│ ├── controllers/
│ ├── models/
│ ├── middleware/
│ └── server.js
├── client/
│ ├── src/
│ ├── components/
│ ├── pages/
│ └── contexts/
└── README.md


The backend handles authentication, API logic, and database interaction,  
while the frontend consumes these APIs and manages UI state.

---

## What I Built & Learned

Through this project, I independently worked on:

- Designing RESTful APIs using Express
- Implementing JWT-based authentication and authorization
- Structuring MongoDB schemas and relationships
- Fetching and processing external API data
- Applying mathematical logic to real datasets
- Connecting frontend and backend in a full-stack application
- Writing documentation and organizing code

This project helped me understand how **large applications are broken into smaller, manageable modules**.

---

## How to Run Locally

1. Clone the repository
   ```bash
   git clone <repo-url>
Install dependencies

npm install
Configure environment variables in a .env file

Start backend server

npm run server
Start frontend client

npm start

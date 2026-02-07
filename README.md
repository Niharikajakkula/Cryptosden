# Cryptosden

Cryptosden is a learning-focused, full-stack MERN application built to understand how
cryptocurrency platforms are architected, including authentication, simulated trading,
portfolio tracking, and community features.

---

## Project Scope & Disclaimer
This project is created **for educational purposes only**.

- It does **not** perform real cryptocurrency trading
- Wallets, balances, and transactions are **simulated**
- Security features are implemented to understand concepts, not for production use
- No real financial data or assets are involved

---

## Overview
Cryptosden was built to explore real-world full-stack development workflows using the
MERN stack. The focus of this project is on backend API design, authentication flows,
role-based access, frontend integration, and overall system structure rather than UI
polish or production deployment.

---

## Key Features
- User authentication using JWT
- Role-based access (User / Trader / Admin)
- Simulated cryptocurrency wallets and transactions
- Basic trading logic (market / limit style orders – simulated)
- Portfolio overview and basic analytics
- Community discussion posts and polls
- Admin dashboard for moderation and user management
- Periodic market data fetched from public APIs (CoinGecko)

---

## Tech Stack
**Frontend**
- React
- JavaScript
- Tailwind CSS
- Axios

**Backend**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT-based authentication

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


The backend handles API logic, authentication, and database interaction, while the
frontend consumes these APIs and manages UI state.

---

## What I Built & Learned
Through this project, I independently worked on:

- Designing RESTful APIs using Express
- Implementing JWT-based authentication and authorization
- Structuring MongoDB schemas and relationships
- Connecting frontend and backend using Axios
- Managing application state in React
- Understanding how large applications are broken into modules
- Improving code organization and documentation

This project helped me move beyond tutorials and understand how full-stack systems work
end-to-end.

---

## How to Run Locally
1. Clone the repository
2. Install dependencies:
npm install

3. Configure environment variables in a `.env` file
4. Start the backend server:
npm run server

5. Start the frontend client:
npm start


---

## Future Improvements
- Add unit and integration tests
- Improve error handling and validation
- Enhance API documentation
- Refactor services for better scalability
- Improve UI/UX consistency

---

## Open-Source Note
This repository is structured to follow open-source best practices and is open to
learning-oriented improvements, documentation enhancements, and refactoring.

---

## License
MIT License

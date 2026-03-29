# Spendly – Expense Habit Coach

A React Native personal finance app designed to help users take control of their spending, build better financial habits, and achieve their savings goals.

## Overview

Spendly provides a comprehensive expense management solution with real-time budget tracking, intelligent spending analysis, and actionable financial insights. Whether you're optimizing your monthly budget or understanding long-term spending patterns, Spendly adapts to your financial goals.

## Key Features

- **Budget Tracking** – Set category-based budgets and monitor spending in real-time
## Project Structure

### Frontend (`/frontend`)
- **React Native + Expo** – Cross-platform mobile development
- **Redux / Zustand** – Predictable state management for complex financial data flows
- **React Native Paper** – Material Design components for consistent UI
- **React Native Chart Kit** – Data visualization for expense trends and budget analytics
- **Axios** – HTTP client for API communication

### Backend (`/backend`)
- **Node.js + Express** – RESTful API server for user authentication and data management
- **Firebase Realtime Database** – Cloud storage for user profiles and expense records
- **JWT Authentication** – Secure token-based user sessions
- **Grok AI Chatbot Integration** – Intelligent financial assistant powered by Grok AI

### Grok AI Chatbot Features
The integrated Grok-based AI chatbot provides:
- **Spending Analysis** – Natural language queries about expense patterns and habits
- **Budget Recommendations** – AI-driven suggestions to optimize spending categories
- **Financial Advice** – Personalized guidance on savings strategies and financial goals
- **Anomaly Detection** – Alerts users about unusual spending behavior
- **Conversational Interface** – Chat-based interactions for intuitive financial insights
- **Goal Planning** – Helps users define and track custom financial objectives

- **Monthly Summary** – View detailed expense breakdowns with visual analytics
- **Budget vs Actual** – Compare planned vs actual spend to identify variances
- **Spending Patterns** – Discover trends and anomalies in your financial behavior
- **Habit Detection** – Get insights on recurring spending habits and their impact
- **Financial Health Score** – Receive a personalized score based on savings rate and budget adherence
- **Savings Rate Calculation** – Automatically compute monthly savings as a percentage of income
- **Budget Utilization Metrics** – Track how efficiently you're using allocated budgets

## Tech Stack

- **Frontend:** React Native + Expo
- **State Management:** Redux / Zustand
- **Database:** SQLite (local) / Firebase Realtime Database
- **UI Framework:** React Native Paper / NativeBase
- **Charts & Analytics:** React Native Chart Kit

## Setup

### Prerequisites

- Node.js 16+
- Expo CLI (`npm install --global expo-cli`)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spendly.git
cd spendly

# Install dependencies
npm install

# Start the development server
expo start

# Scan QR code with Expo Go app (iOS/Android)
```

### Build for Production

```bash
expo build:ios
expo build:android
```

## Core Calculations

- **Savings Rate:** `(Income - Total Expenses) / Income × 100`
- **Budget Utilization:** `Actual Spend / Budget × 100` per category
- **Financial Health Score:** Weighted formula based on savings rate, budget adherence, and spending consistency

## License

MIT

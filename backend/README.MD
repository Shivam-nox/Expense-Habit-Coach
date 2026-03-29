# 💸 Spendly

**Spendly** is a premium, AI-powered personal finance tracker and habit coach. Built with React Native (Expo) and a custom Node.js/Neon PostgreSQL backend, this app focuses on beautiful, lightning-fast UI, strict budget discipline, and actionable AI insights.

## 🏗️ Architecture & Tech Stack

**Frontend:**
* React Native (Expo Router)
* Custom Premium Styling (Teal, Gold, and Slate Palette)
* `moti` & `react-native-reanimated` for 60fps staggered animations
* `expo-print` & `expo-sharing` for client-side PDF generation

**Backend:**
* Node.js & Express.js
* **Drizzle ORM** for type-safe database queries
* **Neon Serverless PostgreSQL** (Utilizing OLAP Rollup Tables for instant dashboard loads)
* **Groq API** for conversational AI coaching
* Custom JWT Authentication

## 🧠 Key Backend Modules

* **Routes (`/src/routes/chat.ts`)**
  * Handles the core API endpoints for the AI Coach.
  * Processes user messages, integrates with expense tracking, and routes incoming requests to the appropriate AI controllers.
* **Utils (`/src/utils/asa.ts`)**
  * Houses the **Average Spending Analysis (ASA)** logic.
  * Calculates spending patterns, evaluates budget utilization, and generates the raw data needed for Duo's coaching insights.

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* `npm` or `yarn`
* Expo Go app on your mobile device (or iOS Simulator / Android Emulator)
* A [Neon PostgreSQL](https://neon.tech/) database URL
* A [Groq](https://console.groq.com/) API Key

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and configure your environment:

```bash
cd backend
npm install
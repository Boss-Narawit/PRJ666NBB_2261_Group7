# ReDrobe

A smart digital wardrobe platform that helps users reduce fashion waste, reduce impulse spending, and maximize their existing wardrobe.

## Brief summary

ReDrobe is a comprehensive digital wardrobe management platform designed
to reduce fashion waste, curb impulsive spending, and optimize personal style. Users digitally
catalog their clothing, track usage, create and manage outfits, and receive intelligent reminders
about underutilized items. The platform integrates a “thoughtful purchasing” feature that
combats impulse buys through a timed consideration period and similarity checks against
existing items.With clear data visualizations and an annual Style Recap, ReDrobe turns daily
habits into insights, while a community board, marketplace integration, and an AI stylist chatbot
help users find new outfit ideas and give unused clothing a second life through resale, donation,
or upcycling.

## Problem

Most people own far more clothes than they actually wear, leading to wasted money, impulsive purchases, and unnecessary environmental harm. Existing wardrobe apps focus on organization, but fail to discourage overconsumption or provide insights on clothing usage.

## Solution

ReDrobe is an all-in-one digital wardrobe management platform that allows users to:

- Digitally catalog their clothing
- Track wear frequency
- Create and save outfits
- Receive reminders for underutilized items
- Prevent impulse purchases through a built-in “cooling-off” system
- Gain insights through analytics and an annual “Style Recap”

## Our Team Members

- Nada Khan – Lead UI/UX Designer & Frontend Developer
- Narawit Sawatdecha – Project Manager & Backend Developer
- Trinity Ma – QA & Analytics Developer
- Seulgi Lee – Data & AI / Algorithm Developer
- Beomgu Jeon – Technical Lead & System Architect
## Setup & Installation

To install all dependencies for the entire project (root, frontend, and backend) at once, run the following command in the root folder:

```powershell
npm run install:all
```

## Running Unit Tests

You can run unit tests for both the backend and frontend at once from the root folder, or navigate to individual directories to run them separately.

### Run All Tests at Once
To run both backend and frontend tests sequentially with a single command from the root directory:
```powershell
npm run test:all
```

### Run Separately
- **Backend Tests:**
  ```powershell
  cd backend
  npm run test
  ```
- **Frontend Tests:** (run sequentially and force exit to prevent timeouts/warnings from background timers)
  ```powershell
  cd frontend
  npm run test -- --runInBand --forceExit
  ```

## Frontend Run

Before running any frontend commands, make sure you are in the `frontend` folder:

```powershell
cd frontend
```

Check the local React Native environment:

```powershell
npx react-native doctor
```

Run Android:

```powershell
npx react-native run-android
```

## Backend Run

Before running the backend, make sure you have set up the environment variables (see below).

### - Run from the `backend` folder
Alternatively, navigate to the `backend` folder and run the development script:
```powershell
cd backend
npm run dev
```

## Environment Variables & Database Setup

Create your own local environment file by duplicating the `.env.example` within the `backend` folder:
```powershell
cp backend/.env.example backend/.env
```

Open your newly created `backend/.env` file and configure the variables:

#### - Database Connection (`MONGODB_URI`)
You can connect to the shared MongoDB Atlas cloud cluster:
```powershell
MONGODB_URI=mongodb+srv://<username>:<password>@cluster-redrobe.xkfghee.mongodb.net/?appName=cluster-redrobe
```

> [!TIP]
> **DNS / Connection Issues (`querySrv ECONNREFUSED`):**
> If Node.js throws a `querySrv ECONNREFUSED` error when trying to connect to the cloud database (common on some Windows/DNS configurations), you can use the standard replica set connection string instead:
> ```powershell
> MONGODB_URI=mongodb://<username>:<password>@ac-6hv3spd-shard-00-00.xkfghee.mongodb.net:27017,ac-6hv3spd-shard-00-01.xkfghee.mongodb.net:27017,ac-6hv3spd-shard-00-02.xkfghee.mongodb.net:27017/redrobe?replicaSet=atlas-dxwvyn-shard-0&ssl=true&authSource=admin
> ```

Update the default placeholder of `JWT_SECRET` variable in your `.env` file with a secure, random string.


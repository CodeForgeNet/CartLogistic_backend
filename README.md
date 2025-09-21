After reviewing the code you shared, I'll create separate README files for both the backend and frontend parts of your logistics planning system.

## README.md for Backend

```markdown
# Logistics Route Planning System - Backend

This is the backend API for the Logistics Route Planning & Simulation System. It provides API endpoints for managing drivers, routes, orders, and running delivery simulations based on company rules.

## Features

- JWT Authentication for secure API access
- MongoDB data storage with Mongoose ODM
- CRUD operations for Drivers, Routes, and Orders
- Advanced simulation engine implementing company logistics rules
- API for retrieving simulation results and KPIs

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Joi for request validation
- CSV data seeding capabilities

## Project Structure
```

backend/
├── config/ # Configuration files
├── controllers/ # Route controllers
├── data/ # CSV data for seeding
├── middleware/ # Custom middleware (auth, error handling)
├── models/ # Mongoose models
├── routes/ # API route definitions
├── scripts/ # Data seeding scripts
├── services/ # Business logic services
├── tests/ # Unit and integration tests
├── .env.example # Environment variables template
├── package.json # Dependencies and scripts
└── server.js # Application entry point

```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory:
```

cd backend

```
3. Install dependencies:
```

npm install

```
4. Create a `.env` file based on `.env.example`:
```

PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/logistics
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000
BCRYPT_SALT=10

```
5. Seed the database:
```

npm run seed

```
6. Start the development server:
```

npm run dev

````

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user profile

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get single driver
- `POST /api/drivers` - Create a driver
- `PUT /api/drivers/:id` - Update a driver
- `DELETE /api/drivers/:id` - Delete a driver

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get single route
- `POST /api/routes` - Create a route
- `PUT /api/routes/:id` - Update a route
- `DELETE /api/routes/:id` - Delete a route

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create an order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order

### Simulation
- `POST /api/simulate` - Run a delivery simulation
- `GET /api/simulate` - Get all simulation results
- `GET /api/simulate/latest` - Get the latest simulation result

## Simulation API Example

### Request
```json
POST /api/simulate
{
"numberOfDrivers": 5,
"routeStartTime": "09:00",
"maxHoursPerDriver": 8
}
````

### Response

```json
{
  "inputs": {
    "numberOfDrivers": 5,
    "routeStartTime": "09:00",
    "maxHoursPerDriver": 8
  },
  "kpis": {
    "totalProfit": 15420,
    "efficiency": 85.71,
    "onTimeDeliveries": 6,
    "totalDeliveries": 7,
    "fuelCostBreakdown": {
      "Low": 600,
      "Medium": 750,
      "High": 1400
    }
  },
  "perOrder": [
    {
      "orderId": "O002",
      "routeId": "R002",
      "valueRs": 1200,
      "timeToDeliverMinutes": 50,
      "onTime": true,
      "penalty": 0,
      "bonus": 120,
      "fuelCost": 150,
      "profit": 1170,
      "assignedDriver": "Rahul Singh"
    }
    // Additional orders...
  ]
}
```

## Testing

Run tests with:

```
npm test
```

Tests cover critical simulation logic including:

- Traffic time multipliers
- Late penalty calculations
- High-value bonuses
- Driver fatigue effects
- Efficiency calculations

## Assumptions & Business Rules

1. **Traffic Effects:**

   - Low Traffic: 0% additional time
   - Medium Traffic: +10% delivery time
   - High Traffic: +25% delivery time and +₹2/km fuel surcharge

2. **Driver Fatigue:**

   - A driver is considered fatigued if they worked more than 8 hours the previous day
   - Fatigued drivers take 30% longer to complete deliveries

3. **Order Prioritization:**

   - Orders are prioritized by value (highest first) to maximize profit
   - High-value orders (>₹1000) receive a 10% bonus if delivered on time

4. **Late Penalties:**

   - An order is considered late if delivery time exceeds base time + 10 minutes
   - Late orders incur a ₹50 penalty

5. **Fuel Costs:**
   - Base fuel cost: ₹5/km
   - High traffic surcharge: +₹2/km

## Deployment

The backend can be deployed to Render, Railway, or any other Node.js hosting platform:

1. Connect your GitHub repository to the deployment platform
2. Set the environment variables (as listed in `.env.example`)
3. Set the build command to `npm install`
4. Set the start command to `node server.js`

```

```

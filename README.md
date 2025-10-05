# HydroSense API

A Next.js API for water quality monitoring and analysis using AI-powered insights. This API allows you to create experiments, analyze water quality data, and find similar historical experiments with geographic context.

## Features

- **Water Quality Analysis**: AI-powered analysis of pH, temperature, and turbidity measurements
- **Experiment Management**: Create and track water quality experiments
- **Historical Data Comparison**: Find similar experiments from a historical database
- **Geographic Context**: Convert coordinates to country names for location-based insights
- **Real-time Recommendations**: Get AI-generated solutions for water quality issues

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o-mini for analysis and recommendations
- **TypeScript**: Full type safety throughout the application

## Database Schema

### Tables

#### `users`

- `id` (UUID, Primary Key)
- `email` (Text)

#### `experiments`

- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key to users)
- `name` (Text)
- `description` (Text)
- `createdAt` (Timestamp)
- `ph` (Numeric)
- `temperature` (Numeric)
- `turbidity` (Numeric)
- `summary` (Text) - AI-generated analysis
- `solution` (Text) - AI-generated recommendations

#### `experimentsBank`

- `id` (UUID, Primary Key)
- `date` (Date)
- `time` (Time)
- `longitude` (Numeric)
- `latitude` (Numeric)
- `turbidity` (Numeric)
- `temperature` (Numeric)
- `ph` (Numeric)

## API Endpoints

### Base URL

```
http://localhost:3000
```

### 1. Create User

**POST** `/users`

Create a new user in the system.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### 2. Create Experiment

**POST** `/experiments`

Create a new water quality experiment.

**Request Body:**

```json
{
  "userId": "user-uuid",
  "name": "Lake Water Test",
  "description": "Testing water quality in local lake"
}
```

**Response:**

```json
{
  "message": "Experiment created successfully",
  "experiment": {
    "id": "experiment-uuid",
    "userId": "user-uuid",
    "name": "Lake Water Test",
    "description": "Testing water quality in local lake",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Update Experiment with Sensor Data

**PATCH** `/experiments/[id]`

Update an experiment with water quality sensor readings and get AI analysis.

**Request Body:**

```json
{
  "ph": 7.2,
  "temperature": 24.5,
  "turbidity": 15.3
}
```

**Response:**

```json
{
  "message": "Experiment updated with sensor data and AI analysis successfully",
  "experiment": {
    "id": "experiment-uuid",
    "ph": "7.2",
    "temperature": "24.5",
    "turbidity": "15.3",
    "summary": "The water quality shows good conditions with neutral pH, optimal temperature, and low turbidity indicating clear water.",
    "solution": ""
  },
  "similarExperimentAnalysis": "Experiment 5 has the most similar values, with pH 7.2, temperature 24°C, and turbidity 15 NTU closely matching your readings. The similar water quality conditions suggest comparable environmental factors. This experiment was conducted in Brazil."
}
```

### 4. Get Experiment

**GET** `/experiments/[id]`

Retrieve a specific experiment by ID.

**Response:**

```json
{
  "experiment": {
    "id": "experiment-uuid",
    "userId": "user-uuid",
    "name": "Lake Water Test",
    "description": "Testing water quality in local lake",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "ph": "7.2",
    "temperature": "24.5",
    "turbidity": "15.3",
    "summary": "The water quality shows good conditions...",
    "solution": ""
  }
}
```

### 5. Get All Experiments

**GET** `/experiments`

Retrieve all experiments for a specific user.

**Query Parameters:**

- `userId` (required): The user ID to filter experiments

**Response:**

```json
{
  "experiments": [
    {
      "id": "experiment-uuid",
      "userId": "user-uuid",
      "name": "Lake Water Test",
      "description": "Testing water quality in local lake",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "ph": "7.2",
      "temperature": "24.5",
      "turbidity": "15.3",
      "summary": "The water quality shows good conditions...",
      "solution": ""
    }
  ]
}
```

## AI Features

### Water Quality Analysis

The API uses OpenAI GPT-4o-mini to analyze water quality data and provide:

- **Summary**: Clear explanation of what the measurements mean
- **Solutions**: Specific recommendations if water quality issues are detected

### Similar Experiment Detection

When updating an experiment with sensor data, the API:

1. Compares current readings with historical data from `experimentsBank`
2. Identifies the most similar experiment based on pH, temperature, and turbidity
3. Converts coordinates to country names for geographic context
4. Provides a natural language explanation of the similarity

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hydrosense"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
```

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your database and run migrations:

   ```bash
   npx drizzle-kit push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage Examples

### Complete Workflow

1. **Create a user:**

   ```bash
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{"email": "scientist@example.com"}'
   ```

2. **Create an experiment:**

   ```bash
   curl -X POST http://localhost:3000/experiments \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-uuid",
       "name": "River Water Analysis",
       "description": "Monthly water quality check"
     }'
   ```

3. **Update with sensor data:**
   ```bash
   curl -X PATCH http://localhost:3000/experiments/experiment-uuid \
     -H "Content-Type: application/json" \
     -d '{
       "ph": 6.8,
       "temperature": 22.1,
       "turbidity": 8.5
     }'
   ```

## Error Handling

The API includes comprehensive error handling for:

- Invalid UUID formats
- Missing required fields
- Database connection issues
- OpenAI API failures
- Invalid JSON payloads

All errors return appropriate HTTP status codes and descriptive error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

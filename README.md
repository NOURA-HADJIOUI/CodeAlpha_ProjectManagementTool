# CodeAlpha Project Management Tool

Project management application with a Kanban board, task tracking, and real-time notifications.

## Features

- User registration and login with JWT authentication
- Project creation and member management
- Kanban boards with drag-and-drop and customizable columns
- Tasks with priorities, due dates, labels, checklists, and comments
- Real-time notifications with Socket.IO
- Dashboard with statistics and project progress

## Project Structure

```text
.
├── client/
│   ├── public/
│   └── src/
│       ├── api/           # HTTP request configuration
│       ├── components/    # Reusable components
│       ├── context/       # Global state, including authentication
│       ├── pages/         # Application pages
│       ├── styles/        # Theme and styles
│       └── utils/         # Utility functions
└── server/
    ├── config/            # Database connection
    ├── controllers/       # API logic
    ├── middleware/        # Authentication and middleware
    ├── models/            # MongoDB models
    ├── routes/            # Express routes
    ├── utils/             # Shared server functions
    ├── server.js          # API startup
    └── socket.js           # Socket.IO configuration
```

## Requirements

- Node.js and npm
- Local MongoDB or an accessible MongoDB instance

## Server Configuration

From the `server` directory, create a `.env` file:

```env
MONGO_URI=mongodb://127.0.0.1:27017/codealpha_project_management
JWT_SECRET=replace_with_a_long_random_key
PORT=5000
```

The server reads this file from `server/.env`. Do not share this file or commit your secrets.

Install the dependencies and start the API:

```bash
cd server
npm install
npm run dev
```

The API is available at `http://localhost:5000`.

## Start the Client

In another terminal, from the project root:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The client uses the API at `http://localhost:5000`.

## Client Checks

From the `client` directory:

```bash
npm run lint
npm run build
```

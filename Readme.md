# Video Streaming Platform – Backend

This repository contains the backend for a full-stack video streaming platform.

## Features
- User authentication using JWT
- User registration with avatar and channel thumbnail
- Channel creation and management
- Video upload, edit, delete, and publish control
- Like, comment, and subscribe functionality
- Playlist management
- Dashboard analytics (views, likes, comments, subscribers)
- Secure media storage.

## Tech Stack
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Multer
- Cloudinary

## Environment Variables
Create a `.env` file and add:

- PORT
- MONGODB_URI
- CORS_ORIGIN
- ACCESS_TOKEN_SECRET
- ACCESS_TOKEN_EXPIRY
- REFRESH_TOKEN_SECRET
- REFRESH_TOKEN_EXPIRY
- CLOUDINARY_URL

## Installation
npm install
npm run dev

## Deployment
The backend is deployed on Vercel using a serverless configuration.

## Author
Omm Malhotra

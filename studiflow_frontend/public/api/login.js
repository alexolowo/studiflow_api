// pages/api/login.js

import { sign } from 'jsonwebtoken';

const SECRET_KEY = 'your-secret-key'; // In a real app, use an environment variable

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { username, password } = req.body;

    // For testing purposes, we'll use a simple check
    // In a real application, you would validate against a database
    if (username === 'testuser' && password === 'testpassword') {
        // Create a payload for the JWT
        const payload = {
            id: '1234567890',
            username: username,
            // Add any other relevant user data
        };

        // Sign the token
        const token = sign(payload, SECRET_KEY, { expiresIn: '1h' });

        // Return the token
        return res.status(200).json({
            message: 'Login successful',
            token: token
        });
    } else {
        // If credentials are invalid
        return res.status(401).json({ message: 'Invalid credentials' });
    }
}
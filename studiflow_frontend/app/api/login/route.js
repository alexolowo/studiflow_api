// app/api/login/route.js

import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

const SECRET_KEY = 'your-secret-key'; // In a real app, use an environment variable

export async function POST(request) {
    try {
        const { username, password } = await request.json();

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
            return NextResponse.json({
                message: 'Login successful',
                token: token
            }, { status: 200 });
        } else {
            // If credentials are invalid
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
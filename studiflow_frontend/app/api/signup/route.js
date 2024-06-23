import { NextResponse } from 'next/server';


export async function POST(request) {
    try {
        return NextResponse.json({
            message: 'Signup successful',
            token: '12345'
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
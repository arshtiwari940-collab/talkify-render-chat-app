import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Ensure you have added the path to your Firebase service account JSON file in .env
// OR you can parse a JSON string from the .env file (preferred for production)

let db;

try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    let credentialOptions;

    if (serviceAccountJson) {
        // Parse the JSON string from the environment variable
        const serviceAccount = JSON.parse(serviceAccountJson);
        credentialOptions = cert(serviceAccount);
        console.log('Firebase initializing from JSON string...');
    } else if (serviceAccountPath) {
        // Fallback to local file path
        credentialOptions = cert(serviceAccountPath);
        console.log('Firebase initializing from Local File Path...');
    } else {
        console.warn('⚠️ Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH is defined in .env! Firestore will not connect.');
    }

    if (credentialOptions) {
        initializeApp({
            credential: credentialOptions,
        });

        db = getFirestore();
        console.log('Connected to Firestore');
    }
} catch (error) {
    console.error('Error connecting to Firestore:', error);
}

export { db };

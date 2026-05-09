const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const API_URL = 'https://jsonplaceholder.typicode.com';

let authConfig = {
    type: 'API_KEY',
    apiKey: 'my-secret-api-key',
    token: 'initial-token'
};

async function refreshToken() {
    console.log('[Auth] Refreshing token...');

    return new Promise((resolve) => {
        setTimeout(() => {
            const newToken = 'new-token-' + Date.now();
            resolve(newToken);
        }, 1000);
    });
}
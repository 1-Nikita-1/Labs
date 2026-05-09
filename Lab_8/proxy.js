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

let lastRequestTime = 0;
const RATE_LIMIT_MS = 500;

function rateLimit() {
    const now = Date.now();

    if (now - lastRequestTime < RATE_LIMIT_MS) {
        throw new Error('Too many requests');
    }

    lastRequestTime = now;
}

async function proxyRequest(endpoint) {
    try {
        rateLimit();

        let headers = {};

        if (authConfig.type === 'API_KEY') {
            headers['x-api-key'] = authConfig.apiKey;
        } else if (authConfig.type === 'JWT') {
            headers['Authorization'] = `Bearer ${authConfig.token}`;
        }

        console.log('[Proxy] Sending request with headers:', headers);

        const response = await axios.get(`${API_URL}${endpoint}`, {
            headers
        });

        return response.data;

    } catch (error) {

        if (error.response && error.response.status === 401) {

            console.log('[Proxy] Token expired');

            const newToken = await refreshToken();
            authConfig.token = newToken;

            console.log('[Proxy] Retrying request...');

            return proxyRequest(endpoint);
        }

        throw error;
    }
}

app.get('/proxy/posts', async (req, res) => {
    try {
        const data = await proxyRequest('/posts');

        res.send(JSON.stringify(data, null, 2));

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

app.get('/switch-auth/:type', (req, res) => {

    const type = req.params.type.toUpperCase();

    if (['API_KEY', 'JWT'].includes(type)) {

        authConfig.type = type;

        res.json({
            message: `Switched to ${type}`
        });

    } else {

        res.status(400).json({
            error: 'Invalid auth type'
        });
    }
});

app.listen(3000, () => {
    console.log('Proxy server running on http://localhost:3000');
});
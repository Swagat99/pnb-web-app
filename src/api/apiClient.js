import { encryptBody, decryptResponse } from '../utils/crypto';

// Replace with your actual backend base URL
const BASE_URL = import.meta.env.VITE_API_INTERNAL_BASE_URL || 'http://localhost:8080/api';
/**
 * A central API client that handles authentication and encryption/decryption.
 */
export const apiClient = async (endpoint, options = {}) => {
    const { 
        method = 'GET', 
        body, 
        encryptReq = false, 
        decryptRes = false, 
        headers: customHeaders = {},
        ...customConfig 
    } = options;
    
    // Set up headers
    const mergedHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    // Attach token from sessionStorage
    const token = sessionStorage.getItem('access_token');
    if (token) {
        mergedHeaders['Authorization'] = `Bearer ${token}`; 
        console.log('Attaching Authorization header with token from sessionStorage');
    } else {
        console.warn('No access_token found in sessionStorage. Authorization header will be missing.');
    }

    // Standardize pass_key to lowercase as seen in the browser request
    if (mergedHeaders['Pass_key']) {
        mergedHeaders['pass_key'] = mergedHeaders['Pass_key'];
        delete mergedHeaders['Pass_key'];
    }

    const config = {
        method,
        headers: mergedHeaders,
        ...customConfig,
    };

    // Handle request body and encryption
    if (body) {
        if (encryptReq) {
            const encryptedData = encryptBody(body);
            // The API expects this specific key for encrypted data
            config.body = JSON.stringify({ RequestData: encryptedData }); 
            console.log('Encrypted payload into RequestData');
        } else {
            config.body = JSON.stringify(body);
        }
    }

    try {
        const fetchUrl = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
        console.log(`Making ${method} request to: ${fetchUrl}`, { headers: mergedHeaders });
        
        const response = await fetch(fetchUrl, config);
        
        let responseData;
        const text = await response.text();

        // Try to parse as JSON
        try {
            responseData = JSON.parse(text);
        } catch (e) {
            responseData = text;
        }

        // Handle decryption
        if (decryptRes && responseData) {
            if (typeof responseData === 'string') {
                responseData = decryptResponse(responseData);
            } else if (responseData.ResponseData && typeof responseData.ResponseData === 'string') {
                responseData = decryptResponse(responseData.ResponseData);
            } else if (responseData.data && typeof responseData.data === 'string') {
                responseData = decryptResponse(responseData.data);
            } else if (responseData.responseData && typeof responseData.responseData === 'string') {
                responseData = decryptResponse(responseData.responseData);
            }
        }

        if (!response.ok) {
            const msg = (responseData && responseData.message) ? responseData.message : `API error: ${response.status}`;
            throw new Error(msg);
        }

        return responseData;

    } catch (error) {
        console.error(`API Call failed for ${endpoint}:`, error);
        throw error;
    }
};

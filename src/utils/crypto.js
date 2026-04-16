import CryptoJS from 'crypto-js';

// The 32-byte encryption key (Base64 encoded) from .env
const ENCRYPTION_KEY_B64 = import.meta.env.VITE_ENCRYPTION_KEY;

/**
 * Encrypts the request body using AES-256-CBC.
 * Generates a random 16-byte IV and prepends it to the result.
 * Returns a Base64 encoded string containing [IV + Ciphertext].
 */
export const encryptBody = (data) => {
    try {
        const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
        const key = CryptoJS.enc.Base64.parse(ENCRYPTION_KEY_B64);
        const iv = CryptoJS.lib.WordArray.random(16);

        const encrypted = CryptoJS.AES.encrypt(text, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // Combine IV and Ciphertext
        const combined = iv.clone().concat(encrypted.ciphertext);
        
        // Return as Base64 string
        return combined.toString(CryptoJS.enc.Base64);
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt request body');
    }
};

/**
 * Decrypts the response using AES-256-CBC.
 * Expects a Base64 encoded string containing [IV + Ciphertext].
 */
export const decryptResponse = (base64Data) => {
    try {
        if (!base64Data) {
            throw new Error('No encrypted data provided');
        }

        const key = CryptoJS.enc.Base64.parse(ENCRYPTION_KEY_B64);
        
        // Decode Base64 to WordArray
        const combined = CryptoJS.enc.Base64.parse(base64Data);
        
        // Extract IV (first 16 bytes / 4 words)
        const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
        
        // Extract Ciphertext (remaining words)
        const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));

        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext },
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );

        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) {
            throw new Error('Decryption resulted in empty string');
        }

        try {
            return JSON.parse(decryptedText);
        } catch (e) {
            return decryptedText;
        }
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt response');
    }
};

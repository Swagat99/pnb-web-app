import { apiClient } from './apiClient';

// Use the explicit URL provided in the curl if the env variable isn't set
const VPA_API_URL = import.meta.env.VITE_FETCH_VPA_URL;

export const fetchVPAList = async (userId) => {
    try {
        const payload = {
            mobile_number: userId
        };

        const response = await apiClient(VPA_API_URL, {
            method: 'POST',
            body: payload,
            encryptReq: true, // Enable Encryption for RequestData
            decryptRes: true, // Enable Decryption for ResponseData
            headers: {
                // apiClient handles lowercase pass_key conversion now, 
                // but we'll set it here clearly too.
                'pass_key': import.meta.env.VITE_PASS_KEY
            }
        });

        return response;
    } catch (error) {
        console.error('Error fetching VPA list:', error);
        throw error;
    }
};

export const fetchVPADetails = async (vpaId) => {
    try {
        const payload = {
            vpa_id: vpaId
        };

        const response = await apiClient(VPA_API_URL, {
            method: 'POST',
            body: payload,
            encryptReq: true,
            decryptRes: true,
            headers: {
                'pass_key': import.meta.env.VITE_PASS_KEY
            }
        });

        return response;
    } catch (error) {
        console.error('Error fetching VPA details:', error);
        throw error;
    }
};

const CURRENT_LANGUAGE_URL = import.meta.env.VITE_CURRENT_LANGUAGE_URL;

export const fetchCurrentLanguage = async (serialNumber) => {
    try {
        const response = await apiClient(`${CURRENT_LANGUAGE_URL}/${serialNumber}`, {
            method: 'GET',
            decryptRes: true,
            headers: {
                'pass_key': import.meta.env.VITE_PASS_KEY
            }
        });

        return response;
    } catch (error) {
        console.error('Error fetching current language:', error);
        throw error;
    }
};

const LANGUAGE_LIST_URL = import.meta.env.VITE_FETCH_LANGUAGE_LIST_URL;

export const fetchLanguageList = async () => {
    try {
        const response = await apiClient(LANGUAGE_LIST_URL, {
            method: 'GET',
            decryptRes: true,
            headers: {
                'pass_key': import.meta.env.VITE_PASS_KEY
            }
        });

        return response;
    } catch (error) {
        console.error('Error fetching language list:', error);
        throw error;
    }
};

const UPDATE_LANGUAGE_URL = import.meta.env.VITE_UPDATE_LANGUAGE_URL;

export const updateLanguage = async (serialNumber, language) => {
    try {
        const response = await apiClient(UPDATE_LANGUAGE_URL, {
            method: 'POST',
            body: {
                tid: serialNumber,
                update_language: language
            },
            encryptReq: false,
            decryptRes: false
        });

        return response;
    } catch (error) {
        console.error('Error updating language:', error);
        throw error;
    }
};

const QR_GENERATE_URL = import.meta.env.VITE_QR_GENERATE_URL;

export const generateQRBase64 = async (qrString) => {
    try {
        const response = await apiClient(QR_GENERATE_URL, {
            method: 'POST',
            body: {
                qrString: qrString
            },
            encryptReq: true,
            decryptRes: true,
            headers: {
                'pass_key': import.meta.env.VITE_PASS_KEY
            }
        });

        return response;
    } catch (error) {
        console.error('Error generating QR base64:', error);
        throw error;
    }
};

const TRANSACTION_REPORTS_URL = import.meta.env.VITE_TRANSACTION_REPORTS_URL;

export const fetchTransactionReports = async (startDate, endDate, vpaId) => {
    try {
        const response = await apiClient(TRANSACTION_REPORTS_URL, {
            method: 'POST',
            body: {
                startDate: startDate,
                endDate: endDate,
                // vpa_id: vpaId,
                //
                vpa_id: "6291777315m@pnbupi",
                mode: "both"
            },
            encryptReq: false,
            decryptRes: false
        });

        return response;
    } catch (error) {
        console.error('Error fetching transaction reports:', error);
        throw error;
    }
};

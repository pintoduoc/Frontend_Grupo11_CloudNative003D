import { msalInstance } from "./main"; 
import { apiRequest } from "./authConfig";

// Asegúrate de tener aquí tu URL real de AWS
const API_GATEWAY_URL = "https://mderoz2uec.execute-api.us-east-1.amazonaws.com"; 

export const fetchWithToken = async (endpoint, options = {}) => {
    try {
        let account = msalInstance.getActiveAccount();
        
        // CORRECCIÓN: Si no hay cuenta activa, buscar en la caché de MSAL
        if (!account) {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                account = accounts[0];
                msalInstance.setActiveAccount(account); // Seteamos la cuenta activa
            } else {
                throw new Error("No hay un usuario autenticado");
            }
        }

        // MSAL obtiene el token de la caché o lo renueva silenciosamente
        const response = await msalInstance.acquireTokenSilent({
            ...apiRequest,
            account: account
        });

        // Inyectamos el JWT en los Headers
        const headers = new Headers(options.headers);
        headers.append("Authorization", `Bearer ${response.accessToken}`);

        const fetchOptions = {
            ...options,
            headers: headers
        };

        // Realizamos la llamada al API Gateway
        const res = await fetch(`${API_GATEWAY_URL}${endpoint}`, fetchOptions);
        
        // Retornar la respuesta en JSON
        return res.json();
    } catch (error) {
        console.error("Error al obtener el token o consumir la API:", error);
        throw error;
    }
};
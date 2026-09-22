import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: "api://9a8c1f22-da48-441c-8ba8-7f0fe7fadf57",
        authority: "https://sts.windows.net/15dd23f3-92e9-4574-8b7c-2cf6104370cd/",
        redirectUri: "https://frontend-cloudnative.vercel.app", // URL de tu frontend local
    },
    cache: {
        cacheLocation: "sessionStorage", 
        storeAuthStateInCookie: false, 
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) { return; }
                switch (level) {
                    case LogLevel.Error: console.error(message); return;
                    case LogLevel.Warning: console.warn(message); return;
                }
            }
        }
    }
};

export const apiRequest = {
    scopes: ["api://9a8c1f22-da48-441c-8ba8-7f0fe7fadf57/read"] 
};
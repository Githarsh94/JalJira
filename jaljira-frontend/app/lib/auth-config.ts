const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";

const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || "http://localhost:3000/auth/callback";

export const authConfig = {
    apiUrl: API_URL,
    redirectUri: REDIRECT_URI,

    google: {
        clientId: GOOGLE_CLIENT_ID,
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent("openid profile email")}&access_type=offline&prompt=consent`,
    },

    github: {
        clientId: GITHUB_CLIENT_ID,
        authUrl: `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent("read:user user:email")}`,
    },
} as const;

export const authConfig = {
    issuer: 'https://pnb-auth-stage.isupay.in/application/o/pnb/',
    clientId: 'SaDG8kozoNOUC07Uv46et8',
    redirectUrl: 'http://localhost:3000/redirected',
    scope: 'path openid profile email offline_access authorities privileges user_name created adminName bankCode goauthentik.io/api',
    dangerouslyAllowInsecureHttpRequests: false,
}
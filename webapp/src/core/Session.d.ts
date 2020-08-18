export interface Session {
    getAccessToken(): Promise<string>

    online: boolean
}

declare namespace apiCalls {

    export type AccessToken = string;
    type RefreshToken = string;

    type UserId = string;
    type ArtistId = string;
    type ReleaseId = string;
    type SongId = string;

    type LoginResult = {
        access_token: AccessToken,
        refresh_token: RefreshToken,
        token_type: 'bearer',
        expires_in: number,
        refresh_expires_in: number
    };

    type RefreshResult = {
        access_token: AccessToken,
        expires_in: number
    }

    type UserType = 'basic' | 'creator';
    type UserTier = 'free' | 'pro';
    type UserPreferences = {
        private: {email: boolean}
    }

    type UserData = {
        username: string,
        email: string,
        avatar_url?: string,
        bio: string,
        type: UserType,
        tier: UserTier,
        prefs: UserPreferences,
        artists?: any[]
    };

    type UploadContentCategory = 'user' | 'artist' | 'release' | 'song';
    type UploadContentObjectId = UserId | ArtistId | ReleaseId | SongId;
    type UploadContentResult = [string, any];  // Url and presigned post data

    function execLogin(identity: string, password: string): Promise<LoginResult>;

    function execLogout(token: AccessToken): Promise<void>;

    function execRefresh(refreshToken: RefreshToken): Promise<RefreshResult>;

    function getUserInfo(token: AccessToken, userId: UserId, includeArtists?: boolean): Promise<UserData>;

    function upgradeUserType(token: AccessToken): Promise<void>;

    function upgradeUserTier(token: AccessToken): Promise<void>;

    function patchUser(token: AccessToken, userId: UserId, patch: Partial<UserData>): Promise<void>;

    function uploadContent(category: UploadContentCategory, categoryId: UploadContentObjectId,
                           mimeType: string, size: number, token: AccessToken): Promise<UploadContentResult>;

    function uploadToStorage(result: UploadContentResult, file: File): Promise<Response>;
}

export = apiCalls;

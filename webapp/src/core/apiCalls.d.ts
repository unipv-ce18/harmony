import {SearchQuery} from './searchQuery';
import {ThemeId} from '../components/theme';

declare namespace apiCalls {

    export type AccessToken = string;
    type RefreshToken = string;

    type UserId = string;
    type ArtistId = string;
    type ReleaseId = string;
    type SongId = string;
    type PlaylistId = string;

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
        private: {email: boolean},
        theme: ThemeId
    }

    type UserData = {
        id: UserId,
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
    type UploadContentObjectId = UserId | ArtistId | ReleaseId | undefined;
    type UploadPresignedData = {
      'bucket': string, 'key': string, 'Content-Type': string, 'policy': string,
      'x-amz-algorithm': string, 'x-amz-credential': string, 'x-amz-date': string, 'x-amz-signature': string
    };
    type UploadContentResult = [string, UploadPresignedData];  // Url and presigned post data

    type SearchResult = {
      artists?: [{id: ArtistId, name: string /* ...more */}]
      releases?: [{id: ReleaseId, name: string /* ...more */}]
      songs?: [{id: SongId, title: string /* ...more */}]
      playlists?: [{id: PlaylistId, /* ...more */}]
    }

    type ArtistResult = {
      id: ArtistId,
      name: string,
      creator: string | null,
      sort_name: string,
      country?: string
      life_span?: {begin: string, end: string | null},
      genres?: string[],
      bio?: string | null,
      members?: [{role: string, name: string}],
      links?: {[target: string]: string},
      image?: string | null,
      releases?: ReleaseResult[]
    }

    type ReleaseResult = {
      id: ReleaseId,
      name: string,
      date?: string,
      artist: any,  // keep it simple for now
      type: 'album' | 'single' | 'ep' | 'compilation' | 'live' | 'remix' | null,
      cover: string | null
    }

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

    function execSearch(token: AccessToken, query: SearchQuery): Promise<SearchResult>;

    function getArtist(artistId: ArtistId, withReleases: boolean, token: AccessToken): Promise<ArtistResult>;
    
    function createArtist(name: string, token: AccessToken): Promise<ArtistId>;

    function createRelease(artistId: ArtistId, fields: {name: string, date?: string}, token: AccessToken): Promise<ReleaseId>;

    function createSong(releaseId: ReleaseId, uploadId: string, title: String, token: AccessToken): Promise<any>;
}

export = apiCalls;

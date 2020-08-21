import {Session} from './Session';
import {
    AccessToken,
    getUserInfo, patchUser, upgradeUserTier,
    upgradeUserType,
    uploadContent,
    uploadToStorage,
    UserData,
    UserId, UserPreferences,
    UserType
} from './apiCalls';

export function fetchUser(session: Session, userId: UserId, includeArtists: boolean = false): Promise<User> {
    return session.getAccessToken()
        .then(token => getUserInfo(token!, userId, includeArtists))
        .then(data => new User(session, userId, data));
}

export class User {

    constructor(private readonly session: Session,
                private readonly userId: UserId,
                private readonly data: UserData) {
    }

    get id() {
        return this.data.id;
    }

    get username() {
        return this.data.username;
    }

    get email() {
        return this.data.email;
    }

    get image() {
        return this.data.avatar_url;
    }

    get biography() {
        return this.data.bio;
    }

    get type() {
        return this.data.type;
    }

    get tier() {
        return this.data.tier;
    }

    get preferences() {
        return this.data.prefs;
    }

    get ownArtists() {
        return Object.freeze(this.data.artists);
    }

    public updateImage(newImage: File) {
        return this.getToken()
            .then(token => uploadContent('user', this.userId, newImage.type, newImage.size, token))
            .then(presignedData => uploadToStorage(presignedData, newImage));
    }

    public updatePreferences(newPreferences: UserPreferences) {
        return this.getToken()
            .then(token => patchUser(token, this.userId, {prefs: newPreferences}));
    }

    public updateBiography(newBiography: string) {
        return this.getToken()
            .then(token => patchUser(token, this.userId, {bio: newBiography}));
    }

    public upgradeType() {
        return this.getToken().then(token => upgradeUserType(token));
    }

    public upgradeTier() {
        return this.getToken().then(token => upgradeUserTier(token));
    }

    public serialize() {
        return Object.freeze(this.data);
    }

    private getToken(): Promise<AccessToken> {
        if (!this.session.online)
            throw new Error('You cannot update your image while offline');

        return this.session.getAccessToken().then(token => {
            if (token == null) throw new Error('No user logged in (empty access token)');
            return token;
        })
    }

}

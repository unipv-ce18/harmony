import {Session} from './Session';
import {uploadContent, uploadToStorage} from './apiCalls';

export class User {

    constructor(private readonly session: Session,
                private readonly userId: string) {
    }

    public updateImage(newImage: File) {
        if (!this.session.online)
            throw Error('You cannot update your image while offline');

        return this.session.getAccessToken()
            .then(token => uploadContent('user', this.userId, newImage.type, newImage.size, token))
            .then(presignedData => uploadToStorage(presignedData, newImage));
    }

}

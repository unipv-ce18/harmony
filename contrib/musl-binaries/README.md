Scripts to compile [shaka-packager](https://github.com/google/shaka-packager)
and [audiowaveform](https://github.com/bbc/audiowaveform) inside Alpine Linux.

The generated artifacts can then be uploaded to a central location
so they can be fetched while building a `transcoder-worker` image.

> It is good practice to sign the artifacts and verify the signature at image
> build time.
> To sign using GPG, use `gpg --detach-sign --default-key $MY_MAIL $FILE_NAME`.

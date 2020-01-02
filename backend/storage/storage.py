import os

from minio.error import ResponseError


_buckets = ['lossless-songs', 'compressed-songs']


class Storage:
    def __init__(self, minio_connection):
        """Initialize Storage.

        Connect to storage server and check if the buckets for lossless and
        compressed songs exist and, if not, create them.

        :param minio.api.Minio minio_connection: minio connection instance
        """
        self.minio_client = minio_connection
        for bucket in _buckets:
            if not self.check_bucket_exist(bucket):
                self.create_bucket(bucket)

    def create_bucket(self, bucket):
        """Create a bucket inside server storage.

        :param str bucket: name of the bucket to create
        """
        try:
            self.minio_client.make_bucket(bucket)
        except ResponseError as err:
            print(err)

    def delete_bucket(self, bucket):
        """Delete a bucket inside server storage.

        :param str bucket: name of the bucket to delete
        """
        try:
            self.minio_client.remove_bucket(bucket)
        except ResponseError as err:
            print(err)

    def list_buckets(self):
        """List the buckets inside server storage.

        :return: list of tuple, each tuple has name and creation date of the bucket
        :rtype: list
        """
        buckets = self.minio_client.list_buckets()
        return [(bucket.name, bucket.creation_date) for bucket in buckets]

    def list_files(self, bucket):
        """List the files inside a bucket.

        :param str bucket: name of the bucket
        :return: names of the files inside a bucket
        :rtype: list
        """
        objects = self.minio_client.list_objects(bucket, recursive=True)
        return [obj.object_name.encode('utf-8') for obj in objects]

    def check_bucket_exist(self, bucket):
        """Check if the bucket exists inside server storage.

        :param str bucket: name of the bucket
        :return: True if exists, False otherwise
        :rtype: bool
        """
        try:
            return self.minio_client.bucket_exists(bucket)
        except ResponseError as err:
            print(err)

    def upload_file(self, bucket, file_name, file_path):
        """Upload a file inside a bucket.

        :param str bucket: name of the bucket
        :param str file_name: name of the file to upload
        :param str file_path: local path to the file
        """
        try:
            self.minio_client.fput_object(bucket, file_name, f'{file_path}/{file_name}')
            print(f'{file_name} uploaded to {bucket}!')
        except ResponseError as err:
            print(err)

    def download_file(self, bucket, file_name, file_path):
        """Download a file from a bucket.

        :param str bucket: name of the bucket
        :param str file_name: name of the file to download
        :param str file_path: local path where the file will be saved
        """
        try:
            self.minio_client.fget_object(bucket, file_name, f'{file_path}/{file_name}')
        except ResponseError as err:
            print(err)

    def delete_file(self, bucket, file_name):
        """Delete a file from a bucket.

        :param str bucket: name of the bucket
        :param str file_name: name of the file to delete
        """
        try:
            self.minio_client.remove_object(bucket, file_name)
        except ResponseError as err:
            print(err)

    def delete_all_files(self, bucket):
        """Delete all files from a bucket.

        :param str bucket: name of the bucket
        """
        for file in self.list_files(bucket):
            self.delete_file(bucket, file)

    def upload_folder(self, bucket, folder, subfolder):
        """Upload a folder, and all its files, inside a bucket.

        :param str bucket: name of the bucket
        :param str folder: local root directory where the subfolder exists
        :param str subfolder: the folder with files to upload to bucket
        """
        for file in os.listdir(f'{folder}/{subfolder}'):
            self.upload_file(bucket, f'{subfolder}/{file}', f'{folder}')

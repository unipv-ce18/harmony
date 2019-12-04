import os

from minio.error import ResponseError


_buckets = ['lossless-songs', 'compressed-songs', 'manifest-files', 'init-segments']


class Storage:
    def __init__(self, minio_connection):
        self.minio_client = minio_connection
        for bucket in _buckets:
            if not self.check_bucket_exist(bucket):
                self.create_bucket(bucket)

    def create_bucket(self, bucket):
        try:
            self.minio_client.make_bucket(bucket)
        except ResponseError as err:
            print(err)

    def delete_bucket(self, bucket):
        try:
            self.minio_client.remove_bucket(bucket)
        except ResponseError as err:
            print(err)

    def list_buckets(self):
        buckets = self.minio_client.list_buckets()
        return [(bucket.name, bucket.creation_date) for bucket in buckets]

    def list_files(self, bucket):
        objects = self.minio_client.list_objects(bucket, recursive=True)
        return [obj.object_name.encode('utf-8') for obj in objects]

    def check_bucket_exist(self, bucket):
        try:
            return self.minio_client.bucket_exists(bucket)
        except ResponseError as err:
            print(err)

    def upload_file(self, bucket, file_name, file_path):
        try:
            self.minio_client.fput_object(bucket, file_name, f'{file_path}/{file_name}')
            print(f'{file_name} uploaded to {bucket}!')
        except ResponseError as err:
            print(err)

    def download_file(self, bucket, file_name, file_path):
        try:
            self.minio_client.fget_object(bucket, file_name, f'{file_path}/{file_name}')
        except ResponseError as err:
            print(err)

    def delete_file(self, bucket, file_name):
        try:
            self.minio_client.remove_object(bucket, file_name)
        except ResponseError as err:
            print(err)

    def delete_all_files(self, bucket):
        for file in self.list_files(bucket):
            self.delete_file(bucket, file)

    def upload_folder(self, bucket, folder, subfolder):
        for file in os.listdir(f'{folder}/{subfolder}'):
            self.upload_file(bucket, f'{subfolder}/{file}', f'{folder}')

type UploadContentResult = [string, any];  // Url and presigned post data

declare namespace apiCalls {
    function uploadContent(category: string, categoryId: string,
                           mimeType: string, size: number, token: string): Promise<UploadContentResult>;

    function uploadToStorage(result: UploadContentResult, file: File): Promise<Response>;
}

export = apiCalls;

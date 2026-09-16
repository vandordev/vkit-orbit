export type StorageConfig = {
	bucket: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	endpoint?: string;
	rootPrefix: string;
};

export type PutObjectInput = {
	key: string;
	body: Uint8Array;
	contentType: string;
	contentLength?: number;
};

export type UploadUrlInput = {
	workspaceId: string;
	documentId: string;
	artifactId: string;
	contentType: string;
	contentLength: number;
	expiresIn?: number;
};

export type DownloadUrlInput = { key: string; expiresIn?: number };

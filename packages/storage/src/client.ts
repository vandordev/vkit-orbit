import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { assertObjectKey, sourceObjectKey } from "./keys";
import type { DownloadUrlInput, PutObjectInput, StorageConfig, UploadUrlInput } from "./types";

type S3ClientLike = {
	send(command: PutObjectCommand | GetObjectCommand | HeadObjectCommand | DeleteObjectCommand): Promise<unknown>;
};

export function createStorageClient(
	config: StorageConfig,
	client: S3ClientLike = new S3Client({
		region: config.region,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
	}),
	presigner: (client: unknown, command: unknown, options: { expiresIn: number }) => Promise<string> = getSignedUrl as unknown as (
		client: unknown,
		command: unknown,
		options: { expiresIn: number },
	) => Promise<string>,
) {
	return {
		async createUploadUrl(input: UploadUrlInput) {
			const key = sourceObjectKey(input);
			assertObjectKey(config.rootPrefix, `${config.rootPrefix}/${key}`);
			return presigner(
				client,
				new PutObjectCommand({
					Bucket: config.bucket,
					Key: `${config.rootPrefix}/${key}`,
					ContentType: input.contentType,
					ContentLength: input.contentLength,
				}),
				{ expiresIn: Math.min(input.expiresIn ?? 900, 900) },
			);
		},
		async createDownloadUrl(input: DownloadUrlInput) {
			assertObjectKey(config.rootPrefix, input.key);
			return presigner(client, new GetObjectCommand({ Bucket: config.bucket, Key: input.key }), {
				expiresIn: Math.min(input.expiresIn ?? 300, 300),
			});
		},
		async put(input: PutObjectInput) {
			assertObjectKey(config.rootPrefix, input.key);
			await client.send(
				new PutObjectCommand({
					Bucket: config.bucket,
					Key: input.key,
					Body: input.body,
					ContentType: input.contentType,
					...(input.contentLength === undefined ? {} : { ContentLength: input.contentLength }),
				}),
			);
		},
		async get(key: string) {
			assertObjectKey(config.rootPrefix, key);
			return client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
		},
		async head(key: string) {
			assertObjectKey(config.rootPrefix, key);
			return client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
		},
		async delete(key: string) {
			assertObjectKey(config.rootPrefix, key);
			return client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
		},
	};
}

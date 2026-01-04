import { S3Client, CopyObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Object {
  bucket: string;
  key: string;
}

export async function copyItemImage(
  s3: S3Client,
  source: S3Object,
  destination: S3Object
): Promise<S3Object> {
  await s3.send(
    new CopyObjectCommand({
      CopySource: `${source.bucket}/${source.key}`,
      Bucket: destination.bucket,
      Key: destination.key,
    })
  );

  return destination;
}

export async function saveItemImage(
  s3: S3Client,
  bucket: string | undefined,
  key: string,
  buffer: Buffer
): Promise<S3Object> {
  const targetBucket = bucket || process.env.EXPRESS_S3_APP_BUCKET!;

  await s3.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: buffer,
    })
  );

  return {
    bucket: targetBucket,
    key,
  };
}

export async function getSignedImage(
  s3: S3Client,
  obj: S3Object
): Promise<S3Object & { url: string }> {
  const command = new GetObjectCommand({
    Bucket: obj.bucket,
    Key: obj.key,
  });

  const url = await getSignedUrl(s3 as any, command as any, { expiresIn: 3600 });

  return {
    ...obj,
    url,
  };
}

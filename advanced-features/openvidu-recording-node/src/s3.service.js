import {
    S3Client,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand
} from "@aws-sdk/client-s3";

// S3 configuration
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET = process.env.S3_BUCKET || "openvidu";

export class S3Service {
    static instance;

    constructor() {
        if (S3Service.instance) {
            return S3Service.instance;
        }

        this.s3Client = new S3Client({
            endpoint: S3_ENDPOINT,
            credentials: {
                accessKeyId: S3_ACCESS_KEY,
                secretAccessKey: S3_SECRET_KEY
            },
            region: AWS_REGION,
            forcePathStyle: true
        });

        S3Service.instance = this;
        return this;
    }

    async exists(key) {
        try {
            await this.headObject(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    async headObject(key) {
        const params = {
            Bucket: S3_BUCKET,
            Key: key
        };
        const command = new HeadObjectCommand(params);
        return this.run(command);
    }

    async getObjectSize(key) {
        const { ContentLength } = await this.headObject(key);
        return ContentLength;
    }

    async getObject(key) {
        const params = {
            Bucket: S3_BUCKET,
            Key: key
        };
        const command = new GetObjectCommand(params);
        const { Body: body, ContentLength: size } = await this.run(command);
        return { body, size };
    }

    async getObjectAsJson(key) {
        const { body } = await this.getObject(key);
        const stringifiedData = await body.transformToString();
        return JSON.parse(stringifiedData);
    }

    async listObjects(prefix, regex) {
        const params = {
            Bucket: S3_BUCKET,
            Prefix: prefix
        };
        const command = new ListObjectsV2Command(params);
        const { Contents: objects } = await this.run(command);
        return (
            objects
                ?.filter((object) => regex.test(object.Key))
                .map((payload) => payload.Key) ?? []
        );
    }

    async deleteObject(key) {
        const params = {
            Bucket: S3_BUCKET,
            Key: key
        };
        const command = new DeleteObjectCommand(params);
        return this.run(command);
    }

    async run(command) {
        return this.s3Client.send(command);
    }
}

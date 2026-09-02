import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import * as path from 'path'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly s3: S3Client | null = null
  private readonly bucket: string
  private readonly cdnUrl: string
  private readonly isStub: boolean

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('DO_SPACES_KEY') || ''
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET') || ''
    const endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT') || 'https://fra1.digitaloceanspaces.com'
    const region = this.configService.get<string>('DO_SPACES_REGION') || 'fra1'
    this.bucket = this.configService.get<string>('DO_SPACES_BUCKET') || ''
    this.cdnUrl = this.configService.get<string>('DO_SPACES_CDN') || ''

    this.isStub = !accessKeyId || !this.bucket

    if (this.isStub) {
      this.logger.log('[STUB] DO Spaces not configured — using stub mode')
    } else {
      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: false,
      })
      this.logger.log(`DO Spaces configured — bucket: ${this.bucket}, endpoint: ${endpoint}`)
    }
  }

  // --- Upload file ---
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<{ url: string; key: string }> {
    if (this.isStub) {
      const stubKey = `${folder}/${uuidv4()}-${originalName}`
      this.logger.log(`[STUB] Spaces upload: ${stubKey}`)
      return { url: `https://stub.africover247.com/${stubKey}`, key: stubKey }
    }

    const ext = path.extname(originalName)
    const key = `${folder}/${uuidv4()}${ext}`

    await this.s3!.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'private',
    }))

    const url = this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.fra1.digitaloceanspaces.com/${key}`

    this.logger.log(`DO Spaces upload complete: ${key}`)
    return { url, key }
  }

  // --- Delete file ---
  async deleteFile(key: string): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] Spaces delete: ${key}`)
      return
    }
    await this.s3!.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    this.logger.log(`DO Spaces delete complete: ${key}`)
  }

  // --- Upload PDF ---
  async uploadPdf(buffer: Buffer, filename: string): Promise<string> {
    if (this.isStub) {
      this.logger.warn('[STUB] DO Spaces not configured — returning stub URL')
      return `https://stub.africover247.com/policies/${filename}`
    }

    const key = `policies/${uuidv4()}-${filename}`

    await this.s3!.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      ACL: 'private',
    }))

    const url = this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.fra1.digitaloceanspaces.com/${key}`

    this.logger.log(`DO Spaces PDF upload complete: ${key}`)
    return url
  }

  // --- Upload document ---
  async uploadDocument(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; key: string }> {
    return this.uploadFile(buffer, originalName, mimeType, 'documents')
  }
}
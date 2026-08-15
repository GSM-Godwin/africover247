import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { v2 as cloudinary } from 'cloudinary'
import { v4 as uuidv4 } from 'uuid'
import * as path from 'path'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly s3: S3Client | null = null
  private readonly bucket: string
  private readonly cloudFrontUrl: string
  private readonly isStub: boolean

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || ''
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || ''
    const region = this.configService.get<string>('AWS_REGION') || 'eu-north-1'
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || ''
    this.cloudFrontUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL') || ''

    this.isStub = !accessKeyId || accessKeyId === 'placeholder' || !this.bucket

    if (this.isStub) {
      this.logger.log('[STUB] S3 not configured — using stub mode')
    } else {
      this.s3 = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      })
      this.logger.log(`S3 configured — bucket: ${this.bucket}, region: ${region}`)
    }

    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL')
    if (cloudinaryUrl) {
      cloudinary.config({ cloud_url: cloudinaryUrl })
      this.logger.log('Cloudinary configured')
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
      const stubUrl = `https://stub-s3.africover247.com/${stubKey}`
      this.logger.log(`[STUB] S3 upload: ${stubKey}`)
      return { url: stubUrl, key: stubKey }
    }

    const ext = path.extname(originalName)
    const key = `${folder}/${uuidv4()}${ext}`

    const upload = new Upload({
      client: this.s3!,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      },
    })

    await upload.done()

    const url = this.cloudFrontUrl
      ? `${this.cloudFrontUrl}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`

    this.logger.log(`S3 upload complete: ${key}`)
    return { url, key }
  }

  // --- Delete file ---
  async deleteFile(key: string): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] S3 delete: ${key}`)
      return
    }

    await this.s3!.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    )
    this.logger.log(`S3 delete complete: ${key}`)
  }

  async uploadPdfToCloudinary(buffer: Buffer, filename: string): Promise<string> {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL')
    if (!cloudinaryUrl) {
      this.logger.warn('[STUB] Cloudinary not configured — returning stub URL')
      return `https://stub-cloudinary.africover247.com/policies/${filename}`
    }

    return new Promise((resolve, reject) => {
      const publicId = `policies/${filename.replace('.pdf', '')}`
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          format: 'pdf',
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`)
            reject(error)
          } else {
            this.logger.log(`Cloudinary upload complete: ${result!.secure_url}`)
            resolve(result!.secure_url)
          }
        }
      )
      stream.end(buffer)
    })
  }

  // --- Upload PDF buffer ---
  async uploadPdf(buffer: Buffer, filename: string): Promise<string> {
    return this.uploadPdfToCloudinary(buffer, filename)
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

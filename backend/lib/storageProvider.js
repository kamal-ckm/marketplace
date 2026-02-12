/**
 * Storage Provider Abstraction
 *
 * Automatically selects the storage backend based on environment variables.
 * - If CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set -> Cloudinary
 * - Otherwise -> Local disk (MVP default, backwards-compatible)
 *
 * Both providers implement the same interface:
 *   upload(filePath, originalName) -> { url: string }
 *   getType() -> 'local' | 'cloudinary'
 */

const path = require('path');
const fs = require('fs');

class LocalStorageProvider {
  constructor(req) {
    this.req = req;
  }

  getType() {
    return 'local';
  }

  async upload(filePath, filename) {
    const protocol = this.req.protocol;
    const host = this.req.get('host');
    const url = `${protocol}://${host}/uploads/${filename}`;
    return { url };
  }
}

class CloudinaryStorageProvider {
  constructor() {
    this.cloudinary = require('cloudinary').v2;
    this.cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  getType() {
    return 'cloudinary';
  }

  async upload(filePath, filename) {
    const result = await this.cloudinary.uploader.upload(filePath, {
      folder: 'healthi-marketplace/products',
      public_id: path.parse(filename).name,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 1024, height: 1024, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });

    try {
      fs.unlinkSync(filePath);
    } catch (_) {}

    return { url: result.secure_url };
  }
}

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function getStorageProvider(req) {
  if (isCloudinaryConfigured()) {
    return new CloudinaryStorageProvider();
  }
  return new LocalStorageProvider(req);
}

module.exports = { getStorageProvider, isCloudinaryConfigured };

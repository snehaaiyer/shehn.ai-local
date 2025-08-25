// Note: Replit object storage not available, using mock implementation

interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface StorageObject {
  name: string;
  key?: string;
}

// Mock Replit Storage Client for testing
class Client {
  async uploadFromBytes(fileName: string, buffer: Buffer): Promise<void> {
    console.log(`Mock upload: ${fileName} (${buffer.length} bytes)`);
  }

  async list(): Promise<any[]> {
    return [];
  }
}

class ImageStorageService {
  private client: Client;

  constructor() {
    // Instantiate the mock client if Replit's object storage is not available
    this.client = new Client();
  }

  async uploadImageFromFile(file: File, imageName: string): Promise<ImageUploadResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await this.client.uploadFromBytes(imageName, buffer);

      return {
        success: true,
        url: `/api/storage/${imageName}`
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async uploadImageFromUrl(imageUrl: string, imageName: string): Promise<ImageUploadResult> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await this.client.uploadFromBytes(imageName, buffer);

      return {
        success: true,
        url: `/api/storage/${imageName}`
      };
    } catch (error) {
      console.error('Error uploading image from URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async getImageUrl(imageName: string): Promise<string> {
    return `/api/storage/${imageName}`;
  }

  async listImages(): Promise<string[]> {
    try {
      const result = await this.client.list();
      if (Array.isArray(result)) {
        return result.map((obj: any) => obj.name || obj.key);
      }
      return [];
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }
}

export const imageStorage = new ImageStorageService();
export default ImageStorageService;
// Mock implementation - Replit object storage not available

interface StorageObject {
  name: string;
  key?: string;
}

// Mock Replit Storage Client for testing
interface Client {
  uploadFromBytes(name: string, buffer: Buffer): Promise<void>;
  list(): Promise<any[]>;
}

// Mock implementation for development
interface MockClient {
  uploadFromBytes(name: string, buffer: Buffer): Promise<void>;
  list(): Promise<any[]>;
}

class MockClientImpl implements MockClient {
  async uploadFromBytes(name: string, buffer: Buffer): Promise<void> {
    console.log(`Mock upload: ${name}, size: ${buffer.length} bytes`);
  }

  async list(): Promise<any[]> {
    return [
      { name: 'sample1.jpg', key: 'sample1.jpg' },
      { name: 'sample2.jpg', key: 'sample2.jpg' }
    ];
  }
}

class ReplitStorageService {
  private client: MockClient;

  constructor() {
    this.client = new MockClientImpl();
  }

  async uploadImage(imageName: string, imageFile: File): Promise<string> {
    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await this.client.uploadFromBytes(imageName, buffer);
      return this.getImageUrl(imageName);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async uploadImageFromUrl(imageName: string, imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await this.client.uploadFromBytes(imageName, buffer);
      return this.getImageUrl(imageName);
    } catch (error) {
      console.error('Error uploading image from URL:', error);
      throw error;
    }
  }

  getImageUrl(imageName: string): string {
    // Return the public URL for the image
    return `/api/storage/images/${imageName}`;
  }

  async listImages(): Promise<string[]> {
    try {
      const result = await this.client.list();
      // The list() method returns an array of StorageObject directly
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

export const replitStorage = new ReplitStorageService();
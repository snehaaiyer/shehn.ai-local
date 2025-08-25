// Mock implementation - Replit object storage not available
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

class MockClient {
  async uploadFromBytes(fileName: string, buffer: Buffer): Promise<void> {
    console.log(`Mock upload: ${fileName} (${buffer.length} bytes)`);
  }

  async list(): Promise<any[]> {
    return [];
  }
}

class ReplitStorageService {
  private client: MockClient;

  constructor() {
    // Assuming Client is a global or imported class that MockClient should implement.
    // For now, we use MockClient as per the provided structure.
    this.client = new MockClient();
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
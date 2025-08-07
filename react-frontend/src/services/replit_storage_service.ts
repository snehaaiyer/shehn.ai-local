
import { Client } from '@replit/object-storage';

class ReplitStorageService {
  private client: Client;

  constructor() {
    this.client = new Client();
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
      if (result && 'success' in result && result.success && result.data) {
        return result.data.map((obj: any) => obj.key);
      } else if (Array.isArray(result)) {
        return result.map((obj: any) => obj.key);
      }
      return [];
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }
}

export const replitStorage = new ReplitStorageService();

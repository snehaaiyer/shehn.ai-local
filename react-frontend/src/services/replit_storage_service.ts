
import { Client } from '@replit/object-storage';

class ReplitStorageService {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async uploadImage(imageName: string, imageFile: File): Promise<string> {
    try {
      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      await this.client.uploadFromBytes(imageName, uint8Array);
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
      const uint8Array = new Uint8Array(arrayBuffer);
      
      await this.client.uploadFromBytes(imageName, uint8Array);
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
      const objects = await this.client.list();
      return objects.map((obj: any) => obj.key);
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }
}

export const replitStorage = new ReplitStorageService();

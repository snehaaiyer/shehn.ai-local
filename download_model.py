import os
import requests
from pathlib import Path

def download_model():
    """Download the Llama2 7B chat model in GGUF format"""
    print("🔄 Creating models directory...")
    models_dir = Path("./models")
    models_dir.mkdir(exist_ok=True)
    
    model_path = models_dir / "llama-2-7b-chat.gguf"
    
    if model_path.exists():
        print("✅ Model already exists!")
        return
    
    print("🔄 Downloading Llama2 7B chat model...")
    # Using a smaller, quantized version of Llama2 that's freely available
    url = "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf"
    
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(model_path, 'wb') as f:
        if total_size == 0:
            f.write(response.content)
        else:
            downloaded = 0
            total_size_mb = total_size / (1024 * 1024)
            for data in response.iter_content(chunk_size=4096):
                downloaded += len(data)
                f.write(data)
                done = int(50 * downloaded / total_size)
                mb_downloaded = downloaded / (1024 * 1024)
                print(f"\rDownloading: [{'=' * done}{' ' * (50-done)}] {mb_downloaded:.1f}/{total_size_mb:.1f} MB", end='')
    print("\n✅ Model downloaded successfully!")

if __name__ == "__main__":
    download_model() 
import subprocess
import pkg_resources

# Check Ollama version
def check_ollama_version():
    result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
    print("Ollama version:", result.stdout.strip())

# Check installed models
def check_ollama_models():
    result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
    print("Ollama models:\n", result.stdout.strip())

# Check CrewAI version
def check_crewai_version():
    version = pkg_resources.get_distribution("crewai").version
    print("CrewAI version:", version)

# Check CrewAI Tools version
def check_crewai_tools_version():
    try:
        version = pkg_resources.get_distribution("crewai-tools").version
        print("CrewAI Tools version:", version)
    except pkg_resources.DistributionNotFound:
        print("CrewAI Tools not installed.")

if __name__ == "__main__":
    print("\n=== Environment Check ===")
    check_ollama_version()
    check_ollama_models()
    print("\n=== Package Versions ===")
    check_crewai_version()
    check_crewai_tools_version() 
#!/usr/bin/env python3
"""
Simple AI Study Tutor Runner
Just runs backend with uvicorn and frontend with npm run dev
"""

import subprocess
import time
import sys
import signal
import os
from pathlib import Path

class SimpleRunner:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.frontend_dir = self.project_root / "frontend"
        self.backend_process = None
        self.frontend_process = None
        self.running = True

    def start_backend(self):
        """Start the FastAPI backend with uvicorn."""
        print("Starting backend (uvicorn)...")
        try:
            self.backend_process = subprocess.Popen(
                ["uvicorn", "backend.api.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
                cwd=self.project_root
            )
            print("Backend started on http://127.0.0.1:8000")
            return True
        except Exception as e:
            print(f"Failed to start backend: {e}")
            return False

    def start_frontend(self):
        """Start the React frontend with npm run dev."""
        print("Starting frontend (npm run dev)...")
        try:
            self.frontend_process = subprocess.Popen(
                ["C:\\Program Files\\nodejs\\npm.cmd", "run", "dev"],
                cwd=self.frontend_dir
            )
            print("Frontend started on http://localhost:5173")
            return True
        except Exception as e:
            print(f"Failed to start frontend: {e}")
            return False

    def stop_all(self):
        """Stop all running processes."""
        print("\nStopping all services...")
        self.running = False
        
        if self.backend_process:
            self.backend_process.terminate()
            print("Backend stopped")
        
        if self.frontend_process:
            self.frontend_process.terminate()
            print("Frontend stopped")

    def signal_handler(self, signum, frame):
        """Handle interrupt signals."""
        print(f"\nReceived signal {signum}, shutting down...")
        self.stop_all()
        sys.exit(0)

    def run(self):
        """Main run method."""
        print("AI Study Tutor - Simple Runner")
        print("=" * 40)
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Start backend
        if not self.start_backend():
            sys.exit(1)
        
        # Wait a moment for backend to start
        time.sleep(2)
        
        # Start frontend
        if not self.start_frontend():
            self.stop_all()
            sys.exit(1)
        
        print("\nProject is running!")
        print("Frontend: http://localhost:5173")
        print("Backend API: http://127.0.0.1:8000")
        print("API Docs: http://127.0.0.1:8000/docs")
        print("\nPress Ctrl+C to stop all services")
        
        # Keep the main thread alive
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop_all()

if __name__ == "__main__":
    runner = SimpleRunner()
    runner.run()

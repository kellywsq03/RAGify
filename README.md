# Installation

Follow these steps to set up and run the project:

1. **Clone the repository**  
   Clone this repo to your local machine:
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```

2. **Open three separate terminal shells**

3. **Install dependencies.**
    
    a) In the first shell, navigate to the frontend folder:
    ```bash
    cd frontend/
    npm install       # Install dependencies
    ```
    b) In the second shell, navigate to the backend folder:
    ```bash
    cd frontend/
    npm install       # Install dependencies
    ```
    c) In the third shell, navigate to the api folder: 
    ```bash
    cd api/
    python3 -m venv venv     # Create a virtual environment
    source venv/bin/activate # Activate the virtual environment
    pip install -r requirements.txt  # Install required Python packages
    ```

4. **Run the frontend**
    
    In the first shell,
    ```bash
    npm run dev 
    ```

5. **Run the backend**

    In the second shell,
    ```bash
    npm run start:dev
    ```

6. **Run the api**

    In the third shell,
    ```bash
    uvicorn server:app --host 0.0.0.0 --port 8000
    ```
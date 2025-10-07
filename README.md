# Demo
Watch a demo of this project [here](https://youtu.be/hpRBZ6XxBQk).

# Installation

Follow these steps to set up and run the project:

1. **Clone the repository**  
   Clone this repo to your local machine:
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```

2. **Create a supabase project and a storage bucket called "pdfs"**
- Configure the bucket to allow insert and select

3. **Open three separate terminal shells**

4. **Install dependencies.**
    
    a) In the first shell, navigate to the frontend folder:
    ```bash
    cd frontend/
    npm install       # Install dependencies
    ```

    b) In the second shell, navigate to the backend folder:
    ```bash
    cd frontend/
    npm install   # Install dependencies
    ```
    Define the following keys in a .env file:
    ```
    SUPABASE_URL=<YOUR_SUPABASE_URL>
    SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_KEY>
    SUPABASE_BUCKET=pdfs
    PY_API_URL='http://localhost:8000'
    ```
    c) In the third shell, navigate to the api folder: 
    ```bash
    cd api/
    python3 -m venv venv     # Create a virtual environment
    source venv/bin/activate # Activate the virtual environment
    pip install -r requirements.txt  # Install required Python packages
    ```
    Define the following keys in ```consts.env```
    ```
    SUPABASE_URL=<YOUR_SUPABASE_URL>
    SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_KEY>
    CHROMA_PATH="chroma"
    GOOGLE_API_KEY=<YOUR_GOOGLE_API_KEY>
    ```

5. **Run the frontend**
    
    In the first shell,
    ```bash
    npm run dev 
    ```

6. **Run the backend**

    In the second shell,
    ```bash
    npm run start:dev
    ```

7. **Run the api**

    In the third shell,
    ```bash
    uvicorn server:app --host 0.0.0.0 --port 8000
    ```

8. Sample data for testing can be found in ```api/data```.
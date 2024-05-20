# Markprompt Backend Application

Welcome to the Markprompt Backend Application! This project is a full-stack application designed to showcase my skills in creating a robust backend for a chat application with fallback mechanisms for AI models. The application uses OpenAI and Gemini by Google for generating responses and is wrapped in a Docker container for easy deployment.

## Features

- **AI-Powered Chat:** Utilizes OpenAI and Gemini models to provide intelligent responses.
- **Fallback Mechanism:** Automatically switches between AI models if one is down.
- **Customer Support Agent:** The AI models are instructed to act as customer support agents.
- **Stateful Conversations:** Maintains conversation history for context-aware interactions.
- **Dockerized Deployment:** Containerized application for seamless setup and deployment.

## Project Structure

- **Frontend:** Built with Next.js and React, providing a user-friendly chat interface.
- **Backend:** Handles API requests, integrates with AI models, and manages conversation state.
- **Docker:** Dockerfile and Docker Compose for containerization.

## Running the Application

### Prerequisites

- **Docker**: Make sure Docker is installed on your machine. You can download it [here](https://www.docker.com/get-started).

### Running Locally with Docker

1. **Pull the Docker Image:**

   ```bash
   docker pull pablaso/markprompt-backend-app:v1.0
   ```
2. **Run the Docker Container:**
   ```bash
   docker run -d -p 3000:3000 --name markprompt-backend-app pablaso/markprompt-backend-app:v1.0
   ```

3. **Access the Application:**

Open your browser and navigate to ```http://localhost:3000``` to see the application in action.


### Building and Running Locally
If you prefer to build and run the application locally, follow these steps:

1. **Clone the Repository:**

```bash
git clone https://github.com/yourusername/markprompt-backend.git
cd markprompt-backend
```

2. **Install Dependencies:**

```bash
npm install
```

3. **Set Up Environment Variables:**

Create a .env.local file in the root directory and add your API keys:

```bash
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

4. **Run the Application:**

```bash
npm run dev
```

4. **Access the Application:**

Open your browser and navigate to ```http://localhost:3000```.


## Usage
1. **Start a New Chat:**

Click on "New Chat" to start a new conversation. You will be prompted to enter your name and describe your problem.

2. **Interact with the AI:**

Type your messages in the input box and click "Send". The AI will respond as a customer support agent, providing helpful information and troubleshooting steps.

3. **View AI Status:**

The top-right corner displays the status of the AI models (OpenAI and Gemini), indicating whether they are up, down, or active.

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.

## Contact
If you have any questions or feedback, feel free to reach out to me at lasomielgopablo@gmail.com.




   


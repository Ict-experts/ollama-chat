# Ollama Chat

A modern chat interface for Ollama AI models with chat history and dark mode support. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🤖 Chat with any Ollama AI model
- 💾 Local chat history persistence
- 🌓 Dark/Light mode
- 📱 Responsive design with mobile support
- 🍔 Collapsible sidebar navigation
- ⚡ Real-time streaming responses
- 🔄 Multiple chat sessions support

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- [Ollama](https://ollama.ai/) installed and running locally

## Setup Instructions

1. **Install Ollama**
   ```bash
   # For macOS
   curl https://ollama.ai/install.sh | sh

   # For Linux
   curl https://ollama.ai/install.sh | sh

   # For Windows
   # Visit https://ollama.ai/download
   ```

2. **Pull an AI Model**
   ```bash
   # Example: Pull the Llama 2 model
   ollama pull llama2
   ```

3. **Start Ollama Server**
   ```bash
   ollama serve
   ```

4. **Clone the Repository**
   ```bash
   git clone [your-repo-url]
   cd ollama-chat
   ```

5. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

6. **Start the Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open the Application**
   - Navigate to `http://localhost:5173` in your browser

## Usage

1. **Select a Model**
   - Choose an AI model from the dropdown menu in the top-right corner

2. **Start a New Chat**
   - Click "New Chat" in the sidebar to start a fresh conversation

3. **Send Messages**
   - Type your message in the input field at the bottom
   - Press Enter or click Send to submit

4. **Manage Chats**
   - Access previous chats from the sidebar
   - Delete unwanted chats using the X button
   - Switch between different chat sessions

5. **Toggle Dark Mode**
   - Click the sun/moon icon in the top-right corner to switch themes

## Development

- Built with Vite + React
- Uses TypeScript for type safety
- Styled with Tailwind CSS
- Uses browser cookies for persistence

## API Endpoints

The application communicates with Ollama's local API:
- `GET http://localhost:11434/api/tags` - Fetch available models
- `POST http://localhost:11434/api/generate` - Generate AI responses

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

1. **Ollama Server Not Responding**
   - Ensure Ollama is running with `ollama serve`
   - Check if the server is accessible at `http://localhost:11434`

2. **Models Not Loading**
   - Verify you have pulled at least one model using `ollama pull`
   - Check the browser console for API errors

3. **Chat History Not Persisting**
   - Ensure cookies are enabled in your browser
   - Clear browser cookies if experiencing issues

## Support

For support, please open an issue in the GitHub repository.

# Threadify

An AI-powered discussion platform with intelligent content moderation, real-time messaging, and community management features.

## 🚀 Features

### Core Features
- **User Authentication**
  - Email/Password authentication with JWT tokens
  - Email verification system
  - Password reset functionality
  - Multiple authentication strategies (OTP, Advanced Auth)

- **Post Management**
  - Create posts with text, images, or videos
  - AI-powered content moderation
  - Topic classification
  - Sensitive content redaction
  - Like/Unlike posts
  - Save posts to collections
  - Edit and delete posts
  - Real-time moderation warnings

- **Community System**
  - Create and join communities
  - Community-specific posts
  - Community search and discovery

- **Comments & Discussions**
  - Nested comment threads
  - AI moderation for comments
  - Discussion summarization (20+ comments)

- **User Profiles**
  - Customizable profiles with avatar and banner
  - Follow/Unfollow users
  - View user posts and comments
  - Profile statistics

- **Real-time Features**
  - WebSocket support for live updates
  - Real-time notifications
  - Direct messaging system

- **AI-Powered Moderation**
  - Multi-agent content moderation
  - Safety scoring (0-100)
  - Risk level assessment (LOW/MEDIUM/HIGH)
  - Automatic flagging of harmful content
  - PII redaction
  - Topic classification

- **Search & Discovery**
  - Global search across posts and users
  - Topic-based filtering
  - Sort by new/top posts

- **Admin Dashboard**
  - Review flagged content
  - User risk scoring
  - Approve/reject posts
  - Platform analytics

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.128.7
- **Database**: MongoDB (PyMongo 4.16.0)
- **Authentication**: JWT (python-jose 3.5.0)
- **Password Hashing**: bcrypt 5.0.0
- **AI/ML**: 
  - Hugging Face Transformers
  - SafeTensors 0.7.0
  - Tokenizers 0.22.2
- **Email**: SMTP with email-validator 2.3.0
- **WebSockets**: websockets 16.0
- **File Upload**: python-multipart 0.0.22
- **Server**: Uvicorn 0.40.0

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.3.1
- **Routing**: React Router DOM 7.13.0
- **HTTP Client**: Axios 1.13.5
- **Styling**: CSS with theme system (dark/light mode)

### Development Tools
- **Linting**: ESLint 9.39.1
- **Type Checking**: TypeScript types for React
- **Hot Reload**: Vite HMR + React SWC

## 📁 Project Structure

```
threadify/
├── backend/
│   ├── app/
│   │   ├── ai/                      # AI moderation modules
│   │   │   ├── moderation_agent.py
│   │   │   ├── multi_agent.py
│   │   │   ├── redactor.py
│   │   │   ├── summarizer.py
│   │   │   └── topic_classifier.py
│   │   ├── models/                  # Pydantic models
│   │   │   ├── auth.py
│   │   │   ├── comment.py
│   │   │   ├── community.py
│   │   │   ├── message.py
│   │   │   ├── notification.py
│   │   │   ├── post.py
│   │   │   └── user.py
│   │   ├── routes/                  # API endpoints
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── comments.py
│   │   │   ├── communities.py
│   │   │   ├── messages.py
│   │   │   ├── notifications.py
│   │   │   ├── posts.py
│   │   │   ├── search.py
│   │   │   └── users.py
│   │   ├── utils/                   # Utilities
│   │   │   ├── dependencies.py
│   │   │   ├── email_service.py
│   │   │   ├── jwt.py
│   │   │   ├── security.py
│   │   │   └── socket_manager.py
│   │   ├── database.py              # MongoDB connection
│   │   └── main.py                  # FastAPI app
│   ├── uploads/                     # User uploads
│   │   ├── images/
│   │   └── videos/
│   ├── .env                         # Environment variables
│   └── requirements.txt             # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # API client
│   │   ├── components/              # React components
│   │   │   ├── CommentCard.jsx
│   │   │   ├── CommentSection.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── GlobalSearch.jsx
│   │   │   └── ...
│   │   ├── context/                 # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Posts.jsx
│   │   │   ├── Communities.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ...
│   │   ├── utils/                   # Utility functions
│   │   │   ├── formatters.js
│   │   │   └── dateUtils.js
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   ├── package.json                 # Node dependencies
│   └── vite.config.js               # Vite configuration
│
└── README.md
```

## 🔧 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas account (or local MongoDB)
- Hugging Face API token

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/threadify
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

HF_API_TOKEN=your-huggingface-token
```

5. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:8000
```

4. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🌐 API Overview

### Authentication Endpoints
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/verify-email` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email

### Post Endpoints
- `GET /posts/` - Get all posts (paginated)
- `POST /posts/` - Create new post (text/image/video)
- `GET /posts/feed` - Get personalized feed
- `POST /posts/like/{post_id}` - Like/unlike post
- `PUT /posts/{post_id}` - Update post
- `DELETE /posts/{post_id}` - Delete post
- `GET /posts/flagged` - Get flagged posts (admin)
- `POST /posts/moderate-check` - Real-time moderation check
- `GET /posts/{post_id}/summarize` - AI discussion summary

### User Endpoints
- `GET /users/me` - Get current user profile
- `GET /users/u/{username}` - Get user profile
- `GET /users/u/{username}/posts` - Get user posts
- `GET /users/u/{username}/comments` - Get user comments
- `POST /users/u/{username}/follow` - Follow/unfollow user
- `PATCH /users/profile` - Update profile

### Community Endpoints
- `GET /communities/` - List all communities
- `POST /communities/` - Create community
- `GET /communities/{slug}` - Get community details
- `POST /communities/{slug}/join` - Join community
- `GET /communities/{slug}/posts` - Get community posts

### Comment Endpoints
- `POST /comments/{post_id}` - Add comment
- `GET /comments/{post_id}` - Get post comments
- `DELETE /comments/{comment_id}` - Delete comment

### Message Endpoints
- `GET /messages/conversations` - Get user conversations
- `GET /messages/{conversation_id}` - Get conversation messages
- `POST /messages/send` - Send message

### Search Endpoints
- `GET /search/` - Global search
- `GET /search/users` - Search users
- `GET /search/communities` - Search communities

### WebSocket
- `WS /ws?token={jwt_token}` - Real-time connection

## 🔐 Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | Example: `mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_ALGORITHM` | JWT algorithm (HS256) | Yes |
| `JWT_EXPIRE_MINUTES` | Token expiration time | Yes |
| `EMAIL_USER` | SMTP email address | Yes |
| `EMAIL_PASSWORD` | SMTP app password | Yes |
| `SMTP_SERVER` | SMTP server address | Yes |
| `SMTP_PORT` | SMTP port (587) | Yes |
| `HF_API_TOKEN` | Hugging Face API token | Yes |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | No (defaults to localhost:8000) |

## 🚀 Running the Project

### Development Mode

1. Start backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

2. Start frontend:
```bash
cd frontend
npm run dev
```

### Production Build

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

Backend:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🧪 Testing

Backend tests:
```bash
cd backend
python -m pytest
```

Frontend linting:
```bash
cd frontend
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Backend: Follow PEP 8 guidelines
- Frontend: Use ESLint configuration provided
- Write meaningful commit messages
- Add comments for complex logic

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React team for the UI library
- Hugging Face for AI/ML models
- MongoDB for the database solution

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with using FastAPI, React, and AI**

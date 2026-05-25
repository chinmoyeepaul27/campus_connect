# Campus_Connect

A comprehensive campus management system built with React.js frontend and Django backend framework. This user-friendly platform helps students and faculty manage campus activities, events, clubs, and academic resources.

## Features

- **User Authentication**: Secure login/signup with password reset functionality
- **Club Management**: Join clubs, manage memberships with payment integration
- **Event Management**: Create, view, edit, and register for campus events
- **Notes Sharing**: Upload and share academic notes with the community
- **Notifications**: Real-time campus updates and announcements
- **User Profiles**: Manage personal information and profile pictures
- **Admin Panels**: Dedicated admin interfaces for club and event management
- **Payment System**: Integrated payment processing for club memberships
- **Activity Tracking**: Monitor user activities and engagement

## Tech Stack

### Frontend

- **React.js**: Modern JavaScript library for building user interfaces
- **Vite**: Fast build tool and development server
- **Axios**: HTTP client for API communication
- **CSS3**: Modern styling with responsive design

### Backend

- **Django**: High-level Python web framework
- **Django REST Framework**: Powerful toolkit for building Web APIs
- **Token Authentication**: Secure API authentication
- **SQLite**: Database for development (easily configurable for production)

## Project Structure

```
Campus_Connect/
├── Campus_Frontend/          # React.js frontend application
│   ├── src/
│   │   ├── component/        # React components
│   │   ├── axiosConfig.js    # API configuration
│   │   └── App.jsx          # Main application component
│   ├── index.html
│   └── package.json
├── campus_backend/           # Django backend application
│   ├── projects/            # Main Django app
│   │   ├── models.py        # Database models
│   │   ├── views.py         # API views
│   │   ├── serializers.py   # API serializers
│   │   └── urls.py          # URL routing
│   ├── campus_backend/      # Django project settings
│   └── manage.py
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd campus_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

```bash
cd Campus_Frontend
npm install
npm run dev
```

## 🌐 API Endpoints

### Authentication

- `POST /api/login/` - User login
- `POST /api/signup/` - User registration
- `POST /api/logout/` - User logout
- `GET /api/userinfo/` - Get user information

### Events

- `GET /api/events/` - List all events
- `POST /api/events/` - Create new event (admin only)
- `GET /api/events/{id}/` - Get event details
- `PUT /api/events/{id}/` - Update event (admin only)
- `POST /api/events/{id}/register/` - Register for event
- `POST /api/events/{id}/unregister/` - Unregister from event

### Clubs

- `GET /api/clubs/` - List all clubs
- `POST /api/clubs/` - Create new club (admin only)
- `POST /api/clubs/{id}/join/` - Join club with payment

### Notes

- `GET /api/notes/` - List all notes
- `POST /api/notes/upload/` - Upload new note

### Notifications

- `GET /api/notifications/` - Get all notifications

## Features Overview

### Student Features

- Browse and join clubs
- Register for events
- Upload and download notes
- View notifications
- Manage profile

### Admin Features

- Create and manage events
- Manage club memberships
- View payment history
- Send notifications
- User management

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your_secret_key_here
DEBUG=True
FRONTEND_URL=http://localhost:5173
```

### Database Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy the dist/ folder
```

### Backend (Heroku/Railway)

```bash
# Configure production settings
# Update ALLOWED_HOSTS
# Set up production database
```



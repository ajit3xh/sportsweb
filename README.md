# GovSports - Premium Sports Facility Management System

A full-stack, state-of-the-art web application designed to digitize and manage sports facility bookings for government, educational, or institutional use. The platform enables verified users to register, purchase membership tiers, and book sports facilities through predefined time slots, while providing administrators complete control over approvals, scheduling, and discipline enforcement.

![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black) ![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC) ![Django](https://img.shields.io/badge/Backend-Django_REST-092E20) ![SQLite](https://img.shields.io/badge/Database-SQLite-003B57)

## ✨ Key Features

### For Users
- **Secure Authentication:** Registration with approval workflows, login, and password resets via OTP.
- **Dynamic Memberships:** View available membership tiers, their associated perks, and purchase plans securely.
- **Real-Time Booking:** Browse available sports facilities, check capacity, and book specific time slots. Rules prevent overlapping sessions.
- **Personal Dashboard:** Track active/past bookings, view membership status, and manage profile information.
- **Premium UI:** Dark mode by default with a luxurious "black and gold" aesthetic, smooth animations, and responsive design.

### For Administrators
- **Centralized Dashboard:** Real-time analytics on users, total bookings, active memberships, and revenue.
- **Facility & Calendar Management:** View bookings on a visual calendar. Easily close specific slots or entire days for maintenance or events.
- **Force Booking:** Override standard capacity limits and manually allocate facility slots to specific users directly from the calendar.
- **User Moderation:** Approve new user registrations, track user activity, and temporarily ban users for policy violations.
- **Dynamic Content:** Update pricing plans, manage gallery images, and toggle facility availability instantly.

## 🛠️ Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (React framework for server-side rendering and static generation)
- [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework for custom styling)
- [Lucide React](https://lucide.dev/) (Beautiful SVG icons)

**Backend:**
- [Django](https://www.djangoproject.com/) (Python web framework)
- [Django REST Framework](https://www.django-rest-framework.org/) (For building robust APIs)
- [SQLite](https://sqlite.org/) (Default local database, easily swappable to PostgreSQL)

---

## 🚀 Local Development Setup

### Prerequisites
Make sure you have the following installed on your machine:
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/ajit3xh/sportsweb.git
cd sportsweb
```

### 2. Backend Setup (Django)
Open a terminal in the root directory (`sportsweb/`) to set up the Python backend.

```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Create a superuser (Admin account)
python manage.py createsuperuser

# Start the Django development server
python manage.py runserver 8000
```
*The backend API will be running at `http://127.0.0.1:8000/api/v1/`.*

### 3. Frontend Setup (Next.js)
Open a **new, separate terminal** in the `frontend/` directory to set up the React application.

```bash
# Navigate to the frontend folder
cd frontend

# Install Node.js dependencies
npm install

# Start the Next.js development server
npm run dev
```
*The frontend application will be running at `http://localhost:3000`.*

---

## 📖 License
This project is proprietary and intended for institutional use. Unauthorized copying, distribution, or modification is prohibited without explicit permission.

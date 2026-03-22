# Telegram Automation Panel - Complete System Guide

## Overview

This is a professional Telegram automation and campaign management panel built with Next.js 16, Supabase, and modern TypeScript. The system provides a secure, scalable platform for managing Telegram accounts, running automation campaigns, and tracking member interactions.

## Key Features

### Authentication & Security
- **Supabase Auth Integration**: Native Supabase authentication with email/password login
- **Session Management**: Server-side middleware protection with automatic session validation
- **Protected Routes**: Automatic redirection to login for unauthenticated users
- **Auth Context**: Client-side auth state management with React Context API
- **Secure Logout**: Proper session cleanup and token management

### Dashboard System
- **Overview Stats**: Real-time statistics on accounts, campaigns, members, and messages
- **Activity Feed**: Recent activity logs with status indicators
- **Responsive Design**: Mobile-first design that works across all devices
- **Performance**: Optimized data fetching with Supabase queries

### Account Management
- **Multi-Account Support**: Manage multiple Telegram accounts
- **Account Status Tracking**: Monitor connection status and last activity
- **Add/Delete Accounts**: Easy account management interface

### Additional Features
- **Campaigns Management**: Create and track campaigns
- **Member Management**: Track scraped members and their status
- **Activity Logging**: Comprehensive logging of all system actions
- **Real-Time Updates**: Live data refresh with Supabase subscriptions

## Login Credentials

**Demo Account:**
- Email: `bogos300@gmail.com`
- Password: `lonake300@@`

These credentials are pre-filled in the login form for easy testing.

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19.2** - Latest React version
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS
- **Shadcn/UI** - High-quality component library
- **Lucide React** - Modern icon library
- **Sonner** - Toast notifications

### Backend & Database
- **Supabase** - PostgreSQL database with auth
- **Middleware.ts** - Route protection and auth checks
- **Server Components** - Efficient server-side rendering

### Authentication
- **@supabase/ssr** - Server-side authentication
- **@supabase/supabase-js** - Client-side Supabase integration
- **Session Persistence** - Secure cookie-based sessions

## File Structure

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Root redirect to login
├── providers.tsx              # Auth context and Sonner provider
├── login/
│   └── page.tsx              # Login page with demo credentials
├── dashboard/
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Main dashboard with stats
│   ├── accounts/
│   │   └── page.tsx          # Account management
│   ├── campaigns/
│   │   └── page.tsx          # Campaign management
│   ├── members/
│   │   └── page.tsx          # Member management
│   └── logs/
│       └── page.tsx          # Activity logs
├── globals.css               # Design tokens and styles
└── api/                       # API routes (if needed)

lib/
├── auth.ts                   # Server-side auth utilities
└── supabase-client.ts        # Client-side Supabase client

middleware.ts                 # Route protection middleware
scripts/
├── 01_create_schema.sql     # Database schema
└── 02_seed_demo_user.sql    # Demo data seed
```

## How It Works

### Authentication Flow
1. **User visits /login** → Presented with login form with pre-filled demo credentials
2. **User clicks Sign In** → Credentials sent to Supabase Auth
3. **Successful login** → Session created, redirected to /dashboard
4. **Middleware checks** → Every request to /dashboard is validated
5. **Unauthorized access** → Redirected back to /login

### Dashboard Flow
1. **Auth Context loads** → Checks for active session on app mount
2. **User auth state updates** → All components using useAuth() get updated
3. **Dashboard Layout renders** → Shows sidebar with navigation
4. **Stats fetched** → Real-time data pulled from Supabase
5. **Activity feed updates** → Recent logs displayed with status

### Data Flow
1. **Components use useAuth()** → Access current user and logout function
2. **createClient() from lib** → Get Supabase client instance
3. **Supabase queries** → Row-Level Security (RLS) enforced at database level
4. **Results cached/updated** → State management with useState hooks
5. **UI updates automatically** → React re-renders with new data

## Database Schema

### Tables
- **auth.users** - Supabase auth users (auto-managed)
- **profiles** - User profile information
- **telegram_accounts** - Connected Telegram accounts per user
- **campaigns** - Automation campaigns with progress tracking
- **members** - Members scraped from campaigns
- **logs** - Activity logs for auditing

### Row-Level Security (RLS)
All tables have RLS enabled. Users can only:
- View their own data
- Insert data associated with their user_id
- Update/delete their own records

## How to Run

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Set Up Environment Variables
The Supabase integration provides these automatically:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Database connection strings

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` - you'll be redirected to login.

### 4. Login with Demo Credentials
- Email: `bogos300@gmail.com`
- Password: `lonake300@@`

## Key Code Patterns

### Using Auth Context
```tsx
import { useAuth } from '@/app/providers'

export default function MyComponent() {
  const { user, logout, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {user?.email}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Fetching Data with Supabase
```tsx
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/app/providers'

export default function MyPage() {
  const { user } = useAuth()
  const supabase = createClient()
  
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
      
      // Handle data/error
    }
    
    if (user?.id) fetchData()
  }, [user?.id])
}
```

## Styling & Design

### Color Scheme
- **Primary Blue**: `#24A1DE` (Telegram Blue)
- **Background**: `#0f172a` (Slate-950)
- **Card Background**: `#1e293b` (Slate-800)
- **Text**: `#f1f5f9` (Slate-100)
- **Muted**: `#94a3b8` (Slate-400)

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Design Tokens
All colors and spacing use Tailwind CSS v4 design tokens defined in `globals.css`.

## Common Tasks

### Add a New Page
1. Create directory: `app/dashboard/newpage/`
2. Create `page.tsx` with 'use client' directive
3. Use `useAuth()` for protected content
4. Add navigation link to `dashboard/layout.tsx`

### Fetch Data from Database
1. Use `createClient()` from `@/lib/supabase-client`
2. Query with RLS-enforced user_id
3. Handle loading and error states
4. Update UI with results

### Logout User
1. Call `logout()` from `useAuth()` hook
2. Automatically clears session and redirects to login

## Troubleshooting

### "User not authenticated" errors
- Check middleware.ts is protecting `/dashboard` routes
- Verify Supabase environment variables are set
- Check browser cookies for auth token

### Data not loading
- Verify RLS policies in Supabase
- Check user_id is correctly set in queries
- Test query directly in Supabase dashboard

### Login not working
- Check demo credentials match database
- Verify NEXT_PUBLIC_SUPABASE_URL and ANON_KEY
- Check browser console for Supabase errors

## Performance Optimizations

- **Server Components**: Used for static layout
- **Client Components**: Only where interactivity needed
- **Middleware**: Reduces unnecessary server requests
- **Query Optimization**: Fetch only needed columns
- **Caching**: Browser caching for images/assets

## Security Best Practices

- ✅ Row-Level Security on all tables
- ✅ Secure session management with HTTPOnly cookies
- ✅ Input validation on forms
- ✅ Middleware protection on routes
- ✅ No sensitive data in client components
- ✅ Environment variables for secrets

## Next Steps

1. **Customize branding**: Update colors and logos
2. **Add more pages**: Following the pattern established
3. **Integrate Telegram API**: For real account management
4. **Add webhooks**: For real-time updates
5. **Implement notifications**: For campaign events

---

**Built with ❤️ using v0 and Supabase**

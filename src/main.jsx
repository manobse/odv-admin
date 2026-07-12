import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { Layout } from './components/Layout'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Sports     from './pages/Sports'
import Courts     from './pages/Courts'
import Charges    from './pages/Charges'
import Taxes      from './pages/Taxes'
import Players    from './pages/Players'
import Bookings   from './pages/Bookings'
import Income     from './pages/Income'
import Expenses   from './pages/Expenses'
import Categories from './pages/Categories'
import Staff      from './pages/Staff'
import Payroll    from './pages/Payroll'
import Reports    from './pages/Reports'
import Audit      from './pages/Audit'
import Roles      from './pages/Roles'
import MyProfile  from './pages/MyProfile'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}>
      <div style={{ width:32,height:32,border:'3px solid #2a2a3e',borderTopColor:'#7c6fff',borderRadius:'50%',animation:'spin .7s linear infinite' }}/>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <Guard>
                <Layout>
                  <Routes>
                    <Route path="/"            element={<Dashboard />} />
                    <Route path="/sports"      element={<Sports />} />
                    <Route path="/courts"      element={<Courts />} />
                    <Route path="/charges"     element={<Charges />} />
                    <Route path="/taxes"       element={<Taxes />} />
                    <Route path="/players"     element={<Players />} />
                    <Route path="/bookings"    element={<Bookings />} />
                    <Route path="/income"      element={<Income />} />
                    <Route path="/expenses"    element={<Expenses />} />
                    <Route path="/categories"  element={<Categories />} />
                    <Route path="/staff"       element={<Staff />} />
                    <Route path="/payroll"     element={<Payroll />} />
                    <Route path="/reports"     element={<Reports />} />
                    <Route path="/audit"       element={<Audit />} />
                    <Route path="/roles"       element={<Roles />} />
                    <Route path="/profile"     element={<MyProfile />} />
                  </Routes>
                </Layout>
              </Guard>
            }/>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

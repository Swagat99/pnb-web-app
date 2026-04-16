import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'
import TransactionReports from './pages/TransactionReports'
import QRDetails from './pages/QRDetails'
import LanguageUpdate from './pages/LanguageUpdate'
import HelpSupport from './pages/HelpSupport'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/redirected" element={<Callback />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transaction-reports" element={<TransactionReports />} />
      <Route path="/qr-details" element={<QRDetails />} />
      <Route path="/language-update" element={<LanguageUpdate />} />
      <Route path="/help-support" element={<HelpSupport />} />
    </Routes>
  )
}

export default App
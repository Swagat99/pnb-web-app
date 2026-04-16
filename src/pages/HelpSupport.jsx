import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout, isTokenValid, redirectToHome } from '../auth/authService'
import { fetchVPADetails } from '../api/vpaService'
import pnbLogo from '../assets/pnb-logo.png'
import profileImage from '../assets/profile-image.png'
import '../css/Dashboard.css'
import '../css/HelpSupport.css'
import { DashboardOutlined } from '@ant-design/icons'

const menuItems = [
    {
        icon: <DashboardOutlined style={{ fontSize: '18px' }} />,
        label: 'Dashboard'
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
        label: 'Transaction Reports'
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
        label: 'QR Details'
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
        label: 'Language Update'
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        label: 'Help & Support'
    },
]

function HelpSupport() {
    const [user, setUser] = useState(null)
    const [activeMenu, setActiveMenu] = useState('Help & Support')
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
    const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false)
    const [deviceDetails, setDeviceDetails] = useState(null)
    const [merchantAccountNumber, setMerchantAccountNumber] = useState('')
    const [activeVpa, setActiveVpa] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        if (!isTokenValid()) {
            redirectToHome()
            return
        }

        const u = getUser()
        if (!u) {
            navigate('/')
            return
        }
        setUser(u)
        
        const fetchData = async () => {
            const vpa = sessionStorage.getItem('active_vpa') || ''
            setActiveVpa(vpa)

            let details = null
            const storedDetails = sessionStorage.getItem('device_details')
            if (storedDetails) {
                try {
                    details = JSON.parse(storedDetails)
                } catch (e) {
                    console.error('Error parsing device details', e)
                }
            }

            if (!details && vpa) {
                try {
                    const res = await fetchVPADetails(vpa)
                    if (res && res.data) {
                        details = Array.isArray(res.data) ? res.data[0] : res.data
                        sessionStorage.setItem('device_details', JSON.stringify(details))
                    }
                } catch (err) {
                    console.error("Failed to fetch VPA details in HelpSupport", err)
                }
            }

            if (details) {
                setDeviceDetails(details)
            }

            const rawAccFromSession = sessionStorage.getItem('merchant_account_no') || ''
            let rawAcc = rawAccFromSession
            
            if (!rawAcc && details) {
                rawAcc = details.merchant_account_no || details.merchant_acc_no || details.account_no || details.acc_no || ''
                if (rawAcc) sessionStorage.setItem('merchant_account_no', rawAcc)
            }

            if (rawAcc && rawAcc.length > 4) {
                setMerchantAccountNumber('X'.repeat(rawAcc.length - 4) + rawAcc.slice(-4))
            } else {
                setMerchantAccountNumber(rawAcc || '')
            }
        }

        fetchData()
    }, [navigate])

    if (!user) return null

    return (
        <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* SIDEBAR */}
            <div className="sidebar">
                <div className="sidebar-logo">
                    <img src={pnbLogo} alt="PNB" />
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <div
                            key={item.label}
                            className={`sidebar-item ${activeMenu === item.label ? 'active' : ''}`}
                            onClick={() => {
                                setActiveMenu(item.label);
                                if (item.label === 'Transaction Reports') navigate('/transaction-reports');
                                else if (item.label === 'Dashboard') navigate('/dashboard');
                                else if (item.label === 'QR Details') navigate('/qr-details');
                                else if (item.label === 'Language Update') navigate('/language-update');
                                else if (item.label === 'Help & Support') navigate('/help-support');
                            }}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
            </div>

            {/* MAIN */}
            <div className="main-content">
                <div className="top-navbar">
                    <div className="toggle-menu" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="6" width="18" height="2" />
                            <path d="M3 12L8 8V16L3 12Z" />
                            <rect x="9" y="11" width="12" height="2" />
                            <rect x="3" y="16" width="18" height="2" />
                        </svg>
                    </div>
                    <div 
                        className="navbar-user" 
                        onClick={(e) => { e.stopPropagation(); setIsProfileDropdownOpen(!isProfileDropdownOpen); }}
                    >
                        <img 
                            src={profileImage} 
                            alt="Avatar" 
                            className="user-img-avatar" 
                        />
                        <span className="user-name">{user?.name || user?.preferred_username || 'User'}</span>
                        {isProfileDropdownOpen && (
                            <div className="custom-dropdown-menu dropdown-right">
                                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setIsProfileOverlayOpen(true); setIsProfileDropdownOpen(false); }}>View Profile</div>
                                <div className="dropdown-item logout-item" onClick={logout}>Logout</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="page-content">
                    <h2 className="page-title">Help & Support</h2>
                    <div className="coming-soon-container">
                        <div className="coming-soon-card">
                            <div className="coming-soon-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#A20E37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                </svg>
                            </div>
                            <h3 className="coming-soon-title">Module Under Development</h3>
                            <p className="coming-soon-text">
                                We are currently building a comprehensive support system for you. 
                                Soon you will be able to raise tickets, view FAQs, and contact our 24/7 helpdesk directly from this dashboard.
                            </p>
                            <div className="coming-soon-progress">
                                <div className="coming-soon-progress-bar"></div>
                            </div>
                            <span className="coming-soon-badge">Coming Soon</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PROFILE MODAL (Reused) */}
            {isProfileOverlayOpen && (
                <div className="profile-overlay-bg" onClick={() => setIsProfileOverlayOpen(false)}>
                    <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="profile-panel-header">
                            <h3>View Profile Details</h3>
                        </div>
                        <div className="profile-panel-content">
                            <div className="profile-card">
                                <div className="profile-card-title">Basic Information</div>
                                <div className="profile-card-body">
                                    <div className="profile-row">
                                        <span className="profile-label">Name</span>
                                        <span className="profile-val">{user?.name || user?.preferred_username || 'Stebin Ben'}</span>
                                    </div>
                                    <div className="profile-row">
                                        <span className="profile-label">Phone</span>
                                        <span className="profile-val">{user?.user_name || ''}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-card">
                                <div className="profile-card-title">Device Information</div>
                                <div className="profile-card-body">
                                    <div className="profile-row"><span className="profile-label">Device Serial Number</span><span className="profile-val">{deviceDetails?.serial_number || ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">Linked Account Number</span><span className="profile-val">{merchantAccountNumber === 'N/A' || !merchantAccountNumber ? '' : merchantAccountNumber}</span></div>
                                    <div className="profile-row"><span className="profile-label">UPI ID</span><span className="profile-val">{activeVpa || ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">IFSC Code</span><span className="profile-val">{deviceDetails?.ifsc || ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">Device Model Name</span><span className="profile-val">{deviceDetails?.device_model || ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">Device Mobile Number</span><span className="profile-val">{user?.user_name || ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">Network Type</span><span className="profile-val">{deviceDetails?.network_type || ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">Device Status</span><span className="profile-val">{deviceDetails?.device_status || ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">Battery Percentage</span><span className="profile-val">{deviceDetails?.device_status?.toLowerCase() === 'active' ? (deviceDetails?.battery_percentage || '') : ''}</span></div>
                                    <div className="profile-row"><span className="profile-label">Network Strength</span><span className="profile-val">{deviceDetails?.device_status?.toLowerCase() === 'active' ? (deviceDetails?.network_strength || '') : ''}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="profile-panel-footer">
                            <button className="btn-close-profile" onClick={() => setIsProfileOverlayOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HelpSupport

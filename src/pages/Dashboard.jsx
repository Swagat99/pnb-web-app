import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout, startTokenRefresh, stopTokenRefresh, isTokenValid, redirectToHome } from '../auth/authService'
import { fetchVPAList, fetchVPADetails, fetchCurrentLanguage, fetchLanguageList, generateQRBase64 } from '../api/apiService'
import pnbLogo from '../assets/pnb-logo.png'
import profileImage from '../assets/profile-image.png'
import '../css/Dashboard.css'
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

function Dashboard() {
    const [user, setUser] = useState(null)
    const [activeMenu, setActiveMenu] = useState('Dashboard')
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [vpaListObjects, setVpaListObjects] = useState([])
    const [deviceDetails, setDeviceDetails] = useState(null)
    const [vpaList, setVpaList] = useState([])
    const [isVpaDropdownOpen, setIsVpaDropdownOpen] = useState(false)
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
    const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false)
    const [activeFilter, setActiveFilter] = useState('Today')
    const [selectedVpa, setSelectedVpa] = useState('')
    const [activeVpa, setActiveVpa] = useState('')
    const [isVpaSelectionModalOpen, setIsVpaSelectionModalOpen] = useState(false)
    const [tempSelectedVpa, setTempSelectedVpa] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [merchantAccountNumber, setMerchantAccountNumber] = useState('')
    const navigate = useNavigate()

    const initialized = useRef(false)

    useEffect(() => {
        // Validate token before loading anything
        if (!isTokenValid()) {
            redirectToHome()
            return
        }

        const u = getUser()
        setUser(u)

        if (!u) {
            navigate('/')
            return
        }

        const vpaFromStorage = sessionStorage.getItem('active_vpa') || ''
        setActiveVpa(vpaFromStorage)
        setSelectedVpa(vpaFromStorage)

        const storedDetails = sessionStorage.getItem('device_details')
        if (storedDetails) {
            try {
                setDeviceDetails(JSON.parse(storedDetails))
            } catch (e) {
                console.error('Error parsing device details', e)
            }
        }

        const rawAcc = sessionStorage.getItem('merchant_account_no') || ''
        if (rawAcc && rawAcc.length > 4) {
            setMerchantAccountNumber('X'.repeat(rawAcc.length - 4) + rawAcc.slice(-4))
        } else {
            setMerchantAccountNumber(rawAcc)
        }

        if (initialized.current) return
        initialized.current = true

        startTokenRefresh()
        const mobile = u.user_name || u.preferred_username || u.mobile_number
        if (mobile) {
            setIsLoading(true)
            fetchVPAList(mobile)
                .then(res => {
                    setIsLoading(false)
                    if (res && res.data && Array.isArray(res.data)) {
                        setVpaListObjects(res.data)
                        const ids = res.data.map(item => item.vpa_id)
                        if (ids.length > 0) {
                            setVpaList(ids)
                            const storedVpa = sessionStorage.getItem('active_vpa')
                            if (storedVpa && ids.includes(storedVpa)) {
                                setActiveVpa(storedVpa)
                                setTempSelectedVpa(storedVpa)
                                fetchVPADetails(storedVpa)
                                    .then(detailRes => {
                                        if (detailRes && detailRes.data) {
                                            const details = Array.isArray(detailRes.data) ? detailRes.data[0] : detailRes.data
                                            setDeviceDetails(details)
                                            sessionStorage.setItem('device_details', JSON.stringify(details))

                                            // Detect account number from VPA list or Details
                                            const activeVpaObj = res.data.find(v => v.vpa_id === storedVpa)
                                            const accNo = activeVpaObj?.merchant_account_no || activeVpaObj?.merchant_acc_no ||
                                                details?.merchant_account_no || details?.merchant_acc_no ||
                                                details?.account_no || details?.acc_no ||
                                                details?.account_number || details?.merchant_account_number ||
                                                details?.linked_account_number

                                            if (accNo) {
                                                sessionStorage.setItem('merchant_account_no', accNo)
                                                if (accNo.length > 4) {
                                                    setMerchantAccountNumber('X'.repeat(accNo.length - 4) + accNo.slice(-4))
                                                } else {
                                                    setMerchantAccountNumber(accNo)
                                                }
                                            }
                                        }
                                    })
                                    .catch(err => console.error("Failed to fetch VPA details", err))
                            } else {
                                setIsVpaSelectionModalOpen(true)
                                setTempSelectedVpa(ids[0])
                            }
                        }
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch VPAs", err)
                    setError(err.message || 'Failed to initialize dashboard. Please check your connection.')
                    setIsLoading(false)
                })
        }
    }, [navigate])

    useEffect(() => {
        const handleClickOutside = () => {
            setIsVpaDropdownOpen(false)
            setIsFilterDropdownOpen(false)
            setIsProfileDropdownOpen(false)
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    if (!user) return null

    const handleVpaProceed = () => {
        setActiveVpa(tempSelectedVpa)
        setIsVpaSelectionModalOpen(false)
        sessionStorage.setItem('active_vpa', tempSelectedVpa)
        fetchVPADetails(tempSelectedVpa)
            .then(res => {
                if (res && res.data) {
                    const details = Array.isArray(res.data) ? res.data[0] : res.data
                    setDeviceDetails(details)
                    sessionStorage.setItem('device_details', JSON.stringify(details))

                    const activeVpaObj = vpaListObjects.find(v => v.vpa_id === tempSelectedVpa)
                    const accNo = activeVpaObj?.merchant_account_no || activeVpaObj?.merchant_acc_no ||
                        details?.merchant_account_no || details?.merchant_acc_no ||
                        details?.account_no || details?.acc_no

                    if (accNo) {
                        sessionStorage.setItem('merchant_account_no', accNo)
                        if (accNo.length > 4) {
                            setMerchantAccountNumber('X'.repeat(accNo.length - 4) + accNo.slice(-4))
                        } else {
                            setMerchantAccountNumber(accNo)
                        }
                    }
                }
            })
            .catch(err => {
                console.error("Failed to fetch VPA details", err)
            })
    }

    const handleVpaSelect = (vpa) => {
        setActiveVpa(vpa)
        sessionStorage.setItem('active_vpa', vpa)
        fetchVPADetails(vpa)
            .then(res => {
                if (res && res.data) {
                    const details = Array.isArray(res.data) ? res.data[0] : res.data
                    setDeviceDetails(details)
                    sessionStorage.setItem('device_details', JSON.stringify(details))

                    const activeVpaObj = vpaListObjects.find(v => v.vpa_id === vpa)
                    const accNo = activeVpaObj?.merchant_account_no || activeVpaObj?.merchant_acc_no ||
                        details?.merchant_account_no || details?.merchant_acc_no ||
                        details?.account_no || details?.acc_no

                    if (accNo) {
                        sessionStorage.setItem('merchant_account_no', accNo)
                        if (accNo.length > 4) {
                            setMerchantAccountNumber('X'.repeat(accNo.length - 4) + accNo.slice(-4))
                        } else {
                            setMerchantAccountNumber(accNo)
                        }
                    }
                }
            })
            .catch(err => console.error("Failed to fetch VPA details", err))
    }

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

                {/* TOP NAVBAR */}
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

                {/* PAGE CONTENT */}
                <div className="page-content">
                    <h2 className="page-title">Dashboard</h2>

                    {/* VPA Row */}
                    <div className="vpa-row">
                        <p className="vpa-text">
                            <span className="vpa-label">VPA ID : </span>
                            <span
                                className="vpa-value-box"
                                onClick={(e) => { e.stopPropagation(); setIsVpaDropdownOpen(!isVpaDropdownOpen); setIsFilterDropdownOpen(false); setIsProfileDropdownOpen(false); }}
                            >
                                <span className="vpa-value">{activeVpa}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                                {isVpaDropdownOpen && (
                                    <div className="custom-dropdown-menu">
                                        {vpaList.length > 0 ? vpaList.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="dropdown-item"
                                                onClick={(e) => { e.stopPropagation(); handleVpaSelect(item); setIsVpaDropdownOpen(false); }}
                                                style={{ alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                {item}
                                            </div>
                                        )) : (
                                            <div className="dropdown-item" style={{ color: '#888', fontStyle: 'italic', cursor: 'default' }}>
                                                Unable to fetch VPA list
                                            </div>
                                        )}
                                    </div>
                                )}
                            </span>
                        </p>
                        <div
                            className="filter-dropdown"
                            onClick={(e) => { e.stopPropagation(); setIsFilterDropdownOpen(!isFilterDropdownOpen); setIsVpaDropdownOpen(false); setIsProfileDropdownOpen(false); }}
                        >
                            {activeFilter} <span className="filter-arrow">▼</span>
                            {isFilterDropdownOpen && (
                                <div className="custom-dropdown-menu dropdown-right">
                                    <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setActiveFilter('Today'); setIsFilterDropdownOpen(false); }}>
                                        <div className={`dropdown-radio ${activeFilter === 'Today' ? 'selected' : ''}`}>
                                            {activeFilter === 'Today' && <div className="dropdown-radio-inner" />}
                                        </div>
                                        Today
                                    </div>
                                    <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); setActiveFilter('Yesterday'); setIsFilterDropdownOpen(false); }}>
                                        <div className={`dropdown-radio ${activeFilter === 'Yesterday' ? 'selected' : ''}`}>
                                            {activeFilter === 'Yesterday' && <div className="dropdown-radio-inner" />}
                                        </div>
                                        Yesterday
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon light-blue">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A20E37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 10L21 6L17 2M21 6H3" />
                                    <path d="M7 14L3 18L7 22M3 18H21" />
                                </svg>
                            </div>
                            <div className="stat-card-info">
                                <span className="stat-label">Total No Of Transaction</span>
                                <span className="stat-value">
                                    {activeVpa ? (activeFilter === 'Today' ? '20.7K' : '15.4K') : '0'}
                                </span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon light-blue">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A20E37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="6" width="20" height="12" rx="2" />
                                    <circle cx="12" cy="12" r="3" />
                                    <circle cx="5" cy="9" r="1" fill="#A20E37" />
                                    <circle cx="19" cy="9" r="1" fill="#A20E37" />
                                    <circle cx="5" cy="15" r="1" fill="#A20E37" />
                                    <circle cx="19" cy="15" r="1" fill="#A20E37" />
                                </svg>
                            </div>
                            <div className="stat-card-info">
                                <span className="stat-label">Total Amount</span>
                                <span className="stat-value">
                                    {activeVpa ? (activeFilter === 'Today' ? '76,000 cr' : '52,400 cr') : '0'}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* VPA SELECTION MODAL */}
            {isVpaSelectionModalOpen && (
                <div className="vpa-modal-overlay">
                    <div className="vpa-modal">
                        <div className="vpa-modal-header">
                            <h3>Select VPA</h3>
                        </div>
                        <div className="vpa-modal-body">
                            <p className="vpa-modal-subtitle">Select a VPA to Proceed</p>
                            <div className="vpa-modal-list">
                                {vpaList.length > 0 ? vpaList.map((vpa) => (
                                    <div
                                        key={vpa}
                                        className={`vpa-modal-item ${tempSelectedVpa === vpa ? 'selected' : ''}`}
                                        onClick={() => setTempSelectedVpa(vpa)}
                                    >
                                        <div className="vpa-radio-icon">
                                            <div className="vpa-radio-dot" />
                                        </div>
                                        <span className="vpa-modal-label">{vpa}</span>
                                    </div>
                                )) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                        Unable to fetch VPA list. Please contact support or try again later.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="vpa-modal-footer">
                            <button className="vpa-modal-btn-cancel" onClick={() => logout()}>Cancel</button>
                            <button className="vpa-modal-btn-proceed" onClick={handleVpaProceed}>Proceed</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PROFILE MODAL */}
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
                                    <div className="profile-row"><span className="profile-label">Linked Account Number</span><span className="profile-val">{merchantAccountNumber === 'N/A' ? '' : merchantAccountNumber}</span></div>
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

export default Dashboard
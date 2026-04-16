import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout, isTokenValid, redirectToHome } from '../auth/authService'

import { updateLanguage, fetchCurrentLanguage, fetchLanguageList, fetchVPADetails } from '../api/vpaService'
import pnbLogo from '../assets/pnb-logo.png'
import profileImage from '../assets/profile-image.png'
import '../css/Dashboard.css'
import '../css/LanguageUpdate.css'
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

function LanguageUpdate() {
    const [user, setUser] = useState(null)
    const [activeMenu, setActiveMenu] = useState('Language Update')
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
    const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false)

    // Language logical state
    const [selectedLanguage, setSelectedLanguage] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [vpaId, setVpaId] = useState('')
    const [serialNumber, setSerialNumber] = useState('')
    const [currentLanguage, setCurrentLanguage] = useState('')
    const [languages, setLanguages] = useState([])
    const [isUpdating, setIsUpdating] = useState(false)
    const [responseModal, setResponseModal] = useState({ open: false, type: 'success', message: '' })
    const [deviceDetails, setDeviceDetails] = useState(null)
    const [merchantAccountNumber, setMerchantAccountNumber] = useState('')

    const navigate = useNavigate()
    const initialized = useRef(false)

    const fetchData = async () => {
        try {
            // 1. Get active VPA
            let vpa = sessionStorage.getItem('active_vpa') || ''
            setVpaId(vpa)

            // 2. Get device details or fetch them
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
                const res = await fetchVPADetails(vpa)
                if (res && res.data) {
                    details = Array.isArray(res.data) ? res.data[0] : res.data
                    sessionStorage.setItem('device_details', JSON.stringify(details))
                }
            }

            if (details) {
                setDeviceDetails(details)
                setSerialNumber(details.serial_number || '')
            }

            // 3. Get Account Number
            let rawAcc = sessionStorage.getItem('merchant_account_no') || ''
            if (!rawAcc && details) {
                rawAcc = details.merchant_account_no || details.merchant_acc_no || details.account_no || details.acc_no || details.account_number || details.merchant_account_number || details.linked_account_number || ''
                if (rawAcc) sessionStorage.setItem('merchant_account_no', rawAcc)
            }
            if (rawAcc) {
                const masked = 'X'.repeat(rawAcc.length - 4) + rawAcc.slice(-4)
                setMerchantAccountNumber(masked)
            }

            // 4. Fetch Language Data
            const sn = details?.serial_number || serialNumber
            const [currRes, listRes] = await Promise.all([
                sn ? fetchCurrentLanguage(sn).catch(() => null) : Promise.resolve(null),
                fetchLanguageList().catch(() => ({ data: [] }))
            ])

            if (currRes) {
                let raw = currRes.data || currRes.responseData || currRes;
                if (raw && raw.data) raw = raw.data;
                const finalData = Array.isArray(raw) ? raw[0] : raw;

                let lang = '';
                if (typeof finalData === 'string' && finalData.length < 50 && !finalData.includes('{')) {
                    lang = finalData;
                } else if (finalData && typeof finalData === 'object') {
                    lang = finalData.language || finalData.current_language || finalData.currentLanguage ||
                        finalData.language_name || finalData.lang_name || finalData.selected_language ||
                        finalData.lang || finalData.name;
                }
                if (lang) setCurrentLanguage(lang)
            }

            if (listRes) {
                let list = listRes.data || listRes.responseData || listRes;
                if (list && list.data) list = list.data;
                if (Array.isArray(list)) {
                    setLanguages(list)
                    sessionStorage.setItem('language_list', JSON.stringify(list))
                }
            }
        } catch (err) {
            console.error('Initialization error:', err)
        }
    }

    useEffect(() => {
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

        if (!initialized.current) {
            initialized.current = true
            fetchData()
        }
    }, [navigate])

    useEffect(() => {
        const handleClickOutside = () => {
            setIsProfileDropdownOpen(false)
            setIsDropdownOpen(false)
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    if (!user) return null

    const handleUpdate = () => {
        if (!selectedLanguage) return
        setIsUpdating(true)
        updateLanguage(serialNumber, selectedLanguage)
            .then(res => {
                setIsUpdating(false)
                const apiMessage = res?.message || res?.description || res?.data?.message || '';
                const isFailure = res?.result === 'error' || res?.status === 'error';

                setResponseModal({
                    open: true,
                    type: isFailure ? 'error' : 'success',
                    message: apiMessage || 'Update process completed'
                })

                // Clear selection and refresh data from server regardless of result to stay in sync
                setSelectedLanguage('')
                // Background refresh
                fetchData()
            })
            .catch(err => {
                setIsUpdating(false)
                setResponseModal({ open: true, type: 'error', message: err.message || 'Failed to update language. Please try again.' })
            })
    }

    return (
        <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* RESPONSE MODAL */}
            {responseModal.open && (
                <div className="status-modal-overlay">
                    <div className="status-modal">
                        <div className="status-modal-content">
                            <div className="status-modal-title" id="status-modal-message">
                                {responseModal.message}
                            </div>
                            <div className={`status-icon-container ${responseModal.type}`}>
                                {responseModal.type === 'success' ? (
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <div className="status-modal-footer">
                            <button className="status-modal-btn" onClick={() => {
                                setResponseModal({ ...responseModal, open: false });
                            }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* MAIN CONTENT */}
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
                    <h2 className="page-title">Language Update</h2>

                    <div className="lang-update-card">
                        <div className="lang-grid">
                            <div className="lang-field-group">
                                <label>VPA ID</label>
                                <div className="lang-input-readonly">{vpaId}</div>
                            </div>
                            <div className="lang-field-group">
                                <label>Device Serial Number</label>
                                <div className="lang-input-readonly">{serialNumber}</div>
                            </div>
                            <div className="lang-field-group">
                                <label>Current Language</label>
                                <div className="lang-input-readonly">{currentLanguage || ''}</div>
                            </div>
                            <div className="lang-field-group">
                                <label>Language Update</label>
                                <div className="lang-dropdown-wrapper">
                                    <div
                                        className={`lang-dropdown-trigger ${!selectedLanguage ? 'placeholder' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                                    >
                                        <span>{selectedLanguage || 'Select Language Update'}</span>
                                        <span className="lang-dropdown-arrow">▼</span>
                                    </div>
                                    {isDropdownOpen && (
                                        <div className="lang-dropdown-menu">
                                            {languages.map((lang, idx) => (
                                                <div
                                                    key={`${lang}-${idx}`}
                                                    className={`lang-option ${selectedLanguage === lang ? 'active' : ''}`}
                                                    onClick={() => { setSelectedLanguage(lang); setIsDropdownOpen(false); }}
                                                >
                                                    {lang}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lang-actions">
                            <button className="lang-btn-cancel" onClick={() => setSelectedLanguage('')}>Cancel</button>
                            <button
                                className="lang-btn-update"
                                onClick={handleUpdate}
                                disabled={!selectedLanguage || isUpdating}
                            >
                                {isUpdating ? 'Updating...' : 'Update'}
                            </button>
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
                                    <div className="profile-row"><span className="profile-label">UPI ID</span><span className="profile-val">{vpaId || ''}</span></div>
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

export default LanguageUpdate

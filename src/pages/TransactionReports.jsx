import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout, isTokenValid, redirectToHome } from '../auth/authService'
import { fetchTransactionReports, fetchVPADetails } from '../api/apiService'
import * as XLSX from 'xlsx'

import pnbLogo from '../assets/pnb-logo.png'
import profileImage from '../assets/profile-image.png'

// Keep MUI for complex functional components like Table/Pagination if needed, 
// but use custom wrappers to match Dashboard design.
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Pagination,
    Chip,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Radio
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/FileDownload'
import MenuIcon from '@mui/icons-material/Menu'

import '../css/Dashboard.css'
import '../css/TransactionReports.css'

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

function TransactionReports() {
    const [user, setUser] = useState(null)
    const [activeMenu, setActiveMenu] = useState('Transaction Reports')
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
    const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [deviceDetails, setDeviceDetails] = useState(null)
    const [merchantAccountNumber, setMerchantAccountNumber] = useState('')
    const [activeVpa, setActiveVpa] = useState('')

    // Filters logic
    const [selectedFilter, setSelectedFilter] = useState('Today')
    const [monthlyOption, setMonthlyOption] = useState("Last Month's Report")
    const [startDate, setStartDate] = useState('') 
    const [endDate, setEndDate] = useState('')   
    const [startDateInput, setStartDateInput] = useState('') 
    const [endDateInput, setEndDateInput] = useState('')   

    // Data state
    const [reportsData, setReportsData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [error, setError] = useState(null)
    const [vpaId, setVpaId] = useState('')

    // Pagination/Search state
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [page, setPage] = useState(0)
    const [gotoPageValue, setGotoPageValue] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const navigate = useNavigate()

    const formatDate = (date) => {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
    }

    const toInputFormat = (date) => {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${year}-${month}-${day}`
    }

    const getYesterday = () => {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        d.setHours(0, 0, 0, 0)
        return d
    }

    const getMonthsAgo = (n) => {
        const d = new Date()
        d.setMonth(d.getMonth() - n)
        d.setHours(0, 0, 0, 0)
        return d
    }

    const formatDateTime = (dtStr) => {
        if (!dtStr) return ''
        try {
            const date = new Date(dtStr.replace(' ', 'T'))
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).toUpperCase().replace(',', '')
        } catch (e) {
            return dtStr
        }
    }

    const initialized = useRef(false)

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
            setVpaId(vpa)

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
                    console.error("Failed to fetch VPA details in TransactionReports", err)
                }
            }

            if (details) setDeviceDetails(details)

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

            if (!initialized.current) {
                initialized.current = true
                if (vpa) {
                    const todayStr = formatDate(new Date())
                    handleFetchReports(todayStr, todayStr, vpa)
                } else {
                    setPageLoading(false)
                }
            }
        }
        fetchData()
    }, [navigate])

    useEffect(() => {
        const handleClickOutside = () => setIsProfileDropdownOpen(false)
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const handleFetchReports = (sDate, eDate, vpa) => {
        setIsLoading(true)
        setReportsData([])
        fetchTransactionReports(sDate, eDate, vpa || vpaId)
            .then(res => {
                if (res && res.data) setReportsData(res.data || [])
                setIsLoading(false)
                setPageLoading(false)
            })
            .catch(err => {
                console.error("Error fetching reports:", err)
                setError(err.message || 'Failed to fetch transaction reports.')
                setIsLoading(false)
                setPageLoading(false)
            })
    }

    const handleSubmitFilter = () => {
        let sDate = ''
        let eDate = ''
        if (selectedFilter === 'Today') {
            sDate = eDate = formatDate(new Date())
        } else if (selectedFilter === 'Monthly') {
            const yesterdayStr = formatDate(getYesterday())
            eDate = yesterdayStr
            if (monthlyOption === "Last Month's Report") sDate = formatDate(getMonthsAgo(1))
            else if (monthlyOption === "Last 3 month's Report") sDate = formatDate(getMonthsAgo(3))
            else if (monthlyOption === "Last 6 month's Report") sDate = formatDate(getMonthsAgo(6))
            else if (monthlyOption === "Last 12 month's Report") sDate = formatDate(getMonthsAgo(12))
        } else if (selectedFilter === 'Custom Range') {
            const yesterday = getYesterday();
            yesterday.setHours(23, 59, 59, 999);
            const [sDay, sMonth, sYear] = startDate.split('/').map(Number);
            const [eDay, eMonth, eYear] = endDate.split('/').map(Number);
            const sDateObj = new Date(sYear, sMonth - 1, sDay);
            const eDateObj = new Date(eYear, eMonth - 1, eDay);

            if (sDateObj > yesterday || eDateObj > yesterday) {
                alert("Please select dates till yesterday only.");
                return;
            }
            if (sDateObj > eDateObj) {
                alert("Start date cannot be after end date.");
                return;
            }
            sDate = startDate
            eDate = endDate
        }
        if (sDate && eDate) {
            handleFetchReports(sDate, eDate)
            setPage(0)
        }
    }

    useEffect(() => {
        if (selectedFilter === 'Today' && vpaId) {
            const todayStr = formatDate(new Date())
            handleFetchReports(todayStr, todayStr)
            setPage(0)
        }
    }, [selectedFilter])

    const filteredData = reportsData.filter(item =>
        (item.Transaction_Id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.RRN?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleDownload = () => {
        if (filteredData.length === 0) {
            alert('No data available to download');
            return;
        }
        const dataToExport = filteredData.map((item, index) => ({
            'S. No.': index + 1,
            'Transaction ID': item.Transaction_Id,
            'RRN Number': item.RRN,
            'Amount': `₹ ${item.Transaction_Amount}`,
            'Date': formatDateTime(item["Date_&_Time"]),
            'Status': 'Received'
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
        const fileName = `PNB_Transactions_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };



    if (!user) return null

    return (
        <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* SIDEBAR - Exactly matching Dashboard.jsx structure */}
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
                {/* TOP NAVBAR - Exactly matching Dashboard.jsx */}
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
                            <img src={profileImage} alt="Avatar" className="user-img-avatar" />
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
                    <h2 className="page-title">Transaction Reports</h2>

                    {/* Filter Card - Using tr-filter-card class for alignment */}
                    <div className="tr-filter-card">
                        <p className="tr-filter-title">Select a Report Filter</p>
                        <div className="tr-radio-group">
                            <label className="tr-radio-label">
                                <Radio 
                                    size="small"
                                    checked={selectedFilter === 'Today'}
                                    onChange={() => {
                                        setSelectedFilter('Today');
                                        setStartDateInput(''); setEndDateInput('');
                                        setSearchTerm(''); setReportsData([]);
                                    }}
                                    sx={{ color: '#ccc', '&.Mui-checked': { color: '#A20E37' }, padding: '4px' }}
                                />
                                Today
                            </label>
                            <label className="tr-radio-label">
                                <Radio 
                                    size="small"
                                    checked={selectedFilter === 'Monthly'}
                                    onChange={() => {
                                        setSelectedFilter('Monthly');
                                        setStartDateInput(''); setEndDateInput('');
                                        setSearchTerm(''); setReportsData([]);
                                    }}
                                    sx={{ color: '#ccc', '&.Mui-checked': { color: '#A20E37' }, padding: '4px' }}
                                />
                                Monthly
                            </label>
                            <label className="tr-radio-label">
                                <Radio 
                                    size="small"
                                    checked={selectedFilter === 'Custom Range'}
                                    onChange={() => {
                                        setSelectedFilter('Custom Range');
                                        setStartDateInput(''); setEndDateInput('');
                                        setSearchTerm(''); setReportsData([]);
                                    }}
                                    sx={{ color: '#ccc', '&.Mui-checked': { color: '#A20E37' }, padding: '4px' }}
                                />
                                Custom Range
                            </label>
                        </div>

                        {selectedFilter === 'Monthly' && (
                            <div className="tr-filter-sub">
                                <div className="tr-sub-field">
                                    <label>Monthly</label>
                                    <Select
                                        size="small"
                                        value={monthlyOption}
                                        onChange={(e) => setMonthlyOption(e.target.value)}
                                        sx={{ width: 240, height: 42, bgcolor: '#fff' }}
                                    >
                                        <MenuItem value="Last Month's Report">Last Month's Report</MenuItem>
                                        <MenuItem value="Last 3 month's Report">Last 3 month's Report</MenuItem>
                                        <MenuItem value="Last 6 month's Report">Last 6 month's Report</MenuItem>
                                        <MenuItem value="Last 12 month's Report">Last 12 month's Report</MenuItem>
                                    </Select>
                                </div>
                                <button className="tr-submit-btn" onClick={handleSubmitFilter}>Submit</button>
                            </div>
                        )}

                        {selectedFilter === 'Custom Range' && (
                            <div className="tr-filter-sub">
                                <div className="tr-sub-field">
                                    <label>Start Date</label>
                                    <input 
                                        type="date" 
                                        className="tr-date-input" 
                                        value={startDateInput}
                                        max={toInputFormat(getYesterday())}
                                        onChange={(e) => {
                                            setStartDateInput(e.target.value);
                                            if (e.target.value) setStartDate(formatDate(new Date(e.target.value)));
                                        }}
                                    />
                                </div>
                                <div className="tr-sub-field">
                                    <label>End Date</label>
                                    <input 
                                        type="date" 
                                        className="tr-date-input" 
                                        value={endDateInput}
                                        max={toInputFormat(getYesterday())}
                                        min={startDateInput}
                                        onChange={(e) => {
                                            setEndDateInput(e.target.value);
                                            if (e.target.value) setEndDate(formatDate(new Date(e.target.value)));
                                        }}
                                    />
                                </div>
                                <button className="tr-submit-btn" onClick={handleSubmitFilter}>Submit</button>
                            </div>
                        )}
                    </div>

                    {/* Table Card */}
                    <div className="tr-table-card">
                        <div className="tr-table-header">
                            <div className="tr-search-box">
                                <SearchIcon fontSize="small" sx={{ color: '#ccc' }} />
                                <input 
                                    type="text" 
                                    className="tr-search-input" 
                                    placeholder="Search here..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="tr-btn-download" onClick={handleDownload}>
                                <DownloadIcon fontSize="small" /> Download
                            </button>
                        </div>

                        <div className="tr-table-wrapper">
                            <Table stickyHeader className="tr-table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#fbfbfb', fontWeight: 600 }}>S. No.</TableCell>
                                        <TableCell sx={{ bgcolor: '#fbfbfb', fontWeight: 600 }}>Transaction ID</TableCell>
                                        <TableCell sx={{ bgcolor: '#fbfbfb', fontWeight: 600 }}>
                                            RRN Number <span className="sort-arrows">⇅</span>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: '#fbfbfb', fontWeight: 600 }}>
                                            Amount <span className="sort-arrows">⇅</span>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: '#fbfbfb', fontWeight: 600 }}>
                                            Date <span className="sort-arrows">⇅</span>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: '#fbfbfb', fontWeight: 600 }}>
                                            Status <span className="sort-arrows">⇅</span>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <CircularProgress color="primary" size={32} />
                                                <p style={{ marginTop: 16, color: '#666', fontSize: 13 }}>Loading transactions...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : error ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 15 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <p style={{ color: '#A20E37', fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>
                                                        Unable to fetch reports
                                                    </p>
                                                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>
                                                        {error}
                                                    </p>
                                                    <button 
                                                        className="tr-submit-btn" 
                                                        style={{ height: 'auto', padding: '10px 40px' }}
                                                        onClick={() => window.location.reload()}
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length > 0 ? (
                                        filteredData.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((item, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                                <TableCell>{item.Transaction_Id}</TableCell>
                                                <TableCell>{item.RRN}</TableCell>
                                                <TableCell>₹ {item.Transaction_Amount}</TableCell>
                                                <TableCell>{formatDateTime(item["Date_&_Time"])}</TableCell>
                                                <TableCell>
                                                    <span className="status-badge success">Received</span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <p style={{ color: '#999', fontSize: 13 }}>No reports found.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Area */}
                        <div className="tr-pagination">
                            <div className="tr-page-left">
                                <span>Row per page</span>
                                <select 
                                    className="tr-page-select" 
                                    value={rowsPerPage} 
                                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                                >
                                    {[10, 20, 30, 50].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <span style={{ marginLeft: 24 }}>Go to</span>
                                <input 
                                    type="text" 
                                    className="tr-goto-input" 
                                    value={gotoPageValue}
                                    onChange={(e) => setGotoPageValue(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const p = parseInt(gotoPageValue);
                                            const max = Math.ceil(filteredData.length / rowsPerPage);
                                            if (p > 0 && p <= max) setPage(p - 1);
                                        }
                                    }}
                                />
                            </div>
                            <Pagination 
                                count={Math.ceil(filteredData.length / rowsPerPage)} 
                                page={page + 1} 
                                onChange={(e, val) => setPage(val - 1)}
                                shape="rounded"
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        color: '#333',
                                        borderColor: '#ddd',
                                        fontWeight: 400,
                                        '&:hover': {
                                            borderColor: '#A20E37',
                                            bgcolor: '#fdf0f3'
                                        }
                                    },
                                    '& .MuiPaginationItem-root.Mui-selected': {
                                        bgcolor: 'transparent !important',
                                        color: '#A20E37 !important',
                                        borderColor: '#A20E37 !important',
                                        fontWeight: 600,
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* PROFILE MODAL (matching Dashboard) */}
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
                                    <div className="profile-row"><span className="profile-label">Linked Account Number</span><span className="profile-val">{merchantAccountNumber || ''}</span></div>
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

export default TransactionReports

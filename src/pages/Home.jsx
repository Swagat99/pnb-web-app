import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import pnbLogo from '../assets/pnb-logo.png'
import { login } from '../auth/authService'

function Home() {
    const navigate = useNavigate()
    const [showComingSoon, setShowComingSoon] = useState(false)

    return (
        <div className="home-wrapper">

            {/* Navbar */}
            <nav className="home-nav">
                <img src={pnbLogo} alt="PNB Logo" className="nav-logo" />

                <div className="nav-links">
                    <span>Personal Banking</span>
                    <span>Corporate Banking</span>
                    <span>NRI Services</span>
                    <span>Loans</span>
                </div>

                <div className="nav-right">
                    <span className="nav-helpline">📞 +91 9348200271</span>
                    <button className="login-btn" onClick={login}>
                        Login →
                    </button>
                </div>
            </nav >

            {/* Hero Section */}
            < div className="hero-section" >
                <div className="hero-left">
                    <div className="hero-badge">🏦 India's Trusted Bank Since 1894</div>
                    <h1 className="hero-title">
                        Welcome to <span style={{ color: "#FBBC09" }}>Punjab</span><br />
                        National Bank
                    </h1>
                    <p className="hero-subtitle">
                        Your financial partner for life. Experience secure, seamless and
                        smart banking with PNB's world-class services.
                    </p>
                    <div className="hero-buttons">

                        <button className="btn-outline" onClick={() => setShowComingSoon(true)}>
                            Open an Account →
                        </button>
                    </div>
                    <div className="hero-stats">
                        <div className="stat">
                            <h3>180M+</h3>
                            <p>Customers</p>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat">
                            <h3>12,000+</h3>
                            <p>Branches</p>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat">
                            <h3>13,000+</h3>
                            <p>ATMs</p>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat">
                            <h3>130+</h3>
                            <p>Years</p>
                        </div>
                    </div>
                </div>
                <div className="hero-right">
                    <div className="hero-card">
                        <div className="card-chip" />
                        <p className="card-bank">Punjab National Bank</p>
                        <p className="card-number">•••• •••• •••• 4582</p>
                        <div className="card-bottom">
                            <div>
                                <p className="card-label">Card Holder</p>
                                <p className="card-value">Swagat Senapati</p>
                            </div>
                            <div>
                                <p className="card-label">Expires</p>
                                <p className="card-value">12/28</p>
                            </div>
                        </div>
                    </div>
                    <div className="hero-floating-badge">
                        🔒 256-bit SSL Secured
                    </div>
                </div>
            </div >

            {/* Services Section */}
            < div className="services-section" >
                <h2 className="section-title">Our Services</h2>
                <p className="section-subtitle">Everything you need, all in one place</p>
                <div className="services-grid">
                    <div className="service-card">
                        <div className="service-icon" style={{ background: "rgba(162,14,55,0.1)" }}>💳</div>
                        <h3>Net Banking</h3>
                        <p>Manage your accounts, transfers and payments online 24/7</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon" style={{ background: "rgba(251,188,9,0.15)" }}>📱</div>
                        <h3>Mobile Banking</h3>
                        <p>Bank on the go with our feature-rich PNB One mobile app</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon" style={{ background: "rgba(162,14,55,0.1)" }}>🏠</div>
                        <h3>Home Loans</h3>
                        <p>Affordable home loans with competitive interest rates</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon" style={{ background: "rgba(251,188,9,0.15)" }}>📈</div>
                        <h3>Fixed Deposits</h3>
                        <p>Grow your savings with high-yield fixed deposit schemes</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon" style={{ background: "rgba(162,14,55,0.1)" }}>🌍</div>
                        <h3>NRI Services</h3>
                        <p>Dedicated banking solutions for Non-Resident Indians</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon" style={{ background: "rgba(251,188,9,0.15)" }}>🛡️</div>
                        <h3>Insurance</h3>
                        <p>Comprehensive life and health insurance plans for you</p>
                    </div>
                </div>
            </div >

            {/* Why PNB Section */}
            < div className="why-section" >
                <div className="why-left">
                    <h2>Why Choose <span style={{ color: "#FBBC09" }}>PNB?</span></h2>
                    <p>With over 130 years of banking excellence, PNB stands as a symbol of trust and reliability for millions of Indians.</p>
                    <div className="why-points">
                        <div className="why-point">✅ RBI Regulated & Government Backed</div>
                        <div className="why-point">✅ DICGC insured deposits up to ₹5 Lakhs</div>
                        <div className="why-point">✅ Award-winning customer service</div>
                        <div className="why-point">✅ Zero-fee NEFT & RTGS transactions</div>
                        <div className="why-point">✅ Pan India branch & ATM network</div>
                    </div>
                </div>
                <div className="why-right">
                    <div className="why-card">
                        <span style={{ fontSize: "32px" }}>🔒</span>
                        <h4>Bank-grade Security</h4>
                        <p>256-bit encryption & multi-factor authentication</p>
                    </div>
                    <div className="why-card">
                        <span style={{ fontSize: "32px" }}>⚡</span>
                        <h4>Instant Transfers</h4>
                        <p>IMPS transfers available 24x7 including holidays</p>
                    </div>
                    <div className="why-card">
                        <span style={{ fontSize: "32px" }}>🏆</span>
                        <h4>Award Winning</h4>
                        <p>Best Public Sector Bank award multiple years</p>
                    </div>
                    <div className="why-card">
                        <span style={{ fontSize: "32px" }}>📞</span>
                        <h4>24/7 Support</h4>
                        <p>Round the clock customer support helpline</p>
                    </div>
                </div>
            </div >

            {/* Footer */}
            < footer className="home-footer" >
                <div className="footer-top">
                    <div className="footer-col">
                        <img src={pnbLogo} alt="PNB" style={{ height: "40px", marginBottom: "12px", filter: "brightness(0) invert(1)" }} />
                        <p style={{ fontSize: "13px", opacity: 0.7, lineHeight: 1.6 }}>
                            Punjab National Bank — India's second largest public sector bank serving the nation since 1894.
                        </p>
                    </div>
                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <p>Net Banking</p>
                        <p>Mobile Banking</p>
                        <p>Locate Branch</p>
                        <p>Careers</p>
                    </div>
                    <div className="footer-col">
                        <h4>Products</h4>
                        <p>Savings Account</p>
                        <p>Fixed Deposit</p>
                        <p>Home Loan</p>
                        <p>Credit Cards</p>
                    </div>
                    <div className="footer-col">
                        <h4>Contact</h4>
                        <p>📞 +91 9348200271</p>
                        <p>📧 swagat.s@iserveu.co.in</p>
                        <p>🌐 www.pnbindia.in</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Punjab National Bank. All Rights Reserved. | Regulated by Swagat Senapati</p>
                </div>
            </footer >

            {showComingSoon && (
                <div className="status-modal-overlay">
                    <div className="status-modal">
                        <div className="status-modal-content">
                            <div className="status-icon-container" style={{ background: 'rgba(251, 188, 9, 0.1)', color: '#FBBC09', boxShadow: '0 0 0 10px rgba(251, 188, 9, 0.05)' }}>
                                <span style={{ fontSize: '40px' }}>⏳</span>
                            </div>
                            <div className="status-modal-title" style={{ marginTop: '20px' }}>
                                This feature is coming soon
                            </div>
                        </div>
                        <div className="status-modal-footer">
                            <button className="status-modal-btn" onClick={() => setShowComingSoon(false)}>
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}

export default Home
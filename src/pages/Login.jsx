import { useNavigate } from 'react-router-dom'
import pnbLogo from '../assets/pnb-logo.png'

function Login() {
    const navigate = useNavigate()

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <img src={pnbLogo} alt="PNB Logo" className="login-logo" />
                <h2>Net Banking Login</h2>
                <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
                    Enter your credentials to continue
                </p>
                <div className="form-group">
                    <label>User ID</label>
                    <input type="text" placeholder="Enter your User ID" />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" placeholder="Enter your Password" />
                </div>
                <button className="btn-primary" style={{ width: "100%", marginTop: "8px" }}>
                    Login
                </button>
                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#666" }}>
                    ← <span style={{ cursor: "pointer", color: "#003f88" }} onClick={() => navigate('/')}>
                        Back to Home
                    </span>
                </p>
            </div>
        </div>
    )
}

export default Login
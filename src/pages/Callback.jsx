import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleCallback, getUser } from '../auth/authService'
import pnbLogo from '../assets/pnb-logo.png'

function Callback() {
    const navigate = useNavigate()

    const processed = useRef(false)
    
    useEffect(() => {
        if (processed.current) return
        processed.current = true
        
        // Clear previous VPA selection so Dashboard shows the VPA picker modal
        // This only runs during the login flow (Home → auth → Callback → Dashboard)
        sessionStorage.removeItem('active_vpa')
        sessionStorage.removeItem('device_details')
        sessionStorage.removeItem('merchant_account_no')

        handleCallback()
            .then(user => {
                console.log('Logged in user:', user)
                navigate('/dashboard')
            })
            .catch(err => {
                console.error('Callback error:', err)
                // If it's already logged in or state missing, try going to dashboard anyway
                if (getUser()) navigate('/dashboard')
                else navigate('/')
            })
    }, [navigate])

    return (
        <div className="full-page-loader">
            <div className="loading-action-container">
                <div className="loading-ring"></div>
                <img src={pnbLogo} alt="PNB" className="loading-logo-action" />
            </div>
        </div>
    )
}

export default Callback
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';

const ReferralContext = createContext();

export const useReferral = () => {
    const context = useContext(ReferralContext);
    if (!context) {
        throw new Error('useReferral must be used within a ReferralProvider');
    }
    return context;
};

export const ReferralProvider = ({ children }) => {
    const [referralCode, setReferralCode] = useState(null);
    const [sponsorInfo, setSponsorInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();

    // Extract referral code from URL on mount and route changes
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const referrerCode = urlParams.get('referrer_code');


        if (referrerCode && referrerCode !== referralCode) {
            setReferralCode(referrerCode);
            fetchSponsorInfo(referrerCode);
        }
    }, [location.search, referralCode]);



    const fetchSponsorInfo = async (code) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ENDPOINTS.auth.referral}/${code}`);
            const data = await response.json();


            if (response.ok && data.success) {
                setSponsorInfo(data.sponsorInfo);
            } else {
                setError(data.message || 'Invalid referral code');
            }
        } catch (err) {
            console.error('ReferralHandler: Fetch error:', err);
            setError('Failed to fetch sponsor information');
        } finally {
            setIsLoading(false);
        }
    };

    const clearReferral = () => {
        setReferralCode(null);
        setSponsorInfo(null);
        setError(null);
    };

    const value = {
        referralCode,
        sponsorInfo,
        
        isLoading,
        error,
        clearReferral,
        setReferralCode,
        setSponsorInfo
    };

    return (
        <ReferralContext.Provider value={value}>
            {children}
        </ReferralContext.Provider>
    );
}; 
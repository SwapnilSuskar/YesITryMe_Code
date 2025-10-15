import { ArrowRight, BadgeCheck, CalendarDays, CheckCircle, Crown, Download, Gift, Image as ImageIcon, IndianRupee, Mail, Package, Quote, RefreshCw, Smartphone, User, UserCheck, User as UserIcon, Users, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import DashboardCard from '../UI/DashboardCard';
import DashboardChart from '../UI/DashboardChart';
import LazyLoad from '../UI/LazyLoad';
import LoginPrompt from '../UI/LoginPrompt';
import ReferralLink from '../UI/ReferralLink';
import SocialLinks from '../UI/SocialLinks';
import StatsCard from '../UI/StatsCard';
import TimePeriodSelector from '../UI/TimePeriodSelector';
import UserAvatar from '../UI/UserAvatar';
import UserFunds from '../UI/UserFunds';
import Leaderboard from './Leaderboard';
import TopDownlinePerformers from './TopDownlinePerformers';

const Dashboard = () => {
  const { user, token, syncUserStatus } = useAuthStore();
  const navigate = useNavigate();
  const [commissionSummary, setCommissionSummary] = useState({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    transactions: []
  });
  const [referralTree, setReferralTree] = useState({ totalReferrals: 0, directReferrals: [] });
  const [userFunds, setUserFunds] = useState({
    mobileFund: 0,
    laptopFund: 0,
    bikeFund: 0,
    carFund: 0,
    houseFund: 0,
    travelFund: 0,
    totalFunds: 0
  });
  const [loading, setLoading] = useState(true);
  const [leadsStats, setLeadsStats] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [downlineStats, setDownlineStats] = useState([]);
  const [downlineLoading, setDownlineLoading] = useState(true);
  const [downlinePeriod, setDownlinePeriod] = useState('7days');
  const [earningsPeriod, setEarningsPeriod] = useState('7days');
  const [totalPackageBuyers, setTotalPackageBuyers] = useState(0);
  const [directBuyers, setDirectBuyers] = useState(0);
  const [indirectBuyers, setIndirectBuyers] = useState(0);
  const [commissionTransactions, setCommissionTransactions] = useState([]);
  const [teamIncome, setTeamIncome] = useState(0);
  const [teamIncomeLoading, setTeamIncomeLoading] = useState(false);
  const [activeIncome, setActiveIncome] = useState(0);
  const [specialIncome, setSpecialIncome] = useState({
    leaderShipFund: 0,
    royaltyIncome: 0,
    rewardIncome: 0,
  });

  // Super Package commissions state
  const [superPackageCommissions, setSuperPackageCommissions] = useState({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    activeIncome: 0,
    passiveIncome: 0,
    transactions: []
  });
  const [superPackageCommissionsLoading, setSuperPackageCommissionsLoading] = useState(true);
  const [superPackageTransactions, setSuperPackageTransactions] = useState([]);
  const [superPackageTransactionsLoading, setSuperPackageTransactionsLoading] = useState(true);

  // Super Package buyers state
  const [totalSuperPackageBuyers, setTotalSuperPackageBuyers] = useState(0);
  const [directSuperPackageBuyers, setDirectSuperPackageBuyers] = useState(0);
  const [indirectSuperPackageBuyers, setIndirectSuperPackageBuyers] = useState(0);
  const [superPackageDownlineStats, setSuperPackageDownlineStats] = useState([]);
  const [superPackageDownlineLoading, setSuperPackageDownlineLoading] = useState(true);
  const [superPackageDownlinePeriod, setSuperPackageDownlinePeriod] = useState('7days');
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [motivationQuote, setMotivationQuote] = useState(null);
  const [motivationQuotes, setMotivationQuotes] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [refreshMessage, setRefreshMessage] = useState('');

  // Memoized calculations to prevent unnecessary recalculations
  const totalActiveIncome = useMemo(() => {
    return activeIncome + userFunds.totalFunds + specialIncome.royaltyIncome + specialIncome.rewardIncome + specialIncome.leaderShipFund;
  }, [activeIncome, userFunds.totalFunds, specialIncome.royaltyIncome, specialIncome.rewardIncome, specialIncome.leaderShipFund]);

  const totalWithdrawn = useMemo(() => {
    return payoutHistory.filter(p => p.status === 'approved' || p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [payoutHistory]);

  const totalIncome = useMemo(() => {
    // Per requirement: Total Income = Active (level 1 regular) + Passive (level 2-120 regular) + Super Package Commissions
    return parseFloat(activeIncome || 0) + parseFloat(teamIncome || 0) + parseFloat(superPackageCommissions.totalEarned || 0) + parseFloat(specialIncome.royaltyIncome || 0) + parseFloat(specialIncome.rewardIncome || 0) + parseFloat(specialIncome.leaderShipFund || 0) + parseFloat(totalWithdrawn || 0);
  }, [activeIncome, teamIncome, superPackageCommissions.totalEarned, specialIncome.royaltyIncome, specialIncome.rewardIncome, specialIncome.leaderShipFund, totalWithdrawn]);


  // Per requirement: Wallet = Active + Passive + Super Package Commissions
  const WalletIncome = (activeIncome || 0) + (teamIncome || 0) + (superPackageCommissions.totalEarned || 0) + parseFloat(specialIncome.royaltyIncome || 0) + parseFloat(specialIncome.rewardIncome || 0) + parseFloat(specialIncome.leaderShipFund || 0);

  useEffect(() => {
    if (user && token) {
      // Fetch all data in parallel for better performance
      Promise.all([
        fetchDashboardData(),
        fetchLeadsStats(),
        fetchDownlineStats(),
        fetchTotalPackageBuyers(),
        fetchMotivationQuote(),
        fetchGalleryImages(),
        fetchSuperPackageDownlineStats(),
        fetchTotalSuperPackageBuyers()
      ]).catch(error => {
        console.error('Error fetching dashboard data:', error);
      });
    }
    // eslint-disable-next-line
  }, [user, token]);


  // Periodic refresh every 5 minutes
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {
      refreshDashboard();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, token]);

  // Refetch downline stats when period changes
  useEffect(() => {
    if (user && token) {
      fetchDownlineStats(downlinePeriod);
    }
  }, [downlinePeriod]);

  // Refetch earnings data when period changes
  useEffect(() => {
    if (user && token) {
      fetchEarningsData(earningsPeriod);
    }
  }, [earningsPeriod]);

  // Fetch initial earnings data
  useEffect(() => {
    if (user && token) {
      fetchEarningsData('7days');
    }
  }, [user, token]);

  // Fetch team income when referralTree changes
  useEffect(() => {
    const fetchTeamIncome = async () => {
      if (!referralTree.directReferrals || referralTree.directReferrals.length === 0) {
        setTeamIncome(0);
        return;
      }
      setTeamIncomeLoading(true);
      try {
        // Get user's wallet data with activeIncome and passiveIncome fields
        const walletResponse = await fetch(`${API_ENDPOINTS.packages.commissionSummary}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();

          // Use the activeIncome and passiveIncome fields directly from the API response
          setActiveIncome(walletData.data?.activeIncome || 0);
          setTeamIncome(walletData.data?.passiveIncome || 0);
        } else {
          setActiveIncome(0);
          setTeamIncome(0);
        }
      } catch (error) {
        console.error('Error fetching income data:', error);
        setActiveIncome(0);
        setTeamIncome(0);
      }

      setTeamIncomeLoading(false);
    };
    if (user && token && referralTree.directReferrals) fetchTeamIncome();
  }, [user, token, referralTree]);

  useEffect(() => {
    async function fetchSpecialIncome() {
      try {
        const res = await fetch(`${API_ENDPOINTS.specialIncome.user.replace(':userId', user.userId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSpecialIncome(data.data || { leaderShipFund: 0, royaltyIncome: 0, rewardIncome: 0 });
        }
      } catch (error) {
        console.error('Error fetching special income:', error);
        setSpecialIncome({ leaderShipFund: 0, royaltyIncome: 0, rewardIncome: 0 });
      }
    }
    if (user && token) fetchSpecialIncome();
  }, [user, token]);

  // Fetch Super Package commissions
  useEffect(() => {
    async function fetchSuperPackageCommissions() {
      try {
        setSuperPackageCommissionsLoading(true);
        // Use the Super Package commission summary endpoint to get proper active/passive income fields
        const res = await fetch(`${API_ENDPOINTS.superPackages.commissionSummary}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSuperPackageCommissions({
            balance: data.data?.balance || 0,
            totalEarned: data.data?.totalEarned || 0,
            totalWithdrawn: data.data?.totalWithdrawn || 0,
            activeIncome: data.data?.activeIncome || 0,
            passiveIncome: data.data?.passiveIncome || 0,
            transactions: data.data?.transactions || []
          });
        }
      } catch (error) {
        console.error('Error fetching super package commissions:', error);
        setSuperPackageCommissions({ balance: 0, totalEarned: 0, totalWithdrawn: 0, activeIncome: 0, passiveIncome: 0, transactions: [] });
      } finally {
        setSuperPackageCommissionsLoading(false);
      }
    }
    if (user && token) fetchSuperPackageCommissions();
  }, [user, token]);

  // Fetch Super Package transactions
  useEffect(() => {
    async function fetchSuperPackageTransactions() {
      try {
        setSuperPackageTransactionsLoading(true);
        // Use the Super Package transactions endpoint
        const res = await fetch(`${API_ENDPOINTS.superPackages.transactions}?limit=1000&period=all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSuperPackageTransactions(data.data?.transactions || []);
        }
      } catch (error) {
        console.error('Error fetching super package transactions:', error);
        setSuperPackageTransactions([]);
      } finally {
        setSuperPackageTransactionsLoading(false);
      }
    }
    if (user && token) fetchSuperPackageTransactions();
  }, [user, token]);

  useEffect(() => {
    async function fetchPayoutHistory() {
      try {
        const res = await fetch(`${API_ENDPOINTS.payout.history}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPayoutHistory(data.payouts || []);
        }
      } catch (error) {
        console.error('Error fetching payout history:', error);
        setPayoutHistory([]);
      }
    }
    if (user && token) fetchPayoutHistory();
  }, [user, token]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Sync user status based on package purchases
      await syncUserStatus();

      // Fetch commission summary
      const commissionResponse = await fetch(`${API_ENDPOINTS.packages.commissionSummary}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (commissionResponse.ok) {
        const commissionData = await commissionResponse.json();
        setCommissionSummary(commissionData.data);

        // Also update active and passive income from the same response
        setActiveIncome(commissionData.data?.activeIncome || 0);
        setTeamIncome(commissionData.data?.passiveIncome || 0);
      }
      // Fetch referral tree
      const referralTreeResponse = await fetch(`${API_ENDPOINTS.packages.referralTree}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (referralTreeResponse.ok) {
        const referralTreeData = await referralTreeResponse.json();
        setReferralTree(referralTreeData.data);
      }
      // Fetch user funds
      const fundsResponse = await fetch(`${API_ENDPOINTS.funds.userFunds}/${user.userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fundsResponse.ok) {
        const fundsData = await fundsResponse.json();
        setUserFunds(fundsData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.userId, syncUserStatus]);

  const fetchLeadsStats = async () => {
    try {
      setLeadsLoading(true);
      const res = await fetch(`${API_ENDPOINTS.packages.referralStats7Days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeadsStats(data.data || []);
      } else {
        setLeadsStats([]);
      }
    } catch (e) {
      setLeadsStats([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchDownlineStats = async (period = downlinePeriod) => {
    try {
      setDownlineLoading(true);
      const res = await fetch(`${API_ENDPOINTS.packages.downlineStats7Days}?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDownlineStats(data.data || []);
        // Update total package buyers with the total unique buyers from downline stats
        if (data.totalUniqueBuyers !== undefined) {
          setTotalPackageBuyers(data.totalUniqueBuyers);
        }
        // Update direct and indirect buyers counts
        if (data.directBuyers !== undefined) {
          setDirectBuyers(data.directBuyers);
        }
        if (data.indirectBuyers !== undefined) {
          setIndirectBuyers(data.indirectBuyers);
        }
      } else {
        setDownlineStats([]);
      }
    } catch (e) {
      setDownlineStats([]);
    } finally {
      setDownlineLoading(false);
    }
  };

  const fetchTotalPackageBuyers = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.packages.totalPackageBuyers}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTotalPackageBuyers(data.data?.totalPackageBuyers || 0);
      } else {
        setTotalPackageBuyers(0);
      }
    } catch (e) {
      setTotalPackageBuyers(0);
    }
  };

  const fetchEarningsData = async (period = '7days') => {
    try {
      const res = await fetch(`${API_ENDPOINTS.packages.transactions}?limit=1000&period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCommissionTransactions(data.data.transactions || []);
      } else {
        setCommissionTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      setCommissionTransactions([]);
    }
  };

  const fetchMotivationQuote = async () => {
    try {
      setQuoteLoading(true);
      const res = await fetch(API_ENDPOINTS.auth.activeMotivationQuote, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMotivationQuote(data.quote);
        setMotivationQuotes(data.quotes || []);
      } else {
        setMotivationQuote(null);
        setMotivationQuotes([]);
      }
    } catch (e) {
      setMotivationQuote(null);
      setMotivationQuotes([]);
    } finally {
      setQuoteLoading(false);
    }
  };

  const fetchGalleryImages = async () => {
    try {
      setGalleryLoading(true);
      const res = await fetch(API_ENDPOINTS.auth.activeGalleryImages);
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data.images || []);
      } else {
        setGalleryImages([]);
      }
    } catch (e) {
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchSuperPackageDownlineStats = async (period = superPackageDownlinePeriod) => {
    try {
      setSuperPackageDownlineLoading(true);
      const res = await fetch(`${API_ENDPOINTS.superPackages.downlineStats7Days}?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuperPackageDownlineStats(data.data || []);
        // Update direct and indirect super package buyers counts
        if (data.directBuyers !== undefined) {
          setDirectSuperPackageBuyers(data.directBuyers);
        }
        if (data.indirectBuyers !== undefined) {
          setIndirectSuperPackageBuyers(data.indirectBuyers);
        }
      } else {
        setSuperPackageDownlineStats([]);
      }
    } catch (e) {
      setSuperPackageDownlineStats([]);
    } finally {
      setSuperPackageDownlineLoading(false);
    }
  };

  const fetchTotalSuperPackageBuyers = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.superPackages.totalSuperPackageBuyers}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTotalSuperPackageBuyers(data.data?.totalSuperPackageBuyers || 0);
      } else {
        setTotalSuperPackageBuyers(0);
      }
    } catch (e) {
      setTotalSuperPackageBuyers(0);
    }
  };

  // Refetch super package downline stats when period changes
  useEffect(() => {
    if (user && token) {
      fetchSuperPackageDownlineStats(superPackageDownlinePeriod);
    }
  }, [superPackageDownlinePeriod]);

  const downloadImage = async (imageUrl, imageTitle) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      // Get file extension from URL or default to .jpg
      const urlParts = imageUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';

      // Set filename with original title and extension
      const filename = `${imageTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const downloadMotivationImage = async (imageUrl, quoteText) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      // Get file extension from URL or default to .jpg
      const urlParts = imageUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';

      // Create a meaningful filename
      let filename = 'motivation';
      if (quoteText && quoteText !== 'motivation') {
        // Use first few words of the quote as filename
        const words = quoteText.split(' ').slice(0, 3).join('_');
        filename = `motivation_${words}`;
      }

      // Clean filename and add extension
      filename = `${filename.replace(/[^a-zA-Z0-9_]/g, '_')}.${extension}`;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading motivation image:', error);
      alert('Failed to download motivation image. Please try again.');
    }
  };

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setRefreshMessage('');
    try {
      // Refresh all data in parallel for better performance
      await Promise.all([
        fetchDashboardData(),
        fetchLeadsStats(),
        fetchDownlineStats(),
        fetchTotalPackageBuyers(),
        fetchMotivationQuote(),
        fetchGalleryImages(),
        fetchSuperPackageDownlineStats(),
        fetchTotalSuperPackageBuyers(),
        // Refresh Super Package commissions
        fetch(`${API_ENDPOINTS.superPackages.commissionSummary}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : null).then(data => {
          if (data) {
            setSuperPackageCommissions({
              balance: data.data?.balance || 0,
              totalEarned: data.data?.totalEarned || 0,
              totalWithdrawn: data.data?.totalWithdrawn || 0,
              activeIncome: data.data?.activeIncome || 0,
              passiveIncome: data.data?.passiveIncome || 0,
              transactions: data.data?.transactions || []
            });
          }
        }),
        // Refresh Super Package transactions
        fetch(`${API_ENDPOINTS.superPackages.transactions}?limit=1000&period=all`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : null).then(data => {
          if (data) {
            setSuperPackageTransactions(data.data?.transactions || []);
          }
        }),
        // Refresh payout history
        fetch(`${API_ENDPOINTS.payout.history}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : null).then(data => {
          if (data) {
            setPayoutHistory(data.payouts || []);
          }
        })
      ]);

      setRefreshMessage('Dashboard refreshed successfully!');
      setTimeout(() => setRefreshMessage(''), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      setRefreshMessage('Failed to refresh dashboard');
      setTimeout(() => setRefreshMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [token, fetchDashboardData]);


  const isActive = user?.activationDate !== undefined ? user.activationDate : true;
  const kycVerified = user?.kycApprovedDate ? true : false;
  const registrationDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-';
  const sponsorName = user?.sponsorName || '-';
  const sponsorMobile = user?.sponsorMobile || '-';

  // Memoized chart data calculations
  const chartData = useMemo(() => {
    const last7Days = leadsStats.length > 0
      ? leadsStats.map(item => {
        const d = new Date(item.date);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      })
      : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      });

    const directLeadsData = leadsStats.length > 0 ? leadsStats.map(item => item.directCount || 0) : [0, 0, 0, 0, 0, 0, 0];
    const indirectLeadsData = leadsStats.length > 0 ? leadsStats.map(item => item.indirectCount || 0) : [0, 0, 0, 0, 0, 0, 0];
    const directDownlineData = downlineStats.length > 0 ? downlineStats.map(item => item.directCount || 0) : [0, 0, 0, 0, 0, 0, 0];
    const indirectDownlineData = downlineStats.length > 0 ? downlineStats.map(item => item.indirectCount || 0) : [0, 0, 0, 0, 0, 0, 0];

    const directSuperPackageData = superPackageDownlineStats.length > 0 ? superPackageDownlineStats.map(item => item.directCount || 0) : [0, 0, 0, 0, 0, 0, 0];
    const indirectSuperPackageData = superPackageDownlineStats.length > 0 ? superPackageDownlineStats.map(item => item.indirectCount || 0) : [0, 0, 0, 0, 0, 0, 0];

    // Combine the arrays by adding corresponding elements
    const combinedDirectData = directDownlineData.map((value, index) => value + (directSuperPackageData[index] || 0));
    const combinedIndirectData = indirectDownlineData.map((value, index) => value + (indirectSuperPackageData[index] || 0));

    return {
      last7Days,
      directLeadsData,
      indirectLeadsData,
      combinedDirectData,
      combinedIndirectData
    };
  }, [leadsStats, downlineStats, superPackageDownlineStats]);

  const leadsChart = useMemo(() => ({
    labels: chartData.last7Days,
    datasets: [
      {
        label: 'Direct Referrals',
        data: chartData.directLeadsData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 24,
      },
      {
        label: 'Indirect Referrals',
        data: chartData.indirectLeadsData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // green-500
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 24,
      },
    ],
  }), [chartData]);

  const downlineChart = useMemo(() => ({
    labels: chartData.last7Days,
    datasets: [
      {
        label: 'Direct Package Buyers',
        data: chartData.combinedDirectData,
        backgroundColor: 'rgba(245, 158, 11, 0.8)', // amber-500
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 24,
      },
      {
        label: 'Indirect Package Buyers',
        data: chartData.combinedIndirectData,
        backgroundColor: 'rgba(236, 72, 153, 0.8)', // pink-500
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 24,
      },
    ],
  }), [chartData]);

  // Memoized earnings data calculation
  const earningsData = useMemo(() => {
    const now = new Date();
    let days;
    let startDate;

    switch (earningsPeriod) {
      case '1day':
        days = 1;
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        days = 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '15days':
        days = 15;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 14);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        days = 30;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'alltime':
        days = 365; // Show last year for all time
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 364);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        days = 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
    }

    const periodDates = Array.from({ length: days }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // Filter transactions for the selected period only
    const periodTransactions = commissionTransactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate && transactionDate <= now;
    });

    // For each day, calculate active and passive income separately from actual transactions only
    const activeIncomeData = periodDates.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      // Commission income (Level 1) - Regular packages only
      const regularCommissionSum = periodTransactions
        .filter(t => t.type === 'commission' && t.status === 'completed' && t.level === 1 && new Date(t.createdAt) >= date && new Date(t.createdAt) < nextDay)
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      // Only include actual transaction data, not static funds/special income
      return regularCommissionSum;
    });

    const passiveIncomeData = periodDates.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      // Regular package passive income (Level 2-120) only
      const regularPassiveSum = periodTransactions
        .filter(t => t.type === 'commission' && t.status === 'completed' && t.level >= 2 && t.level <= 120 && new Date(t.createdAt) >= date && new Date(t.createdAt) < nextDay)
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      return regularPassiveSum;
    });

    const labels = periodDates.map(date => date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));

    return {
      labels,
      activeIncomeData,
      passiveIncomeData,
      totalActive: activeIncomeData.reduce((sum, val) => sum + val, 0),
      totalPassive: passiveIncomeData.reduce((sum, val) => sum + val, 0),
      totalEarnings: activeIncomeData.reduce((sum, val) => sum + val, 0) + passiveIncomeData.reduce((sum, val) => sum + val, 0)
    };
  }, [earningsPeriod, commissionTransactions]);

  if (!user) return <LoginPrompt type="dashboard" />;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
          {/* Profile Card Skeleton */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row items-stretch gap-6">
              <div className="w-full md:w-1/2">
                <div className="bg-white rounded-xl border border-gray-100 p-6 w-full max-w-sm">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center w-full">
                      <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded ml-4 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse mb-8">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
      {/* Dashboard Header with Refresh Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            {refreshMessage && (
              <div className={`text-sm font-semibold px-3 py-1 rounded-lg ${refreshMessage.includes('successfully')
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                {refreshMessage}
              </div>
            )}
            <button
              onClick={refreshDashboard}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile/Info Card */}
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 p-6 flex flex-col md:flex-row items-stretch gap-6 mt-8 mb-8">
        {/* Responsive flex-row for left and right columns */}
        <div className="w-full flex flex-col md:flex-row items-stretch gap-6">
          {/* Left Side: Simple & Attractive Profile Card */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center min-w-[180px] h-full py-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6 w-full max-w-sm">
              {/* Profile Avatar */}
              <div className="flex justify-center mb-4">
                <UserAvatar
                  imageUrl={user.imageUrl}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  status={user.status}
                  size={80}
                  className="shadow-lg"
                />
              </div>

              {/* User Name */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {user.firstName} {user.lastName}
                </h3>
              </div>

              {/* Status Badges */}
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-lg ${user.status === 'active' ? 'bg-green-50 border border-green-200' :
                  user.status === 'kyc_verified' ? 'bg-blue-50 border border-blue-200' :
                    user.status === 'blocked' ? 'bg-red-50 border border-red-200' :
                      'bg-gray-50 border border-gray-200'
                  }`}>
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <span className={`text-sm font-semibold ${user.status === 'active' ? 'text-green-600' :
                    user.status === 'kyc_verified' ? 'text-blue-600' :
                      user.status === 'blocked' ? 'text-red-600' :
                        'text-gray-600'
                    }`}>
                    {user.status === 'free' ? 'Free' :
                      user.status === 'active' ? 'Active' :
                        user.status === 'kyc_verified' ? 'KYC Verified' :
                          user.status === 'blocked' ? 'Blocked' :
                            user.status ? user.status.toUpperCase() : 'Free'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${kycVerified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                  <span className="text-sm font-medium text-gray-600">KYC</span>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${kycVerified ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                    <BadgeCheck size={16} />
                    {kycVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-sm font-medium text-gray-600">Level</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-blue-600">
                    <Crown size={16} />
                    {user.mlmLevel || 'Active Member'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Right Side: Details, always half width, vertically centered */}
          <div className="w-full md:w-1/2 flex flex-col items-start justify-center text-left">
            <div className="flex flex-col gap-3 text-sm text-gray-700 font-medium w-full">
              {/* Field Row */}
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <UserIcon size={18} className="text-blue-400" />Username:
                </div>
                <div className="font-bold text-gray-800 break-all">{user.firstName} {user.lastName}</div>
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <Smartphone size={18} className="text-green-400" />Mobile:
                </div>
                <div className="font-bold text-gray-800 break-all">{user.mobile}</div>
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <Mail size={18} className="text-pink-400" />Email:
                </div>
                <div className="font-bold text-gray-800 break-all">{user.email}</div>
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <CheckCircle size={18} className="text-green-500" />Status:
                </div>
                <div className={`font-bold ${user.status === 'active' ? 'text-green-600' :
                  user.status === 'kyc_verified' ? 'text-blue-600' :
                    user.status === 'blocked' ? 'text-red-600' :
                      'text-gray-800'
                  }`}>
                  {user.status === 'free' ? 'Free' :
                    user.status === 'active' ? 'Active' :
                      user.status === 'kyc_verified' ? 'KYC Verified' :
                        user.status === 'blocked' ? 'Blocked' :
                          user.status ? user.status.toUpperCase() : 'Free'}
                </div>
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <CalendarDays size={18} className="text-orange-400" />Registration Date:
                </div>
                <div className="font-bold text-gray-800">{registrationDate}</div>
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <CalendarDays size={18} className="text-yellow-400" />Activation Date:
                </div>
                <div className="font-bold text-gray-800">{isActive ? new Date(isActive).toLocaleDateString() : '-'}</div>
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <UserCheck size={18} className="text-purple-400" />Sponsor Name:
                </div>
                <div className="font-bold text-gray-800 break-all">{sponsorName}</div>
              </div>
              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <Smartphone size={18} className="text-green-300" />Sponsor Mobile:
                </div>
                <div className="font-bold text-gray-800 break-all">{sponsorMobile}</div>
              </div>

              <div className="flex items-center w-full">
                <div className="flex items-center gap-2 text-gray-400 w-40">
                  <BadgeCheck size={18} className={user.kycApprovedDate ? 'text-green-500' : 'text-gray-400'} />KYC Approved Date:
                </div>
                <div className="font-bold text-gray-800">
                  {user.kycApprovedDate
                    ? `Approved on ${new Date(user.kycApprovedDate).toLocaleDateString()}`
                    : user.kycRejected && user.kycRejectedDate
                      ? `Rejected on ${new Date(user.kycRejectedDate).toLocaleDateString()}`
                      : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* All Income Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-2 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <StatsCard
            icon={Wallet}
            iconColor="text-green-500"
            title="Wallet"
            value={WalletIncome}
            prefix="₹"
            borderColor="border-green-100"
            textColor="text-green-700"
          />
          <StatsCard
            icon={IndianRupee}
            iconColor="text-blue-500"
            title="Withdrawn"
            value={totalWithdrawn}
            prefix="₹"
            borderColor="border-blue-100"
            textColor="text-blue-700"
            tooltip="Amount withdrawn after admin approval"
          />
          <StatsCard
            icon={Users}
            iconColor="text-purple-500"
            title="My Referrals"
            value={referralTree?.directReferrals?.length || 0}
            borderColor="border-purple-100"
            textColor="text-purple-700"
            onClick={() => navigate('/direct-referrals')}
            arrowIcon={ArrowRight}
          />
          <StatsCard
            icon={Package}
            iconColor="text-red-500"
            title="My Successfully Downline"
            value={directBuyers + directSuperPackageBuyers}
            borderColor="border-red-100"
            textColor="text-red-700"
            tooltip={`Direct Package Buyers: ${directBuyers} | Direct Super Package Buyers: ${directSuperPackageBuyers}`}
          />
          <StatsCard
            icon={User}
            iconColor="text-blue-500"
            title="Active Income"
            value={totalActiveIncome}
            prefix="₹"
            borderColor="border-blue-100"
            textColor="text-blue-700"
          />
          <StatsCard
            icon={Users}
            iconColor="text-green-500"
            title="Passive Income"
            value={teamIncome}
            prefix="₹"
            borderColor="border-green-100"
            textColor="text-green-700"
            loading={teamIncomeLoading}
          />
          <StatsCard
            icon={IndianRupee}
            iconColor="text-orange-500"
            title="Leadership Fund"
            value={specialIncome.leaderShipFund}
            prefix="₹"
            borderColor="border-orange-100"
            textColor="text-orange-700"
          />
          <StatsCard
            icon={Crown}
            iconColor="text-purple-500"
            title="Royalty Income"
            value={specialIncome.royaltyIncome}
            prefix="₹"
            borderColor="border-purple-100"
            textColor="text-purple-700"
          />
          <StatsCard
            icon={Gift}
            iconColor="text-yellow-500"
            title="Reward Income"
            value={specialIncome.rewardIncome}
            prefix="₹"
            borderColor="border-yellow-100"
            textColor="text-yellow-700"
          />
          <StatsCard
            icon={Package}
            iconColor="text-indigo-500"
            title="Super Package Commissions"
            value={superPackageCommissions.totalEarned}
            prefix="₹"
            borderColor="border-indigo-100"
            textColor="text-indigo-700"
            loading={superPackageCommissionsLoading}
            tooltip="Total commissions earned from Super Package sales"
          />
          <StatsCard
            icon={Wallet}
            iconColor="text-blue-500"
            title="Total Income"
            value={totalIncome}
            prefix="₹"
            borderColor="border-blue-100"
            textColor="text-blue-700"
            tooltip="Total earnings including withdrawn amounts"
          />
        </div>
        {/* Funds Section */}
        <UserFunds
          funds={userFunds}
          className="mt-10 max-w-6xl mx-auto"
        />
        {/* Referral Link: Only show if user has purchased a package */}
        <ReferralLink
          referralLink={user.referralLink}
          className="mt-8"
        />
      </div>

      {/* 7 Days Leads Graph */}
      <DashboardCard
        title="My 7 Days Referrals"
        icon={Users}
        iconColor="text-orange-500"
        borderColor="border-orange-100"
        className="mt-12"
      >
        <DashboardChart
          type="bar"
          data={leadsChart}
          loading={leadsLoading}
          loadingText="Loading referrals data..."
          summaryData={[
            {
              value: leadsStats.reduce((sum, item) => sum + (item.directCount || 0), 0),
              label: 'Direct Referrals',
              color: 'text-blue-600'
            },
            {
              value: leadsStats.reduce((sum, item) => sum + (item.indirectCount || 0), 0),
              label: 'Indirect Referrals',
              color: 'text-green-600'
            },
            {
              value: leadsStats.reduce((sum, item) => sum + (item.count || 0), 0),
              label: 'Total Referrals',
              color: 'text-orange-600'
            }
          ]}
        />
      </DashboardCard>

      {/* Package Buyers by Referral Level Graph */}
      <DashboardCard
        title="Package Buyers by Referral Level (Package + Super Package)"
        icon={Users}
        iconColor="text-green-500"
        borderColor="border-green-100"
        className="mt-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Regular Packages Period:</label>
              <TimePeriodSelector
                currentPeriod={downlinePeriod}
                onPeriodChange={(period) => {
                  setDownlinePeriod(period);
                  fetchDownlineStats(period);
                }}
                className="mt-2 sm:mt-0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Super Packages Period:</label>
              <TimePeriodSelector
                currentPeriod={superPackageDownlinePeriod}
                onPeriodChange={(period) => {
                  setSuperPackageDownlinePeriod(period);
                  fetchSuperPackageDownlineStats(period);
                }}
                className="mt-2 sm:mt-0"
              />
            </div>
          </div>
        </div>
        <DashboardChart
          type="bar"
          data={downlineChart}
          loading={downlineLoading || superPackageDownlineLoading}
          loadingText="Loading downline data..."
          summaryData={[
            {
              value: directBuyers + directSuperPackageBuyers,
              label: 'Direct Package Buyers',
              color: 'text-amber-600'
            },
            {
              value: indirectBuyers + indirectSuperPackageBuyers,
              label: 'Indirect Package Buyers',
              color: 'text-pink-600'
            },
            {
              value: totalPackageBuyers + totalSuperPackageBuyers,
              label: 'Total Package Buyers',
              color: 'text-green-600'
            },
          ]}
        />
      </DashboardCard>
      {/* Last 7 Days Earning Breakdown */}
      <DashboardCard
        title={`${earningsPeriod === '1day' ? 'Today' : earningsPeriod === '7days' ? 'Last 7 Days' : earningsPeriod === '15days' ? 'Last 15 Days' : earningsPeriod === 'month' ? 'Last 30 Days' : 'All Time'} Earning Breakdown`}
        icon={Wallet}
        iconColor="text-blue-500"
        borderColor="border-blue-100"
        className="mt-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <TimePeriodSelector
            currentPeriod={earningsPeriod}
            onPeriodChange={(period) => {
              setEarningsPeriod(period);
              fetchEarningsData(period);
            }}
            className="mt-2 sm:mt-0"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
            <span className="text-sm font-semibold text-blue-600 mb-1 block">Active Income</span>
            <span className="text-2xl font-extrabold text-blue-700 mb-1 block">₹{earningsData.totalActive.toLocaleString()}</span>
            <span className="text-xs text-blue-500">Level 1 Commissions Only</span>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
            <span className="text-sm font-semibold text-green-600 mb-1 block">Passive Income</span>
            <span className="text-2xl font-extrabold text-green-700 mb-1 block">₹{earningsData.totalPassive.toLocaleString()}</span>
            <span className="text-xs text-green-500">Level 2+ Commissions Only</span>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
            <span className="text-sm font-semibold text-purple-600 mb-1 block">Total Earnings</span>
            <span className="text-2xl font-extrabold text-purple-700 mb-1 block">₹{earningsData.totalEarnings.toLocaleString()}</span>
            <span className="text-xs text-purple-500">{earningsPeriod === '1day' ? 'Today' : earningsPeriod === '7days' ? 'Last 7 Days' : earningsPeriod === '15days' ? 'Last 15 Days' : earningsPeriod === 'month' ? 'Last 30 Days' : 'All Time'} Total</span>
          </div>
        </div>
        <DashboardChart
          type="line"
          data={{
            labels: earningsData.labels,
            datasets: [
              {
                label: 'Active Income',
                data: earningsData.activeIncomeData,
                borderColor: '#3b82f6', // blue-500
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#3b82f6',
                fill: true,
                tension: 0.4,
              },
              {
                label: 'Passive Income',
                data: earningsData.passiveIncomeData,
                borderColor: '#10b981', // green-500
                backgroundColor: 'rgba(16, 185, 129, 0.2)', // green-500 with opacity
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#10b981',
                fill: true,
                tension: 0.4,
              },
            ],
          }}
          loading={loading}
          loadingText="Loading earnings data..."
        />
      </DashboardCard>

      {/* Top Performance in My Downline */}
      {/* <LazyLoad
        fallback={
          <div className="max-w-6xl mx-auto mt-10">
            <h3 className="text-lg font-bold text-yellow-600 mb-2 text-center tracking-wide">Top Performers</h3>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading top performers...</p>
            </div>
          </div>
        }
      >
        <div className="max-w-6xl mx-auto mt-10">
          <h3 className="text-lg font-bold text-yellow-600 mb-2 text-center tracking-wide">Top Performers</h3>
          <div className="max-w-6xl mx-auto mt-10">
            <Leaderboard />
          </div>
          <TopDownlinePerformers />
        </div>
      </LazyLoad> */}

      {/* Motivation Content Section */}
      {motivationQuotes.length > 0 && (
        <LazyLoad
          fallback={
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 shadow-2xl p-8 rounded-2xl mt-8 max-w-6xl mx-auto">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading motivation content...</p>
              </div>
            </div>
          }
        >
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 shadow-2xl p-8 rounded-2xl mt-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                  <Quote className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-orange-600 tracking-wide">Daily Inspiration</h4>
              </div>

              {/* Grid Layout for Multiple Quotes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {motivationQuotes.map((quote, index) => (
                  <div
                    key={quote._id || index}
                    className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    {/* Image Content */}
                    {quote.imageUrl && (
                      <div className="mb-4 relative group">
                        <img
                          src={quote.imageUrl}
                          alt="Motivation"
                          className="w-full h-48 object-cover rounded-lg shadow-md mx-auto group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        {/* Download Button - Appears on hover */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadMotivationImage(quote.imageUrl, quote.quote || 'motivation');
                            }}
                            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
                            title="Download motivation image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Text Content */}
                    {quote.quote && (
                      <blockquote className="text-lg font-medium text-gray-800 italic mb-3 group-hover:text-orange-600 transition-colors duration-300">
                        "{quote.quote}"
                      </blockquote>
                    )}

                    {/* Author */}
                    {quote.author && (
                      <cite className="text-sm text-gray-600 font-medium">
                        — {quote.author}
                      </cite>
                    )}

                    {/* Category Badge */}
                    {quote.category && (
                      <div className="mt-3">
                        <span className="inline-block bg-gradient-to-r from-orange-400 to-yellow-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          {quote.category}
                        </span>
                      </div>
                    )}

                    {/* Content Type Indicator */}
                    <div className="mt-3 flex justify-center gap-2">
                      {quote.imageUrl && !quote.quote && (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                          Image Only
                        </span>
                      )}
                      {quote.quote && !quote.imageUrl && (
                        <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                          Text Only
                        </span>
                      )}
                      {quote.quote && quote.imageUrl && (
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full">
                          Mixed Content
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </LazyLoad>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <LazyLoad
          fallback={
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 shadow-2xl p-8 rounded-2xl mt-8 max-w-6xl mx-auto">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading gallery...</p>
              </div>
            </div>
          }
        >
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 shadow-2xl p-8 rounded-2xl mt-8 max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-2xl text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text tracking-wide">Community Gallery</h4>
              </div>
              <p className="text-gray-600 text-lg font-medium">Discover inspiring moments from our amazing community</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.slice(0, 6).map((image) => (
                <div
                  key={image._id}
                  className="group bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-3 left-3">
                      <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                        {image.category.charAt(0).toUpperCase() + image.category.slice(1)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.imageUrl, image.title);
                        }}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-all"
                        title="Download image"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h5 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-purple-600 transition-colors duration-300">{image.title}</h5>
                    {image.description && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">{image.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-xs font-medium">
                        📅 {new Date(image.uploadDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LazyLoad>
      )}
      {/* Social Links: Always show */}
      <div className="max-w-6xl mx-auto mt-8">
        <SocialLinks />
      </div>
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                {/* Download button */}
                <button
                  onClick={() => downloadImage(selectedImage.imageUrl, selectedImage.title)}
                  className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                  title="Download image"
                >
                  <Download size={20} />
                </button>
                {/* Close button */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedImage.title}</h2>
                <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {selectedImage.category.charAt(0).toUpperCase() + selectedImage.category.slice(1)}
                </span>
              </div>
              {selectedImage.description && (
                <p className="text-gray-600 text-lg leading-relaxed mb-4">{selectedImage.description}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">
                  📅 Uploaded on {new Date(selectedImage.uploadDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Motivation Quote Modal */}
      {selectedQuote && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQuote(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {selectedQuote.imageUrl && (
                <img
                  src={selectedQuote.imageUrl}
                  alt="Motivation"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                {/* Download button */}
                {selectedQuote.imageUrl && (
                  <button
                    onClick={() => downloadMotivationImage(selectedQuote.imageUrl, selectedQuote.quote || 'motivation')}
                    className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                    title="Download motivation image"
                  >
                    <Download size={20} />
                  </button>
                )}
                {/* Close button */}
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Daily Inspiration</h2>
                {selectedQuote.category && (
                  <span className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    {selectedQuote.category}
                  </span>
                )}
              </div>
              {selectedQuote.quote && (
                <blockquote className="text-2xl font-medium text-gray-800 italic mb-6 leading-relaxed">
                  "{selectedQuote.quote}"
                </blockquote>
              )}
              {selectedQuote.author && (
                <cite className="text-lg text-gray-600 font-medium block mb-4">
                  — {selectedQuote.author}
                </cite>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {selectedQuote.imageUrl && !selectedQuote.quote && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Image Only
                    </span>
                  )}
                  {selectedQuote.quote && !selectedQuote.imageUrl && (
                    <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Text Only
                    </span>
                  )}
                  {selectedQuote.quote && selectedQuote.imageUrl && (
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Mixed Content
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-500">
                  📅 {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
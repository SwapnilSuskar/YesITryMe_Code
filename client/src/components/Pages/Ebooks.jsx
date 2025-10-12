import { ArrowLeft, BookOpen, Filter, Folder, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

// Static ebook folder data based on Google Drive structure
const ebookFolders = {
    'Prime Package': [
        {
            id: 'business-books',
            name: 'Business Books',
            description: 'Comprehensive collection of business and entrepreneurship books',
            icon: '💼',
            color: 'bg-blue-500',
            bookCount: 25,
            driveUrl: 'https://drive.google.com/drive/folders/1QHTcqrrOBKclS8NcOa-_A4HhWuNxYrfT'
        },
        {
            id: 'stock-market-books',
            name: 'Stock Market Books',
            description: 'Expert guides on trading, investing, and market analysis',
            icon: '📈',
            color: 'bg-green-500',
            bookCount: 15,
            driveUrl: 'https://drive.google.com/drive/folders/1rd3dyX9cbC9qJj4L2HHuDFkkm0XWSnXM'
        },
        {
            id: 'motivational-books',
            name: 'Motivational Books',
            description: 'Inspirational and self-improvement literature',
            icon: '🚀',
            color: 'bg-purple-500',
            bookCount: 10,
            driveUrl: 'https://drive.google.com/drive/folders/1e6ovsgJwHlEFMvXg06fS6mU1_4zLxp44'
        }
    ],
    'Super Prime Package': [
        {
            id: 'business-books',
            name: 'Business Books',
            description: 'Comprehensive collection of business and entrepreneurship books',
            icon: '💼',
            color: 'bg-blue-500',
            bookCount: 25,
            driveUrl: 'https://drive.google.com/drive/folders/1QHTcqrrOBKclS8NcOa-_A4HhWuNxYrfT'
        },
        {
            id: 'stock-market-books',
            name: 'Stock Market Books',
            description: 'Expert guides on trading, investing, and market analysis',
            icon: '📈',
            color: 'bg-green-500',
            bookCount: 15,
            driveUrl: 'https://drive.google.com/drive/folders/1rd3dyX9cbC9qJj4L2HHuDFkkm0XWSnXM'
        },
        {
            id: 'motivational-books',
            name: 'Motivational Books',
            description: 'Inspirational and self-improvement literature',
            icon: '🚀',
            color: 'bg-purple-500',
            bookCount: 10,
            driveUrl: 'https://drive.google.com/drive/folders/1e6ovsgJwHlEFMvXg06fS6mU1_4zLxp44'
        },
        {
            id: 'parenting-books',
            name: 'Parenting Books',
            description: 'Essential guides for effective parenting',
            icon: '👨‍👩‍👧‍👦',
            color: 'bg-pink-500',
            bookCount: 20,
            driveUrl: 'https://drive.google.com/drive/folders/1q1cmaqjuBjopXek2LUKC547QYwAWxW3L'
        },
        {
            id: 'spiritual-books',
            name: 'Spiritual Books',
            description: 'Books on spirituality and personal growth',
            icon: '🧘',
            color: 'bg-indigo-500',
            bookCount: 15,
            driveUrl: 'https://drive.google.com/drive/folders/1Eu35RhG7ckwtxwscrASPAFctlo-snD27'
        }
    ],
    'Elite Package': [
        {
            id: 'business-books',
            name: 'Business Books',
            description: 'Comprehensive collection of business and entrepreneurship books',
            icon: '💼',
            color: 'bg-blue-500',
            bookCount: 25,
            driveUrl: 'https://drive.google.com/drive/folders/1QHTcqrrOBKclS8NcOa-_A4HhWuNxYrfT'
        },
        {
            id: 'stock-market-books',
            name: 'Stock Market Books',
            description: 'Expert guides on trading, investing, and market analysis',
            icon: '📈',
            color: 'bg-green-500',
            bookCount: 15,
            driveUrl: 'https://drive.google.com/drive/folders/1rd3dyX9cbC9qJj4L2HHuDFkkm0XWSnXM'
        },
        {
            id: 'motivational-books',
            name: 'Motivational Books',
            description: 'Inspirational and self-improvement literature',
            icon: '🚀',
            color: 'bg-purple-500',
            bookCount: 10,
            driveUrl: 'https://drive.google.com/drive/folders/1e6ovsgJwHlEFMvXg06fS6mU1_4zLxp44'
        },
        {
            id: 'parenting-books',
            name: 'Parenting Books',
            description: 'Essential guides for effective parenting',
            icon: '👨‍👩‍👧‍👦',
            color: 'bg-pink-500',
            bookCount: 20,
            driveUrl: 'https://drive.google.com/drive/folders/1q1cmaqjuBjopXek2LUKC547QYwAWxW3L'
        },
        {
            id: 'spiritual-books',
            name: 'Spiritual Books',
            description: 'Books on spirituality and personal growth',
            icon: '🧘',
            color: 'bg-indigo-500',
            bookCount: 15,
            driveUrl: 'https://drive.google.com/drive/folders/1Eu35RhG7ckwtxwscrASPAFctlo-snD27'
        },
        {
            id: 'other-useful-books',
            name: 'Other Useful Books',
            description: 'Additional valuable resources and guides',
            icon: '📚',
            color: 'bg-yellow-500',
            bookCount: 30,
            driveUrl: 'https://drive.google.com/drive/folders/1TM3VtbCSVDMiE8jEKb0ho0BDl171Xsr1'
        }
    ],
    'Booster Package': [
        {
            id: 'business-books',
            name: 'Business Books',
            description: 'Comprehensive collection of business and entrepreneurship books',
            icon: '💼',
            color: 'bg-blue-500',
            bookCount: 25,
            driveUrl: 'https://drive.google.com/drive/folders/1QHTcqrrOBKclS8NcOa-_A4HhWuNxYrfT'
        },
        {
            id: 'stock-market-books',
            name: 'Stock Market Books',
            description: 'Expert guides on trading, investing, and market analysis',
            icon: '📈',
            color: 'bg-green-500',
            bookCount: 15,
            driveUrl: 'https://drive.google.com/drive/folders/1rd3dyX9cbC9qJj4L2HHuDFkkm0XWSnXM'
        }
    ]
};

const Ebooks = () => {
    const { user, token } = useAuthStore();
    const [userPurchases, setUserPurchases] = useState([]);
    const [paymentVerifications, setPaymentVerifications] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        if (user && token) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, [user, token]);

    const fetchUserData = async () => {
        try {
            const [purchasesResponse, verificationsResponse, packagesResponse] = await Promise.all([
                api.get(API_ENDPOINTS.packages.purchases),
                api.get(API_ENDPOINTS.payment.status),
                api.get(API_ENDPOINTS.packages.available)
            ]);
            // Handle different data structures based on API response format
            const purchasesData = purchasesResponse.data.data?.purchases || [];
            const verificationsData = verificationsResponse.data.data?.verifications || [];
            const packagesData = packagesResponse.data.data || [];
            setUserPurchases(purchasesData);
            setPaymentVerifications(verificationsData);
            setPackages(packagesData);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };
    // Get approved packages that user has purchased - using same logic as Package component
    const getApprovedPackages = () => {
        const approvedPackages = [];
        // Use the same logic as getPackagePurchaseCount from Package component
        const getPackagePurchaseCount = (packageId) => {
            // Count verified payment verifications for this package
            const verifiedPayments = paymentVerifications.filter(verification =>
                verification.packageId === packageId && verification.status === 'verified'
            );

            // Also count active purchase records (fallback)
            const activePurchases = userPurchases.filter(purchase =>
                purchase.packageId === packageId && purchase.status === 'active'
            );

            // Return the higher count between verified payments and active purchases
            return Math.max(verifiedPayments.length, activePurchases.length);
        };

        // Check each package to see if user has purchased it
        packages.forEach(pkg => {
            const purchaseCount = getPackagePurchaseCount(pkg._id);
            if (purchaseCount > 0) {
                approvedPackages.push(pkg.name);
            }
        });

        const uniquePackages = [...new Set(approvedPackages)];
        return uniquePackages;
    };

    // Get available ebook folders based on purchased packages
    const getAvailableFolders = () => {
        const approvedPackages = getApprovedPackages();
        const availableFolders = [];
        approvedPackages.forEach(packageName => {
            // Try exact match first
            if (ebookFolders[packageName]) {
                ebookFolders[packageName].forEach(folder => {
                    if (!availableFolders.find(f => f.id === folder.id)) {
                        availableFolders.push(folder);
                    }
                });
            } else {
                // Try case-insensitive match
                const packageKey = Object.keys(ebookFolders).find(key =>
                    key.toLowerCase() === packageName.toLowerCase()
                );

                if (packageKey) {
                    ebookFolders[packageKey].forEach(folder => {
                        if (!availableFolders.find(f => f.id === folder.id)) {
                            availableFolders.push(folder);
                        }
                    });
                } else {
                }
            }
        });

        return availableFolders;
    };

    // Filter folders based on search and category
    const getFilteredFolders = () => {
        let folders = getAvailableFolders();

        if (searchTerm) {
            folders = folders.filter(folder =>
                folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                folder.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            folders = folders.filter(folder => folder.id === selectedCategory);
        }

        return folders;
    };

    const handleFolderClick = (folder) => {
        // Open the Google Drive folder in a new tab
        window.open(folder.driveUrl, '_blank');
    };

    if (!user) {return <LoginPrompt  type="eBooks"/>
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const availableFolders = getAvailableFolders();
    const filteredFolders = getFilteredFolders();

    if (availableFolders.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center mb-8">
                        <Link
                            to="/packages"
                            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Packages
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">BUY ANY PACKAGE FOR EBOOK</h2>
                        <p className="text-gray-600 mb-6">
                            You need to purchase and get approved for a package to access ebooks.
                        </p>
                        <Link
                            to="/packages"
                            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                            Browse Packages
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 mt-14">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Link
                            to="/packages"
                            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mr-6"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Packages
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">My Ebook Library</h1>
                            <p className="text-gray-600">Access your purchased ebooks and resources</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Available Folders</p>
                        <p className="text-2xl font-bold text-blue-600">{availableFolders.length}</p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search ebooks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Categories</option>
                                {availableFolders.map(folder => (
                                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Ebook Folders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFolders.map((folder) => (
                        <div
                            key={folder.id}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                            onClick={() => handleFolderClick(folder)}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 ${folder.color} rounded-xl flex items-center justify-center text-white text-2xl`}>
                                        {folder.icon}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Books</p>
                                        <p className="text-lg font-bold text-gray-800">{folder.bookCount}</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-2">{folder.name}</h3>
                                <p className="text-gray-600 text-sm mb-4">{folder.description}</p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-blue-600 font-medium">
                                        <Folder className="w-4 h-4 mr-2" />
                                        Open Folder
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No Results */}
                {filteredFolders.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
                        <p className="text-gray-600">
                            Try adjusting your search terms or filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ebooks; 
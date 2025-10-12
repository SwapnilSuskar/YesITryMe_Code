import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';

const AiToolsDetailer = () => {
    const { toolName } = useParams();
    const navigate = useNavigate();
    const [tool, setTool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTool = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/api/ai-tools/public');

                // Enhanced matching with multiple fallback strategies
                const foundTool = data.data?.find(t => {
                    if (!t.name || !toolName) return false;
                    
                    const toolNameLower = t.name.toLowerCase().trim();
                    const urlNameLower = toolName.toLowerCase().trim();

                    // 1. Try exact match
                    if (toolNameLower === urlNameLower) return true;

                    // 2. Try with hyphens
                    const toolNameWithHyphens = toolNameLower.replace(/\s+/g, '-');
                    const urlNameWithHyphens = urlNameLower.replace(/\s+/g, '-');
                    if (toolNameWithHyphens === urlNameWithHyphens) return true;

                    // 3. Try without special characters
                    const toolNameClean = toolNameLower.replace(/[^a-z0-9]/g, '');
                    const urlNameClean = urlNameLower.replace(/[^a-z0-9]/g, '');
                    if (toolNameClean === urlNameClean) return true;

                    // 4. Try partial match (if tool name contains URL name or vice versa)
                    if (toolNameLower.includes(urlNameLower) || urlNameLower.includes(toolNameLower)) return true;

                    // 5. Try with underscores
                    const toolNameWithUnderscores = toolNameLower.replace(/\s+/g, '_');
                    const urlNameWithUnderscores = urlNameLower.replace(/\s+/g, '_');
                    if (toolNameWithUnderscores === urlNameWithUnderscores) return true;

                    return false;
                });
                if (foundTool) {
                    setTool(foundTool);
                } else {
                    setError('Tool not found');
                }
            } catch (err) {
                console.error('Error fetching tool:', err);
                setError('Failed to load tool details');
            } finally {
                setLoading(false);
            }
        };

        if (toolName) {
            fetchTool();
        }
    }, [toolName]);

    // Dynamic rendering based on tool name
    const getToolIcon = (toolName) => {
        const name = toolName.toLowerCase();
        if (name.includes('chatgpt') || name.includes('bard') || name.includes('claude')) {
            return '🤖';
        } else if (name.includes('midjourney') || name.includes('dall') || name.includes('stable diffusion')) {
            return '🎨';
        } else if (name.includes('grammarly') || name.includes('quillbot') || name.includes('writesonic')) {
            return '✍️';
        } else if (name.includes('canva') || name.includes('fotor') || name.includes('pixlr')) {
            return '🎨';
        } else if (name.includes('github') || name.includes('replit') || name.includes('code')) {
            return '💻';
        } else if (name.includes('video') || name.includes('lumen') || name.includes('kapwing')) {
            return '🎬';
        } else if (name.includes('audio') || name.includes('murf') || name.includes('play.ht')) {
            return '🎵';
        } else if (name.includes('seo') || name.includes('semrush') || name.includes('ahrefs')) {
            return '📊';
        } else if (name.includes('chatbot') || name.includes('tidio') || name.includes('manychat')) {
            return '💬';
        } else {
            return '⚡';
        }
    };

    const getCategoryColor = (category) => {
        const cat = category?.toLowerCase();
        if (cat?.includes('content') || cat?.includes('writing')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (cat?.includes('image') || cat?.includes('design')) return 'bg-purple-100 text-purple-700 border-purple-200';
        if (cat?.includes('video') || cat?.includes('editing')) return 'bg-red-100 text-red-700 border-red-200';
        if (cat?.includes('audio') || cat?.includes('voice')) return 'bg-green-100 text-green-700 border-green-200';
        if (cat?.includes('code') || cat?.includes('development')) return 'bg-orange-100 text-orange-700 border-orange-200';
        if (cat?.includes('seo') || cat?.includes('marketing')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        if (cat?.includes('chatbot') || cat?.includes('automation')) return 'bg-pink-100 text-pink-700 border-pink-200';
        return 'bg-orange-100 text-orange-700 border-orange-200';
    };

    const getCategoryGradient = (category) => {
        const cat = category?.toLowerCase();
        if (cat?.includes('content') || cat?.includes('writing')) return 'from-blue-500 to-cyan-500';
        if (cat?.includes('image') || cat?.includes('design')) return 'from-purple-500 to-pink-500';
        if (cat?.includes('video') || cat?.includes('editing')) return 'from-red-500 to-orange-500';
        if (cat?.includes('audio') || cat?.includes('voice')) return 'from-green-500 to-emerald-500';
        if (cat?.includes('code') || cat?.includes('development')) return 'from-orange-500 to-red-500';
        if (cat?.includes('seo') || cat?.includes('marketing')) return 'from-yellow-500 to-orange-500';
        if (cat?.includes('chatbot') || cat?.includes('automation')) return 'from-pink-500 to-purple-500';
        return 'from-[#FF4E00] to-orange-500';
    };

    if (loading) {
        return (
            <section className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative mb-6 sm:mb-8">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-orange-200 border-t-[#FF4E00] rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Loading Tool Details</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Preparing amazing insights for you...</p>
                </div>
            </section>
        );
    }

    if (error || !tool) {
        return (
            <section className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-4 sm:mb-6">Tool Not Found</h1>
                    <p className="text-gray-600 mb-8 sm:mb-10 text-sm sm:text-base">{error || 'The requested tool could not be found.'}</p>
                    <button
                        onClick={() => navigate('/ai-tools')}
                        className="bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                    >
                        Back to AI Tools
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 sm:pt-24 py-8 sm:py-12 md:py-16 lg:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <div className="mb-6 sm:mb-8">
                    <button
                        onClick={() => navigate('/ai-tools')}
                        className="inline-flex items-center gap-2 sm:gap-3 text-[#FF4E00] hover:text-orange-600 font-semibold group transition-all duration-200"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 border border-orange-100">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        <span className="text-sm sm:text-base">Back to AI Tools</span>
                    </button>
                </div>

                {/* Main Tool Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                    {/* Hero Section */}
                    <div className={`bg-gradient-to-r ${getCategoryGradient(tool.category)} px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 relative overflow-hidden`}>
                        {/* Background Pattern */}
                        <div className="hidden sm:block absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white rounded-full -translate-y-8 sm:-translate-y-12 md:-translate-y-16 translate-x-8 sm:translate-x-12 md:translate-x-16"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full translate-y-6 sm:translate-y-8 md:translate-y-12 -translate-x-6 sm:-translate-x-8 md:-translate-x-12"></div>
                        </div>

                        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                            <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-white/20 backdrop-blur rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-lg">
                                {getToolIcon(tool.name)}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 break-words">{tool.name}</h1>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 flex-wrap">
                                    <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border-2 ${getCategoryColor(tool.category)}`}>
                                        {tool.category || 'Other'}
                                    </span>
                                    <div className="flex items-center gap-2 text-white/80">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs sm:text-sm">Added {new Date(tool.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-6 md:p-8 lg:p-12">
                        {/* Benefits Section */}
                        <div className="mb-8 sm:mb-10 md:mb-12">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4 sm:mb-6 text-center sm:text-left">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-black">Tool Benefits & Features</h2>
                            </div>
                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-orange-200">
                                <p className="text-gray-700 leading-relaxed text-base sm:text-lg break-words">{tool.benefit}</p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-md sm:rounded-lg flex items-center justify-center">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-black text-sm sm:text-base">Performance</h3>
                                </div>
                                <p className="text-gray-600 text-xs sm:text-sm">High-speed AI processing with advanced algorithms</p>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-md sm:rounded-lg flex items-center justify-center">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-black text-sm sm:text-base">Security</h3>
                                </div>
                                <p className="text-gray-600 text-xs sm:text-sm">Enterprise-grade security and data protection</p>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-200 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#FF4E00] to-orange-500 rounded-md sm:rounded-lg flex items-center justify-center">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-black text-sm sm:text-base">User-Friendly</h3>
                                </div>
                                <p className="text-gray-600 text-xs sm:text-sm">Intuitive interface designed for all skill levels</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            <a
                                href={tool.link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#FF4E00] to-orange-500 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="hidden sm:inline">🚀 Launch Tool</span>
                                <span className="sm:hidden">Launch Tool</span>
                            </a>
                            <button
                                onClick={() => navigate('/ai-tools')}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-orange-300 text-gray-700 font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl hover:bg-orange-50 hover:border-[#FF4E00] hover:text-[#FF4E00] transition-all duration-200"
                            >
                                <span>← Back to AI Tools</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AiToolsDetailer;

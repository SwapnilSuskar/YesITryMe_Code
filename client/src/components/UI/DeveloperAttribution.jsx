import { Phone, Linkedin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const DeveloperAttribution = () => {
    return (
        <div className="bg-black border-t border-gray-800 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="flex justify-center items-center flex-wrap gap-4 text-sm">
                        <span className="text-gray-500">
                            Website designed and developed with ❤️ by{" "}
                            <span className="text-orange-400 font-semibold">Avishkar</span>
                        </span>
                        <span className="text-gray-400">•</span>
                        <Link
                            to="tel:+919322810348"
                            className="text-gray-400 hover:text-orange-400 transition-colors duration-300 flex items-center"
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            +91 9322810348
                        </Link>
                        <span className="text-gray-400">•</span>
                        <Link
                            to="https://www.linkedin.com/in/avishkar-kakde-6592b825b/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-orange-400 transition-colors duration-300 flex items-center"
                        >
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                        <span className="text-gray-400">•</span>
                        <Link
                            to="https://avishkar2004.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-orange-400 transition-colors duration-300 flex items-center"
                        >
                            Portfolio
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperAttribution;

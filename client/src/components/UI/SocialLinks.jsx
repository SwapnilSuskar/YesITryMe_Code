import { MessageCircle, Send, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const SocialLinks = ({
  title = "Connect & Share",
  className = '',
  showTitle = true,
  gridCols = "grid-cols-1 md:grid-cols-2",
  cardClassName = '',
}) => {
  const socialLinks = [
    {
      id: 'youtube',
      name: 'YouTube Channel',
      description: 'Subscribe for updates, tutorials, and more!',
      url: 'https://youtube.com/@swapnilsuskar?si=StUp1DtoCfnXpIMc',
      icon: Youtube,
      iconColor: 'text-white drop-shadow',
      bgGradient: 'from-red-500 to-red-400',
      borderColor: 'border-red-200',
      cardGradient: 'from-red-100/60 via-white/80 to-red-200/60',
      textColor: 'text-red-600',
      buttonGradient: 'from-red-500 to-red-400',
      buttonHover: 'hover:from-red-400 hover:to-red-500',
      shadowHover: 'hover:shadow-red-200/60'
    },
    {
      id: 'telegram',
      name: 'Telegram Group',
      description: 'Join our Telegram for instant news and support!',
      url: 'https://t.me/yesitrymeofficial',
      icon: Send,
      iconColor: 'text-white drop-shadow',
      bgGradient: 'from-blue-500 to-blue-400',
      borderColor: 'border-blue-400',
      cardGradient: 'from-blue-100/60 via-white/80 to-blue-200/60',
      textColor: 'text-blue-500',
      buttonGradient: 'from-blue-500 to-blue-400',
      buttonHover: 'hover:from-blue-400 hover:to-blue-500',
      shadowHover: 'hover:shadow-blue-200/60'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Channel',
      description: 'Get quick updates and connect on WhatsApp!',
      url: 'https://whatsapp.com/channel/0029Vb6YB62CxoAoJDZGNW44',
      icon: MessageCircle,
      iconColor: 'text-white drop-shadow',
      bgGradient: 'from-green-500 to-green-400',
      borderColor: 'border-green-400',
      cardGradient: 'from-green-100/60 via-white/80 to-green-200/60',
      textColor: 'text-green-600',
      buttonGradient: 'from-green-500 to-green-400',
      buttonHover: 'hover:from-green-400 hover:to-green-500',
      shadowHover: 'hover:shadow-green-200/60'
    }
  ];

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {showTitle && (
        <h3 className="text-base font-medium text-center bg-gradient-to-r from-orange-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent mb-4 tracking-wide drop-shadow-sm">
          {title}
        </h3>
      )}
      <div className={`grid ${gridCols} gap-4`}>
        {socialLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <div
              key={link.id}
              className={`bg-gradient-to-br ${link.cardGradient} backdrop-blur-lg rounded-2xl shadow-xl border ${link.borderColor} p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02] ${link.shadowHover} ${cardClassName}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${link.bgGradient} shadow`}>
                  <IconComponent size={22} className={link.iconColor} />
                </span>
                <div>
                  <h4 className={`text-sm font-medium ${link.textColor}`}>{link.name}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{link.description}</p>
                </div>
              </div>
              <Link
                to={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block w-full text-center text-sm bg-gradient-to-r ${link.buttonGradient} px-4 py-2 rounded-xl font-bold shadow ${link.buttonHover} transition-colors text-white tracking-wide mt-1`}
              >
                Join on {link.name.split(' ')[0]}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialLinks; 
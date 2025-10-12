import { Award, CheckCircle, Crown, Star, Target, Trophy, Users } from 'lucide-react';

const RankRequirements = () => {
  const requirements = [
    {
      rank: 'Team Leader',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      requirement: '10 IDs in direct and achieve first team leader level',
      color: 'blue',
      level: 1
    },
    {
      rank: 'Assistant Manager',
      icon: <Star className="w-6 h-6 text-purple-500" />,
      requirement: '7 team leader in direct with 1,2,3 level and achieve second level assistant manager',
      color: 'purple',
      level: 2
    },
    {
      rank: 'Manager',
      icon: <Trophy className="w-6 h-6 text-green-500" />,
      requirement: '5 assistant manager in direct 1,2,3 any level get manager rank',
      color: 'green',
      level: 3
    },
    {
      rank: 'Zonal Head',
      icon: <Award className="w-6 h-6 text-orange-500" />,
      requirement: '3 manager in direct get zonal head level',
      color: 'orange',
      level: 4
    },
    {
      rank: 'National Head Promoter',
      icon: <Crown className="w-6 h-6 text-red-500" />,
      requirement: '2 zonal head in direct get national head promoter',
      color: 'red',
      level: 5
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
      purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
      green: 'from-green-50 to-green-100 border-green-200 text-green-700',
      orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
      red: 'from-red-50 to-red-100 border-red-200 text-red-700'
    };
    return colorMap[color] || 'from-gray-50 to-gray-100 border-gray-200 text-gray-700';
  };

  const getIconBgColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-100',
      purple: 'bg-purple-100',
      green: 'bg-green-100',
      orange: 'bg-orange-100',
      red: 'bg-red-100'
    };
    return colorMap[color] || 'bg-gray-100';
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl shadow-2xl border-2 border-indigo-100/40 p-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-3xl pointer-events-none z-0 animate-pulse bg-gradient-to-tr from-indigo-200/30 via-purple-200/20 to-pink-200/30 blur-xl opacity-60" />

        {/* Header */}
        <div className="text-center mb-8 z-10 relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text tracking-wide">
              How To Achieve Ranks
            </h2>
          </div>
          <p className="text-lg text-gray-600 font-medium">
            Achieve first team leader rank to unlock passive income withdrawl eligibility
          </p>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${getColorClasses(req.color)} rounded-2xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
            >
              {/* Rank Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`${getIconBgColor(req.color)} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  {req.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{req.rank}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">Level {req.level}</span>
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Requirement */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-current mt-0.5 flex-shrink-0" />
                  <p className="text-sm leading-relaxed font-medium">
                    {req.requirement}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-indigo-200 z-10 relative">
          <div className="text-center">
            <h4 className="font-bold text-lg text-indigo-700 mb-3">How It Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Active Income:Activate yours id first</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Passive Income: Achieve first team leader rank</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-medium">Higher ranks unlock more benefits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 text-center z-10 relative">
          <p className="text-gray-600 font-medium">
            Start building your team today to achieve these ranks and unlock passive income withdrawal!
          </p>
        </div>
      </div>
    </div>
  );
};

export default RankRequirements; 
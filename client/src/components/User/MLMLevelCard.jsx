import { Award, CheckCircle, Crown, Target, TrendingUp, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';

const MLMLevelCard = () => {
  const { user, token } = useAuthStore();
  const [mlmData, setMlmData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      fetchMLMData();
    }
  }, [user, token]);

  const fetchMLMData = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.mlm.teamStructure);
      setMlmData(response.data);
    } catch (error) {
      console.error('Error fetching MLM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'National Head Promoter': return <Crown className="text-purple-600" size={24} />;
      case 'Zonal Head': return <Crown className="text-blue-600" size={24} />;
      case 'Manager': return <Award className="text-green-600" size={24} />;
      case 'Assistant Manager': return <Award className="text-orange-600" size={24} />;
      case 'Team Leader': return <TrendingUp className="text-yellow-600" size={24} />;
      case 'Active Member': return <Users className="text-blue-600" size={24} />;
      case 'Free': return <XCircle className="text-red-600" size={24} />;
      default: return <Users className="text-gray-600" size={24} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'National Head Promoter': return 'from-purple-500 to-purple-600';
      case 'Zonal Head': return 'from-blue-500 to-blue-600';
      case 'Manager': return 'from-green-500 to-green-600';
      case 'Assistant Manager': return 'from-orange-500 to-orange-600';
      case 'Team Leader': return 'from-yellow-500 to-yellow-600';
      case 'Active Member': return 'from-blue-500 to-blue-600';
      case 'Free': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 rounded-2xl shadow-xl border border-blue-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!mlmData) {
    return null;
  }

  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-blue-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {getLevelIcon(mlmData.mlmLevel)}
          MLM Level Status
        </h3>
        <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold bg-gradient-to-r ${getLevelColor(mlmData.mlmLevel)}`}>
          {mlmData.mlmLevel}
        </div>
      </div>

      {/* Current Level Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-600">Current Level:</span>
          <span className="font-bold text-gray-800">{mlmData.mlmLevel}</span>
        </div>
        {mlmData.mlmLevelDate && (
          <div className="text-xs text-gray-500">
            Achieved on: {new Date(mlmData.mlmLevelDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Team Structure */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{mlmData.directActiveMembers}</div>
          <div className="text-xs text-gray-600">Direct Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{mlmData.teamLeaders}</div>
          <div className="text-xs text-gray-600">Team Leaders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{mlmData.assistantManagers}</div>
          <div className="text-xs text-gray-600">Asst. Managers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{mlmData.managers}</div>
          <div className="text-xs text-gray-600">Managers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{mlmData.zonalHeads}</div>
          <div className="text-xs text-gray-600">Zonal Heads</div>
        </div>
      </div>

      {/* Next Level Requirements */}
      {mlmData.requirements && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 mb-3">Next Level Requirements:</h4>

          {mlmData.mlmLevel === "Active Member" && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="text-blue-600" size={16} />
                <span className="text-sm font-medium">Team Leader</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {mlmData.requirements.teamLeader.current}/{mlmData.requirements.teamLeader.required} Direct Active Members
                </span>
                {mlmData.requirements.teamLeader.achieved ? (
                  <CheckCircle className="text-green-600" size={16} />
                ) : (
                  <XCircle className="text-red-600" size={16} />
                )}
              </div>
            </div>
          )}

          {mlmData.mlmLevel === "Team Leader" && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="text-yellow-600" size={16} />
                <span className="text-sm font-medium">Assistant Manager</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {mlmData.requirements.assistantManager.current}/{mlmData.requirements.assistantManager.required} Team Leaders
                </span>
                {mlmData.requirements.assistantManager.achieved ? (
                  <CheckCircle className="text-green-600" size={16} />
                ) : (
                  <XCircle className="text-red-600" size={16} />
                )}
              </div>
            </div>
          )}

          {mlmData.mlmLevel === "Assistant Manager" && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="text-orange-600" size={16} />
                <span className="text-sm font-medium">Manager</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {mlmData.requirements.manager.current}/{mlmData.requirements.manager.required} Assistant Managers
                </span>
                {mlmData.requirements.manager.achieved ? (
                  <CheckCircle className="text-green-600" size={16} />
                ) : (
                  <XCircle className="text-red-600" size={16} />
                )}
              </div>
            </div>
          )}

          {mlmData.mlmLevel === "Manager" && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="text-green-600" size={16} />
                <span className="text-sm font-medium">Zonal Head</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {mlmData.requirements.zonalHead.current}/{mlmData.requirements.zonalHead.required} Managers
                </span>
                {mlmData.requirements.zonalHead.achieved ? (
                  <CheckCircle className="text-green-600" size={16} />
                ) : (
                  <XCircle className="text-red-600" size={16} />
                )}
              </div>
            </div>
          )}

          {mlmData.mlmLevel === "Zonal Head" && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="text-blue-600" size={16} />
                <span className="text-sm font-medium">National Head Promoter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {mlmData.requirements.nationalHead.current}/{mlmData.requirements.nationalHead.required} Zonal Heads
                </span>
                {mlmData.requirements.nationalHead.achieved ? (
                  <CheckCircle className="text-green-600" size={16} />
                ) : (
                  <XCircle className="text-red-600" size={16} />
                )}
              </div>
            </div>
          )}

          {mlmData.mlmLevel === "National Head Promoter" && (
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <Crown className="text-purple-600 mx-auto mb-2" size={20} />
              <span className="text-sm font-medium text-purple-800">Maximum Level Achieved!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MLMLevelCard;
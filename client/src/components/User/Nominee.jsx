import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, Edit3, Save, X, UserCheck, Shield, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api, { API_ENDPOINTS } from '../../config/api';
import LoginPrompt from '../UI/LoginPrompt';

const Nominee = () => {
  const { user } = useAuthStore();
  const [nominee, setNominee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bloodRelation: '',
    mobile: '',
    address: ''
  });

  const bloodRelations = [
    'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister',
    'Husband', 'Wife', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin', 'Other'
  ];

  useEffect(() => {
    if (user) {
      fetchNominee();
    }
  }, [user]);

  const fetchNominee = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.nominee.get.replace(':userId', user.userId));
      if (response.data.success) {
        setNominee(response.data.data);
        if (response.data.data) {
          setFormData({
            name: response.data.data.name || '',
            bloodRelation: response.data.data.bloodRelation || '',
            mobile: response.data.data.mobile || '',
            address: response.data.data.address || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching nominee:', error);
      setError('Failed to load nominee information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validation
      if (!formData.name.trim()) {
        setError('Nominee name is required');
        return;
      }
      if (!formData.bloodRelation) {
        setError('Blood relation is required');
        return;
      }
      if (!formData.mobile.trim()) {
        setError('Mobile number is required');
        return;
      }
      if (!/^\d{10}$/.test(formData.mobile)) {
        setError('Mobile number must be 10 digits');
        return;
      }
      if (!formData.address.trim()) {
        setError('Address is required');
        return;
      }

      // Agreement must be accepted
      if (!agreementAccepted) {
        setError('Please review and accept the Nominee Agreement to proceed');
        return;
      }

      const response = await api.post(
        API_ENDPOINTS.nominee.createOrUpdate.replace(':userId', user.userId),
        formData
      );

      if (response.data.success) {
        setNominee(response.data.data);
        setSuccess('Nominee information saved successfully!');
        setEditing(false);
        setAgreementAccepted(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error saving nominee:', error);
      setError(error.response?.data?.message || 'Failed to save nominee information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (nominee) {
      setFormData({
        name: nominee.name || '',
        bloodRelation: nominee.bloodRelation || '',
        mobile: nominee.mobile || '',
        address: nominee.address || ''
      });
    } else {
      setFormData({
        name: '',
        bloodRelation: '',
        mobile: '',
        address: ''
      });
    }
    setEditing(false);
    setError('');
  };

  if (!user) {
    return <LoginPrompt type="nominee" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Nominee Information</h1>
                <p className="text-gray-600">Manage your nominee details</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit3 size={18} />
                {nominee ? 'Edit' : 'Add Nominee'}
              </button>
            )}
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          {editing ? (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nominee Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Enter nominee's full name"
                  required
                />
              </div>

              {/* Blood Relation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCheck className="w-4 h-4 inline mr-2" />
                  Blood Relation *
                </label>
                <select
                  name="bloodRelation"
                  value={formData.bloodRelation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                >
                  <option value="">Select relationship</option>
                  {bloodRelations.map(relation => (
                    <option key={relation} value={relation}>{relation}</option>
                  ))}
                </select>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  placeholder="Enter complete address"
                  required
                />
              </div>

              {/* Agreement - Trust Section */}
              <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Nominee Agreement</h4>
                    <ul className="text-xs text-gray-700 space-y-1.5 mb-3 list-disc pl-5">
                      <li>Your nominee information is stored securely and used only for account security.</li>
                      <li>Only you can update or remove nominee details after verification.</li>
                      <li>In exceptional cases, support may verify nominee identity before action.</li>
                    </ul>
                    {/* User declaration - corrected grammar and spelling */}
                    <p className="text-xs text-gray-800 mb-3 leading-relaxed">
                      I, <span className="font-semibold">{user?.firstName} {user?.lastName}</span>, hereby designate my business nominee from my
                      blood relation and I agree to all the rules, regulations, and Terms & Conditions of
                      <span className="font-semibold"> YesITryMe</span>. YesITryMe is an online digital earning platform that operates on a
                      refer-and-earn model. Commissions are provided based on the business generated by users and
                      active partners, and are <span className="font-semibold">not a salary</span>. Income is not fixed; commissions depend on how
                      the business performs, and turnover depends on the user account and the business plan structure.
                    </p>
                    <label className="inline-flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        checked={agreementAccepted}
                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                        className="h-4 w-4 text-[#FF4E00] focus:ring-[#FF4E00] border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-800">
                        I have read and agree to the above nominee terms and authorize use of this information for account security.
                      </span>
                    </label>
                     <div className="mt-3 flex items-center text-[11px] text-gray-600">
                       <Lock className="w-3.5 h-3.5 mr-1 text-orange-600" />
                       Data is encrypted at rest and in transit.
                     </div>
                     <div className="mt-3 text-right">
                       <p className="text-[10px] text-gray-500 italic">
                         - Mr. Swapnil Suskar<br />
                         <span className="text-[9px]">(Founder of YesITryMe)</span>
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !agreementAccepted}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Nominee'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div className="space-y-6">
              {nominee ? (
                <>
                  {/* Nominee Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Nominee Name</h3>
                      </div>
                      <p className="text-gray-700 font-medium">{nominee.name}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <UserCheck className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Relationship</h3>
                      </div>
                      <p className="text-gray-700 font-medium">{nominee.bloodRelation}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <Phone className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Mobile Number</h3>
                      </div>
                      <p className="text-gray-700 font-medium">{nominee.mobile}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Added Date</h3>
                      </div>
                      <p className="text-gray-700 font-medium">
                        {new Date(nominee.addedDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="w-6 h-6 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{nominee.address}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Nominee Added</h3>
                  <p className="text-gray-500 mb-6">Add your nominee information to secure your account</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Add Nominee
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nominee;

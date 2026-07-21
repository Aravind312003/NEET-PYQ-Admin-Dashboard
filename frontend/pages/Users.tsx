import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users as UsersIcon,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  ChevronRight,
  X,
  Award,
  BookOpen,
  Eye,
  Activity,
  Filter
} from 'lucide-react';
import { UserProfile } from '../types';
import Modal from '../components/Modal';

export default function Users() {
  const navigate = useNavigate();

  // States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled'>('all');

  // Multi-selection for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Detailed profile slide-over panel
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Modals state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<{ id: string; currentDisabled: boolean } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Could not query user index.');
      }

      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'System failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setSelectedUserIds([]); // clear selection on search
  }, [search]);

  // View user profile drawer
  const viewUserProfile = async (userId: string) => {
    setActiveProfileId(userId);
    setLoadingProfile(true);
    setProfileData(null);
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        throw new Error('Failed to retrieve profile.');
      }
    } catch (err) {
      console.error('Error fetching detailed profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Disable / Enable handler
  const handleToggleStatus = (id: string, currentDisabled: boolean) => {
    setStatusAction({ id, currentDisabled });
    setConfirmStatusOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusAction) return;
    const { id, currentDisabled } = statusAction;
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    setConfirmStatusOpen(false);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to patch user status.');
      }

      setSuccess(currentDisabled ? 'User account enabled.' : 'User account disabled.');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
      if (activeProfileId === id) {
        viewUserProfile(id);
      }
    } catch (err) {
      console.error('Failed to change user status:', err);
      setError('Failed to update status on target user record.');
    }
  };

  // Delete handler
  const handleDeleteUser = (id: string) => {
    setSelectedUserId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUserId) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    setConfirmDeleteOpen(false);

    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user.');
      }

      setSuccess('User record permanently deleted.');
      setTimeout(() => setSuccess(''), 3000);
      if (activeProfileId === selectedUserId) {
        setActiveProfileId(null);
      }
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to permanently purge user record.');
    }
  };

  // Bulk status update
  const handleBulkStatusChange = async (disabled: boolean) => {
    if (selectedUserIds.length === 0) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/users/bulk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: selectedUserIds, disabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk operation.');
      }

      const resData = await response.json();
      setSuccess(`Successfully modified ${resData.updated} student profiles.`);
      setTimeout(() => setSuccess(''), 3000);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (err) {
      console.error('Bulk operation failed:', err);
      setError('Failed to execute bulk update on database records.');
    }
  };

  // Checkbox interactions
  const handleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(uId => uId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSelectAll = (filteredUsers: UserProfile[]) => {
    const studentIds = filteredUsers.filter(u => u.role !== 'admin').map(u => u.id);
    const allSelected = studentIds.every(id => selectedUserIds.includes(id));
    
    if (allSelected) {
      setSelectedUserIds(selectedUserIds.filter(id => !studentIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedUserIds, ...studentIds]));
      setSelectedUserIds(combined);
    }
  };

  // Client-side filtering of searched users
  const filteredUsers = users.filter((u) => {
    if (filterStatus === 'active') return !u.disabled;
    if (filterStatus === 'disabled') return !!u.disabled;
    return true;
  });

  return (
    <div className="space-y-6 relative min-h-[70vh]">
      {/* Upper header block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            User Account Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Review candidate student profiles, inspect mock performance history, or manage permissions.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          {(['all', 'active', 'disabled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-950/50 dark:bg-emerald-950/30 p-4 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-950/50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student profiles by email, unique UID, or custom criteria..."
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Bulk actions float menu */}
      {selectedUserIds.length > 0 && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in z-20">
          <div className="flex items-center gap-2.5">
            <UsersIcon className="h-5 w-5" />
            <span className="text-xs font-bold">Selected {selectedUserIds.length} candidate student profiles</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange(false)}
              className="px-3 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold cursor-pointer transition-all"
            >
              Bulk Activate
            </button>
            <button
              onClick={() => handleBulkStatusChange(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer border border-emerald-500 transition-all"
            >
              Bulk Suspend
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="p-1.5 text-white/80 hover:text-white rounded-lg text-xs cursor-pointer ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[250px]">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-xs text-neutral-400 font-semibold">Reading credential index...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-12">
            <UsersIcon className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No User Profiles Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Your search term did not match any active student or administrator records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-950 text-neutral-400 uppercase font-bold tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.filter(u => u.role !== 'admin').length > 0 &&
                        filteredUsers.filter(u => u.role !== 'admin').every(u => selectedUserIds.includes(u.id))
                      }
                      onChange={() => handleSelectAll(filteredUsers)}
                      className="rounded border-neutral-300 text-emerald-600"
                    />
                  </th>
                  <th className="px-5 py-3.5">Registration Date</th>
                  <th className="px-5 py-3.5">User Email</th>
                  <th className="px-5 py-3.5">Role Status</th>
                  <th className="px-5 py-3.5">Permission State</th>
                  <th className="px-5 py-3.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                    <td className="px-5 py-4.5">
                      {u.role !== 'admin' ? (
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => handleSelectUser(u.id)}
                          className="rounded border-neutral-300 text-emerald-600"
                        />
                      ) : (
                        <span className="block h-4 w-4" />
                      )}
                    </td>
                    <td className="px-5 py-4.5 font-mono text-neutral-500">
                      {new Date(u.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4.5 font-semibold text-neutral-900 dark:text-neutral-100">
                      {u.email}
                    </td>

                    <td className="px-5 py-4.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-5 py-4.5">
                      {u.disabled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          <UserX className="h-3.5 w-3.5" />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <UserCheck className="h-3.5 w-3.5" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewUserProfile(u.id)}
                          className="p-1.5 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
                          title="View Profile Analytics"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {u.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u.id, !!u.disabled)}
                              className={`p-1.5 rounded-md border text-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer ${
                                u.disabled
                                  ? 'border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:border-emerald-950/40'
                                  : 'border-neutral-200 hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800'
                              }`}
                              title={u.disabled ? 'Enable Account' : 'Disable Account'}
                            >
                              {u.disabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-md border border-red-200 hover:bg-red-50 text-red-600 dark:border-red-950/40 dark:text-red-400 dark:hover:bg-red-950/20 cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {u.role === 'admin' && (
                          <span className="text-[10px] text-neutral-400 font-medium italic select-none">
                            System Sovereign
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Profile Drawer */}
      {activeProfileId && (
        <div className="fixed inset-0 overflow-hidden z-50 animate-fade-in flex">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity" onClick={() => setActiveProfileId(null)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
              <div className="min-w-0">
                <h3 className="font-black text-sm text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                  <UsersIcon className="h-4.5 w-4.5 text-emerald-600" />
                  Student Diagnostic Profile
                </h3>
                <p className="text-[10px] text-neutral-400 mt-0.5 font-mono truncate">ID: {activeProfileId}</p>
              </div>
              <button
                onClick={() => setActiveProfileId(null)}
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span className="text-xs text-neutral-400 font-semibold">Parsing historic quiz attempts...</span>
                </div>
              ) : !profileData ? (
                <div className="text-center py-12 text-xs text-neutral-400">
                  Failed to load diagnostic profile.
                </div>
              ) : (
                <div className="space-y-6 text-xs">
                  {/* Account Metadata Card */}
                  <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl p-4 border border-neutral-100 dark:border-neutral-900 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-semibold">Email:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{profileData.user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-semibold">Created At:</span>
                      <span className="font-mono text-neutral-500">{new Date(profileData.user?.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-semibold">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${profileData.user?.disabled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {profileData.user?.disabled ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Diagnostic stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Tests Taken</span>
                      <p className="text-lg font-black text-emerald-600 mt-1">{profileData.stats?.totalTests}</p>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Avg Score</span>
                      <p className="text-lg font-black text-blue-600 mt-1">{profileData.stats?.avgScore} <span className="text-[10px] text-neutral-400 font-normal">pts</span></p>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Accuracy</span>
                      <p className="text-lg font-black text-purple-600 mt-1">{profileData.stats?.avgAccuracy}%</p>
                    </div>
                  </div>

                  {/* Attempts list */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      Mock Quiz Submissions History
                    </h4>

                    {profileData.attempts?.length === 0 ? (
                      <p className="text-center py-6 text-[11px] text-neutral-400 italic">No mock exam attempts logged in registry yet.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {profileData.attempts?.map((att: any, idx: number) => (
                          <div key={idx} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-950 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-[11px] text-neutral-800 dark:text-neutral-200">{att.test_title || 'Mock Practice Practice'}</p>
                              <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{new Date(att.completed_at).toLocaleDateString()} • {att.attempted} Qs Answered</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-emerald-600">{att.score} pts</span>
                              <p className="text-[9px] font-bold text-neutral-400">{Math.round((att.correct / att.attempted) * 100)}% Accuracy</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer controls inside drawer */}
            {profileData?.user && profileData.user.role !== 'admin' && (
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex gap-2">
                <button
                  onClick={() => {
                    handleToggleStatus(profileData.user.id, !!profileData.user.disabled);
                  }}
                  className="flex-1 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  {profileData.user.disabled ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>{profileData.user.disabled ? 'Reactivate Profile' : 'Suspend Profile'}</span>
                </button>
                <button
                  onClick={() => {
                    handleDeleteUser(profileData.user.id);
                  }}
                  className="py-2 px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-xs cursor-pointer transition-all"
                  title="Purge Profile"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Disable Toggle Modal */}
      <Modal
        isOpen={confirmStatusOpen}
        onClose={() => setConfirmStatusOpen(false)}
        onConfirm={confirmToggleStatus}
        title={statusAction?.currentDisabled ? 'Activate User Account' : 'Suspend User Account'}
        message={
          statusAction?.currentDisabled
            ? 'Are you sure you want to reactivate access parameters for this student? They will immediately regain authorization to take practice quizzes and mock exams.'
            : 'Are you sure you want to temporarily suspend access for this student? They will receive an Account Suspended notice and be booted from active quiz sessions immediately.'
        }
        confirmText={statusAction?.currentDisabled ? 'Enable Access' : 'Suspend Access'}
        cancelText="Cancel"
        isDanger={!statusAction?.currentDisabled}
      />

      {/* Account Deletion Modal */}
      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Permanently Purge Student Profile"
        message="Are you sure you want to permanently delete this student account? This will purge all associated quiz histories, streak records, performance statistics, and logins. This action is irreversible."
        confirmText="Purge Account"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}

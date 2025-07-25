import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { logoutUser } from '@/store/authSlice';
import { landDealsApi } from '@/services/landDealsApi';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Search,
  Shield,
  LogOut,
  Eye,
  MessageSquare,
  Calendar,
  DollarSign,
  MapPin,
  Settings,
  ArrowLeft,
  ChevronDown,
  Edit
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDeals, setUserDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('deals'); // 'deals' or 'users'
  const [loading, setLoading] = useState(false);
  const adminEmail = user?.email || localStorage.getItem('adminEmail') || 'admin@example.com';

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    // Check if user is actually an admin
    if (!user?.is_staff) {
      navigate('/dashboard');
      return;
    }

    loadInitialData();
  }, [isAuthenticated, user, navigate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load all deals
      const dealsResponse = await landDealsApi.admin.getAllDeals();
      if (dealsResponse.success) {
        setDeals(dealsResponse.data);
      }

      // Load all users
      const usersResponse = await landDealsApi.admin.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserDeals = async (userId) => {
    setLoading(true);
    try {
      const response = await landDealsApi.admin.getUserDeals(userId);
      if (response.success) {
        setUserDeals(response.data);
      }
    } catch (error) {
      console.error('Failed to load user deals:', error);
      toast({
        title: "Error",
        description: "Failed to load user deals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDealStatus = async (dealId, newStatus) => {
    try {
      const response = await landDealsApi.admin.updateDealStatus(dealId, newStatus);
      if (response.success) {
        // Update local state
        if (selectedUser) {
          setUserDeals(prev => prev.map(deal => 
            deal.id === dealId ? { ...deal, status: newStatus } : deal
          ));
        } else {
          setDeals(prev => prev.map(deal => 
            deal.id === dealId ? { ...deal, status: newStatus } : deal
          ));
        }
        
        toast({
          title: "Success",
          description: `Deal status updated to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Failed to update deal status:', error);
      toast({
        title: "Error",
        description: "Failed to update deal status",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logged out",
        description: "You have been logged out locally.",
      });
    } finally {
      navigate('/admin/login');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusVariant = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'status-pending';
      case 'under review':
        return 'status-reviewed';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const currentDeals = selectedUser ? userDeals : deals;
  
  const filteredDeals = currentDeals.filter(deal =>
    (deal.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.landType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = deals.reduce((sum, deal) => sum + (deal.askingPrice || 0), 0);
  const pendingDeals = deals.filter(deal => (deal.status || '').toLowerCase().includes('pending') || (deal.status || '').toLowerCase().includes('review')).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">LandDeal Pro Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null);
                    setUserDeals([]);
                    setView('deals');
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to All Deals
                </Button>
              )}
              <Button
                variant={view === 'users' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('users')}
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
              <Button
                variant={view === 'deals' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('deals')}
              >
                <FileText className="h-4 w-4 mr-2" />
                All Deals
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/form-options')}
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
                Form Options
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">{adminEmail}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deals</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{deals.length}</div>
                <p className="text-xs text-muted-foreground">All submissions</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{pendingDeals}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">Combined deal value</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{users.length}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>
                {view === 'users' ? 'All Users' : selectedUser ? `Deals for ${selectedUser.username}` : 'All Deal Submissions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={view === 'users' ? "Search users..." : "Search deals by address, ID, or type..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-muted-foreground">Loading...</div>
                </div>
              ) : view === 'users' ? (
                // Users Table
                filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium text-muted-foreground">User ID</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Username</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                            <td className="p-4">
                              <span className="font-mono text-sm font-medium text-primary">{user.id}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-medium text-foreground">{user.username}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-foreground">{user.email}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-foreground">
                                {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : 'N/A'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-foreground">{formatDate(user.date_joined)}</span>
                            </td>
                            <td className="p-4">
                              <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setView('deals');
                                  loadUserDeals(user.id);
                                }}
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Deals
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                // Deals Table
                filteredDeals.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchTerm ? 'No deals found' : selectedUser ? 'No deals for this user' : 'No deals submitted yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search terms' : 'Deal submissions will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium text-muted-foreground">Deal ID</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Location</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Value</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeals.map((deal) => (
                          <tr key={deal.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                            <td className="p-4">
                              <span className="font-mono text-sm font-medium text-primary">{deal.id}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-start space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-foreground text-sm line-clamp-1">{deal.address || 'No address'}</p>
                                  <p className="text-xs text-muted-foreground">{deal.acreage || 'N/A'} acres</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-foreground capitalize">{deal.landType}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-medium text-foreground">
                                {formatCurrency(deal.askingPrice || 0)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">{deal.submittedOn ? formatDate(deal.submittedOn) : 'N/A'}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Badge className={`${getStatusVariant(deal.status)} text-xs`}>
                                  {deal.status}
                                </Badge>
                                <select
                                  value={deal.status}
                                  onChange={(e) => updateDealStatus(deal.id, e.target.value)}
                                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                                >
                                  <option value="submitted">Submitted</option>
                                  <option value="under_review">Under Review</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/deal/${deal.id}`)}
                                  className="hover:bg-primary hover:text-primary-foreground"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
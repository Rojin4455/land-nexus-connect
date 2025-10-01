import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { logoutUser } from '@/store/authSlice';
import { landDealsApi } from '@/services/landDealsApi';
import BuyerDetailsDialog from '@/components/admin/BuyerDetailsDialog';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
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
  Edit,
  Plus,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDeals, setUserDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('deals'); // 'deals' or 'users'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [loading, setLoading] = useState(false);
  const adminEmail = user?.email || localStorage.getItem('adminEmail') || 'admin@example.com';

  // Buyers UI state
  const [createBuyerOpen, setCreateBuyerOpen] = useState(false);
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerEmail, setNewBuyerEmail] = useState('');
  const [newBuyerPhone, setNewBuyerPhone] = useState('');
  const [buyerDetailsOpen, setBuyerDetailsOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [deleteBuyerOpen, setDeleteBuyerOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<any>(null);

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
      // Load all deals with status filter
      const dealsResponse = await landDealsApi.admin.getAllDeals(statusFilter);
      if (dealsResponse.success) {
        setDeals(dealsResponse.data);
      }

      // Load all users
      const usersResponse = await landDealsApi.admin.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }
      const buyersResponse = await landDealsApi.admin.getBuyers();
      if (buyersResponse.success) {
        setBuyers(buyersResponse.data);
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

  // Reload deals when status filter changes
  useEffect(() => {
    if (view === 'deals') {
      loadInitialData();
    }
  }, [statusFilter, view]);

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

  // Status update modal state
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [dealToUpdate, setDealToUpdate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [buyerRejectedNotes, setBuyerRejectedNotes] = useState('');

  const updateDealStatus = async (dealId, newStatus, notes = null) => {
    try {
      const response = await landDealsApi.admin.updateDealStatus(dealId, newStatus, notes);
      if (response.success) {
        // Update local state
        if (selectedUser) {
          setUserDeals(prev => prev.map(deal => 
            deal.id === dealId ? { ...deal, status: newStatus, buyer_rejected_notes: notes } : deal
          ));
        } else {
          setDeals(prev => prev.map(deal => 
            deal.id === dealId ? { ...deal, status: newStatus, buyer_rejected_notes: notes } : deal
          ));
        }
        
        toast({
          title: "Success",
          description: `Deal status updated to ${newStatus.replace('_', ' ')}`,
        });
      }
    } catch (error) {
      console.error('Failed to update deal status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.buyer_rejected_notes?.[0] || "Failed to update deal status",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!dealToUpdate || !selectedStatus) return;
    
    if (selectedStatus === 'buyer_rejected' && !buyerRejectedNotes.trim()) {
      toast({
        title: "Error",
        description: "Buyer rejected notes are required when rejecting a deal",
        variant: "destructive",
      });
      return;
    }

    await updateDealStatus(dealToUpdate.id, selectedStatus, selectedStatus === 'buyer_rejected' ? buyerRejectedNotes : null);
    setStatusUpdateOpen(false);
    setDealToUpdate(null);
    setSelectedStatus('');
    setBuyerRejectedNotes('');
  };

  const handleCreateBuyer = async () => {
    try {
      setLoading(true);
      const res = await landDealsApi.admin.createBuyer({
        name: newBuyerName,
        email: newBuyerEmail,
        phone: newBuyerPhone,
      });
      if (res.success) {
        toast({ title: 'Buyer created', description: 'Buyer has been created successfully.' });
        setCreateBuyerOpen(false);
        setNewBuyerName('');
        setNewBuyerEmail('');
        setNewBuyerPhone('');
        const buyersResponse = await landDealsApi.admin.getBuyers();
        if (buyersResponse.success) setBuyers(buyersResponse.data);
      }
    } catch (error) {
      console.error('Failed to create buyer:', error);
      toast({ title: 'Error', description: 'Failed to create buyer', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBuyer = async () => {
    if (!buyerToDelete) return;
    
    try {
      setLoading(true);
      await landDealsApi.admin.deleteBuyer(buyerToDelete.id.toString());
      toast({ 
        title: 'Buyer deleted', 
        description: `${buyerToDelete.name} has been removed from the system.` 
      });
      setDeleteBuyerOpen(false);
      setBuyerToDelete(null);
      
      // Refresh buyers list
      const buyersResponse = await landDealsApi.admin.getBuyers();
      if (buyersResponse.success) setBuyers(buyersResponse.data);
    } catch (error) {
      console.error('Failed to delete buyer:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete buyer', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
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
      case 'submitted':
        return 'default';
      case 'under_review_with_buyer':
        return 'secondary';
      case 'buyer_approved':
        return 'default';
      case 'buyer_rejected':
        return 'destructive';
      case 'mls_pending':
        return 'secondary';
      case 'mls_active':
        return 'default';
      case 'sold':
        return 'default';
      case 'canceled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusDisplayName = (status) => {
    const statusMap = {
      'submitted': 'Submitted',
      'under_review_with_buyer': 'Under review with Buyer',
      'buyer_approved': 'Buyer Approved',
      'buyer_rejected': 'Buyer Rejected',
      'mls_pending': 'MLS Listing - Pending',
      'mls_active': 'MLS Active Listing',
      'sold': 'Sold Deal',
      'canceled': 'Canceled Deal'
    };
    return statusMap[status] || status;
  };

  const currentDeals = selectedUser ? userDeals : deals;
  
  const filteredDeals = currentDeals.filter(deal => {
    const matchesSearch = (deal.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.landType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || (deal.status || '').toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user =>
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBuyers = buyers.filter(buyer =>
  (buyer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
  (buyer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
  (buyer.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
);


  const totalValue = deals.reduce((sum, deal) => sum + (deal.agreedPrice || 0), 0);
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
                <p className="text-sm text-muted-foreground">JV Deal Hub Management</p>
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
                variant={view === 'buyers' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('buyers')}
              >
                <Users className="h-4 w-4 mr-2" />
                Buyers
              </Button>
              <Button
                variant={view === 'users' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('users')}
              >
                <Users className="h-4 w-4 mr-2" />
                JV Partners
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
                onClick={() => navigate('/admin/conversations')}
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversations
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
                {view === 'users' ? 'All Users' : view === 'buyers' ? 'All Buyers' : selectedUser ? `Deals for ${selectedUser.username}` : 'All Deal Submissions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={view === 'users' ? "Search users..." : view === 'buyers' ? "Search buyers..." : "Search deals by address, ID, or type..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-4">
                  {view === 'deals' && (
                    <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Statuses</SelectItem>
                         <SelectItem value="submitted">Submitted</SelectItem>
                         <SelectItem value="under_review_with_buyer">Under review with Buyer</SelectItem>
                         <SelectItem value="buyer_approved">Buyer Approved</SelectItem>
                         <SelectItem value="buyer_rejected">Buyer Rejected</SelectItem>
                         <SelectItem value="mls_pending">MLS Listing - Pending</SelectItem>
                         <SelectItem value="mls_active">MLS Active Listing</SelectItem>
                         <SelectItem value="sold">Sold Deal</SelectItem>
                         <SelectItem value="canceled">Canceled Deal</SelectItem>
                       </SelectContent>
                    </Select>
                  )}
                  {view === 'buyers' && (
                    <Button onClick={() => setCreateBuyerOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Buyer
                    </Button>
                  )}
                </div>
              </div>

              {/* Create Buyer Dialog */}
              <Dialog open={createBuyerOpen} onOpenChange={setCreateBuyerOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Buyer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyer-name">Name</Label>
                      <Input id="buyer-name" value={newBuyerName} onChange={(e) => setNewBuyerName(e.target.value)} placeholder="Enter name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer-email">Email</Label>
                      <Input id="buyer-email" type="email" value={newBuyerEmail} onChange={(e) => setNewBuyerEmail(e.target.value)} placeholder="Enter email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer-phone">Phone</Label>
                      <Input id="buyer-phone" type="tel" value={newBuyerPhone} onChange={(e) => setNewBuyerPhone(e.target.value)} placeholder="Enter phone" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateBuyerOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateBuyer} disabled={loading || !newBuyerName || !newBuyerEmail || !newBuyerPhone}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <BuyerDetailsDialog
                open={buyerDetailsOpen}
                onOpenChange={setBuyerDetailsOpen}
                buyer={selectedBuyer}
                onUpdated={async () => {
                  try {
                    const buyersResponse = await landDealsApi.admin.getBuyers();
                    if (buyersResponse.success) setBuyers(buyersResponse.data);
                  } catch {}
                }}
              />

              {/* Delete Buyer Confirmation Dialog */}
              <Dialog open={deleteBuyerOpen} onOpenChange={setDeleteBuyerOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Buyer</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-muted-foreground">
                      Are you sure you want to delete <strong>{buyerToDelete?.name}</strong>? This action will remove them from the system.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => { setDeleteBuyerOpen(false); setBuyerToDelete(null); }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteBuyer}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete Buyer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const response = await landDealsApi.admin.getUserDetailsWithDeals(user.id);
                                    if (response.success) {
                                      console.log('User details:', response.data);
                                      toast({
                                        title: "User Details",
                                        description: "User details loaded successfully",
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Failed to load user details:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to load user details",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : view === 'buyers' ? (
              // ✅ NEW: Buyers view block here
              filteredBuyers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No buyers found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuyers.map((buyer) => (
                        <tr key={buyer.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="p-4"><span className="text-sm font-medium text-foreground">{buyer.name}</span></td>
                          <td className="p-4"><span className="text-sm text-foreground">{buyer.email}</span></td>
                          <td className="p-4"><span className="text-sm text-foreground">{buyer.phone || 'N/A'}</span></td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedBuyer(buyer); setBuyerDetailsOpen(true); }}
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setBuyerToDelete(buyer); setDeleteBuyerOpen(true); }}
                                className="hover:bg-destructive hover:text-destructive-foreground text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
              ) :(
                // Deals View with Tabs
                <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
                  <div className="flex items-center justify-between mb-6">
                    <TabsList className="grid w-64 grid-cols-2">
                      <TabsTrigger value="list" className="flex items-center space-x-2">
                        <List className="h-4 w-4" />
                        <span>List View</span>
                      </TabsTrigger>
                      <TabsTrigger value="kanban" className="flex items-center space-x-2">
                        <LayoutGrid className="h-4 w-4" />
                        <span>Kanban View</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="list">
                    {filteredDeals.length === 0 ? (
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
                                      <p className="text-xs text-muted-foreground">{deal.lot_size || 'N/A'} {deal.lot_size_unit || 'acres'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-sm text-foreground capitalize">{deal.land_type_name || deal.landType}</span>
                                </td>
                                <td className="p-4">
                                  <span className="text-sm font-medium text-foreground">
                                    {formatCurrency(deal.agreed_price || deal.agreedPrice || 0)}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{deal.created_at ? formatDate(deal.created_at) : formatDate(deal.submittedOn) || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={getStatusVariant(deal.status)} className="text-xs">
                                      {getStatusDisplayName(deal.status)}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setDealToUpdate(deal);
                                        setSelectedStatus(deal.status);
                                        setStatusUpdateOpen(true);
                                      }}
                                      className="text-xs h-6 px-2"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Update
                                    </Button>
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
                    )}
                  </TabsContent>

                  <TabsContent value="kanban">
                    <KanbanBoard 
                      deals={filteredDeals}
                      onStatusUpdate={(deal, newStatus, notes) => updateDealStatus(deal.id, newStatus, notes)}
                      onDealClick={(deal) => navigate(`/admin/deal/${deal.id}`)}
                      onEditStatus={(deal) => {
                        setDealToUpdate(deal);
                        setSelectedStatus(deal.status);
                        setStatusUpdateOpen(true);
                      }}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Status Update Dialog */}
          <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Update Deal Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="submitted">Submitted</SelectItem>
                       <SelectItem value="under_review_with_buyer">Under review with Buyer</SelectItem>
                       <SelectItem value="buyer_approved">Buyer Approved</SelectItem>
                       <SelectItem value="buyer_rejected">Buyer Rejected</SelectItem>
                       <SelectItem value="mls_pending">MLS Listing - Pending</SelectItem>
                       <SelectItem value="mls_active">MLS Active Listing</SelectItem>
                       <SelectItem value="sold">Sold Deal</SelectItem>
                       <SelectItem value="canceled">Canceled Deal</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                
                {selectedStatus === 'buyer_rejected' && (
                  <div>
                    <Label htmlFor="notes">Buyer Rejected Notes *</Label>
                    <Textarea
                      id="notes"
                      value={buyerRejectedNotes}
                      onChange={(e) => setBuyerRejectedNotes(e.target.value)}
                      placeholder="Please provide detailed feedback for the student..."
                      className="mt-1"
                      rows={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      These notes will be used in a templated message to provide feedback to the student.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate}>
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import DashboardLayout from '@/components/DashboardLayout';
import { useAppSelector } from '@/hooks/useAppSelector';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye, 
  Plus,
  TrendingUp,
  FileText,
  Clock,
  Trash2,
  Search
} from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';
import { toast } from '@/hooks/use-toast';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user is trying to access admin area (redirect admins to admin dashboard)
    if (user?.is_staff) {
      navigate('/admin/dashboard');
      return;
    }

    loadDeals();
  }, [isAuthenticated, user, navigate]);

  const loadDeals = async () => {
    try {
      const response = await landDealsApi.getUserLandDeals();
      if (response.success) {
        setDeals(response.data);
      } else {
        // Fallback to demo data if API fails
        const demoDeals = [
          {
            id: 'DEAL-001',
            address: '123 Mountain View Ave, Colorado Springs, CO',
            submittedOn: '2024-01-15',
            status: 'Under Review',
            coach: 'Sarah Johnson',
            agreedPrice: 125000,
            landType: 'Residential'
          },
          {
            id: 'DEAL-002', 
            address: '456 Forest Trail, Boulder, CO',
            submittedOn: '2024-01-10',
            status: 'Approved',
            coach: 'Mike Chen',
            agreedPrice: 89000,
            landType: 'Commercial'
          }
        ];
        setDeals(demoDeals);
        toast({
          title: "Using demo data",
          description: "Could not connect to API, showing demo data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error loading deals",
        description: errorMessage,
        variant: "destructive",
      });
      // Set empty array on error
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
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

  const handleDeleteDeal = async (dealId: string) => {
    try {
      const response = await landDealsApi.deleteLandDeal(dealId);
      if (response.success) {
        // Remove the deleted deal from the state
        setDeals(deals.filter(deal => deal.id !== dealId));
        toast({
          title: "Deal deleted",
          description: "The property deal has been successfully deleted.",
        });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error deleting deal",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Filter deals based on search term and status
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = (deal.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.landType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || 
      (deal.status || '').toLowerCase().replace(/\s+/g, '_') === statusFilter.toLowerCase() ||
      (deal.status || '').toLowerCase() === statusFilter.toLowerCase().replace('_', ' ');
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <DashboardLayout activeTab="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your deals...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground">Track your land deals and connect with coaches</p>
          </div>
          <Button 
            className="btn-hero"
            onClick={() => navigate('/submit-deal')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit New Deal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Deals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{deals.length}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(deals.reduce((sum, deal) => sum + deal.agreedPrice, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Across all submissions</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {deals.filter(deal => deal.status.toLowerCase().includes('review')).length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting coach feedback</p>
            </CardContent>
          </Card>
        </div>

        {/* Deals Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Land Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No deals submitted yet</h3>
                <p className="text-muted-foreground mb-6">Start by submitting your first land deal for review</p>
                <Button 
                  className="btn-primary"
                  onClick={() => navigate('/submit-deal')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Deal
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search deals by address, ID, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Deal ID</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Location</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Coach</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeals.map((deal) => (
                        <tr key={deal.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-sm font-medium text-primary">{deal.id}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-foreground text-sm">{deal.address}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(deal.agreedPrice)} • {deal.landType}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{formatDate(deal.submittedOn)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getStatusVariant(deal.status)} text-xs`}>
                              {deal.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-foreground">{deal.coach}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/deal/${deal.id}`)}
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Property Deal</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this property deal? This action cannot be undone.
                                      <br /><br />
                                      <strong>Property:</strong> {deal.address}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDeal(deal.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Property
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
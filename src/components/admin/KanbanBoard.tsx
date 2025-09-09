import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';

interface Deal {
  id: number;
  llc_name?: string;
  first_name?: string;
  last_name?: string;
  address: string;
  parcel_id?: string;
  lot_size?: string;
  lot_size_unit?: string;
  agreed_price?: string;
  status: string;
  land_type_name?: string;
  utilities_name?: string;
  access_type_name?: string;
  created_at: string;
  total_files_count?: number;
  // Legacy fields for backward compatibility
  landType?: string;
  agreedPrice?: number;
  submittedOn?: string;
  acreage?: string;
}

interface KanbanBoardProps {
  deals: Deal[];
  onStatusUpdate: (deal: Deal, newStatus: string, notes?: string | null) => void;
  onDealClick: (deal: Deal) => void;
  onEditStatus: (deal: Deal) => void;
}

const statusColumns = [
  { key: 'submitted', title: 'Submitted', color: 'bg-blue-50 border-blue-200' },
  { key: 'under_review_with_buyer', title: 'Under Review', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'buyer_approved', title: 'Approved', color: 'bg-green-50 border-green-200' },
  { key: 'buyer_rejected', title: 'Rejected', color: 'bg-red-50 border-red-200' },
  { key: 'mls_pending', title: 'MLS Pending', color: 'bg-purple-50 border-purple-200' },
  { key: 'mls_active', title: 'MLS Active', color: 'bg-indigo-50 border-indigo-200' },
  { key: 'sold', title: 'Sold', color: 'bg-emerald-50 border-emerald-200' },
  { key: 'canceled', title: 'Canceled', color: 'bg-gray-50 border-gray-200' }
];

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(num || 0);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusVariant = (status: string) => {
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

const DealCard: React.FC<{ 
  deal: Deal; 
  onDealClick: (deal: Deal) => void; 
  onEditStatus: (deal: Deal) => void; 
}> = ({ deal, onDealClick, onEditStatus }) => {
  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow bg-card border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-foreground mb-1">
              Deal #{deal.id}
            </h4>
            <div className="flex items-start space-x-2 mb-2">
              <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground line-clamp-2">{deal.address}</p>
            </div>
          </div>
          <Badge variant={getStatusVariant(deal.status)} className="text-xs ml-2 flex-shrink-0">
            {deal.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Type:</span>
            <span className="text-foreground capitalize">{deal.land_type_name || deal.landType}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Value:</span>
            <span className="text-foreground font-medium">
              {formatCurrency(deal.agreed_price || deal.agreedPrice || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Size:</span>
            <span className="text-foreground">
              {deal.lot_size || deal.acreage || 'N/A'} {deal.lot_size_unit || 'acres'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(deal.created_at || deal.submittedOn)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditStatus(deal);
              }}
              className="h-6 px-2 text-xs"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDealClick(deal);
              }}
              className="h-6 px-2 text-xs"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  deals, 
  onStatusUpdate, 
  onDealClick, 
  onEditStatus 
}) => {
  const groupDealsByStatus = (deals: Deal[]) => {
    const grouped: Record<string, Deal[]> = {};
    
    statusColumns.forEach(column => {
      grouped[column.key] = deals.filter(deal => deal.status === column.key);
    });
    
    return grouped;
  };

  const groupedDeals = groupDealsByStatus(deals);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {statusColumns.map(column => {
        const columnDeals = groupedDeals[column.key] || [];
        
        return (
          <div key={column.key} className="flex flex-col">
            <Card className={`${column.color} mb-4`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {columnDeals.length}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
            
            <div className="flex-1 space-y-0">
              {columnDeals.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No deals</p>
                </div>
              ) : (
                columnDeals.map(deal => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onDealClick={onDealClick}
                    onEditStatus={onEditStatus}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
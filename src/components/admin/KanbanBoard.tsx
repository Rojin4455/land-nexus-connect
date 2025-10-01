import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Edit, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable, MeasuringStrategy } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  { 
    key: 'submitted', 
    title: 'Submitted', 
    headerBg: 'bg-blue-500',
    headerText: 'text-white',
    columnBg: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900'
  },
  { 
    key: 'under_review_with_buyer', 
    title: 'Under Review', 
    headerBg: 'bg-yellow-500',
    headerText: 'text-white',
    columnBg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-900'
  },
  { 
    key: 'buyer_approved', 
    title: 'Approved', 
    headerBg: 'bg-green-500',
    headerText: 'text-white',
    columnBg: 'bg-green-50/50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-900'
  },
  { 
    key: 'buyer_rejected', 
    title: 'Rejected', 
    headerBg: 'bg-red-500',
    headerText: 'text-white',
    columnBg: 'bg-red-50/50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-900'
  },
  { 
    key: 'mls_pending', 
    title: 'MLS Pending', 
    headerBg: 'bg-purple-500',
    headerText: 'text-white',
    columnBg: 'bg-purple-50/50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-900'
  },
  { 
    key: 'mls_active', 
    title: 'MLS Active', 
    headerBg: 'bg-indigo-500',
    headerText: 'text-white',
    columnBg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-900'
  },
  { 
    key: 'sold', 
    title: 'Sold', 
    headerBg: 'bg-emerald-500',
    headerText: 'text-white',
    columnBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900'
  },
  { 
    key: 'canceled', 
    title: 'Canceled', 
    headerBg: 'bg-gray-500',
    headerText: 'text-white',
    columnBg: 'bg-gray-50/50 dark:bg-gray-950/20',
    border: 'border-gray-200 dark:border-gray-900'
  }
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

const DroppableColumn: React.FC<{
  id: string;
  children: React.ReactNode;
  columnBg: string;
}> = ({ id, children, columnBg }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 space-y-0 overflow-y-auto transition-all duration-300 rounded-lg p-3 ${columnBg} ${
        isOver ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg bg-primary/10' : ''
      }`}
    >
      {children}
    </div>
  );
};

const DraggableDealCard: React.FC<{ 
  deal: Deal; 
  onDealClick: (deal: Deal) => void; 
  onEditStatus: (deal: Deal) => void; 
}> = ({ deal, onDealClick, onEditStatus }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `deal-${deal.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className={`mb-3 hover:shadow-lg transition-all duration-200 bg-card border-2 ${isDragging ? 'shadow-2xl rotate-2 scale-105' : 'hover:scale-[1.02]'}`} {...attributes} {...listeners}>
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
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  deals, 
  onStatusUpdate, 
  onDealClick, 
  onEditStatus 
}) => {
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);
  const [optimisticDeals, setOptimisticDeals] = React.useState<Deal[]>([]);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [pendingRejectDeal, setPendingRejectDeal] = React.useState<{ deal: Deal; newStatus: string } | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');

  // Use optimistic deals if available, otherwise use props deals
  const displayDeals = optimisticDeals.length > 0 ? optimisticDeals : deals;

  React.useEffect(() => {
    // Reset optimistic state when deals prop updates
    setOptimisticDeals([]);
  }, [deals]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const groupDealsByStatus = (deals: Deal[]) => {
    const grouped: Record<string, Deal[]> = {};
    
    statusColumns.forEach(column => {
      grouped[column.key] = deals.filter(deal => deal.status === column.key);
    });
    
    return grouped;
  };

  const groupedDeals = groupDealsByStatus(displayDeals);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dealId = active.id.toString().replace('deal-', '');
    const deal = displayDeals.find(d => d.id.toString() === dealId);
    setActiveDeal(deal || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const activeDealId = activeId.replace('deal-', '');
    const activeDeal = displayDeals.find(d => d.id.toString() === activeDealId);
    
    if (!activeDeal) return;

    let targetStatus: string;
    
    if (overId.startsWith('column-')) {
      targetStatus = overId.replace('column-', '');
    } else if (overId.startsWith('deal-')) {
      const overDealId = overId.replace('deal-', '');
      const overDeal = displayDeals.find(d => d.id.toString() === overDealId);
      if (!overDeal) return;
      targetStatus = overDeal.status;
    } else {
      return;
    }
  };

  const handleRejectSubmit = () => {
    if (!pendingRejectDeal || !rejectReason.trim()) return;
    
    const { deal, newStatus } = pendingRejectDeal;
    
    // Optimistic update
    const updatedDeals = deals.map(d => 
      d.id === deal.id ? { ...d, status: newStatus } : d
    );
    setOptimisticDeals(updatedDeals);
    
    // Call API
    onStatusUpdate(deal, newStatus, rejectReason);
    
    // Reset
    setShowRejectDialog(false);
    setPendingRejectDeal(null);
    setRejectReason('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id.toString().replace('deal-', '');
    const deal = deals.find(d => d.id.toString() === dealId);
    
    if (!deal) return;

    let newStatus: string;

    if (over.id.toString().startsWith('column-')) {
      newStatus = over.id.toString().replace('column-', '');
    } else if (over.id.toString().startsWith('deal-')) {
      const targetDealId = over.id.toString().replace('deal-', '');
      const targetDeal = deals.find(d => d.id.toString() === targetDealId);
      if (!targetDeal) return;
      newStatus = targetDeal.status;
    } else {
      return;
    }
    
    if (deal.status !== newStatus && statusColumns.find(col => col.key === newStatus)) {
      // If dropping to rejected status, show dialog for reason
      if (newStatus === 'buyer_rejected') {
        setPendingRejectDeal({ deal, newStatus });
        setShowRejectDialog(true);
        return;
      }
      
      // Optimistic update for other statuses
      const updatedDeals = deals.map(d => 
        d.id === deal.id ? { ...d, status: newStatus } : d
      );
      setOptimisticDeals(updatedDeals);
      
      // Call API
      onStatusUpdate(deal, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div className="w-full h-[calc(100vh-200px)] overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 pb-6 px-2 min-w-max">
          {statusColumns.map(column => {
            const columnDeals = groupedDeals[column.key] || [];
            const dealIds = columnDeals.map(deal => `deal-${deal.id}`);
            
            return (
              <div 
                key={column.key} 
                id={`column-${column.key}`}
                className="flex flex-col min-w-[340px] max-w-[340px] flex-shrink-0 h-full"
              >
                <div className={`${column.headerBg} ${column.headerText} rounded-t-lg px-4 py-3 mb-2 shadow-md`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold tracking-wide">
                      {column.title}
                    </h3>
                    <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold">
                      {columnDeals.length}
                    </span>
                  </div>
                </div>
                
                <DroppableColumn id={`column-${column.key}`} columnBg={column.columnBg}>
                  <SortableContext id={`column-${column.key}`} items={dealIds} strategy={verticalListSortingStrategy}>
                    {columnDeals.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border-2 border-dashed border-border">
                          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground font-medium">No deals yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Drag cards here</p>
                        </div>
                      </div>
                    ) : (
                      columnDeals.map(deal => (
                        <DraggableDealCard
                          key={deal.id}
                          deal={deal}
                          onDealClick={onDealClick}
                          onEditStatus={onEditStatus}
                        />
                      ))
                    )}
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeDeal ? (
          <Card className="cursor-grabbing shadow-2xl bg-card border-2 border-primary w-[340px] rotate-3 scale-110 opacity-90">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    Deal #{activeDeal.id}
                  </h4>
                  <div className="flex items-start space-x-2 mb-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground line-clamp-2">{activeDeal.address}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(activeDeal.status)} className="text-xs ml-2 flex-shrink-0">
                  {activeDeal.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(activeDeal.agreed_price || activeDeal.agreedPrice || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rejection Reason Required</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this deal. This will be recorded with the status change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setPendingRejectDeal(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
            >
              Reject Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};

export default KanbanBoard;
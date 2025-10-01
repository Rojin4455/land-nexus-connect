import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Edit, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
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

const DroppableColumn: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 space-y-0 min-h-[200px] transition-colors rounded-lg p-2 ${
        isOver ? 'bg-muted/50 border-2 border-dashed border-primary' : ''
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card border" {...attributes} {...listeners}>
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

  const groupedDeals = groupDealsByStatus(deals);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dealId = parseInt(active.id.toString().replace('deal-', ''));
    const deal = deals.find(d => d.id === dealId);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = parseInt(active.id.toString().replace('deal-', ''));
    const deal = deals.find(d => d.id === dealId);
    
    if (!deal) return;

    // Check if dropped on a column
    const newStatus = over.id.toString().replace('column-', '');
    
    if (deal.status !== newStatus && statusColumns.find(col => col.key === newStatus)) {
      onStatusUpdate(deal, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {statusColumns.map(column => {
            const columnDeals = groupedDeals[column.key] || [];
            const dealIds = columnDeals.map(deal => `deal-${deal.id}`);
            
            return (
              <div 
                key={column.key} 
                id={`column-${column.key}`}
                className="flex flex-col min-w-[320px] flex-shrink-0"
              >
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
                
                <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
                  <DroppableColumn id={`column-${column.key}`}>
                    {columnDeals.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No deals</p>
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
                  </DroppableColumn>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <DragOverlay>
        {activeDeal ? (
          <Card className="cursor-grabbing shadow-lg bg-card border w-[320px]">
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
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
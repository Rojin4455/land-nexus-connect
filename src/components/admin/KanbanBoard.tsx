import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      className={`flex-1 space-y-0 min-h-[400px] transition-all duration-300 rounded-lg p-3 ${columnBg} ${
        isOver ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg' : ''
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

  console.log('🗂️ KanbanBoard received deals:', {
    totalDeals: deals.length,
    dealIds: deals.map(d => d.id),
    dealIdsWithTypes: deals.slice(0, 5).map(d => ({ id: d.id, type: typeof d.id, status: d.status })),
    firstDeal: deals[0],
  });

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
    console.log('🎯 DRAG START:', {
      activeId: active.id,
    });
    const dealId = active.id.toString().replace('deal-', '');
    const deal = deals.find(d => d.id.toString() === dealId);
    console.log('📦 Deal being dragged:', { dealId, deal, dealStatus: deal?.status });
    setActiveDeal(deal || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    console.log('🔄 DRAG OVER:', {
      activeId: active.id,
      overId: over?.id,
    });

    if (!over) {
      console.log('⚠️ No over target');
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log('🎪 IDs:', { activeId, overId });

    // Don't do anything if dropping on itself
    if (activeId === overId) {
      console.log('⚠️ Dropping on itself, skipping');
      return;
    }

    // Get the active deal
    const activeDealId = activeId.replace('deal-', '');
    const activeDeal = deals.find(d => d.id.toString() === activeDealId);
    
    if (!activeDeal) {
      console.log('⚠️ Active deal not found');
      return;
    }

    // Determine the target column
    let targetStatus: string;
    
    if (overId.startsWith('column-')) {
      targetStatus = overId.replace('column-', '');
      console.log('📍 Dropping on column:', targetStatus);
    } else if (overId.startsWith('deal-')) {
      const overDealId = overId.replace('deal-', '');
      const overDeal = deals.find(d => d.id.toString() === overDealId);
      if (!overDeal) {
        console.log('⚠️ Over deal not found');
        return;
      }
      targetStatus = overDeal.status;
      console.log('📍 Dropping on deal in column:', targetStatus);
    } else {
      console.log('⚠️ Unknown drop target type');
      return;
    }

    // Only update if status is different
    if (activeDeal.status !== targetStatus) {
      console.log(`✅ Would move deal ${activeDealId} from ${activeDeal.status} to ${targetStatus}`);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('🏁 DRAG END:', {
      activeId: active.id,
      overId: over?.id,
    });

    setActiveDeal(null);

    if (!over) {
      console.log('❌ No drop target - drag cancelled');
      return;
    }

    const dealId = active.id.toString().replace('deal-', '');
    const deal = deals.find(d => d.id.toString() === dealId);
    
    if (!deal) {
      console.log('❌ Deal not found:', dealId);
      return;
    }

    let newStatus: string;

    // Check if dropped on a column directly
    if (over.id.toString().startsWith('column-')) {
      newStatus = over.id.toString().replace('column-', '');
      console.log('✅ Dropped on column:', newStatus);
    } else if (over.id.toString().startsWith('deal-')) {
      // Dropped on another card - find the status of that card
      const targetDealId = over.id.toString().replace('deal-', '');
      const targetDeal = deals.find(d => d.id.toString() === targetDealId);
      if (!targetDeal) {
        console.log('❌ Target deal not found:', targetDealId);
        return;
      }
      newStatus = targetDeal.status;
      console.log('✅ Dropped on deal, using its status:', newStatus);
    } else {
      console.log('❌ Unknown drop target type:', over.id);
      return;
    }
    
    console.log('🔄 Status change:', {
      dealId,
      oldStatus: deal.status,
      newStatus,
      willUpdate: deal.status !== newStatus,
    });

    // Only update if status changed
    if (deal.status !== newStatus && statusColumns.find(col => col.key === newStatus)) {
      console.log('🚀 Calling onStatusUpdate');
      onStatusUpdate(deal, newStatus);
    } else {
      console.log('⏭️ Skipping update - same status or invalid column');
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
                className="flex flex-col min-w-[340px] max-w-[340px] flex-shrink-0"
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
                
                <SortableContext id={`column-${column.key}`} items={dealIds} strategy={verticalListSortingStrategy}>
                  <DroppableColumn id={`column-${column.key}`} columnBg={column.columnBg}>
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
                  </DroppableColumn>
                </SortableContext>
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
    </DndContext>
  );
};

export default KanbanBoard;
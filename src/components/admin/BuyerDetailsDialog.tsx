import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { landDealsApi } from "@/services/landDealsApi";
import AddressAutocomplete from '@/components/map/AddressAutocomplete';

// Consolidated constants and schemas
const CONSTANTS = {
  assetTypes: [
    { label: "Land", value: "land" as const },
    { label: "Houses", value: "houses" as const },
    { label: "Both", value: "both" as const },
  ],
  boolOptions: [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ],
  strategies: {
    houses: ["Fix & Flip", "Buy & Hold (Rental)", "BRRRR", "Airbnb / Short-Term Rental", "Novation / Creative Finance"],
    land: ["Infill Lot Development", "Buy & Flip", "Buy & Hold", "Subdivide & Sell", "Seller Financing", "RV Lot / Tiny Home Lot / Mobile Home Lot", "Entitlement / Rezoning"],
  },
  exitStrategies: ["infill", "flip", "subdivide", "seller_financing", "rezoning", "mobile_home"],
  exitStrategyLabels: {
    "infill": "Infill Lot Development",
    "flip": "Buy & Flip", 
    "subdivide": "Subdivide & Sell",
    "seller_financing": "Seller Financing",
    "rezoning": "Entitlement/Rezoning", 
    "mobile_home": "Mobile Home Lot"
  },
  propertyTypes: {
    houses: ["Single Family", "Duplex / Triplex", "Mobile Home with Land", "Townhouse", "Condo"],
    land: ["Residential Vacant", "Agricultural", "Commercial", "Recreational", "Timberland / Hunting", "Waterfront", "Subdividable"],
  },
  ranges: ["Any", "1+", "2+", "3+", "4+", "5+"],
  restrictedRehab: ["Major Foundation", "Fire Damage", "Mold", "Full Gut", "Termite", "Roof Replacement"],
  specialtyRehab: ["Septic", "Electrical Panel", "Full Rewire", "Unpermitted Additions", "Historic Home"],
  strictRequirements: ["Legal Access Required (Land)", "Utilities at Road (Land)", "No Flood Zone", "Clear Title", "No HOA", "Paved Road Access", "Mobile Home Allowed"],
  locationChars: ["Flood Zone", "Near Main Road", "HOA Community", "55+ Community", "Near Commercial", "Waterfront", "Near Railroad"],
  propertyChars: ["Pool", "Garage", "Solar Panels", "Wood Frame", "Driveway", "City Water", "Well Water", "Septic Tank", "Power at Street (Land)", "Perk Tested (Land)"],
} as const;

const BuyBoxSchema = z.object({
  assetType: z.enum(["land", "houses", "both"]).default("both"),
  activeBuyer: z.boolean().default(true),
  blacklistStatus: z.boolean().default(false),
  address: z.string().optional().default(""),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  place_id: z.string().optional().default(""),
  strategiesHouses: z.array(z.string()).default([]),
  strategiesLand: z.array(z.string()).default([]),
  desiredTypesHouses: z.array(z.string()).default([]),
  desiredTypesLand: z.array(z.string()).default([]),
  priceMin: z.number().optional().nullable(),
  priceMax: z.number().optional().nullable(),
  lotSizeMin: z.number().optional().nullable(),
  lotSizeMax: z.number().optional().nullable(),
  bedsMin: z.number().optional().nullable(),
  bedsMax: z.number().optional().nullable(),
  bathsMin: z.number().optional().nullable(),
  bathsMax: z.number().optional().nullable(),
  livingAreaMin: z.number().optional().nullable(),
  livingAreaMax: z.number().optional().nullable(),
  yearBuiltMin: z.number().optional().nullable(),
  yearBuiltMax: z.number().optional().nullable(),
  restrictedRehabTypes: z.array(z.string()).default([]),
  specialtyRehabAvoidance: z.array(z.string()).default([]),
  strictRequirements: z.array(z.string()).default([]),
  locationCharacteristics: z.array(z.string()).default([]),
  propertyCharacteristics: z.array(z.string()).default([]),
  exitStrategy: z.array(z.string()).default([]),
  notes: z.string().optional().default(""),
});

export type BuyBoxFormValues = z.infer<typeof BuyBoxSchema>;

interface BuyerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyer: { id: number; name: string; email: string; phone?: string | null } | null;
  onUpdated?: () => void;
}

export default function BuyerDetailsDialog({ open, onOpenChange, buyer, onUpdated }: BuyerDetailsDialogProps) {
  // Consolidated state
  const [state, setState] = useState({
    savingInfo: false,
    savingBuyBox: false,
    checkingMatch: false,
    propertyIdForMatch: "",
    matchScore: null as number | null,
    buyBoxLoaded: false,
    matchingStats: null as any,
    loadingMatchingStats: false,
    togglingBuyBox: false,
  });

  const form = useForm<BuyBoxFormValues>({
    resolver: zodResolver(BuyBoxSchema),
    defaultValues: {
      assetType: "both",
      activeBuyer: true,
      blacklistStatus: false,
      address: "",
      latitude: undefined,
      longitude: undefined,
      place_id: "",
      strategiesHouses: [],
      strategiesLand: [],
      desiredTypesHouses: [],
      desiredTypesLand: [],
      priceMin: undefined,
      priceMax: undefined,
      lotSizeMin: undefined,
      lotSizeMax: undefined,
      bedsMin: undefined,
      bedsMax: undefined,
      bathsMin: undefined,
      bathsMax: undefined,
      livingAreaMin: undefined,
      livingAreaMax: undefined,
      yearBuiltMin: undefined,
      yearBuiltMax: undefined,
      restrictedRehabTypes: [],
      specialtyRehabAvoidance: [],
      strictRequirements: [],
      locationCharacteristics: [],
      propertyCharacteristics: [],
      exitStrategy: [],
      notes: "",
    },
  });

  const assetType = form.watch("assetType");

  const getMatchLikelihood = (score: number) => {
    if (score > 45) return { label: "Good Fit", color: "bg-green-100 text-green-800" };
    if (score < 40) return { label: "Poor Fit", color: "bg-red-100 text-red-800" };
    return { label: "Marginal Fit", color: "bg-yellow-100 text-yellow-800" };
  };

  // Utility functions
  const updateState = (updates: Partial<typeof state>) => setState(prev => ({ ...prev, ...updates }));

  const mapAssetType = (value: any): "land" | "houses" | "both" => {
    if (!value) return "both";
    const str = String(value).toLowerCase();
    if (str === "land") return "land";
    if (str === "houses") return "houses";
    return "both";
  };

  const csvToArray = (v: string): string[] => v.split(",").map(s => s.trim()).filter(Boolean);

  const numOrNull = (v: string, integer = false): number | null => {
    if (v === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return integer ? Math.trunc(n) : n;
  };

  const numberOrNull = (v: any): number | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const resetFormToEmpty = () => {
    form.reset({
      assetType: "both",
      activeBuyer: true,
      blacklistStatus: false,
      address: "",
      latitude: undefined,
      longitude: undefined,
      place_id: "",
      strategiesHouses: [],
      strategiesLand: [],
      desiredTypesHouses: [],
      desiredTypesLand: [],
      priceMin: undefined,
      priceMax: undefined,
      lotSizeMin: undefined,
      lotSizeMax: undefined,
      bedsMin: undefined,
      bedsMax: undefined,
      bathsMin: undefined,
      bathsMax: undefined,
      livingAreaMin: undefined,
      livingAreaMax: undefined,
      yearBuiltMin: undefined,
      yearBuiltMax: undefined,
      restrictedRehabTypes: [],
      specialtyRehabAvoidance: [],
      strictRequirements: [],
      locationCharacteristics: [],
      propertyCharacteristics: [],
      exitStrategy: [],
      notes: "",
    });
  };

  // API functions
const loadBuyBox = async () => {
  if (!buyer?.id || state.buyBoxLoaded) return;
  
  try {
    const res = await landDealsApi.admin.getBuyerBuyBox(String(buyer.id));
    if (res?.success && res.data) {
      const data = res.data;
      
      // Check if we have the buybox_criteria nested structure (like in your API response)
      const buyBoxData = data.buybox_criteria || data;
      
      const hasExistingData = Object.keys(buyBoxData).some(key => {
        const value = buyBoxData[key];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'number') return value !== null && value !== undefined;
        if (typeof value === 'boolean') return true;
        return false;
      });

      if (hasExistingData) {
        const mapped: Partial<BuyBoxFormValues> = {
          assetType: mapAssetType(buyBoxData.asset_type) || "both",
          activeBuyer: Boolean(buyBoxData.is_active_buyer ?? true),
          blacklistStatus: Boolean(buyBoxData.is_blacklisted ?? false),
          address: buyBoxData.address || "",
          latitude: buyBoxData.latitude || null,
          longitude: buyBoxData.longitude || null,
          place_id: buyBoxData.place_id || "",
          strategiesHouses: buyBoxData.house_strategies || [], // Fix: was strategies_houses
          strategiesLand: buyBoxData.land_strategies || [],   // Fix: was strategies_land
          desiredTypesHouses: buyBoxData.house_property_types || [], // Fix: was desired_types_houses
          desiredTypesLand: buyBoxData.land_property_types || [],   // Fix: was desired_types_land
          priceMin: numberOrNull(buyBoxData.price_min),
          priceMax: numberOrNull(buyBoxData.price_max),
          lotSizeMin: numberOrNull(buyBoxData.lot_size_min),
          lotSizeMax: numberOrNull(buyBoxData.lot_size_max),
          bedsMin: numberOrNull(buyBoxData.bedroom_min),     // Fix: was beds_min
          bedsMax: numberOrNull(buyBoxData.bedroom_max),     // Fix: was beds_max
          bathsMin: numberOrNull(buyBoxData.bathroom_min),   // Fix: was baths_min
          bathsMax: numberOrNull(buyBoxData.bathroom_max),   // Fix: was baths_max
          livingAreaMin: numberOrNull(buyBoxData.sqft_min),  // Fix: was living_area_min
          livingAreaMax: numberOrNull(buyBoxData.sqft_max),  // Fix: was living_area_max
          yearBuiltMin: numberOrNull(buyBoxData.year_built_min),
          yearBuiltMax: numberOrNull(buyBoxData.year_built_max),
          restrictedRehabTypes: buyBoxData.restricted_rehabs || [], // Fix: was restricted_rehab_types
          specialtyRehabAvoidance: buyBoxData.specialty_rehab_avoidance || [],
          strictRequirements: buyBoxData.strict_requirements || [],
          locationCharacteristics: buyBoxData.location_characteristics || [],
          propertyCharacteristics: buyBoxData.property_characteristics || [],
          exitStrategy: Array.isArray(buyBoxData.exit_strategy) ? buyBoxData.exit_strategy : (buyBoxData.exit_strategy ? [buyBoxData.exit_strategy] : []),
          notes: buyBoxData.notes || "",
        };
        form.reset(mapped as BuyBoxFormValues);
      } else {
        resetFormToEmpty();
      }
    } else {
      resetFormToEmpty();
    }
  } catch (e) {
    console.error('Error loading buy box:', e); // Add for debugging
    resetFormToEmpty();
  } finally {
    updateState({ buyBoxLoaded: true });
  }
};

  const loadMatchingStats = async () => {
    if (!buyer?.id || state.loadingMatchingStats) return;
    
    try {
      updateState({ loadingMatchingStats: true });
      const res = await landDealsApi.admin.getBuyerMatchingStats(String(buyer.id));
      
      if (res?.success && res.data) {
        updateState({ matchingStats: res.data });
      } else if (res?.data) {
        updateState({ matchingStats: res.data });
      } else {
        updateState({ matchingStats: null });
        toast({ 
          title: "No matching data available", 
          description: "This buyer doesn't have any matching statistics yet.",
          variant: "default" 
        });
      }
    } catch (e: any) {
      updateState({ matchingStats: null });
      toast({ 
        title: "Failed to load matching stats", 
        description: e?.message || "An error occurred while loading matching statistics", 
        variant: "destructive" 
      });
    } finally {
      updateState({ loadingMatchingStats: false });
    }
  };

  const saveBuyerInfo = async () => {
    if (!buyer) return;
    try {
      updateState({ savingInfo: true });
      const payload = {
        name: (document.getElementById("buyer-info-name") as HTMLInputElement)?.value || buyer.name,
        email: (document.getElementById("buyer-info-email") as HTMLInputElement)?.value || buyer.email,
        phone: (document.getElementById("buyer-info-phone") as HTMLInputElement)?.value || buyer.phone || "",
      };
      await landDealsApi.admin.updateBuyer(String(buyer.id), payload);
      toast({ title: "Buyer updated" });
      onUpdated?.();
    } catch (e: any) {
      toast({ title: "Failed to update buyer", description: e?.message || "", variant: "destructive" });
    } finally {
      updateState({ savingInfo: false });
    }
  };

const onSubmit = async (values: BuyBoxFormValues) => {
  if (!buyer) return;
  try {
    updateState({ savingBuyBox: true });
    const payload: any = {
      asset_type: values.assetType.toLowerCase(),
      is_active_buyer: values.activeBuyer,
      is_blacklisted: values.blacklistStatus,
      address: values.address || "",
      latitude: values.latitude || null,
      longitude: values.longitude || null,
      place_id: values.place_id || "",
      house_strategies: values.strategiesHouses,  // Fix: was strategies_houses
      land_strategies: values.strategiesLand,     // Fix: was strategies_land
      house_property_types: values.desiredTypesHouses, // Fix: was desired_types_houses
      land_property_types: values.desiredTypesLand,    // Fix: was desired_types_land
      price_min: values.priceMin,
      price_max: values.priceMax,
      lot_size_min: values.lotSizeMin,
      lot_size_max: values.lotSizeMax,
      bedroom_min: values.bedsMin,                // Fix: was beds_min
      bedroom_max: values.bedsMax,                // Fix: was beds_max
      bathroom_min: values.bathsMin,              // Fix: was baths_min
      bathroom_max: values.bathsMax,              // Fix: was baths_max
      sqft_min: values.livingAreaMin,             // Fix: was living_area_min
      sqft_max: values.livingAreaMax,             // Fix: was living_area_max
      year_built_min: values.yearBuiltMin,
      year_built_max: values.yearBuiltMax,
      restricted_rehabs: values.restrictedRehabTypes, // Fix: was restricted_rehab_types
      specialty_rehab_avoidance: values.specialtyRehabAvoidance,
      strict_requirements: values.strictRequirements,
      location_characteristics: values.locationCharacteristics,
      property_characteristics: values.propertyCharacteristics,
      exit_strategy: values.exitStrategy,
      notes: values.notes,
    };

    const res = await landDealsApi.admin.updateBuyerBuyBox(String(buyer.id), payload);
    if (res?.success) toast({ title: "Buy box saved" });
    onUpdated?.();
  } catch (e: any) {
    toast({ title: "Failed to save buy box", description: e?.message || "", variant: "destructive" });
  } finally {
    updateState({ savingBuyBox: false });
  }
};

  const checkMatch = async () => {
    try {
      updateState({ checkingMatch: true });
      const propId = state.propertyIdForMatch.trim();
      if (!propId) return;
      const res = await landDealsApi.admin.matchBuyersForProperty(propId);
      if (res?.success) {
        const list: any[] = (res.data as any) || [];
        const match = list.find((b: any) => String(b.id) === String(buyer?.id));
        if (match) {
          updateState({ matchScore: Number((match as any).score ?? (match as any).match_score ?? 0) });
        } else {
          updateState({ matchScore: null });
          toast({ title: "No match found for this buyer on that property" });
        }
      }
    } catch (e: any) {
      toast({ title: "Failed to check match", description: e?.message || "", variant: "destructive" });
    } finally {
      updateState({ checkingMatch: false });
    }
  };

  const toggleBuyBoxActive = async () => {
    if (!buyer?.id || state.togglingBuyBox) return;
    
    try {
      updateState({ togglingBuyBox: true });
      const res = await landDealsApi.admin.toggleBuyBoxActive(String(buyer.id));
      
      if (res?.success) {
        // Update the form value to reflect the new status
        const newActiveStatus = res.data?.is_active ?? !form.getValues("activeBuyer");
        form.setValue("activeBuyer", newActiveStatus);
        
        toast({ 
          title: `Buy Box ${newActiveStatus ? 'Activated' : 'Deactivated'}`,
          description: `This buyer is now ${newActiveStatus ? 'active' : 'inactive'} for property matching.`
        });
        onUpdated?.();
      } else {
        toast({ 
          title: "Failed to toggle Buy Box status", 
          description: "Please try again.",
          variant: "destructive" 
        });
      }
    } catch (e: any) {
      toast({ 
        title: "Failed to toggle Buy Box status", 
        description: e?.message || "An error occurred", 
        variant: "destructive" 
      });
    } finally {
      updateState({ togglingBuyBox: false });
    }
  };

  // Event handlers
  const handleTabChange = (value: string) => {
    if (value === "buybox" && !state.buyBoxLoaded) {
      loadBuyBox();
    } else if (value === "match") {
      loadMatchingStats();
    }
  };

  // Effects
  useEffect(() => {
    if (open) {
      updateState({
        buyBoxLoaded: false,
        matchScore: null,
        propertyIdForMatch: "",
        matchingStats: null,
      });
    }
  }, [open, buyer?.id]);

  // Reusable components
  const CsvField = ({ name, label, placeholder }: { name: keyof BuyBoxFormValues; label: string; placeholder?: string }) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              value={(field.value || []).join(", ")}
              onChange={(e) => field.onChange(csvToArray(e.target.value))}
              placeholder={placeholder}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );

  const RangeFields = ({ minName, maxName, label, integer = false }: { minName: keyof BuyBoxFormValues; maxName: keyof BuyBoxFormValues; label: string; integer?: boolean }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={form.control}
          name={minName as any}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(numOrNull(e.target.value, integer))} placeholder="Min" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={maxName as any}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(numOrNull(e.target.value, integer))} placeholder="Max" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const CheckboxGroup = ({ name, label, options }: { name: keyof BuyBoxFormValues; label: string; options: readonly string[] }) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => {
              const currentValue = Array.isArray(field.value) ? field.value : [];
              const checked = currentValue.includes(opt);
              
              return (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const currentArray = Array.isArray(field.value) ? field.value : [];
                      const val = new Set<string>(currentArray);
                      if (isChecked) val.add(opt); else val.delete(opt);
                      field.onChange(Array.from(val));
                    }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </FormItem>
      )}
    />
  );

  const MatchingStatsDisplay = () => (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Buyer Matching Results</h3>
        <Button 
          onClick={loadMatchingStats} 
          disabled={state.loadingMatchingStats}
          variant="outline"
          size="sm"
        >
          {state.loadingMatchingStats ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {state.loadingMatchingStats ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading matching results...</div>
        </div>
      ) : state.matchingStats ? (
        <div className="space-y-8">
          {/* Buyer Profile & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Status</h4>
              <div className="flex flex-col gap-2">
                <Badge variant={state.matchingStats.buybox_criteria?.is_active ? "default" : "secondary"}>
                  {state.matchingStats.buybox_criteria?.is_active ? "Active" : "Inactive"}
                </Badge>
                {state.matchingStats.buybox_criteria?.is_blacklisted && (
                  <Badge variant="destructive">Blacklisted</Badge>
                )}
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Asset Type</h4>
              <p className="text-lg font-semibold capitalize">
                {state.matchingStats.buybox_criteria?.asset_type || "Not Set"}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Target Location</h4>
              <p className="text-sm truncate">
                {state.matchingStats.buybox_criteria?.address || "Not Specified"}
              </p>
            </div>
          </div>

          {/* Algorithm Weights Display */}
          <div className="border rounded-lg p-6 bg-accent/20">
            <h4 className="font-medium text-lg mb-4">Weighted Matching Algorithm</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">40%</div>
                <div className="text-xs font-medium">Location Match</div>
                <div className="text-xs text-muted-foreground">City, County, Zip</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">30%</div>
                <div className="text-xs font-medium">Land Type</div>
                <div className="text-xs text-muted-foreground">Property Category</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">20%</div>
                <div className="text-xs font-medium">Exit Strategy</div>
                <div className="text-xs text-muted-foreground">Investment Plan</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">5%</div>
                <div className="text-xs font-medium">Lot Size</div>
                <div className="text-xs text-muted-foreground">Acreage Match</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">5%</div>
                <div className="text-xs font-medium">Agreed Price</div>
                <div className="text-xs text-muted-foreground">Price Range</div>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div>
            <h4 className="font-medium text-lg mb-4">Performance Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 bg-card">
                <h5 className="font-semibold text-sm text-muted-foreground mb-4">Recent Performance (30 Days)</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Properties:</span>
                    <span className="font-semibold text-lg">{state.matchingStats.matching_stats?.recent_performance?.total_properties_last_30_days || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Matches:</span>
                    <span className="font-semibold text-lg">{state.matchingStats.matching_stats?.recent_performance?.total_matches_last_30_days || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Match Rate:</span>
                    <span className="font-semibold text-lg">
                      {state.matchingStats.matching_stats?.recent_performance?.match_rate_percentage !== undefined 
                        ? `${Number(state.matchingStats.matching_stats.recent_performance.match_rate_percentage).toFixed(1)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Score:</span>
                    <span className="font-semibold text-lg">
                      {state.matchingStats.matching_stats?.recent_performance?.avg_match_score !== undefined 
                        ? `${Number(state.matchingStats.matching_stats.recent_performance.avg_match_score).toFixed(1)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-6 bg-card">
                <h5 className="font-semibold text-sm text-muted-foreground mb-4">All Time Performance</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Properties:</span>
                    <span className="font-semibold text-lg">{state.matchingStats.matching_stats?.all_time_performance?.total_properties || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Matches:</span>
                    <span className="font-semibold text-lg">{state.matchingStats.matching_stats?.all_time_performance?.total_matches || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Match Rate:</span>
                    <span className="font-semibold text-lg">
                      {state.matchingStats.matching_stats?.all_time_performance?.match_rate_percentage !== undefined 
                        ? `${Number(state.matchingStats.matching_stats.all_time_performance.match_rate_percentage).toFixed(1)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Score:</span>
                    <span className="font-semibold text-lg">
                      {state.matchingStats.matching_stats?.all_time_performance?.avg_match_score !== undefined 
                        ? `${Number(state.matchingStats.matching_stats.all_time_performance.avg_match_score).toFixed(1)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Quality Breakdown */}
          <div>
            <h4 className="font-medium text-lg mb-4">Match Quality Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6 text-center bg-card">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {state.matchingStats.matching_stats?.recent_performance?.good_fit_count || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Good Fit</div>
                <div className="text-xs text-muted-foreground mt-1">(&gt;45% match)</div>
              </div>
              <div className="border rounded-lg p-6 text-center bg-card">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {state.matchingStats.matching_stats?.recent_performance?.marginal_fit_count || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Marginal Fit</div>
                <div className="text-xs text-muted-foreground mt-1">(40-45% match)</div>
              </div>
              <div className="border rounded-lg p-6 text-center bg-card">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {state.matchingStats.matching_stats?.recent_performance?.poor_fit_count || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Poor Fit</div>
                <div className="text-xs text-muted-foreground mt-1">(&lt;40% match)</div>
              </div>
            </div>
          </div>

          {/* Recent Matches */}
          {state.matchingStats.matching_results?.recent_matches?.length > 0 && (
            <div>
              <h4 className="font-medium text-lg mb-4">Recent Property Matches</h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <div className="divide-y">
                    {state.matchingStats.matching_results.recent_matches.map((match: any) => {
                      const likelihood = getMatchLikelihood(match.match_score);
                      return (
                        <div key={match.property_id} className="p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h6 className="font-medium text-sm mb-2">{match.display_name}</h6>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">Type:</span> {match.land_type}
                                </div>
                                <div>
                                  <span className="font-medium">Size:</span> {match.acreage} acres
                                </div>
                                <div>
                                  <span className="font-medium">Price:</span> ${Number(match.agreed_price || 0).toLocaleString()}
                                </div>
                                <div>
                                  <span className="font-medium">Address:</span> {match.address}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <Badge 
                                className={`text-xs ${likelihood.color}`}
                              >
                                {match.likelihood || likelihood.label}
                              </Badge>
                              <div className="text-right">
                                <div className="font-semibold text-lg">{match.match_score}%</div>
                                <div className="text-xs text-muted-foreground">Match Score</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-sm text-muted-foreground mb-4">
            No matching data available for this buyer
          </div>
          <Button onClick={loadMatchingStats} disabled={state.loadingMatchingStats}>
            {state.loadingMatchingStats ? "Loading..." : "Load Matching Stats"}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Buyer Details</DialogTitle>
        </DialogHeader>

        {!buyer ? (
          <div className="text-muted-foreground">No buyer selected.</div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <Tabs defaultValue="info" className="w-full flex flex-col flex-1 min-h-0" onValueChange={handleTabChange}>
              <TabsList className="mb-4 flex-shrink-0">
                <TabsTrigger value="info">Buyer Info</TabsTrigger>
                <TabsTrigger value="buybox">Buy Box Filters</TabsTrigger>
                <TabsTrigger value="match">Match Score</TabsTrigger>
              </TabsList>

              {/* Buyer Info */}
              <TabsContent value="info" className="flex-1 overflow-y-auto">
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyer-info-name">Name</Label>
                      <Input id="buyer-info-name" defaultValue={buyer.name} placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer-info-email">Email</Label>
                      <Input id="buyer-info-email" type="email" defaultValue={buyer.email} placeholder="Email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer-info-phone">Phone</Label>
                      <Input id="buyer-info-phone" type="tel" defaultValue={buyer.phone || ""} placeholder="Phone" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveBuyerInfo} disabled={state.savingInfo}>
                      {state.savingInfo ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Buy Box */}
              <TabsContent value="buybox" className="flex-1 min-h-0 flex flex-col">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-6 p-1 pb-6">
                        {/* Buy Box Toggle */}
                        <div className="border rounded-lg p-4 bg-accent/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">Buy Box Status</h4>
                              <p className="text-sm text-muted-foreground">Toggle buyer's property matching eligibility</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">
                                {form.watch("activeBuyer") ? "Active" : "Inactive"}
                              </span>
                              <Switch
                                checked={form.watch("activeBuyer")}
                                onCheckedChange={toggleBuyBoxActive}
                                disabled={state.togglingBuyBox}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Top toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="assetType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Asset Type</FormLabel>
                                <FormDescription>Select the main asset type</FormDescription>
                                <div className="flex gap-2 flex-wrap">
                                  {CONSTANTS.assetTypes.map((opt) => (
                                    <Badge
                                      key={opt.value}
                                      onClick={() => field.onChange(opt.value)}
                                      className={`${field.value === opt.value ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"} cursor-pointer`}
                                    >
                                      {opt.label}
                                    </Badge>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="activeBuyer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Active Buyer</FormLabel>
                                <div className="flex items-center gap-4">
                                  {CONSTANTS.boolOptions.map((o) => (
                                    <label key={String(o.value)} className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox checked={field.value === o.value} onCheckedChange={() => field.onChange(o.value)} />
                                      <span>{o.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="blacklistStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Blacklist</FormLabel>
                                <div className="flex items-center gap-4">
                                  {CONSTANTS.boolOptions.map((o) => (
                                    <label key={String(o.value)} className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox checked={field.value === o.value} onCheckedChange={() => field.onChange(o.value)} />
                                      <span>{o.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Address field */}
                        <section className="space-y-4">
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Address / Location</FormLabel>
                                <FormControl>
                                  <AddressAutocomplete
                                    value={field.value || ""}
                                    onChange={(address, locationData) => {
                                      field.onChange(address);
                                      if (locationData) {
                                        form.setValue("latitude", locationData.lat);
                                        form.setValue("longitude", locationData.lng);
                                        form.setValue("place_id", locationData.place_id);
                                      }
                                    }}
                                    placeholder="Enter target investment address..."
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Specify the target address or area for investments
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </section>

                        {/* Strategies and desired types */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(assetType === "houses" || assetType === "both") && (
                            <CheckboxGroup
                              name="strategiesHouses"
                              label="Investment Strategy (Houses)"
                              options={CONSTANTS.strategies.houses}
                            />
                          )}
                          {(assetType === "land" || assetType === "both") && (
                            <CheckboxGroup
                              name="strategiesLand"
                              label="Investment Strategy (Land)"
                              options={CONSTANTS.strategies.land}
                            />
                          )}
                          {(assetType === "houses" || assetType === "both") && (
                            <CheckboxGroup
                              name="desiredTypesHouses"
                              label="Desired Property Type (Houses)"
                              options={CONSTANTS.propertyTypes.houses}
                            />
                          )}
                          {(assetType === "land" || assetType === "both") && (
                            <CheckboxGroup
                              name="desiredTypesLand"
                              label="Desired Property Type (Land)"
                              options={CONSTANTS.propertyTypes.land}
                            />
                          )}
                        </section>

                        {/* Ranges */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <RangeFields minName="priceMin" maxName="priceMax" label="Purchase Price ($)" />
                          {(assetType === "land" || assetType === "both") && (
                            <RangeFields minName="lotSizeMin" maxName="lotSizeMax" label="Lot Size (acres) – Land only" />
                          )}
                          {(assetType === "houses" || assetType === "both") && (
                            <RangeFields minName="livingAreaMin" maxName="livingAreaMax" label="Living Area (SqFt) – Houses" />
                          )}
                          {(assetType === "houses" || assetType === "both") && (
                            <RangeFields minName="yearBuiltMin" maxName="yearBuiltMax" label="Year Built – Houses" />
                          )}
                          {(assetType === "houses" || assetType === "both") && (
                            <RangeFields minName="bedsMin" maxName="bedsMax" label="Bedrooms – Houses" integer />
                          )}
                          {(assetType === "houses" || assetType === "both") && (
                            <RangeFields minName="bathsMin" maxName="bathsMax" label="Bathrooms – Houses" />
                          )}
                        </section>

                        {/* Rehab & requirements */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(assetType === "houses" || assetType === "both") && (
                            <CheckboxGroup name="restrictedRehabTypes" label="Restricted Rehab Types" options={CONSTANTS.restrictedRehab} />
                          )}
                          {(assetType === "houses" || assetType === "both") && (
                            <CheckboxGroup name="specialtyRehabAvoidance" label="Specialty Rehab Avoidance" options={CONSTANTS.specialtyRehab} />
                          )}
                          <CheckboxGroup name="strictRequirements" label="Strict Requirements" options={CONSTANTS.strictRequirements} />
                          <CheckboxGroup name="locationCharacteristics" label="Location Characteristics" options={CONSTANTS.locationChars} />
                          <CheckboxGroup name="propertyCharacteristics" label="Property Characteristics" options={CONSTANTS.propertyChars} />
                        </section>

                        {/* Exit Strategy */}
                        <CheckboxGroup
                          name="exitStrategy"
                          label="Exit Strategy"
                          options={Object.values(CONSTANTS.exitStrategyLabels)}
                        />

                        {/* Notes */}
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Internal Notes</FormLabel>
                              <FormDescription>Only visible to admins</FormDescription>
                              <FormControl>
                                <Textarea rows={4} placeholder="Unique conditions, communication prefs, pre-negotiated terms..." {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </ScrollArea>
                    
                    <div className="flex justify-end pt-4 mt-4 border-t bg-background flex-shrink-0">
                      <Button type="submit" disabled={state.savingBuyBox}>
                        {state.savingBuyBox ? "Saving..." : "Save Buy Box"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Match Score */}
              <TabsContent value="match" className=" overflow-y-auto">
                <MatchingStatsDisplay />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { landDealsApi } from "@/services/landDealsApi";

// Options (can be later fetched from API if available)
const assetTypeOptions = ["Land", "Houses", "Both"] as const;
const yesNoOptions = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];
const blacklistOptions = [
  { label: "Blacklisted", value: true },
  { label: "Not Blacklisted", value: false },
];

const investmentStrategiesHouses = [
  "Fix & Flip",
  "Buy & Hold (Rental)",
  "BRRRR",
  "Airbnb / Short-Term Rental",
  "Novation / Creative Finance",
] as const;

const investmentStrategiesLand = [
  "Infill Lot Development",
  "Buy & Flip",
  "Buy & Hold",
  "Subdivide & Sell",
  "Seller Financing",
  "RV Lot / Tiny Home Lot / Mobile Home Lot",
  "Entitlement / Rezoning",
] as const;

const desiredPropertyTypeHouses = [
  "Single Family",
  "Duplex / Triplex",
  "Mobile Home with Land",
  "Townhouse",
  "Condo",
] as const;

const desiredPropertyTypeLand = [
  "Residential Vacant",
  "Agricultural",
  "Commercial",
  "Recreational",
  "Timberland / Hunting",
  "Waterfront",
  "Subdividable",
] as const;

const bedroomOptions = ["Any", "1+", "2+", "3+", "4+", "5+"] as const;
const bathroomOptions = ["Any", "1+", "1.5+", "2+", "3+", "4+"] as const;

const restrictedRehabTypes = [
  "Major Foundation",
  "Fire Damage",
  "Mold",
  "Full Gut",
  "Termite",
  "Roof Replacement",
] as const;

const specialtyRehabAvoidance = [
  "Septic",
  "Electrical Panel",
  "Full Rewire",
  "Unpermitted Additions",
  "Historic Home",
] as const;

const strictRequirementOptions = [
  "Legal Access Required (Land)",
  "Utilities at Road (Land)",
  "No Flood Zone",
  "Clear Title",
  "No HOA",
  "Paved Road Access",
  "Mobile Home Allowed",
] as const;

const locationCharacteristicsOptions = [
  "Flood Zone",
  "Near Main Road",
  "HOA Community",
  "55+ Community",
  "Near Commercial",
  "Waterfront",
  "Near Railroad",
] as const;

const propertyCharacteristicsOptions = [
  "Pool",
  "Garage",
  "Solar Panels",
  "Wood Frame",
  "Driveway",
  "City Water",
  "Well Water",
  "Septic Tank",
  "Power at Street (Land)",
  "Perk Tested (Land)",
] as const;

const BuyBoxSchema = z.object({
  assetType: z.enum(["Land", "Houses", "Both"]).default("Both"),
  activeBuyer: z.boolean().default(true),
  blacklistStatus: z.boolean().default(false),

  // Location preferences
  cities: z.array(z.string()).default([]),
  counties: z.array(z.string()).default([]),
  states: z.array(z.string()).default([]),
  zips: z.array(z.string()).default([]),
  radiusMiles: z.number().optional().nullable(),

  // Strategies / property types
  strategiesHouses: z.array(z.string()).default([]),
  strategiesLand: z.array(z.string()).default([]),
  desiredTypesHouses: z.array(z.string()).default([]),
  desiredTypesLand: z.array(z.string()).default([]),

  // Ranges
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

  notes: z.string().optional().default(""),
});

export type BuyBoxFormValues = z.infer<typeof BuyBoxSchema>;

interface BuyerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyer: { id: number; name: string; email: string; phone?: string | null } | null;
  onUpdated?: () => void; // callback to refresh listing
}

export default function BuyerDetailsDialog({ open, onOpenChange, buyer, onUpdated }: BuyerDetailsDialogProps) {
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingBuyBox, setSavingBuyBox] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(false);
  const [propertyIdForMatch, setPropertyIdForMatch] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const form = useForm<BuyBoxFormValues>({
    resolver: zodResolver(BuyBoxSchema),
    defaultValues: {
      assetType: "Both",
      activeBuyer: true,
      blacklistStatus: false,
      cities: [],
      counties: [],
      states: [],
      zips: [],
      radiusMiles: undefined,
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
      notes: "",
    },
  });

  // Watch the asset type to conditionally show/hide fields
  const assetType = form.watch("assetType");

  // Load existing buy box when tab is clicked
  const [buyBoxLoaded, setBuyBoxLoaded] = useState(false);
  
  const loadBuyBox = async () => {
    if (!buyer?.id || buyBoxLoaded) return;
    
    try {
      const res = await landDealsApi.admin.getBuyerBuyBox(String(buyer.id));
        if (res?.success && res.data) {
          const data = res.data;
          // Only load data if the response contains actual saved criteria
          // Check if any meaningful data exists (not just default/empty values)
          const hasExistingData = Object.keys(data).some(key => {
            const value = data[key];
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'number') return value !== null && value !== undefined;
            if (typeof value === 'boolean') return true; // booleans are always meaningful
            return false;
          });

          if (hasExistingData) {
            // Map API fields to form fields safely
            const mapped: Partial<BuyBoxFormValues> = {
              assetType: (data.assetType || data.asset_type || "Both") as any,
              activeBuyer: Boolean(data.activeBuyer ?? data.active_buyer ?? true),
              blacklistStatus: Boolean(data.blacklistStatus ?? data.blacklist_status ?? false),
              cities: data.cities || [],
              counties: data.counties || [],
              states: data.states || [],
              zips: data.zips || [],
              radiusMiles: data.radiusMiles ?? data.radius_miles ?? undefined,
              strategiesHouses: data.strategiesHouses || data.strategies_houses || [],
              strategiesLand: data.strategiesLand || data.strategies_land || [],
              desiredTypesHouses: data.desiredTypesHouses || data.desired_types_houses || [],
              desiredTypesLand: data.desiredTypesLand || data.desired_types_land || [],
              priceMin: numberOrNull(data.priceMin ?? data.price_min),
              priceMax: numberOrNull(data.priceMax ?? data.price_max),
              lotSizeMin: numberOrNull(data.lotSizeMin ?? data.lot_size_min),
              lotSizeMax: numberOrNull(data.lotSizeMax ?? data.lot_size_max),
              bedsMin: numberOrNull(data.bedsMin ?? data.beds_min),
              bedsMax: numberOrNull(data.bedsMax ?? data.beds_max),
              bathsMin: numberOrNull(data.bathsMin ?? data.baths_min),
              bathsMax: numberOrNull(data.bathsMax ?? data.baths_max),
              livingAreaMin: numberOrNull(data.livingAreaMin ?? data.living_area_min),
              livingAreaMax: numberOrNull(data.livingAreaMax ?? data.living_area_max),
              yearBuiltMin: numberOrNull(data.yearBuiltMin ?? data.year_built_min),
              yearBuiltMax: numberOrNull(data.yearBuiltMax ?? data.year_built_max),
              restrictedRehabTypes: data.restrictedRehabTypes || data.restricted_rehab_types || [],
              specialtyRehabAvoidance: data.specialtyRehabAvoidance || data.specialty_rehab_avoidance || [],
              strictRequirements: data.strictRequirements || data.strict_requirements || [],
              locationCharacteristics: data.locationCharacteristics || data.location_characteristics || [],
              propertyCharacteristics: data.propertyCharacteristics || data.property_characteristics || [],
              notes: data.notes || "",
            };
            form.reset(mapped as BuyBoxFormValues);
          } else {
            // Reset to empty defaults for new buyer or buyer with no saved criteria
            form.reset({
              assetType: "Both",
              activeBuyer: true,
              blacklistStatus: false,
              cities: [],
              counties: [],
              states: [],
              zips: [],
              radiusMiles: undefined,
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
              notes: "",
            });
          }
        } else {
          // No buy box data found - reset to empty defaults
          resetFormToEmpty();
        }
      } catch (e) {
        // No buy box yet or error - reset to empty defaults
        resetFormToEmpty();
      } finally {
        setBuyBoxLoaded(true);
      }
    };

  const resetFormToEmpty = () => {
    form.reset({
      assetType: "Both",
      activeBuyer: true,
      blacklistStatus: false,
      cities: [],
      counties: [],
      states: [],
      zips: [],
      radiusMiles: undefined,
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
      notes: "",
    });
  };

  // Reset buy box loaded state when dialog opens
  useEffect(() => {
    if (open) {
      setBuyBoxLoaded(false);
      setMatchScore(null);
      setPropertyIdForMatch("");
    }
  }, [open, buyer?.id]);

  // Handle tab change to load buy box data when clicking the tab
  const handleTabChange = (value: string) => {
    if (value === "buybox" && !buyBoxLoaded) {
      loadBuyBox();
    }
  };

  const likelihood = useMemo(() => {
    if (matchScore == null) return null;
    if (matchScore >= 70) return { label: "High", color: "bg-green-100 text-green-800" };
    if (matchScore >= 40) return { label: "Medium", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Low", color: "bg-red-100 text-red-800" };
  }, [matchScore]);

  async function saveBuyerInfo() {
    if (!buyer) return;
    try {
      setSavingInfo(true);
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
      setSavingInfo(false);
    }
  }

  async function onSubmit(values: BuyBoxFormValues) {
    if (!buyer) return;
    try {
      setSavingBuyBox(true);
      // Normalize keys to snake_case to be backend friendly
      const payload: any = {
        asset_type: values.assetType.toLowerCase(),
        active_buyer: values.activeBuyer,
        blacklist_status: values.blacklistStatus,
        cities: values.cities,
        counties: values.counties,
        states: values.states,
        zips: values.zips,
        radius_miles: values.radiusMiles,
        strategies_houses: values.strategiesHouses,
        strategies_land: values.strategiesLand,
        desired_types_houses: values.desiredTypesHouses,
        desired_types_land: values.desiredTypesLand,
        price_min: values.priceMin,
        price_max: values.priceMax,
        lot_size_min: values.lotSizeMin,
        lot_size_max: values.lotSizeMax,
        beds_min: values.bedsMin,
        beds_max: values.bedsMax,
        baths_min: values.bathsMin,
        baths_max: values.bathsMax,
        living_area_min: values.livingAreaMin,
        living_area_max: values.livingAreaMax,
        year_built_min: values.yearBuiltMin,
        year_built_max: values.yearBuiltMax,
        restricted_rehab_types: values.restrictedRehabTypes,
        specialty_rehab_avoidance: values.specialtyRehabAvoidance,
        strict_requirements: values.strictRequirements,
        location_characteristics: values.locationCharacteristics,
        property_characteristics: values.propertyCharacteristics,
        notes: values.notes,
      };

      const res = await landDealsApi.admin.updateBuyerBuyBox(String(buyer.id), payload);
      if (res?.success) toast({ title: "Buy box saved" });
      onUpdated?.();
    } catch (e: any) {
      toast({ title: "Failed to save buy box", description: e?.message || "", variant: "destructive" });
    } finally {
      setSavingBuyBox(false);
    }
  }

  async function checkMatch() {
    try {
      setCheckingMatch(true);
      const propId = propertyIdForMatch.trim();
      if (!propId) return;
      const res = await landDealsApi.admin.matchBuyersForProperty(propId);
      if (res?.success) {
        const list: any[] = (res.data as any) || [];
        const match = list.find((b: any) => String(b.id) === String(buyer?.id));
        if (match) {
          setMatchScore(Number((match as any).score ?? (match as any).match_score ?? 0));
        } else {
          setMatchScore(null);
          toast({ title: "No match found for this buyer on that property" });
        }
      }
    } catch (e: any) {
      toast({ title: "Failed to check match", description: e?.message || "", variant: "destructive" });
    } finally {
      setCheckingMatch(false);
    }
  }

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
                    <Button onClick={saveBuyerInfo} disabled={savingInfo}>{savingInfo ? "Saving..." : "Save"}</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Buy Box - Fixed scrolling issue */}
              <TabsContent value="buybox" className="flex-1 min-h-0 flex flex-col">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-6 p-1 pb-6">
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
                                  {assetTypeOptions.map((opt) => (
                                    <Badge
                                      key={opt}
                                      onClick={() => field.onChange(opt)}
                                      className={`${field.value === opt ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"} cursor-pointer`}
                                    >
                                      {opt}
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
                                  {yesNoOptions.map((o) => (
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
                                  {yesNoOptions.map((o) => (
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

                        {/* Location preferences */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {csvField(form, "cities", "Cities (CSV)", "e.g., Phoenix, Tempe")}
                          {csvField(form, "counties", "Counties (CSV)", "e.g., Maricopa, Pima")}
                          {csvField(form, "states", "States (CSV)", "e.g., AZ, CA, TX")}
                          {csvField(form, "zips", "ZIP codes (CSV)", "e.g., 85281, 85282")}
                          <FormField
                            control={form.control}
                            name="radiusMiles"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Radius (miles)</FormLabel>
                                <FormControl>
                                  <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(numOrNull(e.target.value))} placeholder="Optional" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </section>

                        {/* Strategies and desired types */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(assetType === "Houses" || assetType === "Both") && (
                            <CheckboxGroup
                              form={form}
                              name="strategiesHouses"
                              label="Investment Strategy (Houses)"
                              options={investmentStrategiesHouses}
                            />
                          )}
                          {(assetType === "Land" || assetType === "Both") && (
                            <CheckboxGroup
                              form={form}
                              name="strategiesLand"
                              label="Investment Strategy (Land)"
                              options={investmentStrategiesLand}
                            />
                          )}
                          {(assetType === "Houses" || assetType === "Both") && (
                            <CheckboxGroup
                              form={form}
                              name="desiredTypesHouses"
                              label="Desired Property Type (Houses)"
                              options={desiredPropertyTypeHouses}
                            />
                          )}
                          {(assetType === "Land" || assetType === "Both") && (
                            <CheckboxGroup
                              form={form}
                              name="desiredTypesLand"
                              label="Desired Property Type (Land)"
                              options={desiredPropertyTypeLand}
                            />
                          )}
                        </section>

                        {/* Ranges */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <RangeFields form={form} minName="priceMin" maxName="priceMax" label="Purchase Price ($)" />
                          {(assetType === "Land" || assetType === "Both") && (
                            <RangeFields form={form} minName="lotSizeMin" maxName="lotSizeMax" label="Lot Size (acres) – Land only" />
                          )}
                          {(assetType === "Houses" || assetType === "Both") && (
                            <RangeFields form={form} minName="livingAreaMin" maxName="livingAreaMax" label="Living Area (SqFt) – Houses" />
                          )}
                          {(assetType === "Houses" || assetType === "Both") && (
                            <RangeFields form={form} minName="yearBuiltMin" maxName="yearBuiltMax" label="Year Built – Houses" />
                          )}
                          {(assetType === "Houses" || assetType === "Both") && (
                            <RangeFields form={form} minName="bedsMin" maxName="bedsMax" label="Bedrooms – Houses" integer />
                          )}
                          {(assetType === "Houses" || assetType === "Both") && (
                            <RangeFields form={form} minName="bathsMin" maxName="bathsMax" label="Bathrooms – Houses" />
                          )}
                        </section>

                        {/* Rehab & requirements */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(assetType === "Houses" || assetType === "Both") && (
                            <CheckboxGroup form={form} name="restrictedRehabTypes" label="Restricted Rehab Types" options={restrictedRehabTypes} />
                          )}
                          {(assetType === "Houses" || assetType === "Both") && (
                            <CheckboxGroup form={form} name="specialtyRehabAvoidance" label="Specialty Rehab Avoidance" options={specialtyRehabAvoidance} />
                          )}
                          <CheckboxGroup form={form} name="strictRequirements" label="Strict Requirements" options={strictRequirementOptions} />
                          <CheckboxGroup form={form} name="locationCharacteristics" label="Location Characteristics" options={locationCharacteristicsOptions} />
                          <CheckboxGroup form={form} name="propertyCharacteristics" label="Property Characteristics" options={propertyCharacteristicsOptions} />
                        </section>

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
                    
                    {/* Submit button - now always visible at bottom */}
                    <div className="flex justify-end pt-4 mt-4 border-t bg-background flex-shrink-0">
                      <Button type="submit" disabled={savingBuyBox}>
                        {savingBuyBox ? "Saving..." : "Save Buy Box"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Match */}
              <TabsContent value="match" className="flex-1 overflow-y-auto">
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="match-property-id">Property ID</Label>
                      <Input id="match-property-id" placeholder="Enter a property ID to check match" value={propertyIdForMatch} onChange={(e) => setPropertyIdForMatch(e.target.value)} />
                    </div>
                    <div className="flex md:justify-end">
                      <Button onClick={checkMatch} disabled={!propertyIdForMatch || checkingMatch}>{checkingMatch ? "Checking..." : "Check Match"}</Button>
                    </div>
                  </div>

                  {matchScore != null && (
                    <div className="flex items-center gap-3">
                      <Badge className="bg-secondary text-foreground">Score: {matchScore}</Badge>
                      {likelihood && <Badge className={likelihood.color}>Likelihood: {likelihood.label}</Badge>}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">Match results are private to admins.</p>
                </div>
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

// Helpers
function csvField(form: any, name: keyof BuyBoxFormValues, label: string, placeholder?: string) {
  return (
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
}

function RangeFields({ form, minName, maxName, label, integer = false }: { form: any; minName: keyof BuyBoxFormValues; maxName: keyof BuyBoxFormValues; label: string; integer?: boolean; }) {
  return (
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
}

function CheckboxGroup({ form, name, label, options }: { form: any; name: keyof BuyBoxFormValues; label: string; options: readonly string[]; }) {
  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => {
              // Ensure field.value is always treated as an array
              const currentValue = Array.isArray(field.value) ? field.value : [];
              const checked = currentValue.includes(opt);
              
              return (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      // Ensure we're always working with an array
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
}

function csvToArray(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function numOrNull(v: string, integer = false): number | null {
  if (v === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return integer ? Math.trunc(n) : n;
}

function numberOrNull(v: any): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}
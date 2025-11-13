import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Navigation, Clock, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GeographicPreferencesProps {
  buyerId: string;
  currentCity: string;
  currentTravelDistance?: number;
  onUpdate?: () => void;
}

interface CityWithinRadius {
  city_name: string;
  distance_km: number;
  travel_time_minutes: number;
  highway_route: string | null;
}

export function GeographicPreferences({
  buyerId,
  currentCity,
  currentTravelDistance = 25,
  onUpdate,
}: GeographicPreferencesProps) {
  const [travelDistance, setTravelDistance] = useState(currentTravelDistance);
  const [avoidTollRoutes, setAvoidTollRoutes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch cities within current radius
  const { data: citiesInRadius, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities-in-radius", currentCity, travelDistance],
    queryFn: async () => {
      console.log(`[GeographicPreferences] Fetching cities within ${travelDistance}km of ${currentCity}`);
      
      const { data, error } = await supabase.rpc("get_cities_within_radius", {
        p_city_name: currentCity.toLowerCase(),
        p_radius_km: travelDistance,
      });

      if (error) {
        console.error("[GeographicPreferences] Error fetching cities:", error);
        throw error;
      }

      console.log(`[GeographicPreferences] Found ${data?.length || 0} cities within radius`);
      return (data || []) as CityWithinRadius[];
    },
    enabled: !!currentCity,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch buyer's current preferences
  const { data: buyerPrefs } = useQuery({
    queryKey: ["buyer-preferences", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyers")
        .select("willing_to_travel_km, avoid_toll_routes, max_travel_time_minutes")
        .eq("id", buyerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!buyerId,
  });

  // Initialize state from fetched preferences
  useEffect(() => {
    if (buyerPrefs) {
      setTravelDistance(buyerPrefs.willing_to_travel_km || 25);
      setAvoidTollRoutes(buyerPrefs.avoid_toll_routes || false);
    }
  }, [buyerPrefs]);

  // Track changes
  useEffect(() => {
    const hasChanged =
      travelDistance !== (buyerPrefs?.willing_to_travel_km || 25) ||
      avoidTollRoutes !== (buyerPrefs?.avoid_toll_routes || false);
    setHasChanges(hasChanged);
  }, [travelDistance, avoidTollRoutes, buyerPrefs]);

  const handleSave = async () => {
    setIsSaving(true);
    console.log(`[GeographicPreferences] Saving preferences: ${travelDistance}km`);

    try {
      const { error } = await supabase
        .from("buyers")
        .update({
          willing_to_travel_km: travelDistance,
          avoid_toll_routes: avoidTollRoutes,
          service_radius_updated_at: new Date().toISOString(),
        })
        .eq("id", buyerId);

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: `Your service radius has been updated to ${travelDistance}km`,
      });

      setHasChanges(false);
      onUpdate?.();
    } catch (error: any) {
      console.error("[GeographicPreferences] Save error:", error);
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTravelDistance(buyerPrefs?.willing_to_travel_km || 25);
    setAvoidTollRoutes(buyerPrefs?.avoid_toll_routes || false);
    setHasChanges(false);
  };

  const getDistanceLabel = (km: number) => {
    if (km === 0) return "Local only";
    if (km <= 15) return "Very small radius";
    if (km <= 30) return "Small radius";
    if (km <= 50) return "Medium radius";
    if (km <= 80) return "Large radius";
    return "Very large radius";
  };

  const getRecommendation = () => {
    const currentCount = citiesInRadius?.length || 0;
    
    if (currentCount === 0) {
      return {
        message: `Increase your radius to receive leads from nearby cities.`,
        action: `Try ${travelDistance + 10}km`,
        type: "warning" as const,
      };
    }
    
    if (currentCount < 3 && travelDistance < 50) {
      return {
        message: `Expand to ${travelDistance + 10}km to include more cities with high lead volume.`,
        action: `+${10}km for ${Math.floor(currentCount * 1.5)} more cities (estimated)`,
        type: "info" as const,
      };
    }
    
    return null;
  };

  const recommendation = getRecommendation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geographic Preferences
        </CardTitle>
        <CardDescription>
          Control how far you're willing to travel for leads. You'll receive leads from your home city plus any cities within your service radius.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Home Base City */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Your Home Base
          </Label>
          <div className="p-3 bg-muted rounded-md">
            <p className="font-medium capitalize">{currentCity}</p>
            <p className="text-sm text-muted-foreground">
              All distances are calculated from this city
            </p>
          </div>
        </div>

        {/* Service Radius Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="travel-distance" className="flex items-center gap-2">
              Service Radius
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      You'll receive leads from your home city and any cities within this distance.
                      Leads are priced the same regardless of distance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{travelDistance}km</span>
              <span className="text-sm text-muted-foreground">
                ({getDistanceLabel(travelDistance)})
              </span>
            </div>
          </div>

          <Slider
            id="travel-distance"
            value={[travelDistance]}
            onValueChange={(value) => setTravelDistance(value[0])}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0km (Local only)</span>
            <span>25km (Default)</span>
            <span>50km (Wide area)</span>
            <span>100km (Province-wide)</span>
          </div>
        </div>

        {/* Cities Within Radius */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Cities Within Your Service Radius</Label>
            {citiesLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
            {citiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !citiesInRadius || citiesInRadius.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No nearby cities found</p>
                <p className="text-sm">
                  Increase your service radius to include more cities
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Home city always first */}
                <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="font-medium capitalize">{currentCity}</span>
                  </div>
                  <Badge variant="default">Home Base</Badge>
                </div>

                {/* Nearby cities */}
                {citiesInRadius.map((city) => (
                  <div
                    key={city.city_name}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">{city.city_name}</span>
                      {city.highway_route && (
                        <span className="text-xs text-muted-foreground">
                          via {city.highway_route}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {city.distance_km.toFixed(0)}km
                      </div>
                      {city.travel_time_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {city.travel_time_minutes}min
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {citiesInRadius && citiesInRadius.length > 0 && (
            <p className="text-sm text-muted-foreground">
              You'll receive leads from <strong>{citiesInRadius.length + 1} cities</strong>{" "}
              (including {currentCity})
            </p>
          )}
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div
            className={`p-4 rounded-md border ${
              recommendation.type === "warning"
                ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <Info
                className={`h-5 w-5 mt-0.5 ${
                  recommendation.type === "warning" ? "text-yellow-600" : "text-blue-600"
                }`}
              />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{recommendation.message}</p>
                <p className="text-xs text-muted-foreground">{recommendation.action}</p>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Advanced Options</Label>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="avoid-tolls" className="text-sm font-normal">
                Avoid toll routes (407, etc.)
              </Label>
              <p className="text-xs text-muted-foreground">
                Prefer non-toll highways when routing
              </p>
            </div>
            <Switch
              id="avoid-tolls"
              checked={avoidTollRoutes}
              onCheckedChange={setAvoidTollRoutes}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Info Note */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Note:</strong> Lead pricing is the same regardless of distance. You decide
            what travel distance is worth it to your business.
          </p>
          <p>
            Expanding your service radius increases the number of leads you'll receive.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


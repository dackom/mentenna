"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface OpenRouterCreditsData {
  data?: {
    label?: string;
    total_credits?: number;
    total_usage?: number;
    usage?: number;
    limit?: number;
    is_free_tier?: boolean;
    rate_limit?: {
      requests?: number;
      interval?: string;
    };
  };
}

export default function OpenRouterPage() {
  const [keyData, setKeyData] = useState<OpenRouterCreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // Fetch credits/key info
      const creditsResponse = await fetch("/api/open-router/credits");
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setKeyData(creditsData);
      } else {
        console.error("Failed to fetch credits data");
        toast.error("Failed to load OpenRouter data");
      }
    } catch (error) {
      console.error("Error fetching OpenRouter data:", error);
      toast.error("Failed to load OpenRouter data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "N/A";
    return `$${amount.toFixed(4)}`;
  };

  const totalCredits = keyData?.data?.total_credits ?? keyData?.data?.limit;
  const totalUsage = keyData?.data?.total_usage ?? keyData?.data?.usage;
  const remainingCredits =
    totalCredits && totalUsage ? totalCredits - totalUsage : null;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">OpenRouter Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your OpenRouter API usage and credits
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Credits Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Usage
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalUsage)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Credits
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalCredits ? formatCurrency(totalCredits) : "Unlimited"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Remaining Credits
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {remainingCredits !== null
                    ? formatCurrency(remainingCredits)
                    : "Unlimited"}
                </div>
                {keyData?.data?.is_free_tier && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Free Tier
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rate Limit Info */}
          {keyData?.data?.rate_limit && (
            <Card>
              <CardHeader>
                <CardTitle>Rate Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {keyData.data.rate_limit.requests} requests per{" "}
                  {keyData.data.rate_limit.interval}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

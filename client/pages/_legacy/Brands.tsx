// LEGACY PAGE (archived)
// This file is not routed or imported anywhere.
// Canonical implementation lives under client/app/(postd)/...
// Safe to delete after one or two stable releases.

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Settings,
  BarChart3,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { supabase, type Brand } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";

export default function Brands() {
  const { brands, refreshBrands, setCurrentBrand: _setCurrentBrand, loading } = useBrand();
  const { user } = useAuth();
  const { toast } = useToast();
  const _navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    website_url: "",
    industry: "",
    description: "",
    primary_color: "#8B5CF6",
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      // Brands are loaded from context via useBrand hook
      // This component just displays them
      refreshBrands();
    } catch (error) {
      console.error("Failed to load brands:", error);
    }
  };

  const handleCreate = async () => {
    if (!user) return;

    try {
      // Use API endpoint which handles unique slug generation
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          website_url: formData.website_url,
          industry: formData.industry,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create brand" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const { brand: brandData } = await response.json();

      toast({
        title: "Brand created",
        description: `${formData.name} has been created successfully.`,
      });

      setOpen(false);
      setFormData({
        name: "",
        slug: "",
        website_url: "",
        industry: "",
        description: "",
        primary_color: "#8B5CF6",
      });
      refreshBrands();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error creating brand",
        description: message,
        variant: "destructive",
      });
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600">
            Manage your client brands and their social media presence
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>

      {/* Create Brand Dialog */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Brand</DialogTitle>
              <DialogDescription>
                Add a new brand to manage with Aligned AI.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="TechFlow Solutions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="techflow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website_url}
                  onChange={(e) =>
                    setFormData({ ...formData, website_url: e.target.value })
                  }
                  placeholder="https://techflow.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Technology"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full">
              Create Brand
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  const nav = useNavigate();
  const { setCurrentBrand } = useBrand();

  const handleClick = () => {
    setCurrentBrand(brand);
    nav(`/brands/${brand.id}`);
  };

  const getLogoEmoji = () => {
    if (brand.logo_url) {
      return "📷";
    }
    const industries: Record<string, string> = {
      technology: "💻",
      healthcare: "⚕️",
      finance: "💰",
      retail: "🛍️",
      food: "🍔",
      education: "🎓",
      entertainment: "🎭",
      sports: "⚽",
      travel: "✈️",
    };
    return industries[brand.industry?.toLowerCase() || ""] || "🏢";
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getLogoEmoji()}</div>
            <div>
              <CardTitle className="text-lg">{brand.name}</CardTitle>
              {brand.industry && (
                <p className="text-sm text-gray-600">{brand.industry}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {brand.website_url && (
          <div className="text-sm">
            <p className="text-gray-600 mb-1">Website</p>
            <a
              href={brand.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {brand.website_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {brand.description && (
          <div className="text-sm">
            <p className="text-gray-600 mb-1">Description</p>
            <p className="text-gray-800 line-clamp-2">{brand.description}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1">
            <BarChart3 className="h-3 w-3" />
            Analytics
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1">
            <Calendar className="h-3 w-3" />
            Calendar
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Created: {new Date(brand.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

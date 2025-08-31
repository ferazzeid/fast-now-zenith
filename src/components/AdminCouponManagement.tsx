import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

interface CouponCode {
  id: string;
  code: string;
  description: string | null;
  duration_days: number;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CouponFormData {
  code: string;
  description: string;
  duration_days: number;
  usage_limit: string;
  expires_at: string;
  is_active: boolean;
}

export function AdminCouponManagement() {
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    description: "",
    duration_days: 30,
    usage_limit: "",
    expires_at: "",
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupon_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to fetch coupon codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      duration_days: 30,
      usage_limit: "",
      expires_at: "",
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const handleCreateCoupon = async () => {
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        duration_days: formData.duration_days,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      };

      const { error } = await supabase
        .from("coupon_codes")
        .insert([couponData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Coupon code created successfully",
      });

      setIsCreateOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to create coupon code",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        duration_days: formData.duration_days,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      };

      const { error } = await supabase
        .from("coupon_codes")
        .update(couponData)
        .eq("id", editingCoupon.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Coupon code updated successfully",
      });

      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to update coupon code",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const { error } = await supabase
        .from("coupon_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Coupon code deleted successfully",
      });

      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Error",
        description: "Failed to delete coupon code",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (coupon: CouponCode) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      duration_days: coupon.duration_days,
      usage_limit: coupon.usage_limit?.toString() || "",
      expires_at: coupon.expires_at ? format(new Date(coupon.expires_at), "yyyy-MM-dd") : "",
      is_active: coupon.is_active,
    });
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading coupon codes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Coupon Code Management
            </CardTitle>
            <CardDescription>
              Create and manage discount coupon codes for premium access
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coupon Code</DialogTitle>
                <DialogDescription>
                  Create a new coupon code for premium access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO2024"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Black Friday 2024 Promotion"
                  />
                </div>
                <div>
                  <Label htmlFor="duration_days">Duration (Days)</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="usage_limit">Usage Limit (Optional)</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCoupon}>
                  Create Coupon
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No coupon codes found
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-semibold">
                    {coupon.code}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {coupon.description || "-"}
                  </TableCell>
                  <TableCell>{coupon.duration_days} days</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {coupon.used_count}
                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                      </span>
                      {coupon.usage_limit && (
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${getUsagePercentage(coupon.used_count, coupon.usage_limit)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {isExpired(coupon.expires_at) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(coupon.expires_at), "MMM d, yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Coupon Code</DialogTitle>
                            <DialogDescription>
                              Update the coupon code settings
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit_code">Coupon Code</Label>
                              <Input
                                id="edit_code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="PROMO2024"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_description">Description</Label>
                              <Textarea
                                id="edit_description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Black Friday 2024 Promotion"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_duration_days">Duration (Days)</Label>
                              <Input
                                id="edit_duration_days"
                                type="number"
                                value={formData.duration_days}
                                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_usage_limit">Usage Limit (Optional)</Label>
                              <Input
                                id="edit_usage_limit"
                                type="number"
                                value={formData.usage_limit}
                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                placeholder="Leave empty for unlimited"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_expires_at">Expiration Date (Optional)</Label>
                              <Input
                                id="edit_expires_at"
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="edit_is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                              />
                              <Label htmlFor="edit_is_active">Active</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingCoupon(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateCoupon}>
                              Update Coupon
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
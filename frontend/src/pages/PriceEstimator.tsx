import { useState, useEffect } from "react";
import { Calculator, TrendingUp, Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

interface Turul {
  tid: number;
  tname: string;
  temoji?: string;
}

interface Tuluv {
  tid: number;
  tname: string;
}

interface City {
  hid: number;
  hname: string;
}

interface District {
  did: number;
  dname: string;
  hid: number;
}

const PriceEstimator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  // Dropdown data
  const [turul, setTurul] = useState<Turul[]>([]);
  const [tuluv, setTuluv] = useState<Tuluv[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    rooms: "",
    m2: "",
    type_id: "",
    status_id: "",
    district_id: "",
  });

  // Load dropdown data
  useEffect(() => {
    fetch(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getturul" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.resultCode === 6003) {
          setTurul(data.data.turul || []);
          setTuluv(data.data.tuluv || []);
          setCities(data.data.hot || []);
          setDistricts(data.data.duureg || []);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEstimate = async () => {
    if (!formData.m2 || parseFloat(formData.m2) <= 0) {
      toast({
        title: "Алдаа",
        description: "Талбай (м²) 0-ээс их байх ёстой",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type_id || !formData.status_id) {
      toast({
        title: "Алдаа",
        description: "Төрөл болон төлөвийг сонгоно уу",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "estimate_price",
        rooms: parseInt(formData.rooms) || 0,
        m2: parseFloat(formData.m2),
        district_id: parseInt(formData.district_id) || 0,
        type_id: parseInt(formData.type_id),
        status_id: parseInt(formData.status_id),
      });

      if (response.resultCode === 9002 && response.data?.[0]) {
        const data = response.data[0];
        setEstimatedPrice(data.estimated_price);
        setPriceRange({
          min: data.min_price,
          max: data.max_price,
        });
        toast({
          title: "Амжилттай!",
          description: "Үнэ тооцоолол хийгдлээ",
        });
      } else {
        toast({
          title: "Алдаа",
          description: response.resultMessage || "Үнэ тооцоолоход алдаа гарлаа",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Алдаа",
        description: err.message || "Сервертэй холбогдоход алдаа гарлаа",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Calculator className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Үнэ тооцоолуур</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Машин сургалтын алгоритм ашиглан үл хөдлөх хөрөнгийн үнийг тооцоолох
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Үл хөдлөх хөрөнгийн мэдээлэл</CardTitle>
                  <CardDescription>
                    Дэлгэрэнгүй мэдээлэл оруулж үнийг тооцоолно уу
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="type">Үл хөдлөхийн төрөл *</Label>
                      <Select
                        value={formData.type_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Төрөл сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          {turul.map((t) => (
                            <SelectItem key={t.tid} value={t.tid.toString()}>
                              {t.temoji} {t.tname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Төлөв *</Label>
                      <Select
                        value={formData.status_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Төлөв сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          {tuluv.map((t) => (
                            <SelectItem key={t.tid} value={t.tid.toString()}>
                              {t.tname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="m2">Талбай (м²) *</Label>
                      <Input
                        id="m2"
                        type="number"
                        placeholder="50"
                        value={formData.m2}
                        onChange={(e) =>
                          setFormData({ ...formData, m2: e.target.value })
                        }
                        min="1"
                        step="0.1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rooms">Өрөөний тоо</Label>
                      <Input
                        id="rooms"
                        type="number"
                        placeholder="3"
                        value={formData.rooms}
                        onChange={(e) =>
                          setFormData({ ...formData, rooms: e.target.value })
                        }
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">Хот/Аймаг</Label>
                      <Select
                        value={
                          formData.district_id
                            ? districts.find(
                                (d) => d.did.toString() === formData.district_id
                              )?.hid.toString() || ""
                            : ""
                        }
                        onValueChange={(value) => {
                          setFormData({ ...formData, district_id: "" });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Хот сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c.hid} value={c.hid.toString()}>
                              {c.hname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">Дүүрэг/Сум</Label>
                      <Select
                        value={formData.district_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, district_id: value })
                        }
                        disabled={!formData.district_id && !cities.length}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Дүүрэг сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts
                            .filter((d) => {
                              const selectedCity = cities.find(
                                (c) =>
                                  c.hid.toString() ===
                                  (formData.district_id
                                    ? districts
                                        .find(
                                          (dd) =>
                                            dd.did.toString() === formData.district_id
                                        )
                                        ?.hid.toString() || ""
                                    : "")
                              );
                              return selectedCity
                                ? d.hid === selectedCity.hid
                                : true;
                            })
                            .map((d) => (
                              <SelectItem key={d.did} value={d.did.toString()}>
                                {d.dname}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleEstimate}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? "Тооцоолж байна..." : "Үнэ тооцоолох"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Result Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Тооцооллын үр дүн
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {estimatedPrice ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Тооцоолсон үнэ
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {estimatedPrice.toLocaleString()}₮
                        </p>
                      </div>

                      {priceRange && (
                        <div className="space-y-2 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Үнийн хүрээ (±20%)
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Хамгийн бага:</span>
                              <span className="font-semibold">
                                {priceRange.min.toLocaleString()}₮
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Хамгийн их:</span>
                              <span className="font-semibold">
                                {priceRange.max.toLocaleString()}₮
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground">
                          * Энэ үнэ нь тооцоолол бөгөөд бодит үнэтэй ялгаатай байж
                          болно. Зөвхөн лавлагааны зориулалттай.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Мэдээлэл оруулж үнэ тооцоолно уу
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PriceEstimator;


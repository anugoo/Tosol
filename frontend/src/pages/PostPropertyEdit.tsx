import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Turul { tid: number; tname: string; temoji?: string; }
interface Tuluv { tid: number; tname: string; }
interface City { hid: number; hname: string; }
interface District { did: number; dname: string; hid: number; }
interface Hiits { h_id: number; h_name: string; }

interface ImageObj {
  zurag_id?: number;
  image_path: string;
}

const EditProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [images, setImages] = useState<string[]>([]);
  const [removeImageIds, setRemoveImageIds] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<ImageObj[]>([]);

  const [turul, setTurul] = useState<Turul[]>([]);
  const [tuluv, setTuluv] = useState<Tuluv[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [hiitsList, setHiitsList] = useState<Hiits[]>([]);

  const [selectedTurul, setSelectedTurul] = useState<string>("");
  const [selectedTuluv, setSelectedTuluv] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedHiits, setSelectedHiits] = useState<string>("");

  const [formData, setFormData] = useState({
    z_title: "",
    z_price: "",
    z_address: "",
    z_rooms: "",
    z_bathroom: "",
    z_balcony: "",
    z_m2: "",
    z_floor: "",
    z_description: "",
  });

  // Popconfirm state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Турш, төлөв, хот, дүүрэг, хийц ачааллах
  useEffect(() => {
    fetch("http://localhost:8000/user/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getturul" }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.resultCode === 6003 && data.data) {
          setTurul(data.data.turul || []);
          setTuluv(data.data.tuluv || []);
          setCities(data.data.hot || []);
          setDistricts(data.data.duureg || []);
          setHiitsList(data.data.hiits || []);
        }
      })
      .catch(console.error);
  }, []);

  // Зарын мэдээлэл ачаалах
  useEffect(() => {
    if (!id) return;

    fetch("http://localhost:8000/user/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getzarbyid", zid: id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.resultCode === 7005 && data.data?.length > 0) {
          const zar = data.data[0];

          const typeId = (zar.type_id || zar.z_type || "").toString();
          const statusId = (zar.status_id || zar.z_status || "").toString();
          const hotId = (zar.hot_id || zar.z_hot || "").toString();
          const districtId = (zar.district_id || zar.z_duureg || "").toString();
          const hiitsId = (zar.hiits_id || zar.z_hiits || "").toString();

          setSelectedTurul(typeId);
          setSelectedTuluv(statusId);
          setSelectedCity(hotId);
          setSelectedDistrict(districtId);
          setSelectedHiits(hiitsId);

          setFormData({
            z_title: zar.z_title || "",
            z_price: zar.z_price || "",
            z_address: zar.z_address || "",
            z_rooms: zar.z_rooms || "",
            z_bathroom: zar.z_bathroom || "",
            z_balcony: zar.z_balcony || "",
            z_m2: zar.z_m2 || "",
            z_floor: zar.z_floor || "",
            z_description: zar.z_description || "",
          });

          const imgs: ImageObj[] = (zar.images || [])
            .map((img: any) => ({
              zurag_id: img.zurag_id,
              image_path: img.image_path
            }))
            .filter(img => img.image_path);

          setOriginalImages(imgs);
          setImages(imgs.map(img => img.image_path));
        }
      })
      .catch(err => console.error("Зар ачаалахад алдаа:", err));
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const removedUrl = images[index];
    const originalImg = originalImages.find(img => img.image_path === removedUrl);
    if (originalImg?.zurag_id) {
      setRemoveImageIds(prev => [...prev, originalImg.zurag_id.toString()]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const safe = (val: string): string | null => (val === "" ? null : val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      action: "update_zar",
      zid: id,
      z_title: formData.z_title,
      z_type: safe(selectedTurul),
      z_status: safe(selectedTuluv),
      z_price: formData.z_price,
      z_hot: safe(selectedCity),
      z_duureg: safe(selectedDistrict),
      z_address: formData.z_address || null,
      z_rooms: safe(formData.z_rooms),
      z_bathroom: safe(formData.z_bathroom),
      z_balcony: safe(formData.z_balcony),
      z_m2: safe(formData.z_m2),
      z_floor: safe(formData.z_floor),
      z_hiits: safe(selectedHiits),
      z_description: formData.z_description,
      images: images.filter(img => img.startsWith("data:image")),
      remove_images: removeImageIds,
    };

    try {
      const res = await fetch("http://localhost:8000/user/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      const isSuccess =
        result.resultCode === 7011 ||
        result.resultCode === 7009 ||
        (Array.isArray(result) && result.some(x => x.error === "7011" || x.resultCode === 7011)) ||
        result.error === "7011";

      if (isSuccess) {
        toast({
          title: "Зар амжилттай засагдлаа!",
        });
        navigate("/");
      } else {
        toast({
          title: "Алдаа гарлаа",
          description: JSON.stringify(result),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Сервертэй холбогдоход алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  // ЗАР УСТГАХ ФУНКЦ (Popconfirm-д ашиглана)
  const handleDelete = async () => {
    if (!id) return;

    try {
      const res = await fetch("http://localhost:8000/user/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_zar",
          zar_id: id,
        }),
      });

      const result = await res.json();

      if (result.resultCode === 7011) {
        toast({
          title: "Зар амжилттай устгалаа!",
        });
        setDeleteDialogOpen(false);
        navigate("/");
      } else {
        toast({
          title: "Устгахад алдаа гарлаа",
          description: result.message || result.error || JSON.stringify(result),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Устгахад алдаа:", err);
      toast({
        title: "Сервертэй холбогдоход алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Зар засах</h1>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Үндсэн мэдээлэл */}
            <Card>
              <CardHeader><CardTitle>Үндсэн мэдээлэл</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Гарчиг *</Label>
                    <Input
                      placeholder="Яаралтай зарна..."
                      value={formData.z_title}
                      onChange={e => setFormData(prev => ({ ...prev, z_title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Үнэ (₮) *</Label>
                    <Input
                      type="number"
                      placeholder="250000000"
                      value={formData.z_price}
                      onChange={e => setFormData(prev => ({ ...prev, z_price: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Төрөл *</Label>
                    <Select value={selectedTurul} onValueChange={setSelectedTurul} required>
                      <SelectTrigger><SelectValue placeholder="Төрөл сонгох" /></SelectTrigger>
                      <SelectContent>
                        {turul.map(t => (
                          <SelectItem key={t.tid} value={t.tid.toString()}>
                            {t.temoji} {t.tname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Төлөв *</Label>
                    <Select value={selectedTuluv} onValueChange={setSelectedTuluv} required>
                      <SelectTrigger><SelectValue placeholder="Төлөв сонгох" /></SelectTrigger>
                      <SelectContent>
                        {tuluv.map(t => (
                          <SelectItem key={t.tid} value={t.tid.toString()}>{t.tname}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Хийц</Label>
                    <Select value={selectedHiits} onValueChange={setSelectedHiits}>
                      <SelectTrigger><SelectValue placeholder="Сонгоогүй" /></SelectTrigger>
                      <SelectContent>
                        {hiitsList.map(h => (
                          <SelectItem key={h.h_id} value={h.h_id.toString()}>{h.h_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Өрөө</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={formData.z_rooms}
                      onChange={e => setFormData(prev => ({ ...prev, z_rooms: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Input placeholder="Ариун цэвэр" type="number" value={formData.z_bathroom}
                    onChange={e => setFormData(prev => ({ ...prev, z_bathroom: e.target.value }))} />
                  <Input placeholder="Тагт" type="number" value={formData.z_balcony}
                    onChange={e => setFormData(prev => ({ ...prev, z_balcony: e.target.value }))} />
                  <Input placeholder="м²" type="number" value={formData.z_m2}
                    onChange={e => setFormData(prev => ({ ...prev, z_m2: e.target.value }))} />
                  <Input placeholder="Давхар" type="number" value={formData.z_floor}
                    onChange={e => setFormData(prev => ({ ...prev, z_floor: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Тайлбар</Label>
                  <textarea
                    className="w-full min-h-32 p-3 border rounded-lg resize-none"
                    placeholder="Нэмэлт мэдээлэл оруулна уу..."
                    value={formData.z_description}
                    onChange={e => setFormData(prev => ({ ...prev, z_description: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Байршил */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Байршил
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Хот/Аймаг *</Label>
                    <Select value={selectedCity} onValueChange={(val) => {
                      setSelectedCity(val);
                      setSelectedDistrict("");
                    }} required>
                      <SelectTrigger><SelectValue placeholder="Хот сонгох" /></SelectTrigger>
                      <SelectContent>
                        {cities.map(c => (
                          <SelectItem key={c.hid} value={c.hid.toString()}>{c.hname}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Дүүрэг/Сум *</Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict} required>
                      <SelectTrigger><SelectValue placeholder="Эхлээд хот сонгоно уу" /></SelectTrigger>
                      <SelectContent>
                        {districts
                          .filter(d => selectedCity === "" || d.hid.toString() === selectedCity)
                          .map(d => (
                            <SelectItem key={d.did} value={d.did.toString()}>{d.dname}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Нэмэлт хаяг</Label>
                    <Input
                      placeholder="11-р хороо, Энхтайвны өргөн чөлөө..."
                      value={formData.z_address}
                      onChange={e => setFormData(prev => ({ ...prev, z_address: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Зургууд */}
            <Card>
              <CardHeader><CardTitle>Зургууд</CardTitle></CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-xl p-10 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="upload-edit"
                  />
                  <label htmlFor="upload-edit" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg mb-2">Зураг чирж оруулах эсвэл дарж сонгох</p>
                    <Button type="button" variant="outline">Зураг сонгох</Button>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt={`Зураг ${i + 1}`} className="w-full h-40 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Товчнууд: Засах + Устгах (Popconfirm) */}
            <div className="flex justify-end gap-4 pt-8">
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="lg" className="text-lg px-8">
                    Зар устгах
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Та итгэлтэй байна уу?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Энэ зарыг <strong>бүрмөсөн устгана</strong>. Энэ үйлдлийг буцаах боломжгүй.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Болих</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Тийм, устгах
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit" size="lg" className="text-lg px-12">
                Зар засах
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditProperty;
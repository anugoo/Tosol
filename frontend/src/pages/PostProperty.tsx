import { useState, useEffect } from "react";
import { Upload, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface Turul { tid: number; tname: string; temoji?: string; }
interface Tuluv { tid: number; tname: string; }
interface City { hid: number; hname: string; }
interface District { did: number; dname: string; hid: number; }
interface Hiits { h_id: number; h_name: string; }

const PostProperty = () => {
  const { toast } = useToast();

  // Dropdown data
  const [turul, setTurul] = useState<Turul[]>([]);
  const [tuluv, setTuluv] = useState<Tuluv[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [hiitsList, setHiitsList] = useState<Hiits[]>([]);

  // Selected values
  const [selectedTurul, setSelectedTurul] = useState<string>("");
  const [selectedTuluv, setSelectedTuluv] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedHiits, setSelectedHiits] = useState<string>("");

  // Images
  const [images, setImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/user/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getturul" }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.resultCode === 6003) {
          setTurul(data.data.turul || []);
          setTuluv(data.data.tuluv || []);
          setCities(data.data.hot || []);
          setDistricts(data.data.duureg || []);
          setHiitsList(data.data.hiits || []);
        }
      })
      .catch(console.error);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      setImages(prev => [...prev, file]);

      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setPreviewImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    // Формын утгууд
    const formValues = {
      title: (document.getElementById("title") as HTMLInputElement).value.trim(),
      price: (document.getElementById("price") as HTMLInputElement).value,
      address: (document.getElementById("address") as HTMLInputElement).value,
      rooms: (document.getElementById("rooms") as HTMLInputElement).value || "0",
      bathroom: (document.getElementById("bathroom") as HTMLInputElement).value || "0",
      balcony: (document.getElementById("balcony") as HTMLInputElement).value || "0",
      m2: (document.getElementById("m2") as HTMLInputElement).value || "0",
      floor: (document.getElementById("floor") as HTMLInputElement).value || "0",
      description: (document.getElementById("description") as HTMLInputElement).value || "",
    };

    // Зургуудыг base64 болгох
    const base64Promises = images.map(file =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
    );

    let base64Images: string[] = [];
    try {
      base64Images = await Promise.all(base64Promises);
    } catch (err) {
      toast({ title: "Алдаа", description: "Зураг хөрвүүлэхэд алдаа гарлаа", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    // Нэгдсэн payload (JSON)
    const payload = {
      action: "add_zar",
      uid: "115", // та логин хийж uid авдаг бол энд динамикаар оруулна уу
      z_title: formValues.title,
      z_type: selectedTurul,
      z_status: selectedTuluv,
      z_price: formValues.price,
      z_hot: selectedCity,
      z_duureg: selectedDistrict,
      z_address: formValues.address,
      z_rooms: formValues.rooms,
      z_bathroom: formValues.bathroom,
      z_balcony: formValues.balcony,
      z_m2: formValues.m2,
      z_floor: formValues.floor,
      z_hiits: selectedHiits,
      z_description: formValues.description,
      images: base64Images, // ← массив base64 string
    };

    try {
      const res = await fetch("http://localhost:8000/user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.resultCode === 7007) {
        toast({
          title: "Амжилттай!",
          description: `Зар амжилттай нэмэгдлээ! ID: ${data.data[0].zid}`,
        });

        // Формыг цэвэрлэх
        setImages([]);
        setPreviewImages([]);
        setSelectedTurul("");
        setSelectedTuluv("");
        setSelectedCity("");
        setSelectedDistrict("");
        setSelectedHiits("");
        (e.target as HTMLFormElement).reset();
      } else {
        toast({
          title: "Алдаа",
          description: data.message || JSON.stringify(data.data),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Сервертэй холбогдохгүй байна", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Үл хөдлөх хөрөнгийн зар оруулах</h1>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Үндсэн мэдээлэл */}
            <Card>
              <CardHeader><CardTitle>Үндсэн мэдээлэл</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Гарчиг *</Label>
                    <Input id="title" required placeholder="Жишээ: Баянголд 3 өрөө байр" />
                  </div>
                  <div className="space-y-2">
                    <Label>Төлөв *</Label>
                    <Select value={selectedTuluv} onValueChange={setSelectedTuluv} required>
                      <SelectTrigger><SelectValue placeholder="Сонгоно уу" /></SelectTrigger>
                      <SelectContent>
                        {tuluv.map(t => <SelectItem key={t.tid} value={t.tid.toString()}>{t.tname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Үл хөдлөхийн төрөл *</Label>
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
                    <Label htmlFor="price">Үнэ (₮) *</Label>
                    <Input id="price" type="number" required placeholder="450000000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Input id="rooms" type="number" placeholder="Өрөө" defaultValue="0" />
                  <Input id="bathroom" type="number" placeholder="АЦ өрөө" defaultValue="0" />
                  <Input id="balcony" type="number" placeholder="Тагт" defaultValue="0" />
                  <Input id="m2" type="number" placeholder="м²" />
                  <Input id="floor" type="number" placeholder="Давхар" />
                  <Input id="description" placeholder="Нэмэлт тайлбар" className="col-span-2 md:col-span-4" />
                  <div className="space-y-2">
                    <Label>Хийц</Label>
                    <Select value={selectedHiits} onValueChange={setSelectedHiits}>
                      <SelectTrigger><SelectValue placeholder="Хийц сонгох" /></SelectTrigger>
                      <SelectContent>
                        {hiitsList.map(h => (
                          <SelectItem key={h.h_id} value={h.h_id.toString()}>{h.h_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Байршил */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Байршил</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Хот/Аймаг *</Label>
                    <Select value={selectedCity} onValueChange={v => { setSelectedCity(v); setSelectedDistrict(""); }} required>
                      <SelectTrigger><SelectValue placeholder="Хот сонгох" /></SelectTrigger>
                      <SelectContent>
                        {cities.map(c => <SelectItem key={c.hid} value={c.hid.toString()}>{c.hname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Дүүрэг/Сум *</Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedCity} required>
                      <SelectTrigger><SelectValue placeholder="Дүүрэг сонгох" /></SelectTrigger>
                      <SelectContent>
                        {districts
                          .filter(d => selectedCity && d.hid.toString() === selectedCity)
                          .map(d => <SelectItem key={d.did} value={d.did.toString()}>{d.dname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Нэмэлт хаяг</Label>
                    <Input id="address" placeholder="Жишээ: 11-р хороо, 28-р байр" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Зураг оруулах */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Зургууд</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-2 border-dashed rounded-xl p-10 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Зураг чирж оруулах эсвэл дарж сонгоно уу</p>
                    </label>
                  </div>

                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                      {previewImages.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} alt="" className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isUploading}>
                {isUploading ? "Илгээж байна..." : "Зар нийтлэх"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostProperty;
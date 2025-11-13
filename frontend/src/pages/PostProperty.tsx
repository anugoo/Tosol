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
  const [images, setImages] = useState<string[]>([]);
  const [turul, setTurul] = useState<Turul[]>([]);
  const [tuluv, setTuluv] = useState<Tuluv[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [hiitsList, setHiitsList] = useState<Hiits[]>([]);

  const [selectedTurul, setSelectedTurul] = useState<string>();
  const [selectedTuluv, setSelectedTuluv] = useState<string>();
  const [selectedCity, setSelectedCity] = useState<string>();
  const [selectedDistrict, setSelectedDistrict] = useState<string>();
  const [selectedHiits, setSelectedHiits] = useState<string>();


  useEffect(() => {
    fetch("http://localhost:8000/user/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getturul" }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.resultCode === 6003) {
          setTurul(data.data.turul || []);
          setTuluv(data.data.tuluv || []);
          setCities(data.data.hot || []);
          setDistricts(data.data.duureg || []);
          setHiitsList(data.data.hiits || []);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setImages(prev => [...prev, event.target.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = (document.getElementById("title") as HTMLInputElement).value;
    const price = (document.getElementById("price") as HTMLInputElement).value;
    const address = (document.getElementById("address") as HTMLInputElement).value;
    const rooms = (document.getElementById("rooms") as HTMLInputElement).value || "0";
    const bathroom = (document.getElementById("bathroom") as HTMLInputElement).value || "0";
    const balcony = (document.getElementById("balcony") as HTMLInputElement).value || "0";
    const m2 = (document.getElementById("m2") as HTMLInputElement).value || "0";
    const floor = (document.getElementById("floor") as HTMLInputElement).value || "0";
    const description = (document.getElementById("description") as HTMLInputElement).value || "";

    // JSON-р Base64 зураг дамжуулах
    const payload = {
      action: "add_zar",
      uid: "115",
      z_title: title,
      z_type: selectedTurul ?? "",
      z_status: selectedTuluv ?? "",
      z_price: price,
      z_hot: selectedCity ?? "",
      z_duureg: selectedDistrict ?? "",
      z_address: address,
      z_rooms: rooms,
      z_bathroom: bathroom,
      z_balcony: balcony,
      z_m2: m2,
      z_floor: floor,
      z_hiits: selectedHiits ?? "",
      z_description: description,
      images: images, // Base64 array
    };

    try {
      const res = await fetch("http://localhost:8000/user/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.resultCode === 7007) {
        toast({
          title: "Амжилттай!",
          description: `Зар амжилттай нэмэгдлээ! ID: ${data.data[0].zid}`,
        });
        setImages([]);
        setSelectedCity(undefined);
        setSelectedDistrict(undefined);
        setSelectedTurul(undefined);
        setSelectedTuluv(undefined);
        setSelectedHiits(undefined);
        (document.getElementById("title") as HTMLInputElement).value = "";
      } else {
        alert(`Алдаа гарлаа: ${JSON.stringify(data.data)}`);
      }
    } catch (err) {
      console.error(err);
      alert("Сервертэй холбогдох үед алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-4">Үл хөдлөх хөрөнгийн зар оруулах</h1>
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Үндсэн мэдээлэл */}
            <Card>
              <CardHeader><CardTitle>Үндсэн мэдээлэл</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Гарчиг *</Label>
                    <Input id="title" placeholder="Жишээ: 3 өрөө орон сууц" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Төлөв *</Label>
                    <Select value={selectedTuluv} onValueChange={setSelectedTuluv}>
                      <SelectTrigger><SelectValue placeholder="Сонгоно уу" /></SelectTrigger>
                      <SelectContent>
                        {tuluv.map(t => <SelectItem key={t.tid} value={t.tid.toString()}>{t.tname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="property-type">Үл хөдлөхийн төрөл *</Label>
                    <Select value={selectedTurul} onValueChange={setSelectedTurul}>
                      <SelectTrigger><SelectValue placeholder="Төрөл сонгох" /></SelectTrigger>
                      <SelectContent>
                        {turul.map(t => <SelectItem key={t.tid} value={t.tid.toString()}>{t.temoji} {t.tname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Үнэ (₮) *</Label>
                    <Input id="price" type="number" placeholder="450000000" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input id="rooms" placeholder="Өрөө" type="number" />
                  <Input id="bathroom" placeholder="Ариун цэврийн өрөө" type="number" />
                  <Input id="balcony" placeholder="Тагт" type="number" />
                  <Input id="m2" placeholder="м²" type="number" />
                  <Input id="floor" placeholder="Давхар" type="number" />
                  <div className="space-y-2">
                    <Select value={selectedHiits} onValueChange={setSelectedHiits}>
                      <SelectTrigger><SelectValue placeholder="Хийц сонгох" /></SelectTrigger>
                      <SelectContent>
                        {hiitsList.map(h => <SelectItem key={h.h_id} value={h.h_id.toString()}>{h.h_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input id="description" placeholder="Тайлбар" type="text" />
                </div>
              </CardContent>
            </Card>

            {/* Байршил */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Байршил</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">Хот/Аймаг *</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger><SelectValue placeholder="Хот сонгох" /></SelectTrigger>
                      <SelectContent>
                        {cities.map(c => <SelectItem key={c.hid} value={c.hid.toString()}>{c.hname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">Дүүрэг/Сум *</Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedCity}>
                      <SelectTrigger><SelectValue placeholder="Дүүрэг сонгох" /></SelectTrigger>
                      <SelectContent>
                        {districts.filter(d => selectedCity && d.hid.toString() === selectedCity)
                          .map(d => <SelectItem key={d.did} value={d.did.toString()}>{d.dname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Нэмэлт хаяг</Label>
                    <Input id="address" placeholder="1-р хороо" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Зураг */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Зургууд</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Зургаа чирж оруулах эсвэл дарж сонгох</p>
                      <Button type="button" variant="outline">Зураг сонгох</Button>
                    </label>
                  </div>
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img src={image} alt={`Upload ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              {/* <Button type="button" variant="outline" className="flex-1">Урьдчилан харах</Button> */}
              <Button type="submit" variant="outline" className="flex-1 bg-white">Зар нийтлэх</Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostProperty;

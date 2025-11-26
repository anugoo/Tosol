// src/components/Hero.tsx
import { Search, MapPin, Home, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/context/SearchContext"; // ← НЭМНЭ
import heroImage from "@/assets/hero-bg.jpg";

interface Turul { tid: number; tname: string; temoji?: string; }
interface City { hid: number; hname: string; }
interface District { did: number; dname: string; hid: number; }

const Hero = () => {
  const navigate = useNavigate();
  const { setSearchParams, triggerSearch } = useSearch(); // ← АВАХ

  const [searchType, setSearchType] = useState<"sale" | "rent" | "preorder">("sale");
  const [turulList, setTurulList] = useState<Turul[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/user/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getturul" }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.resultCode === 6003) {
          setTurulList(d.data.turul || []);
          setCities(d.data.hot || []);
          setDistricts(d.data.duureg || []);
        }
      });
  }, []);

  const handleSearch = () => {
    const params: any = {};

    if (searchType === "sale") params.status = "1";
    if (searchType === "rent") params.status = "2";
    if (searchType === "preorder") params.status = "3";

    if (propertyType) params.type = propertyType;
    if (city) params.hot = city;
    if (district) params.duureg = district;
    if (minPrice) params.min = minPrice;
    if (maxPrice) params.max = maxPrice;
    if (startDate) params.from = startDate;
    if (endDate) params.to = endDate;

    setSearchParams(params);
    triggerSearch(); // ← PropertyListings дахин ачаална!
  };

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40"></div>
      </div>

      <div className="relative z-10 text-center w-full px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Мөрөөдлийн гэрээ <span className="block text-primary-glow">олоорой</span>
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Монголын хамгийн том үл хөдлөх хөрөнгийн платформоос өөрт тохирох орон сууц, байшинг хайж олоорой
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-5xl mx-auto">
          <div className="flex gap-2 mb-6 p-1 bg-accent/30 rounded-xl">
            {["sale", "rent", "preorder"].map(t => (
              <button
                key={t}
                onClick={() => setSearchType(t as any)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${searchType === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent/50"}`}
              >
                {t === "sale" ? "Худалдан авах" : t === "rent" ? "Түрээслэх" : "Урьдчилсан захиалга"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-12 border-0 bg-accent/30 rounded-xl">
                <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                <SelectValue placeholder="Үл хөдлөх хөрөнгийн төрөл" />
              </SelectTrigger>
              <SelectContent>
                {turulList.map(t => (
                  <SelectItem key={t.tid} value={t.tid.toString()}>
                    {t.temoji} {t.tname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={city} onValueChange={v => { setCity(v); setDistrict(""); }}>
              <SelectTrigger className="h-12 border-0 bg-accent/30 rounded-xl">
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                <SelectValue placeholder="Хот/Аймаг" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c.hid} value={c.hid.toString()}>{c.hname}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={district} onValueChange={setDistrict} disabled={!city}>
              <SelectTrigger className="h-12 border-0 bg-accent/30 rounded-xl">
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                <SelectValue placeholder="Сум/Дүүрэг" />
              </SelectTrigger>
              <SelectContent>
                {districts.filter(d => city && d.hid.toString() === city).map(d => (
                  <SelectItem key={d.did} value={d.did.toString()}>{d.dname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-12 border-0 bg-accent/30 rounded-xl" />
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-12 border-0 bg-accent/30 rounded-xl" />
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="number" placeholder={searchType === "sale" ? "Доод үнэ (сая ₮)" : "Доод үнэ (₮)"} value={minPrice} onChange={e => setMinPrice(e.target.value)} className="pl-10 h-12 border-0 bg-accent/30 rounded-xl" />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="number" placeholder={searchType === "sale" ? "Дээд үнэ (сая ₮)" : "Дээд үнэ (₮)"} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="pl-10 h-12 border-0 bg-accent/30 rounded-xl" />
            </div>
            <Button onClick={handleSearch} className="h-12 hero-gradient text-white font-semibold rounded-xl hover:scale-105 shadow-lg">
              <Search className="mr-2 h-5 w-5" /> Хайх
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {turulList.slice(0, 5).map(t => (
              <Button key={t.tid} variant="ghost" size="sm" className="rounded-full hover:bg-accent/50"
                onClick={() => { setPropertyType(t.tid.toString()); handleSearch(); }}>
                {t.temoji} {t.tname}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Button variant="outline" size="lg" onClick={() => navigate("/post")}
            className="text-lg px-8 py-4 rounded-2xl bg-white/10 border-white text-white hover:bg-white hover:text-primary transition-all">
            Шинэ зар оруулах
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
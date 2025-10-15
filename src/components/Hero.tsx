import { Search, MapPin, Home, DollarSign, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState("sale");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState("");
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40"></div>
      </div>

        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Мөрөөдлийн гэрээ 
            <span className="block text-primary-glow">олоорой</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Монголын хамгийн том үл хөдлөх хөрөнгийн платформоос 
            өөрт тохирох орон сууц, байшинг хайж олоорой
          </p>
          
          {/* Enhanced Search Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-5xl mx-auto">
            {/* Search Type Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-accent/30 rounded-xl">
              <button 
                onClick={() => setSearchType("sale")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  searchType === "sale" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                Худалдан авах
              </button>
              <button 
                onClick={() => setSearchType("rent")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  searchType === "rent" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                Түрээслэх
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Байршил сонгох"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 border-0 bg-accent/30 rounded-xl focus:bg-accent/50 transition-colors"
                />
              </div>
              
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-12 border-0 bg-accent/30 rounded-xl focus:bg-accent/50">
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-muted-foreground mr-3" />
                    <SelectValue placeholder="Үл хөдлөх хөрөнгийн төрөл" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Орон сууц</SelectItem>
                  <SelectItem value="house">Хашаа/Байшин</SelectItem>
                  <SelectItem value="ger">Монгол гэр</SelectItem>
                  <SelectItem value="commercial">Худалдааны талбай</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="h-12 border-0 bg-accent/30 rounded-xl focus:bg-accent/50">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-muted-foreground mr-3" />
                    <SelectValue placeholder="Үнийн хязгаар" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {searchType === "sale" ? (
                    <>
                      <SelectItem value="0-200m">0 - 200 сая ₮</SelectItem>
                      <SelectItem value="200-500m">200 - 500 сая ₮</SelectItem>
                      <SelectItem value="500m+">500 сая ₮+</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="0-500k">0 - 500,000 ₮</SelectItem>
                      <SelectItem value="500k-1m">500,000 - 1 сая ₮</SelectItem>
                      <SelectItem value="1m+">1 сая ₮+</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              
              <Button className="h-12 hero-gradient text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg">
                <Search className="mr-2 h-5 w-5" />
                Хайх
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-accent/50">
                🏢 Орон сууц
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-accent/50">
                🏠 Байшин
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-accent/50">
                🏕️ Монгол гэр
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-accent/50">
                🏪 Худалдаа
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-accent/50">
              🏕️ Газар
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Зар харах
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate("/post")}
              className="text-lg px-8 py-4 rounded-2xl bg-white/10 border-white text-white hover:bg-white hover:text-primary transition-all duration-300"
            >
              Шинэ зар оруулах
            </Button>
          </div>
        </div>
    </section>
  );
};

export default Hero;
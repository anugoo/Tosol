import { Heart, Share2, Bed, Bath, Square, MapPin, Calendar, Building, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";

const PropertyDetails = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [property1, property2, property3, property1, property2];
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Буцах
        </Button>

        {/* Interactive Image Carousel */}
        <div className="mb-8">
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-card shadow-lg">
              <img 
                src={images[currentImageIndex]} 
                alt="Property image"
                className="w-full h-96 lg:h-[500px] object-cover"
              />
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Info */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl font-medium shadow-sm">
                  Худалдах
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Шинэ орон сууц Сүхбаатар дүүрэгт
              </h1>
              <div className="flex items-center text-muted-foreground mb-6">
                <MapPin className="h-5 w-5 mr-2" />
                <span>Сүхбаатар дүүрэг, 1-р хороо, Улаанбаатар</span>
              </div>
              <div className="text-4xl font-bold text-primary mb-6">
                450,000,000₮
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-3 gap-6 p-6 bg-card rounded-2xl border border-border/50 shadow-lg">
              <div className="text-center p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
                <Bed className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Унтлагын өрөө</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
                <Bath className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm text-muted-foreground">Угаалгын өрөө</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
                <Square className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold">85 м²</div>
                <div className="text-sm text-muted-foreground">Талбай</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Дэлгэрэнгүй мэдээлэл</h2>
              <div className="prose prose-lg">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Сүхбаатар дүүрэгт байрлах энэхүү орон сууц нь орчин үеийн дизайн, 
                  өндөр чанарын материалаар хийгдсэн бөгөөд бүх шаардлагатай тохижилттой. 
                  Гэр бүлийн амьдралд тохиромжтой, нарны гэрэл их орж, агаар сэлгээ сайтай.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Ойролцоогоор сургууль, цэцэрлэг, эмнэлэг, дэлгүүр, банк зэрэг бүх 
                  үйлчилгээ байрладаг тул өдөр тутмын амьдралд маш тохиромжтой.
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Нэмэлт мэдээлэл</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Барилгын төрөл:</span>
                    <span>Орон сууц</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Барьсан он:</span>
                    <span>2022</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Давхар:</span>
                    <span>5/12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Гадна талбай:</span>
                    <span>Тэргэнцэр</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Тохижилт</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Халаалт:</span>
                    <span>Төвийн</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Интернет:</span>
                    <span>Байгаа</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Тохижилт:</span>
                    <span>Бүрэн</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Лифт:</span>
                    <span>Байгаа</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="sticky top-24">
              <div className="p-6 bg-card rounded-xl border border-border mb-6">
                <h3 className="font-semibold mb-4">Холбоо барих</h3>
                <div className="space-y-3">
                  <Button variant="hero" className="w-full">
                    Утасаар холбогдох
                  </Button>
                  <Button variant="outline" className="w-full">
                    Мессеж илгээх
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Зуучлагч</h3>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    БО
                  </div>
                  <div>
                    <div className="font-medium">Болдбаатар Очирбат</div>
                    <div className="text-sm text-muted-foreground">Мэргэжлийн зуучлагч</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Профайл харах
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PropertyDetails;
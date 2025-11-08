import { useState } from "react";
import { Upload, X, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PostProperty = () => {
  const [images, setImages] = useState<string[]>([]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Үл хөдлөх хөрөнгийн зар оруулах
            </h1>
            <p className="text-muted-foreground">
              Таны үл хөдлөх хөрөнгийн мэдээллийг дэлгэрэнгүй оруулна уу
            </p>
          </div>

          <form className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Үндсэн мэдээлэл</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Гарчиг *</Label>
                    <Input 
                      id="title"
                      placeholder="Жишээ: 3 өрөө орон сууц Сүхбаатар дүүрэгт"
                      className="search-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Төлөв *</Label>
                    <Select>
                      <SelectTrigger className="search-input">
                        <SelectValue placeholder="Сонгоно уу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">Худалдах</SelectItem>
                        <SelectItem value="rent">Түрээслэх</SelectItem>
                        <SelectItem value="rent">Захиалгат</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="property-type">Үл хөдлөхийн төрөл *</Label>
                    <Select>
                      <SelectTrigger className="search-input">
                        <SelectValue placeholder="Төрөл сонгох" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Орон сууц</SelectItem>
                        <SelectItem value="house">Байшин</SelectItem>
                        <SelectItem value="villa">Вилла</SelectItem>
                        <SelectItem value="office">Оффис</SelectItem>
                        <SelectItem value="land">Газар</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Үнэ (₮) *</Label>
                    <Input 
                      id="price"
                      type="number"
                      placeholder="450000000"
                      className="search-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Байршил
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">Хот/Аймаг *</Label>
                    <Select>
                      <SelectTrigger className="search-input">
                        <SelectValue placeholder="Хот сонгох" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ulaanbaatar">Улаанбаатар</SelectItem>
                        <SelectItem value="erdenet">Эрдэнэт</SelectItem>
                        <SelectItem value="darkhan">Дархан</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="district">Дүүрэг/Сум *</Label>
                    <Select>
                      <SelectTrigger className="search-input">
                        <SelectValue placeholder="Дүүрэг сонгох" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sukhbaatar">Сүхбаатар</SelectItem>
                        <SelectItem value="chingeltei">Чингэлтэй</SelectItem>
                        <SelectItem value="bayangol">Баянгол</SelectItem>
                        <SelectItem value="bayanzurkh">Баянзүрх</SelectItem>
                        <SelectItem value="khan-uul">Хан-Уул</SelectItem>
                        <SelectItem value="songino-khairkhan">Сонгинохайрхан</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="khoroo">Хороо</Label>
                    <Input 
                      id="khoroo"
                      placeholder="1-р хороо"
                      className="search-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Дэлгэрэнгүй хаяг</Label>
                  <Input 
                    id="address"
                    placeholder="Гудамж, байрны дугаар"
                    className="search-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Хөрөнгийн мэдээлэл</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rooms">Өрөөний тоо</Label>
                    <Select>
                      <SelectTrigger className="search-input">
                        <SelectValue placeholder="Тоо" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Угаалгын өрөө</Label>
                    <Select>
                      <SelectTrigger className="search-input">
                        <SelectValue placeholder="Тоо" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="area">Талбай (м²) *</Label>
                    <Input 
                      id="area"
                      type="number"
                      placeholder="85"
                      className="search-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="floor">Давхар</Label>
                    <Input 
                      id="floor"
                      placeholder="5/12"
                      className="search-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Тайлбар</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="description">Дэлгэрэнгүй тайлбар</Label>
                  <Textarea 
                    id="description"
                    placeholder="Үл хөдлөх хөрөнгийн онцлог, давуу тал, орчин тойронд байгаа үйлчилгээний тухай дэлгэрэнгүй бичнэ үү..."
                    className="search-input min-h-32"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Зургууд
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Зургаа чирж оруулах эсвэл дарж сонгох
                      </p>
                      <Button type="button" variant="outline">
                        Зураг сонгох
                      </Button>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={image} 
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1">
                Урьдчилан харах
              </Button>
              <Button type="submit" variant="hero" className="flex-1">
                Зар нийтлэх
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
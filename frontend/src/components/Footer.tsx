import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-[var(--hero-gradient)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Гэрэ</span>
              </div>
              <span className="font-bold text-xl text-foreground">Гэрэ</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Монгол орны хамгийн найдвартай үл хөдлөх хөрөнгийн платформ. 
              Та бидэнтэй хамт мөрөөдлийн гэр олоорой.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="sm">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>


          <div>
            <h3 className="font-semibold text-foreground mb-4">Холбоосууд</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-muted-foreground hover:text-primary transition-colors">Бидний тухай</a></li>
              <li><a href="/services" className="text-muted-foreground hover:text-primary transition-colors">Үйлчилгээ</a></li>
              <li><a href="/agents" className="text-muted-foreground hover:text-primary transition-colors">Холбоо барих</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Хууль эрх зүй</h3>
            <ul className="space-y-2">
              <li><a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Үйлчилгээний нөхцөл</a></li>
              <li><a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Нууцлалын бодлого</a></li>
              <li><a href="/support" className="text-muted-foreground hover:text-primary transition-colors">Дэмжлэг</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Холбоо барих</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+976 9999-9999</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@germaani.mn</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Улаанбаатар хот</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Мэдээлэл авах</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="И-мэйл хаяг" 
                  className="search-input"
                />
                <Button className="gold-button">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Гэрэ. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate("/")}
              className="text-2xl font-bold text-primary hover:scale-105 transition-transform duration-300"
            >
              🏠 Гэрэ
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105">
              Худалдан авах
            </button>
            <button className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105">
              Түрээслэх
            </button>
            <button 
              onClick={() => navigate("/post")}
              className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
            >
              Зар оруулах
            </button>
            <button className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105">
              Тооцоолуур
            </button>
          </nav>

          {/* Auth & Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Нэвтрэх */}
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden md:flex rounded-xl"
              onClick={() => navigate("/login")}
            >
              Нэвтрэх
            </Button>

            {/* Бүртгүүлэх */}
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex rounded-xl"
              onClick={() => navigate("/signup")}
            >
              Бүртгүүлэх
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border/50 mt-2 pt-4 bg-card/50 rounded-b-xl">
            <nav className="flex flex-col space-y-3">
              <button 
                onClick={() => {
                  navigate("/");
                  setIsMenuOpen(false);
                }}
                className="text-left px-4 py-2 text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-all"
              >
                Нүүр
              </button>
              <button className="text-left px-4 py-2 text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-all">
                Худалдан авах
              </button>
              <button className="text-left px-4 py-2 text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-all">
                Түрээслэх
              </button>
              <button 
                onClick={() => {
                  navigate("/post");
                  setIsMenuOpen(false);
                }}
                className="text-left px-4 py-2 text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-all"
              >
                Зар оруулах
              </button>
              <button className="text-left px-4 py-2 text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-all">
                Холбоо барих
              </button>

              {/* Mobile login/signup */}
              <div className="flex flex-col gap-2 pt-2 px-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-xl"
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Нэвтрэх
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl"
                  onClick={() => {
                    navigate("/signup");
                    setIsMenuOpen(false);
                  }}
                >
                  Бүртгүүлэх
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

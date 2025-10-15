import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PropertyListings from "@/components/PropertyListings";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <PropertyListings />
      <Footer />
    </div>
  );
};

export default Index;

import { Link } from "react-router-dom";
import { Github, Twitter, Instagram, Heart, MapPin, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src="/logo-2025.png" 
                alt="NomadX Logo" 
                className="w-8 h-8 rounded-lg object-contain transition-transform group-hover:scale-110"
              />
              <span className="text-xl font-bold text-gradient-hero">
                NomadX
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The ultimate AI-powered travel planner for budget adventurers. Plan faster, go further, and explore the world with your crew.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300">
                <Twitter className="w-4 h-4" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="p-2 rounded-full bg-muted/50 hover:bg-coral/10 text-muted-foreground hover:text-coral transition-all duration-300">
                <Instagram className="w-4 h-4" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="p-2 rounded-full bg-muted/50 hover:bg-mustard/10 text-muted-foreground hover:text-mustard transition-all duration-300">
                <Github className="w-4 h-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/trip/new" className="hover:text-primary transition-colors flex items-center">
                  AI Trip Planner
                  <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">New</span>
                </Link>
              </li>
              <li>
                <Link to="/inspirations" className="hover:text-primary transition-colors">
                  Explore Destinations
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">
                  Budget Tracker
                </Link>
              </li>
              <li>
                <Link to="/friends" className="hover:text-primary transition-colors">
                  Find Travel Buddies
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-coral transition-colors">
                  Travel Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-coral transition-colors">
                  Community Forum
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-coral transition-colors">
                  Safety Guides
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-coral transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <span>Made globally by nomads, for nomads.</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:hello@nomadx.app" className="hover:text-primary transition-colors">
                  hello@nomadx.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} NomadX. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
              <span>Built with</span>
              <Heart className="w-3 h-3 text-coral fill-coral animate-pulse" />
              <span>and Coffee</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
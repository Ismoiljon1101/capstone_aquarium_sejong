import { BarChart3, Bot, TrendingUp, Bell, Smartphone, Microscope, Clock, Zap, Brain, Rocket, Book, Palette, Code, Plug } from "lucide-react";
import { FaAtom } from "react-icons/fa";

/** Feature cards for landing page */
export const FEATURES = [
  { icon: BarChart3, title: "Real-time Monitoring", description: "Track water quality parameters with live data visualization and AI-powered insights.", gradient: "from-blue-500 to-cyan-500" },
  { icon: Bot, title: "AI Assistant", description: "Get instant answers about your aquarium with our intelligent virtual assistant Veronica.", gradient: "from-purple-500 to-pink-500" },
  { icon: TrendingUp, title: "Trend Analysis", description: "Analyze historical data patterns to optimize your aquaculture management strategy.", gradient: "from-emerald-500 to-teal-500" },
  { icon: Bell, title: "Smart Alerts", description: "Receive proactive notifications when parameters exceed optimal ranges.", gradient: "from-orange-500 to-red-500" },
  { icon: Smartphone, title: "Mobile Ready", description: "Access your dashboard from any device with our responsive design.", gradient: "from-indigo-500 to-purple-500" },
  { icon: Microscope, title: "Scientific Accuracy", description: "Built with precision instruments and validated algorithms for reliable results.", gradient: "from-teal-500 to-green-500" },
] as const;

/** Stats banner for landing page */
export const STATS = [
  { value: "24/7", label: "Monitoring", icon: Clock },
  { value: "99.9%", label: "Uptime", icon: Rocket },
  { value: "AI", label: "Powered", icon: Brain },
  { value: "Real-time", label: "Data", icon: Zap },
] as const;

/** Tech stack grid for landing page */
export const TECH_STACK = [
  { name: "Next.js", icon: FaAtom },
  { name: "TypeScript", icon: Book },
  { name: "Tailwind CSS", icon: Palette },
  { name: "Python", icon: Code },
  { name: "AI/ML", icon: Bot },
  { name: "WebSocket", icon: Plug },
] as const;

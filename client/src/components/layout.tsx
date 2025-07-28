import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bell, 
  User, 
  Home, 
  Folder, 
  BarChart3,
  Settings,
  Calculator
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

// Simple Calculator Component
function CalculatorWidget() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  return (
    <div className="w-64 p-4 bg-white rounded-lg">
      <div className="mb-4 p-3 bg-slate-100 rounded text-right text-xl font-mono">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Button onClick={clear} variant="outline" className="col-span-2">Clear</Button>
        <Button onClick={() => inputOperation("÷")} variant="outline">÷</Button>
        <Button onClick={() => inputOperation("×")} variant="outline">×</Button>
        
        <Button onClick={() => inputNumber("7")} variant="outline">7</Button>
        <Button onClick={() => inputNumber("8")} variant="outline">8</Button>
        <Button onClick={() => inputNumber("9")} variant="outline">9</Button>
        <Button onClick={() => inputOperation("-")} variant="outline">-</Button>
        
        <Button onClick={() => inputNumber("4")} variant="outline">4</Button>
        <Button onClick={() => inputNumber("5")} variant="outline">5</Button>
        <Button onClick={() => inputNumber("6")} variant="outline">6</Button>
        <Button onClick={() => inputOperation("+")} variant="outline">+</Button>
        
        <Button onClick={() => inputNumber("1")} variant="outline">1</Button>
        <Button onClick={() => inputNumber("2")} variant="outline">2</Button>
        <Button onClick={() => inputNumber("3")} variant="outline">3</Button>
        <Button onClick={performCalculation} variant="default" className="row-span-2 bg-blueprint-600 hover:bg-blueprint-700">=</Button>
        
        <Button onClick={() => inputNumber("0")} variant="outline" className="col-span-2">0</Button>
        <Button onClick={() => inputNumber(".")} variant="outline">.</Button>
      </div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-blueprint-600 rounded-lg flex items-center justify-center">
                  <Home className="text-white w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-slate-900">EstimAgent</span>
              </div>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blueprint-700">
                  <Calculator className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 w-auto">
                <DialogHeader className="p-4 pb-0">
                  <DialogTitle>Calculator</DialogTitle>
                </DialogHeader>
                <CalculatorWidget />
              </DialogContent>
            </Dialog>
            <div className="hidden md:flex items-center space-x-1 ml-8">
              <Link href="/">
                <Button variant="ghost" size="sm" className={location === "/" ? "text-blueprint-700 bg-blueprint-50 hover:bg-blueprint-100" : "text-slate-600 hover:text-blueprint-700"}>
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className={location === "/projects" ? "text-blueprint-700 bg-blueprint-50 hover:bg-blueprint-100" : "text-slate-600 hover:text-blueprint-700"}>
                  <Folder className="w-4 h-4 mr-2" />
                  Projects
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className={location === "/reports" ? "text-blueprint-700 bg-blueprint-50 hover:bg-blueprint-100" : "text-slate-600 hover:text-blueprint-700"}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reports
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className={location === "/settings" ? "text-blueprint-700 bg-blueprint-50" : "text-slate-600 hover:text-blueprint-700"}>
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">John Constructor</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      {children}
    </div>
  );
}